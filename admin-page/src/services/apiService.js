/**
 * API Service for Admin Page
 * This service now directly calls Supabase API instead of backend proxy
 * Migrated from bub-backend to Supabase for better performance and reliability
 */
import supabaseService from './supabaseService';

// Library codes mapping to Location IDs (LID) - for compatibility
export const LIBRARY_CODES = {
  'mug': { name: 'Mugar Memorial Library', code: 'mug', lid: 19336 },
  'par': { name: 'Pardee Management Library', code: 'par', lid: 19818 },
  'pic': { name: 'Pickering Educational Resources Library', code: 'pic', lid: 18359 },
  'sci': { name: 'Science & Engineering Library', code: 'sci', lid: 20177 },
  'med': { name: 'Alumni Medical Library', code: 'med', lid: 13934 }
};

/**
 * Main API Service Class
 * Handles all API interactions via Supabase
 */
class ApiService {
  constructor() {
    this.supabaseService = supabaseService;
  }

  /**
   * Health check endpoint
   */
  async healthCheck() {
    try {
      const result = await this.supabaseService.testConnection();

      if (result.success) {
        return {
          status: 'healthy',
          message: 'Supabase API is healthy',
          timestamp: new Date().toISOString()
        };
      } else {
        return {
          status: 'unhealthy',
          message: `Supabase API error: ${result.error}`,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Supabase API error: ${error.message}`,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test backend connection (alias for healthCheck for compatibility)
   */
  async testBackendConnection() {
    const result = await this.healthCheck();
    return {
      success: result.status === 'healthy',
      connected: result.status === 'healthy',
      error: result.status === 'healthy' ? null : result.message
    };
  }

  /**
   * Test Supabase connection (alias for healthCheck for compatibility)
   */
  async testSupabaseConnection() {
    const result = await this.healthCheck();
    return {
      success: result.status === 'healthy',
      connected: result.status === 'healthy',
      error: result.status === 'healthy' ? null : result.message
    };
  }

  /**
   * Get dashboard data in one call (optimized for admin interface)
   */
  async getDashboardData() {
    try {
      // Get both booking stats and buildings data in parallel
      const [bookingStatsResult, buildingsResult] = await Promise.all([
        this.supabaseService.getBookingStats(),
        this.supabaseService.getBuildings()
      ]);

      if (bookingStatsResult.success && buildingsResult.success) {
        return {
          success: true,
          data: {
            bookingStats: bookingStatsResult.data,
            buildings: buildingsResult.data,
            lastUpdated: new Date().toISOString()
          }
        };
      } else {
        const errors = [];
        if (!bookingStatsResult.success) errors.push(`Booking stats: ${bookingStatsResult.error}`);
        if (!buildingsResult.success) errors.push(`Buildings: ${buildingsResult.error}`);

        throw new Error(errors.join(', '));
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get statistics for dashboard
   */
  async getStats() {
    try {
      return await this.supabaseService.getDashboardOverview();
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get all buildings
   */
  async getBuildings() {
    try {
      return await this.supabaseService.getBuildings();
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get all rooms with building information
   */
  async getAllRooms() {
    try {
      return await this.supabaseService.getRooms();
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get bookings with filters
   */
  async getBookings(filters = {}) {
    try {
      return await this.supabaseService.getBookings(1, 100, filters);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Create a new booking
   */
  async createBooking(bookingData) {
    try {
      return await this.supabaseService.createBooking(bookingData);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId, status, cancellationReason = null) {
    try {
      return await this.supabaseService.updateBookingStatus(bookingId, status, cancellationReason);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get system configuration
   */
  async getSystemConfig() {
    try {
      return await this.supabaseService.getSystemConfig();
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Update system configuration
   */
  async updateSystemConfig(config) {
    try {
      return await this.supabaseService.updateSystemConfig(config);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Check room availability (for compatibility)
   */
  async checkAvailability(params) {
    try {
      return await this.supabaseService.checkAvailability(params);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get availability for a building (LibCal compatibility)
   */
  async getAvailability(buildingCode, date) {
    try {
      // This would need to be implemented based on your needs
      // For now, return a placeholder response
      return {
        success: true,
        data: {
          building: buildingCode,
          date: date,
          rooms: [],
          message: 'Availability check not implemented'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Utility method to check if a library code is valid
   */
  isValidLibraryCode(code) {
    return Object.keys(LIBRARY_CODES).includes(code);
  }

  /**
   * Get library information by code
   */
  getLibraryInfo(code) {
    return LIBRARY_CODES[code] || null;
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export { apiService };
export default apiService;