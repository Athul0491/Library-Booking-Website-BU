// StatisticsData服务 - 提供Statistics相关的API模拟
import dayjs from 'dayjs';

/**
 * 模拟StatisticsData服务
 * 提供各种StatisticsData和AnalysisReport
 */
class StatsService {
  constructor() {
    // 模拟延迟，真实API调用的Time
    this.delay = 500;
  }

  // 模拟网络延迟
  sleep(ms = this.delay) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 获取SystemOverviewStatistics
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
        // 同比GrowthRate
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

  // 获取Room使用Statistics
  async getRoomStats(dateRange = null) {
    await this.sleep();

    const rooms = [
      { id: 1, name: '自习室A', type: 'study', capacity: 50 },
      { id: 2, name: '会议室B', type: 'meeting', capacity: 12 },
      { id: 3, name: '讨论室C', type: 'discussion', capacity: 8 },
      { id: 4, name: '机房D', type: 'computer', capacity: 30 },
      { id: 5, name: '阅读区E', type: 'reading', capacity: 100 },
      { id: 6, name: '小组室F', type: 'group', capacity: 6 },
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

  // 获取UserActive度Statistics
  async getUserStats(limit = 10) {
    await this.sleep();

    const users = [];
    const names = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑一', '王二'];
    
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

  // 获取预订趋势Data
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

  // 获取RevenueAnalysis
  async getRevenueAnalysis(period = 'month') {
    await this.sleep();

    let data = [];
    
    if (period === 'month') {
      // Recent12个月的RevenueData
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
      // Recent8周的RevenueData
      for (let i = 7; i >= 0; i--) {
        const week = dayjs().subtract(i, 'week');
        data.push({
          period: `第${week.week()}周`,
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

  // 获取Equipment使用Statistics
  async getEquipmentStats() {
    await this.sleep();

    const equipment = [
      { name: '投影仪', total: 15, available: 12, inUse: 3, maintenance: 0 },
      { name: '白板', total: 25, available: 20, inUse: 4, maintenance: 1 },
      { name: '电脑', total: 120, available: 95, inUse: 22, maintenance: 3 },
      { name: '音响Equipment', total: 8, available: 6, inUse: 2, maintenance: 0 },
      { name: '桌椅', total: 200, available: 180, inUse: 18, maintenance: 2 },
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

    // 模拟Export功能
    console.log('ExportReport参数:', params);

    return {
      success: true,
      data: {
        downloadUrl: '/api/reports/download/report_' + Date.now() + '.xlsx',
        filename: `Statistics & Reports_${dayjs().format('YYYY-MM-DD')}.xlsx`
      }
    };
  }

  // 获取实时StatisticsData（用于仪表盘）
  async getRealTimeStats() {
    await this.sleep(200); // 实时Data延迟更短

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
}

// 创建单例实例
const statsService = new StatsService();

export default statsService;
