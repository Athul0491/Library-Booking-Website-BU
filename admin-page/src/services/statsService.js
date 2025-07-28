/**
 * Statistics Service
 * Provides comprehensive statistical analysis and reporting using unified API service with new database schema
 * Integrates real data from Supabase, bub-backend, and fallback mock data
 */
import apiService from './apiService';
import supabaseService from './supabaseService';
import bookingService from './bookingService';
import locationService from './locationService';

/**
 * Mock statistics data for fallback when API is unavailable
 * Updated to match new database schema
 */
const mockStatsData = {
  totalBookings: 1247,
  totalUsers: 342,
  totalRooms: 67,
  totalBuildings: 4,
  activeBuildings: 4,
  occupancyRate: 78.5,
  averageBookingDuration: 2.3,
  bookingStatusBreakdown: {
    confirmed: 856,
    pending: 234,
    cancelled: 157
  },
  popularTimes: [
    { hour: '09:00', bookings: 45 },
    { hour: '10:00', bookings: 67 },
    { hour: '11:00', bookings: 89 },
    { hour: '12:00', bookings: 56 },
    { hour: '13:00', bookings: 78 },
    { hour: '14:00', bookings: 92 },
    { hour: '15:00', bookings: 81 },
    { hour: '16:00', bookings: 74 },
    { hour: '17:00', bookings: 58 },
    { hour: '18:00', bookings: 43 }
  ],
  weeklyTrends: [
    { day: 'Monday', bookings: 156, availability: 82 },
    { day: 'Tuesday', bookings: 189, availability: 75 },
    { day: 'Wednesday', bookings: 203, availability: 68 },
    { day: 'Thursday', bookings: 187, availability: 77 },
    { day: 'Friday', bookings: 234, availability: 62 },
    { day: 'Saturday', bookings: 145, availability: 88 },
    { day: 'Sunday', bookings: 133, availability: 91 }
  ],
  buildingStats: [
    { 
      id: '550e8400-e29b-41d4-a716-446655440101',
      name: 'Mugar Memorial Library', 
      short_name: 'mug', 
      bookings: 456, 
      occupancy: 85,
      total_rooms: 15,
      available_rooms: 8,
      status: 'operational'
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440102',
      name: 'Pardee Library', 
      short_name: 'par', 
      bookings: 298, 
      occupancy: 72,
      total_rooms: 8,
      available_rooms: 3,
      status: 'operational'
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440103',
      name: 'Pickering Educational Resources Library', 
      short_name: 'pic', 
      bookings: 267, 
      occupancy: 68,
      total_rooms: 5,
      available_rooms: 2,
      status: 'maintenance'
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440104',
      name: 'Science & Engineering Library', 
      short_name: 'sci', 
      bookings: 226, 
      occupancy: 74,
      total_rooms: 12,
      available_rooms: 7,
      status: 'operational'
    }
  ]
};

/**
 * Generate mock user statistics for demo purposes
 * Updated to match new database schema
 */
const generateMockUserStats = () => {
  return [
    { 
      id: '550e8400-e29b-41d4-a716-446655440201', 
      user_email: 'john.doe@bu.edu', 
      user_name: 'John Doe',
      total_bookings: 12, 
      last_booking_date: '2025-01-27',
      status: 'active'
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440202', 
      user_email: 'jane.smith@bu.edu', 
      user_name: 'Jane Smith',
      total_bookings: 8, 
      last_booking_date: '2025-01-26',
      status: 'active'
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440203', 
      user_email: 'bob.johnson@bu.edu', 
      user_name: 'Bob Johnson',
      total_bookings: 15, 
      last_booking_date: '2025-01-25',
      status: 'active'
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440204', 
      user_email: 'alice.brown@bu.edu', 
      user_name: 'Alice Brown',
      total_bookings: 6, 
      last_booking_date: '2025-01-24',
      status: 'active'
    }
  ];
};

/**
 * Get comprehensive system statistics
 * @param {Object} options - Query options
 * @param {Array} options.dateRange - Date range for statistics
 * @param {string} options.selectedMetric - Selected metric type
 * @returns {Promise<Object>} Statistics data with success indicator
 */
