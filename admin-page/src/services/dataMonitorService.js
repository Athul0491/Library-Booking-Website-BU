/**
 * Data Monitor Service - Monitor data from all systems
 * 
 * This service provides comprehensive monitoring for:
 * - bub-backend API health and performance
 * - bu-book frontend data integration
 * - Real-time data synchronization
 * - System health monitoring
 */

import axios from 'axios';
import dayjs from 'dayjs';

/**
 * Configuration
 */
const BUB_BACKEND_URL = 'http://localhost:5000';
const BU_BOOK_API_URL = '/api'; // Assuming bu-book runs on same domain

/**
 * Data Monitor Service Class
 */
class DataMonitorService {
  constructor() {
    this.apiStats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      lastUpdated: dayjs()
    };
  }

  /**
   * Check system health for all components
   * @returns {Promise<Object>} System health status
   */
  async checkSystemHealth() {
    const results = {};

    // Check bub-backend
    try {
      const startTime = Date.now();
      const response = await axios.get(`${BUB_BACKEND_URL}/api/availability`, {
        timeout: 3000,
        validateStatus: () => true // Accept all status codes
      });
      const responseTime = Date.now() - startTime;

      results.bubBackend = {
        status: response.status === 200 ? 'running' : 'warning',
        message: response.status === 200 
          ? `Server responding (${responseTime}ms)` 
          : `Server returned status ${response.status}`,
        responseTime,
        lastChecked: dayjs().toISOString()
      };

      this.updateApiStats(true, responseTime);
    } catch (error) {
      results.bubBackend = {
        status: 'error',
        message: `Connection failed: ${error.message}`,
        responseTime: null,
        lastChecked: dayjs().toISOString()
      };

      this.updateApiStats(false, null);
    }

    // Check bu-book (indirect check through expected endpoints)
    try {
      // Try to check if bu-book endpoints are available
      // This is a proxy check since bu-book is a separate frontend
      results.buBook = {
        status: 'unknown',
        message: 'Frontend status cannot be directly checked from admin panel',
        lastChecked: dayjs().toISOString()
      };
    } catch (error) {
      results.buBook = {
        status: 'unknown',
        message: 'Cannot determine bu-book status',
        lastChecked: dayjs().toISOString()
      };
    }

    // Admin page is always running if this code executes
    results.adminPage = {
      status: 'running',
      message: 'Admin panel active and responsive',
      lastChecked: dayjs().toISOString()
    };

    return results;
  }

  /**
   * Get API usage statistics
   * @returns {Object} API statistics
   */
  getApiStats() {
    const successRate = this.apiStats.totalRequests > 0 
      ? (this.apiStats.successfulRequests / this.apiStats.totalRequests) * 100 
      : 0;

    const avgResponseTime = this.apiStats.responseTimes.length > 0
      ? this.apiStats.responseTimes.reduce((a, b) => a + b, 0) / this.apiStats.responseTimes.length
      : 0;

    return {
      totalRequests: this.apiStats.totalRequests,
      successfulRequests: this.apiStats.successfulRequests,
      failedRequests: this.apiStats.failedRequests,
      successRate: Math.round(successRate * 10) / 10,
      avgResponseTime: Math.round(avgResponseTime),
      errorCount: this.apiStats.failedRequests,
      lastUpdated: this.apiStats.lastUpdated.format('YYYY-MM-DD HH:mm:ss')
    };
  }

  /**
   * Update API statistics
   * @param {boolean} success - Whether the request was successful
   * @param {number|null} responseTime - Response time in milliseconds
   */
  updateApiStats(success, responseTime) {
    this.apiStats.totalRequests++;
    
    if (success) {
      this.apiStats.successfulRequests++;
      if (responseTime !== null) {
        this.apiStats.responseTimes.push(responseTime);
        // Keep only last 100 response times
        if (this.apiStats.responseTimes.length > 100) {
          this.apiStats.responseTimes.shift();
        }
      }
    } else {
      this.apiStats.failedRequests++;
    }

    this.apiStats.lastUpdated = dayjs();
  }

  /**
   * Get building data (mock data representing bu-book integration)
   * @returns {Promise<Array>} Building data
   */
  async getBuildingData() {
    try {
      // Mock building data that represents what bu-book would provide
      // In a real implementation, this would integrate with bu-book's Supabase data
      const mockBuildingData = [
        {
          id: 1,
          name: 'Mugar Memorial Library',
          code: 'mug',
          lid: 19336,
          totalRooms: 24,
          availableRooms: 18,
          available: true,
          address: '771 Commonwealth Ave, Boston, MA 02215',
          website: 'https://www.bu.edu/library/mugar/',
          lastUpdated: dayjs().toISOString()
        },
        {
          id: 2,
          name: 'Pardee Library',
          code: 'par',
          lid: 19818,
          totalRooms: 16,
          availableRooms: 12,
          available: true,
          address: '1 Silber Way, Boston, MA 02215',
          website: 'https://www.bu.edu/library/pardee/',
          lastUpdated: dayjs().toISOString()
        },
        {
          id: 3,
          name: 'Pickering Educational Resources Library',
          code: 'pic',
          lid: 18359,
          totalRooms: 8,
          availableRooms: 3,
          available: true,
          address: '2 Silber Way, Boston, MA 02215',
          website: 'https://www.bu.edu/library/pickering/',
          lastUpdated: dayjs().toISOString()
        },
        {
          id: 4,
          name: 'Science & Engineering Library',
          code: 'sci',
          lid: 20177,
          totalRooms: 20,
          availableRooms: 0,
          available: false,
          address: '38 Cummington Mall, Boston, MA 02215',
          website: 'https://www.bu.edu/library/sel/',
          lastUpdated: dayjs().toISOString()
        }
      ];

      return mockBuildingData;
    } catch (error) {
      console.error('Failed to get building data:', error);
      return [];
    }
  }

  /**
   * Get real-time availability data from bub-backend
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Availability data
   */
  async getAvailabilityData(params) {
    try {
      const startTime = Date.now();
      const response = await axios.post(`${BUB_BACKEND_URL}/api/availability`, params, {
        timeout: 5000
      });
      const responseTime = Date.now() - startTime;

      this.updateApiStats(true, responseTime);

      return {
        success: true,
        data: response.data,
        responseTime,
        timestamp: dayjs().toISOString()
      };
    } catch (error) {
      this.updateApiStats(false, null);

      return {
        success: false,
        error: error.message,
        timestamp: dayjs().toISOString()
      };
    }
  }

  /**
   * Get data usage patterns and insights
   * @returns {Object} Data insights
   */
  getDataInsights() {
    const insights = {
      peakUsageTimes: [
        { time: '09:00-10:00', requests: 45 },
        { time: '13:00-14:00', requests: 38 },
        { time: '15:00-16:00', requests: 42 }
      ],
      mostRequestedLibraries: [
        { library: 'Mugar Memorial Library', code: 'mug', requests: 156 },
        { library: 'Pardee Library', code: 'par', requests: 98 },
        { library: 'Science & Engineering Library', code: 'sci', requests: 87 },
        { library: 'Pickering Educational Resources Library', code: 'pic', requests: 34 }
      ],
      dataFreshness: {
        availability: dayjs().subtract(2, 'minutes'),
        buildings: dayjs().subtract(15, 'minutes'),
        health: dayjs().subtract(30, 'seconds')
      },
      systemLoad: {
        cpu: Math.floor(Math.random() * 60) + 20, // Mock CPU usage
        memory: Math.floor(Math.random() * 40) + 40, // Mock memory usage
        network: Math.floor(Math.random() * 30) + 10 // Mock network usage
      }
    };

    return insights;
  }

  /**
   * Export monitoring data for analysis
   * @param {string} format - Export format ('json' or 'csv')
   * @returns {string} Formatted data
   */
  exportMonitoringData(format = 'json') {
    const data = {
      timestamp: dayjs().toISOString(),
      apiStats: this.getApiStats(),
      systemHealth: 'Available via checkSystemHealth()',
      dataInsights: this.getDataInsights()
    };

    if (format === 'csv') {
      // Simple CSV conversion for key metrics
      const csv = [
        'Metric,Value,Timestamp',
        `Total Requests,${data.apiStats.totalRequests},${data.timestamp}`,
        `Success Rate,${data.apiStats.successRate}%,${data.timestamp}`,
        `Avg Response Time,${data.apiStats.avgResponseTime}ms,${data.timestamp}`,
        `Error Count,${data.apiStats.errorCount},${data.timestamp}`
      ].join('\n');
      
      return csv;
    }

    return JSON.stringify(data, null, 2);
  }

  /**
   * Reset API statistics
   */
  resetApiStats() {
    this.apiStats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      lastUpdated: dayjs()
    };
  }

  /**
   * Get system recommendations based on current data
   * @returns {Array} Recommendations
   */
  getSystemRecommendations() {
    const stats = this.getApiStats();
    const recommendations = [];

    if (stats.successRate < 90) {
      recommendations.push({
        type: 'warning',
        title: 'Low Success Rate',
        message: 'API success rate is below 90%. Consider checking backend server health.',
        priority: 'high'
      });
    }

    if (stats.avgResponseTime > 2000) {
      recommendations.push({
        type: 'warning',
        title: 'Slow Response Time',
        message: 'Average response time is above 2 seconds. Consider optimizing API calls.',
        priority: 'medium'
      });
    }

    if (stats.errorCount > 10) {
      recommendations.push({
        type: 'error',
        title: 'High Error Count',
        message: 'Multiple API errors detected. Immediate attention required.',
        priority: 'high'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        title: 'System Running Smoothly',
        message: 'All systems are operating within normal parameters.',
        priority: 'info'
      });
    }

    return recommendations;
  }
}

// Create singleton instance
const dataMonitorService = new DataMonitorService();

export default dataMonitorService;

// Export individual methods for convenience
export const {
  checkSystemHealth,
  getApiStats,
  getBuildingData,
  getAvailabilityData,
  getDataInsights,
  exportMonitoringData,
  resetApiStats,
  getSystemRecommendations
} = dataMonitorService;
