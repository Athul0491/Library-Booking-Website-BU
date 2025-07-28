/**
 * Data Monitor Service
 * Provides comprehensive monitoring for all system components:
 * - bub-backend API health and performance
 * - bu-book frontend data usage
 * - Supabase database connectivity
 * - LibCal API integration status
 * - Real-time availability monitoring
 */
import apiService from './apiService';

/**
 * Check the health status of all system components
 * @returns {Object} Health status for all components
 */
const checkSystemHealth = async () => {
  const health = {
    bubBackend: { status: 'unknown', message: 'Checking...', responseTime: null },
    supabase: { status: 'unknown', message: 'Checking...', responseTime: null },
    libcal: { status: 'unknown', message: 'Checking...', responseTime: null },
    adminPage: { status: 'running', message: 'Current session active', responseTime: 0 }
  };

  try {
    // Test bub-backend connection
    const startTime = Date.now();
    const backendResult = await apiService.testBackendConnection();
    health.bubBackend = {
      status: backendResult.success ? 'running' : 'error',
      message: backendResult.success ? 'Connected successfully' : backendResult.error,
      responseTime: Date.now() - startTime
    };

    // Test Supabase connection
    const supabaseStartTime = Date.now();
    const supabaseResult = await apiService.testSupabaseConnection();
    health.supabase = {
      status: supabaseResult.success ? 'running' : 'error',
      message: supabaseResult.success ? 'Connected successfully' : supabaseResult.error,
      responseTime: Date.now() - supabaseStartTime
    };

    // Test LibCal integration through backend
    if (backendResult.success) {
      const libcalStartTime = Date.now();
      // Use checkAvailability method instead of getAvailability
      const libcalResult = await apiService.checkAvailability({
        building: 'mug', 
        date: new Date().toISOString().split('T')[0]
      });
      health.libcal = {
        status: libcalResult.success ? 'running' : 'error',
        message: libcalResult.success ? 'LibCal API accessible via backend' : 'LibCal API not accessible',
        responseTime: Date.now() - libcalStartTime
      };
    }

  } catch (error) {
    console.error('Health check error:', error);
  }

  return health;
};

/**
 * Get API usage statistics and performance metrics
 * @returns {Object} API statistics
 */
const getApiStats = async () => {
  try {
    // Mock API statistics - in a real implementation, these would come from monitoring tools
    const stats = {
      totalRequests: Math.floor(Math.random() * 10000) + 5000,
      successRate: Math.floor(Math.random() * 10) + 90, // 90-100%
      avgResponseTime: Math.floor(Math.random() * 200) + 100, // 100-300ms
      errorCount: Math.floor(Math.random() * 50),
      uptime: '99.8%',
      lastUpdated: new Date().toISOString(),
      endpoints: [
        {
          path: '/buildings',
          requests: Math.floor(Math.random() * 1000) + 500,
          avgResponseTime: Math.floor(Math.random() * 150) + 50,
          successRate: Math.floor(Math.random() * 5) + 95
        },
        {
          path: '/buildings',
          requests: Math.floor(Math.random() * 500) + 200,
          avgResponseTime: Math.floor(Math.random() * 100) + 30,
          successRate: Math.floor(Math.random() * 3) + 97
        },
        {
          path: '/bookings',
          requests: Math.floor(Math.random() * 200) + 100,
          avgResponseTime: Math.floor(Math.random() * 50) + 10,
          successRate: 100
        }
      ]
    };

    return {
      success: true,
      data: stats,
      isMockData: true
    };

  } catch (error) {
    console.error('Failed to get API stats:', error);
    return {
      success: false,
      error: error.message,
      data: {
        totalRequests: 0,
        successRate: 0,
        avgResponseTime: 0,
        errorCount: 0,
        uptime: 'Unknown',
        endpoints: []
      }
    };
  }
};

/**
 * Monitor real-time data flow between systems
 * @returns {Object} Data flow monitoring information
 */
const monitorDataFlow = async () => {
  try {
    // Check data flow from each source
    const buBookData = await apiService.getBuildings();
    const libcalData = await apiService.getAvailability('mug', new Date().toISOString().split('T')[0]);

    const dataFlow = {
      buBookToAdmin: {
        status: buBookData.success ? 'active' : 'inactive',
        lastSync: new Date().toISOString(),
        dataCount: buBookData.success ? (buBookData.data?.length || 0) : 0,
        errors: buBookData.success ? 0 : 1
      },
      backendToAdmin: {
        status: libcalData.success ? 'active' : 'inactive',
        lastSync: new Date().toISOString(),
        dataCount: libcalData.success ? (libcalData.data?.length || 0) : 0,
        errors: libcalData.success ? 0 : 1
      },
      adminToDisplay: {
        status: 'active',
        lastSync: new Date().toISOString(),
        dataCount: 1,
        errors: 0
      }
    };

    return {
      success: true,
      data: dataFlow,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Data flow monitoring error:', error);
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
};

/**
 * Get system performance metrics
 * @returns {Object} Performance metrics
 */
const getPerformanceMetrics = async () => {
  try {
    // Mock performance data - would be real metrics in production
    const metrics = {
      memoryUsage: {
        used: Math.floor(Math.random() * 200) + 100, // MB
        total: 512,
        percentage: Math.floor(Math.random() * 40) + 20
      },
      cpuUsage: {
        percentage: Math.floor(Math.random() * 30) + 10
      },
      networkLatency: {
        backend: Math.floor(Math.random() * 50) + 20, // ms
        supabase: Math.floor(Math.random() * 100) + 50,
        libcal: Math.floor(Math.random() * 200) + 100
      },
      cacheHitRate: Math.floor(Math.random() * 20) + 80, // 80-100%
      activeConnections: Math.floor(Math.random() * 50) + 10,
      queueLength: Math.floor(Math.random() * 5)
    };

    return {
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Performance metrics error:', error);
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
};

/**
 * Get error logs and system alerts
 * @returns {Object} Error logs and alerts
 */
const getSystemLogs = async () => {
  try {
    // Mock log data - would be real logs in production
    const logs = [
      {
        id: 1,
        timestamp: new Date(Date.now() - 60000).toISOString(),
        level: 'info',
        source: 'bub-backend',
        message: 'LibCal API connection established',
        details: 'Successfully connected to LibCal API endpoint'
      },
      {
        id: 2,
        timestamp: new Date(Date.now() - 120000).toISOString(),
        level: 'info',
        source: 'supabase',
        message: 'Database query executed',
        details: 'Retrieved building data for dashboard display'
      },
      {
        id: 3,
        timestamp: new Date(Date.now() - 180000).toISOString(),
        level: 'warning',
        source: 'admin-page',
        message: 'Slow API response detected',
        details: 'LibCal API response time exceeded 2 seconds'
      },
      {
        id: 4,
        timestamp: new Date(Date.now() - 300000).toISOString(),
        level: 'info',
        source: 'system',
        message: 'Auto-refresh completed',
        details: 'Dashboard data refreshed successfully'
      }
    ];

    return {
      success: true,
      data: logs,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('System logs error:', error);
    return {
      success: false,
      error: error.message,
      data: []
    };
  }
};

export default {
  checkSystemHealth,
  getApiStats,
  monitorDataFlow,
  getPerformanceMetrics,
  getSystemLogs
};
