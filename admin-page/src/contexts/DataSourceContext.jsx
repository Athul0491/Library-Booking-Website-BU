/**
 * Data Source Context
 * Manages data source configuration for the admin interface
 * Supports backend proxy, direct Supabase, and mock data modes
 */
import React, { createContext, useContext, useState, useEffect } from 'react';

const DataSourceContext = createContext();

export const useDataSource = () => {
  const context = useContext(DataSourceContext);
  if (!context) {
    throw new Error('useDataSource must be used within a DataSourceProvider');
  }
  return context;
};

// Data source modes
export const DATA_SOURCE_MODES = {
  BACKEND_PROXY: 'backend-proxy',
  DIRECT_SUPABASE: 'direct-supabase', 
  MOCK_DATA: 'mock-data'
};

export const DataSourceProvider = ({ children }) => {
  // Default to backend proxy mode
  const [dataSourceMode, setDataSourceMode] = useState(() => {
    const saved = localStorage.getItem('admin-page-data-source-mode');
    return saved || DATA_SOURCE_MODES.BACKEND_PROXY;
  });

  // Legacy support for useRealData
  const [useRealData, setUseRealData] = useState(() => {
    return dataSourceMode !== DATA_SOURCE_MODES.MOCK_DATA;
  });

  // Auto refresh settings - disabled by default per user requirement
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(() => {
    // Always return false to disable auto refresh
    return false;
  });

  const [refreshInterval, setRefreshInterval] = useState(() => {
    const saved = localStorage.getItem('admin-page-refresh-interval');
    return saved ? parseInt(saved) : 120000; // 2 minutes default
  });

  // Connection status and notifications
  const [connectionStatus, setConnectionStatus] = useState({
    backend: 'unknown', // 'healthy', 'degraded', 'unhealthy', 'unknown'
    supabase: 'unknown',
    lastCheck: null,
    errorMessage: null
  });

  const [notifications, setNotifications] = useState([]);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('admin-page-data-source-mode', dataSourceMode);
    localStorage.setItem('admin-page-use-real-data', JSON.stringify(useRealData));
  }, [dataSourceMode, useRealData]);

  useEffect(() => {
    localStorage.setItem('admin-page-auto-refresh', JSON.stringify(autoRefreshEnabled));
  }, [autoRefreshEnabled]);

  useEffect(() => {
    localStorage.setItem('admin-page-refresh-interval', refreshInterval.toString());
  }, [refreshInterval]);

  // Update useRealData when dataSourceMode changes
  useEffect(() => {
    setUseRealData(dataSourceMode !== DATA_SOURCE_MODES.MOCK_DATA);
  }, [dataSourceMode]);

  const toggleDataSource = () => {
    setDataSourceMode(prev => {
      switch (prev) {
        case DATA_SOURCE_MODES.BACKEND_PROXY:
          return DATA_SOURCE_MODES.DIRECT_SUPABASE;
        case DATA_SOURCE_MODES.DIRECT_SUPABASE:
          return DATA_SOURCE_MODES.MOCK_DATA;
        case DATA_SOURCE_MODES.MOCK_DATA:
          return DATA_SOURCE_MODES.BACKEND_PROXY;
        default:
          return DATA_SOURCE_MODES.BACKEND_PROXY;
      }
    });
  };

  // Connection testing functions
  const testConnection = async () => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      // Test backend connection
      let backendStatus = 'unhealthy';
      let backendError = null;
      
      try {
        const response = await fetch(`${backendUrl}/api/health`);
        if (response.ok) {
          const data = await response.json();
          backendStatus = data.status === 'healthy' ? 'healthy' : 'degraded';
          
          // Check Supabase status from backend response
          if (data.services && data.services.supabase_api) {
            const supabaseStatus = data.services.supabase_api.status === 'healthy' ? 'healthy' : 'unhealthy';
            setConnectionStatus(prev => ({
              ...prev,
              supabase: supabaseStatus
            }));
          }
        } else {
          backendError = `HTTP ${response.status}`;
        }
      } catch (error) {
        backendError = error.message;
      }
      
      const status = {
        backend: backendStatus,
        lastCheck: new Date().toISOString(),
        errorMessage: backendError
      };
      
      setConnectionStatus(prev => ({ ...prev, ...status }));
      
      // Add notification based on connection status
      if (backendStatus === 'unhealthy') {
        addNotification({
          type: 'error',
          title: 'Backend Connection Failed',
          message: `Unable to connect to backend server: ${backendError}`,
          timestamp: new Date().toISOString()
        });
      } else if (backendStatus === 'degraded') {
        addNotification({
          type: 'warning',
          title: 'Service Status Degraded',
          message: 'Backend service is accessible, but some features may be limited',
          timestamp: new Date().toISOString()
        });
      } else {
        addNotification({
          type: 'success',
          title: 'Connection Successful',
          message: 'Backend service is running normally',
          timestamp: new Date().toISOString()
        });
      }
      
      return status;
    } catch (error) {
      const errorStatus = {
        backend: 'unhealthy',
        lastCheck: new Date().toISOString(),
        errorMessage: error.message
      };
      
      setConnectionStatus(prev => ({ ...prev, ...errorStatus }));
      
      addNotification({
        type: 'error',
        title: 'Connection Test Failed',
        message: `Error occurred while testing connection: ${error.message}`,
        timestamp: new Date().toISOString()
      });
      
      return errorStatus;
    }
  };

  // Notification management
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      ...notification
    };
    
    setNotifications(prev => [newNotification, ...prev.slice(0, 9)]); // Keep last 10 notifications
    
    // Auto-remove success notifications after 5 seconds
    if (notification.type === 'success') {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 5000);
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  // Test connection when data source mode changes
  useEffect(() => {
    if (dataSourceMode !== DATA_SOURCE_MODES.MOCK_DATA) {
      testConnection();
    }
  }, [dataSourceMode]);

  const setBackendProxyMode = () => setDataSourceMode(DATA_SOURCE_MODES.BACKEND_PROXY);
  const setDirectSupabaseMode = () => setDataSourceMode(DATA_SOURCE_MODES.DIRECT_SUPABASE);
  const setMockDataMode = () => setDataSourceMode(DATA_SOURCE_MODES.MOCK_DATA);

  const getDataSourceLabel = () => {
    switch (dataSourceMode) {
      case DATA_SOURCE_MODES.BACKEND_PROXY:
        return 'Backend Proxy (Recommended)';
      case DATA_SOURCE_MODES.DIRECT_SUPABASE:
        return 'Direct Supabase API';
      case DATA_SOURCE_MODES.MOCK_DATA:
        return 'Mock Demo Data';
      default:
        return 'Unknown Data Source';
    }
  };

  const getDataSourceDescription = () => {
    switch (dataSourceMode) {
      case DATA_SOURCE_MODES.BACKEND_PROXY:
        return 'Uses backend proxy for optimized and secure API calls';
      case DATA_SOURCE_MODES.DIRECT_SUPABASE:
        return 'Direct connection to Supabase (legacy mode)';
      case DATA_SOURCE_MODES.MOCK_DATA:
        return 'Uses mock data for testing and demonstration';
      default:
        return '';
    }
  };

  const value = {
    // Data source mode
    dataSourceMode,
    setDataSourceMode,
    
    // Legacy support
    useRealData,
    setUseRealData,
    
    // Mode helpers
    isBackendProxyMode: dataSourceMode === DATA_SOURCE_MODES.BACKEND_PROXY,
    isDirectSupabaseMode: dataSourceMode === DATA_SOURCE_MODES.DIRECT_SUPABASE,
    isMockDataMode: dataSourceMode === DATA_SOURCE_MODES.MOCK_DATA,
    
    // Mode setters
    setBackendProxyMode,
    setDirectSupabaseMode,
    setMockDataMode,
    toggleDataSource,
    
    // Auto refresh settings
    autoRefreshEnabled,
    setAutoRefreshEnabled,
    refreshInterval,
    setRefreshInterval,
    
    // Connection monitoring
    connectionStatus,
    testConnection,
    
    // Notifications
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    
    // Labels and descriptions
    dataSourceLabel: getDataSourceLabel(),
    dataSourceDescription: getDataSourceDescription(),
    
    // API configuration based on mode
    apiConfig: {
      useBackendProxy: dataSourceMode === DATA_SOURCE_MODES.BACKEND_PROXY,
      useDirectSupabase: dataSourceMode === DATA_SOURCE_MODES.DIRECT_SUPABASE,
      useMockData: dataSourceMode === DATA_SOURCE_MODES.MOCK_DATA,
      forceUseMockData: dataSourceMode === DATA_SOURCE_MODES.MOCK_DATA
    }
  };

  return (
    <DataSourceContext.Provider value={value}>
      {children}
    </DataSourceContext.Provider>
  );
};
