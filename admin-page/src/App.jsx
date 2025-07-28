// Main application component - Root component of the library booking management system
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { ConnectionProvider } from './contexts/ConnectionContext';
import { DataSourceProvider } from './contexts/DataSourceContext';
import { GlobalApiProvider } from './contexts/GlobalApiContext';

// Import page components
import DashboardPage from './pages/DashboardPage';
import LocationsPage from './pages/LocationsPage';
import BookingsPage from './pages/BookingsPage';
import RoomsManagementPage from './pages/RoomsManagementPage';
import StatisticsPage from './pages/StatisticsPage';
import DataMonitorPage from './pages/DataMonitorPage';

/**
 * Main application component
 * Responsible for routing configuration and overall layout
 */
const App = () => {
  return (
    <DataSourceProvider>
      <ConnectionProvider>
        <GlobalApiProvider>
          <Router 
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
          <MainLayout>
        <Routes>
          {/* Default route - redirect to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Dashboard page - display system overview and key metrics */}
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* Location management page - manage library rooms and venue information */}
          <Route path="/locations" element={<LocationsPage />} />
          
          {/* Booking management page - view and manage all booking records */}
          <Route path="/bookings" element={<BookingsPage />} />
          
          {/* Rooms management page - comprehensive room and schedule management */}
          <Route path="/availability" element={<RoomsManagementPage />} />
          
          {/* Statistics report page - view various data analysis and reports */}
          <Route path="/statistics" element={<StatisticsPage />} />
          
          {/* Data monitor page - monitor data from all systems */}
          <Route path="/monitor" element={<DataMonitorPage />} />
          
          {/* 404 page - handle routes not found */}
          <Route 
            path="*" 
            element={
              <div style={{ 
                padding: '50px', 
                textAlign: 'center', 
                color: '#999' 
              }}>
                <h2>Page Not Found</h2>
                <p>Please check if the URL address is correct</p>
              </div>
            } 
          />
        </Routes>
        </MainLayout>
      </Router>
    </GlobalApiProvider>
    </ConnectionProvider>
    </DataSourceProvider>
  );
}

export default App;
