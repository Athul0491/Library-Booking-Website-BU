/**
 * Global API Context for bu-book application
 * Manages global state and API calls for building and room data
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '../services/apiService';
import type { ModernBuilding } from '../lib/fetchBuildingsWithModernApi';

interface GlobalApiContextType {
  // Data state
  buildings: ModernBuilding[];
  rooms: any[];
  isLoading: boolean;
  lastFetch: string | null;
  error: string | null;
  
  // API methods
  refreshData: () => Promise<void>;
  getBuildingById: (id: string) => ModernBuilding | null;
  getRoomsByBuilding: (buildingId: string) => any[];
  
  // Connection status
  isConnected: boolean;
  testConnection: () => Promise<boolean>;
}

const GlobalApiContext = createContext<GlobalApiContextType | undefined>(undefined);

export const useGlobalApi = () => {
  const context = useContext(GlobalApiContext);
  if (context === undefined) {
    throw new Error('useGlobalApi must be used within a GlobalApiProvider');
  }
  return context;
};

interface GlobalApiProviderProps {
  children: React.ReactNode;
}

export const GlobalApiProvider: React.FC<GlobalApiProviderProps> = ({ children }) => {
  const [buildings, setBuildings] = useState<ModernBuilding[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Test connection to Supabase
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      const result = await apiService.healthCheck();
      setIsConnected(result.success);
      return result.success;
    } catch (error) {
      console.error('Connection test failed:', error);
      setIsConnected(false);
      return false;
    }
  }, []);

  // Fetch all data
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Test connection first
      const connectionOk = await testConnection();
      if (!connectionOk) {
        throw new Error('Unable to connect to database');
      }

      // Fetch buildings and rooms in parallel
      const [buildingsResult, roomsResult] = await Promise.all([
        apiService.getBuildings(),
        apiService.getRooms()
      ]);

      if (buildingsResult.success) {
        setBuildings(buildingsResult.data || []);
      } else {
        console.error('Failed to fetch buildings:', buildingsResult.error);
      }

      if (roomsResult.success) {
        setRooms(roomsResult.data || []);
      } else {
        console.error('Failed to fetch rooms:', roomsResult.error);
      }

      setLastFetch(new Date().toISOString());
      
      if (!buildingsResult.success && !roomsResult.success) {
        throw new Error('Failed to fetch any data');
      }

    } catch (error) {
      console.error('Failed to refresh data:', error);
      setError(String(error));
    } finally {
      setIsLoading(false);
    }
  }, [testConnection]);

  // Get building by ID
  const getBuildingById = useCallback((id: string): ModernBuilding | null => {
    return buildings.find(building => building.id === id) || null;
  }, [buildings]);

  // Get rooms by building ID
  const getRoomsByBuilding = useCallback((buildingId: string) => {
    return rooms.filter(room => room.building_id === buildingId);
  }, [rooms]);

  // Initialize data on mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        refreshData();
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [isLoading, refreshData]);

  const contextValue: GlobalApiContextType = {
    buildings,
    rooms,
    isLoading,
    lastFetch,
    error,
    refreshData,
    getBuildingById,
    getRoomsByBuilding,
    isConnected,
    testConnection
  };

  return (
    <GlobalApiContext.Provider value={contextValue}>
      {children}
    </GlobalApiContext.Provider>
  );
};
