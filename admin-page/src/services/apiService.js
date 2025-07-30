/**
 * API Service for Admin Page
 * This service now directly calls Supabase API instead of backend proxy
 * Migrat  async getBuildings() {
    try {
      return await this.supabaseService.getBuildings();rom bub-backend to Supabase for better pe  async getBookings(filters =   async createBooking(book  async updateBookingStatu  async getSystemConfig() {
      async updateSystemConfi  async checkAvailability(params) {
    try {
      return await this.supabaseService.checkAvailability(params);nfig) {
    try {
      return await this.supabaseService.updateSystemConfig(config);{
      return await this.supabaseService.getSystemConfig();okingId, status, cancellationReason = null) {
    try {
      return await this.supabaseService.updateBookingStatus(bookingId, status, cancellationReason);ata) {
    try {
      return await this.supabaseService.createBooking(bookingData);{
    try {
      return await this.supabaseService.getBookings(filters);mance and reliability
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

class ApiService {
  constructor() {
    // Using Supabase service directly
    this.supabaseService = supabaseService;
  }

  /**
   * Health check - test if Supabase is accessible
   */
  async healthCheck() {
    try {
      const result = await this.supabaseService.testConnection();
      
      if (result.success) {
        return {
          status: 'healthy',
          message: 'Supabase API is accessible',
          timestamp: new Date().toISOString(),
          details: result
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
        const dashboardData = {
          ...bookingStatsResult.data,
          buildings: buildingsResult.data,
          timestamp: new Date().toISOString()
        };
        
        return {
          success: true,
          data: dashboardData,
          error: null,
          source: 'supabase-direct'
        };
      } else {
        throw new Error(
          bookingStatsResult.error || buildingsResult.error || 'Unknown error'
        );
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      return {
        success: false,
        data: null,
        error: error.message,
        source: 'supabase-direct'
      };
    }
  }

  /**
   * Get all buildings
   */
  async getBuildings() {
    try {
      console.log('Fetching buildings...');
      const result = await this.supabaseService.getBuildings();
      
      if (result.success) {
        return { 
          success: true,
          data: result.data,
          buildings: result.data, // For compatibility
          count: result.data.length,
          error: null,
          source: 'supabase-direct'
        };
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to fetch buildings:', error);
      return {
        success: false,
        data: [],
        buildings: [],
        error: error.message,
        source: 'supabase-direct'
      };
    }
  }

  /**
   * Get building by ID
   */
  async getBuildingById(id) {
    try {
      const result = await this.supabaseService.getBuildings();
      
      if (result.success) {
        const building = result.data.find(b => b.id === id);
        return building || null;
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to fetch building:', error);
      throw error;
    }
  }

  /**
   * Update building
   */
  async updateBuilding(id, updates) {
    try {
      const result = await this.supabaseService.updateBuilding(id, updates);
      
      if (result.success) {
        return {
          success: true,
          data: result.data,
          error: null
        };
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to update building:', error);
      throw error;
    }
  }

  /**
   * Get all rooms with building information
   */
  async getAllRooms() {
    try {
      const result = await this.supabaseService.getRooms();
      
      if (result.success) {
        return { 
          success: true,
          data: {
            rooms: result.data,
            count: result.data.length
          }
        };
      } else {
        return {
          success: false,
          error: result.error || 'Unknown error'
        };
      }
    } catch (error) {
      console.error('Failed to fetch all rooms:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get comprehensive statistics
   */
  async getStats() {
    try {
      const result = await this.supabaseService.getBookingStats();
      
      if (result.success) {
        return {
          success: true,
          stats: result.data,
          error: null,
          source: 'supabase-direct'
        };
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      return {
        success: false,
        stats: null,
        error: error.message,
        source: 'supabase-direct'
      };
    }
  }

  /**
   * Get bookings with optional filters
   */
  async getBookings(filters = {}) {
    try {
      console.log('Fetching bookings with filters:', filters);
      const result = await this.supabaseService.getBookings(filters);
      
      if (result.success) {
        return { 
          success: true,
          bookings: result.data,
          count: result.data.length,
          error: null
        };
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      return {
        success: false,
        bookings: [],
        error: error.message
      };
    }
  }

  /**
   * Create a new booking
   */
  async createBooking(bookingData) {
    try {
      console.log('Creating new booking:', bookingData);
      const result = await this.supabaseService.createBooking(bookingData);
      
      if (result.success) {
        return {
          success: true,
          data: result.data,
          booking: result.data,
          error: null
        };
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to create booking:', error);
      throw error;
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId, status, cancellationReason = null) {
    try {
      console.log('Updating booking status:', { bookingId, status, cancellationReason });
      const result = await this.supabaseService.updateBookingStatus(bookingId, status, cancellationReason);
      
      if (result.success) {
        return {
          success: true,
          data: result.data,
          booking: result.data,
          error: null
        };
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to update booking status:', error);
      throw error;
    }
  }

  /**
   * Get system configuration
   */
  async getSystemConfig() {
    try {
      console.log('Fetching system configuration...');
      const result = await this.supabaseService.getSystemConfig();
      
      if (result.success) {
        return {
          success: true,
          config: result.data,
          error: null
        };
      } else {
        return {
          success: false,
          config: null,
          error: result.error || 'Unknown error'
        };
      }
    } catch (error) {
      console.error('Failed to fetch system config:', error);
      return {
        success: false,
        config: null,
        error: error.message
      };
    }
  }

  /**
   * Update system configuration
   */
  async updateSystemConfig(config) {
    try {
      console.log('Updating system configuration:', config);
      const result = await this.supabaseService.updateSystemConfig(config);
      
      if (result.success) {
        return {
          success: true,
          config: result.data,
          error: null
        };
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to update system config:', error);
      throw error;
    }
  }

  /**
   * Check room availability
   */
  async checkAvailability(params) {
    try {
      console.log('Checking availability:', params);
      const result = await this.supabaseService.checkAvailability(params);
      
      if (result.success) {
        return {
          success: true,
          data: result.data,
          availability: result.data,
          error: null
        };
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to check availability:', error);
      return {
        success: false,
        data: null,
        availability: null,
        error: error.message
      };
    }
  }

  /**
   * Get list of all libraries
   */
  getLibraries() {
    return Object.values(LIBRARY_CODES);
  }

  /**
   * Validate library code
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
export const apiService = new ApiService();
export default apiService;
