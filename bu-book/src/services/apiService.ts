/**
 * API Service for bu-book application
 * Provides a unified interface for data access
 */
import supabaseService from './supabaseService';

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
      return {
        success: result.success,
        status: result.success ? 'connected' : 'disconnected',
        message: result.message || result.error,
        source: 'supabase-direct'
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        success: false,
        status: 'error',
        message: String(error),
        source: 'error'
      };
    }
  }

  /**
   * Get all buildings with rooms
   */
  async getBuildings() {
    try {
      return await this.supabaseService.getBuildings();
    } catch (error) {
      console.error('Failed to fetch buildings:', error);
      return {
        success: false,
        data: [],
        error: String(error)
      };
    }
  }

  /**
   * Get building by ID
   */
  async getBuildingById(buildingId: string) {
    try {
      return await this.supabaseService.getBuildingById(buildingId);
    } catch (error) {
      console.error('Failed to fetch building by ID:', error);
      return {
        success: false,
        data: null,
        error: String(error)
      };
    }
  }

  /**
   * Get all rooms
   */
  async getRooms() {
    try {
      return await this.supabaseService.getRooms();
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      return {
        success: false,
        data: [],
        error: String(error)
      };
    }
  }

  /**
   * Get rooms by building ID
   */
  async getRoomsByBuilding(buildingId: string) {
    try {
      return await this.supabaseService.getRoomsByBuilding(buildingId);
    } catch (error) {
      console.error('Failed to fetch rooms by building:', error);
      return {
        success: false,
        data: [],
        error: String(error)
      };
    }
  }

  /**
   * Create a new booking
   */
  async createBooking(bookingData: any) {
    try {
      return await this.supabaseService.createBooking(bookingData);
    } catch (error) {
      console.error('Failed to create booking:', error);
      return {
        success: false,
        data: null,
        error: String(error)
      };
    }
  }

  /**
   * Get bookings with optional filters
   */
  async getBookings(filters: any = {}) {
    try {
      return await this.supabaseService.getBookings(filters);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      return {
        success: false,
        data: [],
        error: String(error)
      };
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId: string, status: string, cancellationReason?: string) {
    try {
      return await this.supabaseService.updateBookingStatus(bookingId, status, cancellationReason);
    } catch (error) {
      console.error('Failed to update booking status:', error);
      return {
        success: false,
        data: null,
        error: String(error)
      };
    }
  }

  /**
   * Test backend connection (placeholder for consistency)
   */
  async testBackendConnection() {
    // bu-book doesn't use backend, always return Supabase status
    const result = await this.healthCheck();
    return {
      success: result.success,
      connected: result.success,
      error: result.success ? null : result.message
    };
  }

  private supabaseService: typeof supabaseService;
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
