/**
 * Data Source Context
 * Manages the toggle between real server data and mock data for development/demo purposes
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

export const DataSourceProvider = ({ children }) => {
  // Default to real data, but allow switching to mock data
  const [useRealData, setUseRealData] = useState(() => {
    // Check localStorage for saved preference
    const saved = localStorage.getItem('admin-page-use-real-data');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Save preference to localStorage when changed
  useEffect(() => {
    localStorage.setItem('admin-page-use-real-data', JSON.stringify(useRealData));
  }, [useRealData]);

  const toggleDataSource = () => {
    setUseRealData(prev => !prev);
  };

  const value = {
    useRealData,
    setUseRealData,
    toggleDataSource,
    dataSourceLabel: useRealData ? 'Real Server Data' : 'Mock Demo Data'
  };

  return (
    <DataSourceContext.Provider value={value}>
      {children}
    </DataSourceContext.Provider>
  );
};