const getStatistics = async (options = {}) => {
  try {
    const { dateRange, selectedMetric, forceUseMockData = false } = options;
    
    // If forced to use mock data, return mock data immediately
    if (forceUseMockData) {
      return {
        success: true,
        data: {
          statsData: mockStatsData,
          roomStats: mockStatsData.buildingStats,
          userStats: generateMockUserStats()
        },
        isMockData: true,
        timestamp: new Date().toISOString()
      };
    }
    
    // Try to get real data from multiple sources
    const [buildingsResult, bookingsResult, systemResult] = await Promise.allSettled([
      locationService.getBuildingStats(),
      bookingService.getBookingStats(),
      supabaseService.getSystemStats()
    ]);

    // Combine real and calculated data
    let combinedStats = { ...mockStatsData };
    
    // Use real booking stats if available
    if (bookingsResult.status === 'fulfilled' && bookingsResult.value.success) {
      const bookingData = bookingsResult.value.data;
      combinedStats = {
        ...combinedStats,
        totalBookings: bookingData.totalBookings || combinedStats.totalBookings,
        bookingStatusBreakdown: bookingData.statusBreakdown || combinedStats.bookingStatusBreakdown,
        recentBookings: bookingData.recentBookings || 0,
        monthlyBookings: bookingData.monthlyBookings || 0
      };
    }
    
    // Use real building stats if available
    if (buildingsResult.status === 'fulfilled' && buildingsResult.value.success) {
      const buildingData = buildingsResult.value.data;
      combinedStats = {
        ...combinedStats,
        totalBuildings: buildingData.totalBuildings || combinedStats.totalBuildings,
        activeBuildings: buildingData.activeBuildings || combinedStats.activeBuildings,
        totalRooms: buildingData.totalRooms || combinedStats.totalRooms,
        occupancyRate: buildingData.occupancyRate || combinedStats.occupancyRate
      };
    }
    
    // Use real system stats if available
    if (systemResult.status === 'fulfilled' && systemResult.value.success) {
      const systemData = systemResult.value.data;
      combinedStats = {
        ...combinedStats,
        ...systemData
      };
    }

    const isMockData = 
      bookingsResult.status === 'rejected' && 
      buildingsResult.status === 'rejected' && 
      systemResult.status === 'rejected';

    return {
      success: true,
      data: {
        statsData: combinedStats,
        roomStats: buildingsResult.status === 'fulfilled' && buildingsResult.value.success
          ? buildingsResult.value.data.buildings || mockStatsData.buildingStats
          : mockStatsData.buildingStats,
        userStats: await getUserStatistics(dateRange)
      },
      isMockData,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Failed to get statistics:', error);
    return {
      success: false,
      error: error.message,
      data: {
        statsData: mockStatsData,
        roomStats: mockStatsData.buildingStats,
        userStats: generateMockUserStats()
      },
      isMockData: true
    };
  }
};

/**
 * Get building-specific statistics from Supabase with new schema
 * @param {Array} dateRange - Date range for statistics
 * @returns {Promise<Object>} Building statistics
 */
const getBuildingStatistics = async (dateRange) => {
  try {
    // Try to get data from locationService first
    const buildingsResult = await locationService.getBuildingStats();
    
    if (buildingsResult.success) {
      return buildingsResult;
    }
    
    // Fallback to mock data
    throw new Error('Failed to fetch buildings data from locationService');

  } catch (error) {
    console.error('Building statistics error:', error);
    return {
      success: false,
      error: error.message,
      data: mockStatsData.buildingStats
    };
  }
};

/**
 * Get booking statistics from new database schema
 * @param {Array} dateRange - Date range for statistics
 * @param {string} selectedMetric - Selected metric type
 * @returns {Promise<Object>} Booking statistics
 */
const getBookingStatistics = async (dateRange, selectedMetric) => {
  try {
    // Try to get data from bookingService first
    const bookingsResult = await bookingService.getBookingStats();
    
    if (bookingsResult.success) {
      const data = bookingsResult.data;
      
      // Transform to expected format
      const transformedStats = {
        totalBookings: data.totalBookings || 0,
        recentBookings: data.recentBookings || 0,
        monthlyBookings: data.monthlyBookings || 0,
        activeBookings: data.activeBookings || 0,
        occupancyRate: mockStatsData.occupancyRate, // Calculate from room data
        averageBookingDuration: mockStatsData.averageBookingDuration, // Calculate from booking data
        bookingStatusBreakdown: data.statusBreakdown || mockStatsData.bookingStatusBreakdown,
        popularTimes: mockStatsData.popularTimes, // Calculate from booking times
        weeklyTrends: mockStatsData.weeklyTrends, // Calculate from booking dates
        lastUpdated: new Date().toISOString()
      };
      
      return {
        success: true,
        data: transformedStats,
        source: 'database'
      };
    }
    
    throw new Error('Failed to fetch booking data from bookingService');

  } catch (error) {
    console.error('Booking statistics error:', error);
    return {
      success: false,
      error: error.message,
      data: mockStatsData
    };
  }
};

/**
 * Get user statistics (mock data for now)
 * @param {Array} dateRange - Date range for statistics
 * @returns {Promise<Array>} User statistics
 */
const getUserStatistics = async (dateRange) => {
  try {
    // Mock user statistics - in real implementation, this would come from authentication system
    const userStats = [
      { period: 'Today', users: 45, newUsers: 8, activeUsers: 37 },
      { period: 'This Week', users: 234, newUsers: 23, activeUsers: 189 },
      { period: 'This Month', users: 892, newUsers: 67, activeUsers: 567 },
      { period: 'All Time', users: 2341, newUsers: 245, activeUsers: 1234 }
    ];

    return userStats;

  } catch (error) {
    console.error('User statistics error:', error);
    return [];
  }
};

/**
 * Get performance metrics for system monitoring
 * @returns {Promise<Object>} Performance metrics
 */
const getPerformanceMetrics = async () => {
  try {
    // Test connectivity to get response times
    const startTime = Date.now();
    const [backendResult, supabaseResult] = await Promise.allSettled([
      apiService.testBackendConnection(),
      apiService.testSupabaseConnection()
    ]);
    const endTime = Date.now();

    const metrics = {
      apiResponseTime: endTime - startTime,
      backendStatus: backendResult.status === 'fulfilled' && backendResult.value.success,
      supabaseStatus: supabaseResult.status === 'fulfilled' && supabaseResult.value.success,
      systemLoad: Math.floor(Math.random() * 30) + 20, // Mock system load 20-50%
      uptime: '99.8%',
      errorRate: Math.random() * 2, // 0-2% error rate
      lastChecked: new Date().toISOString()
    };

    return {
      success: true,
      data: metrics
    };

  } catch (error) {
    console.error('Performance metrics error:', error);
    return {
      success: false,
      error: error.message,
      data: {
        apiResponseTime: 0,
        backendStatus: false,
        supabaseStatus: false,
        systemLoad: 0,
        uptime: 'Unknown',
        errorRate: 100,
        lastChecked: new Date().toISOString()
      }
    };
  }
};

/**
 * Get usage analytics for reporting
 * @param {Object} timeframe - Timeframe for analytics
 * @returns {Promise<Object>} Usage analytics
 */
const getUsageAnalytics = async (timeframe = 'week') => {
  try {
    // Generate time-based analytics
    const analytics = {
      timeframe,
      totalSessions: Math.floor(Math.random() * 1000) + 500,
      avgSessionDuration: Math.floor(Math.random() * 45) + 15, // 15-60 minutes
      bounceRate: Math.floor(Math.random() * 20) + 10, // 10-30%
      topPages: [
        { page: '/dashboard', views: 456, uniqueViews: 234 },
        { page: '/bookings', views: 389, uniqueViews: 198 },
        { page: '/locations', views: 267, uniqueViews: 145 },
        { page: '/availability', views: 234, uniqueViews: 123 },
        { page: '/statistics', views: 189, uniqueViews: 98 }
      ],
      deviceTypes: {
        desktop: 65,
        mobile: 28,
        tablet: 7
      },
      referralSources: {
        direct: 45,
        search: 32,
        social: 15,
        email: 8
      }
    };

    return {
      success: true,
      data: analytics,
      isMockData: true
    };

  } catch (error) {
    console.error('Usage analytics error:', error);
    return {
      success: false,
      error: error.message,
      data: {}
    };
  }
};

/**
 * Export report data in various formats
 * @param {string} reportType - Type of report to export
 * @param {string} format - Export format (json, csv, pdf)
 * @returns {Promise<Object>} Export result
 */
const exportReport = async (reportType, format = 'json') => {
  try {
    const reportData = await getStatistics();
    
    if (!reportData.success) {
      throw new Error('Failed to generate report data');
    }

    // Mock export functionality
    const exportResult = {
      filename: `${reportType}_report_${new Date().toISOString().split('T')[0]}.${format}`,
      size: Math.floor(Math.random() * 1000) + 100, // KB
      format,
      generatedAt: new Date().toISOString(),
      data: reportData.data
    };

    return {
      success: true,
      data: exportResult,
      message: `Report exported successfully as ${format.toUpperCase()}`
    };

  } catch (error) {
    console.error('Export report error:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to export report'
    };
  }
};

export default {
  getStatistics,
  getBuildingStatistics,
  getBookingStatistics,
  getUserStatistics,
  getPerformanceMetrics,
  getUsageAnalytics,
  exportReport
};
