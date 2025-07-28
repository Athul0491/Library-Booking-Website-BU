// Statistics service - Provides statistics-related API simulation
import dayjs from 'dayjs';

/**
 * Mock statistics service
 * Provides various statistics data and analysis reports
 */
class StatsService {
  constructor() {
    // Simulate delay for realistic API call timing
    this.delay = 500;
  }

  // Simulate network delay
  sleep(ms = this.delay) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get system overview statistics
  async getOverviewStats() {
    await this.sleep();
    
    return {
      success: true,
      data: {
        totalBookings: 1248,
        activeUsers: 456,
        totalRevenue: 12450,
        avgBookingDuration: 2.5,
        utilizationRate: 68.5,
        // Year-over-year growth rate
        growthRates: {
          bookings: 15.6,
          users: 8.3,
          revenue: 22.1,
          utilization: 5.2
        },
        // TodayData
        todayStats: {
          bookings: 45,
          revenue: 890,
          activeUsers: 23
        }
      }
    };
  }

  // Get room usage statistics
  async getRoomStats(dateRange = null) {
    await this.sleep();

    const rooms = [
      { id: 1, name: 'Study Room A', type: 'study', capacity: 50 },
      { id: 2, name: 'Meeting Room B', type: 'meeting', capacity: 12 },
      { id: 3, name: 'Discussion Room C', type: 'discussion', capacity: 8 },
      { id: 4, name: 'Computer Lab D', type: 'computer', capacity: 30 },
      { id: 5, name: 'Reading Area E', type: 'reading', capacity: 100 },
      { id: 6, name: 'Group Room F', type: 'group', capacity: 6 },
    ];

    const stats = rooms.map(room => ({
      ...room,
      bookings: Math.floor(Math.random() * 200) + 50,
      utilization: Math.floor(Math.random() * 40) + 50,
      revenue: Math.floor(Math.random() * 3000) + 1000,
      avgDuration: Math.floor(Math.random() * 3) + 1,
      rating: (Math.random() * 1.5 + 3.5).toFixed(1)
    }));

    return {
      success: true,
      data: stats.sort((a, b) => b.bookings - a.bookings)
    };
  }

  // Get user activity statistics
  async getUserStats(limit = 10) {
    await this.sleep();

    const users = [];
    const names = ['John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson', 'Jessica Miller', 'Robert Taylor', 'Lisa Anderson', 'James Wilson', 'Mary Johnson'];
    
    for (let i = 0; i < Math.min(limit, names.length); i++) {
      users.push({
        id: i + 1,
        name: names[i],
        email: `${names[i].toLowerCase()}@example.com`,
        bookings: Math.floor(Math.random() * 30) + 5,
        totalHours: Math.floor(Math.random() * 100) + 20,
        lastActive: dayjs().subtract(Math.floor(Math.random() * 7), 'day').format('YYYY-MM-DD'),
        joinDate: dayjs().subtract(Math.floor(Math.random() * 365), 'day').format('YYYY-MM-DD'),
        status: Math.random() > 0.1 ? 'active' : 'inactive'
      });
    }

    return {
      success: true,
      data: users.sort((a, b) => b.bookings - a.bookings)
    };
  }

  // Get booking trend data
  async getBookingTrends(days = 30) {
    await this.sleep();

    const trends = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = dayjs().subtract(i, 'day');
      trends.push({
        date: date.format('YYYY-MM-DD'),
        bookings: Math.floor(Math.random() * 50) + 20,
        revenue: Math.floor(Math.random() * 1000) + 500,
        utilization: Math.floor(Math.random() * 30) + 50
      });
    }

