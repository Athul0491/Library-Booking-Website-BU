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
    rooms: null,
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
        const buildings = result.data?.buildings || [];
        let allRooms = [];
        
        // Get all rooms with building info in one efficient call
        if (buildings.length > 0) {
          console.log('🏢 Fetching all rooms with building info...');
          try {
            const roomsResult = await apiService.getAllRooms();
            if (roomsResult.success && roomsResult.data?.rooms) {
              allRooms = roomsResult.data.rooms.map(room => ({
                // Keep the original room data
                ...room,
                // Add building information for consistent structure
                building_code: room.buildings?.short_name || 'unknown',
                building_name: room.buildings?.name || 'Unknown Building',
                // Keep existing building_id
                building_id: room.building_id
              }));
              console.log(`🏠 Total rooms fetched: ${allRooms.length}`);
              console.log('🔍 Sample room data:', allRooms[0]);
            } else {
              console.warn('No rooms data received:', roomsResult.error);
            }
          } catch (error) {
            console.warn('Failed to fetch all rooms:', error);
          }
        }
        
        setGlobalData({
          dashboard: result.data,
          buildings: buildings,
          rooms: allRooms,
          lastUpdated: new Date().toISOString()
        });
        
        setLastApiCall(new Date().toISOString());
        
        console.log(`✅ Global API Initialized - Status: SUCCESS`);
        console.log(`⏱️ Response time: ${responseTime}ms`);
        console.log(`📊 Data cached: ${buildings.length} buildings, ${allRooms.length} rooms`);
        
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
      case 'rooms':
        return globalData.rooms;
      default:
        return null;
    }
  }, [globalData.dashboard, globalData.buildings, globalData.rooms]);

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
