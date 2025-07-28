/**
 * Global API Context
 * Manages global API state and prevents unnecessary API calls
 * Only calls API on app initialization and manual refresh
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';

const GlobalApiContext = createContext();

export const useGlobalApi = () => {
  const context = useContext(GlobalApiContext);
  if (!context) {
    throw new Error('useGlobalApi must be used within a GlobalApiProvider');
  }
  return context;
};

export const GlobalApiProvider = ({ children }) => {
  // Global API status states
  const [apiStatus, setApiStatus] = useState('disconnected'); // 'connecting', 'connected', 'disconnected', 'error'
  const [connectionDetails, setConnectionDetails] = useState({
    backend: 'unknown',
    database: 'unknown',
    lastUpdated: null,
    responseTime: null
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastApiCall, setLastApiCall] = useState(null);
  const [forceRefresh, setForceRefresh] = useState(false);

  // Global data cache
  const [globalData, setGlobalData] = useState({
    dashboard: null,
    buildings: null,
    lastUpdated: null
  });

  // Initialize API on app start
  const initializeApi = useCallback(async () => {
    const startTime = Date.now();
    
    try {
      setIsConnecting(true);
      setApiStatus('connecting');
      console.log('🚀 Initializing Global API...');
      
      // Try to get dashboard data as a health check
      const result = await apiService.getDashboardData();
      
      const responseTime = Date.now() - startTime;
      
      if (result.success) {
        // Update connection status - SUCCESS
        setApiStatus('connected');
        setConnectionDetails({
          backend: 'healthy',
          database: 'connected',
          lastUpdated: new Date().toISOString(),
          responseTime: responseTime
        });
        
        // Cache the data
        setGlobalData({
          dashboard: result.data,
          buildings: result.data?.buildings || [],
          lastUpdated: new Date().toISOString()
        });
        
        setLastApiCall(new Date().toISOString());
        
        console.log(`✅ Global API Initialized - Status: SUCCESS`);
        console.log(`⏱️ Response time: ${responseTime}ms`);
        console.log(`📊 Data cached: ${result.data?.buildings?.length || 0} buildings`);
        
      } else {
        throw new Error(result.error || 'API initialization failed');
      }
    } catch (error) {
      console.error('❌ Global API initialization failed:', error);
      
      // Update connection status - ERROR
      setApiStatus('error');
      setConnectionDetails({
        backend: 'unhealthy',
        database: 'error',
        lastUpdated: new Date().toISOString(),
        responseTime: Date.now() - startTime
      });
      
      // Set empty data for error state
      setGlobalData({
        dashboard: null,
        buildings: [],
        lastUpdated: new Date().toISOString()
      });
    } finally {
      setIsConnecting(false);
      setForceRefresh(false);
    }
  }, []);

  // Manual refresh function for user-triggered refreshes
  const refreshApi = useCallback(async () => {
    console.log('🔄 Manual API refresh triggered...');
    setForceRefresh(true);
    await initializeApi();
  }, [initializeApi]);

  // Initialize on app start
  useEffect(() => {
    console.log('🌐 App started - Initializing Global API...');
    initializeApi();
  }, [initializeApi]);

  // Listen for browser refresh (beforeunload event)
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('🔄 Browser refresh detected - will reinitialize API...');
      // We can't actually call API here due to browser limitations
      // but we reset the state so next load will call API
      setLastApiCall(null);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Check if data should be refreshed (for safety, allow refresh after 5 minutes)
  const shouldRefreshData = useCallback(() => {
    if (!lastApiCall) return true;
    
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    const lastCallTime = new Date(lastApiCall).getTime();
    
    return lastCallTime < fiveMinutesAgo;
  }, [lastApiCall]);

  // Get cached data (stable method that doesn't trigger unnecessary re-renders)
  const getCachedData = useCallback((dataType) => {
    // Simply return cached data without triggering refresh from within getter
    switch (dataType) {
      case 'dashboard':
        return globalData.dashboard;
      case 'buildings':
        return globalData.buildings;
      default:
        return null;
    }
  }, [globalData.dashboard, globalData.buildings]);

  const value = {
    // API Status
    apiStatus,
    connectionDetails,
    isConnecting,
    lastApiCall,
    
    // Data Access
    globalData,
    getCachedData,
    
    // Control Functions
    refreshApi,
    initializeApi,
    
    // Helper Functions
    shouldRefreshData,
    
    // Status Helpers
    isApiConnected: apiStatus === 'connected',
    isApiError: apiStatus === 'error',
    hasValidData: globalData.lastUpdated !== null && apiStatus === 'connected'
  };

  return (
    <GlobalApiContext.Provider value={value}>
      {children}
    </GlobalApiContext.Provider>
  );
};
