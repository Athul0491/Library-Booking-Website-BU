/**
 * Connection Status Context
 * Manages database and backend server connection states using unified API service
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/apiService';
import supabaseService from '../services/supabaseService';

const ConnectionContext = createContext();

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
};

export const ConnectionProvider = ({ children }) => {
  const [connectionStatus, setConnectionStatus] = useState({
    supabase: {
      configured: false,
      connected: false,
      error: null,
      lastChecked: null
    },
    backend: {
      connected: false,
      error: null,
      url: import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000',
      lastChecked: null
    },
    loading: true,
    lastFullCheck: null
  });

  // Test Supabase connection using supabaseService
  const checkSupabaseConnection = async () => {
    try {
      const result = await supabaseService.testConnection();
      const timestamp = new Date().toISOString();
      
      return {
        configured: true,
        connected: result.success,
        error: result.error,
        lastChecked: timestamp
      };
    } catch (error) {
      return {
        configured: false,
        connected: false,
        error: 'Failed to test Supabase connection',
        lastChecked: new Date().toISOString()
      };
    }
  };

  // Test backend connection using apiService (optional - backend is not required)
  const checkBackendConnection = async () => {
    try {
      const result = await apiService.testBackendConnection();
      const timestamp = new Date().toISOString();
      
      return {
        connected: result.success,
        error: result.success ? null : 'Backend server not available (using Supabase instead)',
        url: connectionStatus.backend.url,
        lastChecked: timestamp
      };
    } catch (error) {
      return {
        connected: false,
        error: 'Backend server not available (using Supabase instead)',
        url: connectionStatus.backend.url,
        lastChecked: new Date().toISOString()
      };
    }
  };

  // Comprehensive connection check
  const checkAllConnections = async () => {
    setConnectionStatus(prev => ({ ...prev, loading: true }));
    
    try {
      const [supabaseStatus, backendStatus] = await Promise.all([
        checkSupabaseConnection(),
        checkBackendConnection()
      ]);

      setConnectionStatus({
        supabase: supabaseStatus,
        backend: backendStatus,
        loading: false,
        lastFullCheck: new Date().toISOString()
      });
    } catch (error) {
      console.error('Connection check failed:', error);
      setConnectionStatus(prev => ({
        ...prev,
        loading: false,
        lastFullCheck: new Date().toISOString()
      }));
    }
  };

  // Initialize connection checking
  useEffect(() => {
    checkAllConnections();
    
    // Check connections every 30 seconds
    const interval = setInterval(checkAllConnections, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Manual refresh connections
  const refreshConnections = () => {
    checkAllConnections();
  };

  // Force individual connection tests
  const testSupabase = async () => {
    const result = await checkSupabaseConnection();
    setConnectionStatus(prev => ({
      ...prev,
      supabase: result
    }));
    return result;
  };

  const testBackend = async () => {
    const result = await checkBackendConnection();
    setConnectionStatus(prev => ({
      ...prev,
      backend: result
    }));
    return result;
  };

  // Computed connection states
  const hasAnyConnection = connectionStatus.supabase.connected || 
                           connectionStatus.backend.connected;

  const isOptimalConnection = connectionStatus.supabase.connected && 
                             connectionStatus.backend.connected;

  const isDataAvailable = hasAnyConnection && !connectionStatus.loading;

  const value = {
    connectionStatus,
    refreshConnections,
    testSupabase,
    testBackend,
    
    // Connection state flags
    hasAnyConnection,
    isOptimalConnection,
    isDataAvailable,
    
    // Convenience accessors
    isSupabaseConnected: connectionStatus.supabase.connected,
    isBackendConnected: connectionStatus.backend.connected,
    isLoading: connectionStatus.loading,
    
    // Individual connection status for detailed UI
    supabaseStatus: connectionStatus.supabase,
    backendStatus: connectionStatus.backend
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
};

export default ConnectionProvider;