    return {
      success: true,
      data: trends
    };
  }

  // Get revenue analysis
  async getRevenueAnalysis(period = 'month') {
    await this.sleep();

    let data = [];
    
    if (period === 'month') {
      // Recent 12 months revenue data
      for (let i = 11; i >= 0; i--) {
        const month = dayjs().subtract(i, 'month');
        data.push({
          period: month.format('YYYY-MM'),
          revenue: Math.floor(Math.random() * 5000) + 8000,
          bookings: Math.floor(Math.random() * 200) + 300,
          avgPrice: Math.floor(Math.random() * 20) + 25
        });
      }
    } else if (period === 'week') {
      // Recent 8 weeks revenue data
      for (let i = 7; i >= 0; i--) {
        const week = dayjs().subtract(i, 'week');
        data.push({
          period: `Week ${week.week()}`,
          revenue: Math.floor(Math.random() * 1500) + 2000,
          bookings: Math.floor(Math.random() * 80) + 100,
          avgPrice: Math.floor(Math.random() * 20) + 25
        });
      }
    }

    return {
      success: true,
      data
    };
  }

  // Get equipment usage statistics
  async getEquipmentStats() {
    await this.sleep();

    const equipment = [
      { name: 'Projector', total: 15, available: 12, inUse: 3, maintenance: 0 },
      { name: 'Whiteboard', total: 25, available: 20, inUse: 4, maintenance: 1 },
      { name: 'Computer', total: 120, available: 95, inUse: 22, maintenance: 3 },
      { name: 'Audio Equipment', total: 8, available: 6, inUse: 2, maintenance: 0 },
      { name: 'Desk & Chair', total: 200, available: 180, inUse: 18, maintenance: 2 },
    ];

    return {
      success: true,
      data: equipment.map(item => ({
        ...item,
        utilizationRate: ((item.inUse / item.total) * 100).toFixed(1)
      }))
    };
  }

  // ExportStatistics & Reports
  async exportReport(params) {
    await this.sleep();

    // Mock export functionality
    console.log('Export report parameters:', params);

    return {
      success: true,
      data: {
        downloadUrl: '/api/reports/download/report_' + Date.now() + '.xlsx',
        filename: `Statistics & Reports_${dayjs().format('YYYY-MM-DD')}.xlsx`
      }
    };
  }

  // Get real-time statistics data (for dashboard)
  async getRealTimeStats() {
    await this.sleep(200); // Shorter delay for real-time data

    return {
      success: true,
      data: {
        currentOnline: Math.floor(Math.random() * 50) + 20,
        todayBookings: Math.floor(Math.random() * 100) + 150,
        todayRevenue: Math.floor(Math.random() * 2000) + 3000,
        systemLoad: Math.floor(Math.random() * 30) + 40,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Get recent bookings for dashboard
  async getRecentBookings(limit = 10) {
    await this.sleep();

    const bookings = [];
    const rooms = ['Study Room A', 'Meeting Room B', 'Discussion Room C', 'Computer Lab D', 'Reading Area E', 'Group Room F'];
    const users = ['John Smith', 'Sarah Johnson', 'Michael Brown', 'Emily Davis', 'David Wilson', 'Jessica Miller', 'Robert Taylor', 'Lisa Anderson'];
    const statuses = ['confirmed', 'completed', 'cancelled', 'pending'];

    for (let i = 0; i < limit; i++) {
      const startTime = dayjs().subtract(Math.floor(Math.random() * 7), 'day').add(Math.floor(Math.random() * 24), 'hour');
      bookings.push({
        id: i + 1,
        room: rooms[Math.floor(Math.random() * rooms.length)],
        user: users[Math.floor(Math.random() * users.length)],
        date: startTime.format('YYYY-MM-DD'),
        time: startTime.format('HH:mm'),
        duration: Math.floor(Math.random() * 4) + 1,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        createdAt: startTime.subtract(Math.floor(Math.random() * 24), 'hour').toISOString()
      });
    }

    return {
      success: true,
      data: bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    };
  }

  // Get popular rooms for dashboard
  async getPopularRooms(limit = 6) {
    await this.sleep();

    const rooms = [
      { id: 1, name: 'Study Room A', type: 'study', capacity: 50 },
      { id: 2, name: 'Meeting Room B', type: 'meeting', capacity: 12 },
      { id: 3, name: 'Discussion Room C', type: 'discussion', capacity: 8 },
      { id: 4, name: 'Computer Lab D', type: 'computer', capacity: 30 },
      { id: 5, name: 'Reading Area E', type: 'reading', capacity: 100 },
      { id: 6, name: 'Group Room F', type: 'group', capacity: 6 },
      { id: 7, name: 'Conference Room G', type: 'conference', capacity: 20 },
      { id: 8, name: 'Workshop Room H', type: 'workshop', capacity: 15 }
    ];

    const popularRooms = rooms.map(room => ({
      ...room,
      bookings: Math.floor(Math.random() * 150) + 50,
      rating: (Math.random() * 1.5 + 3.5).toFixed(1),
      utilization: Math.floor(Math.random() * 40) + 50,
      revenue: Math.floor(Math.random() * 2000) + 1000,
      trend: Math.random() > 0.5 ? 'up' : 'down',
      trendValue: Math.floor(Math.random() * 20) + 5
    })).sort((a, b) => b.bookings - a.bookings);

    return {
      success: true,
      data: popularRooms.slice(0, limit)
    };
  }
}

// Create singleton instance
const statsService = new StatsService();

export default statsService;
