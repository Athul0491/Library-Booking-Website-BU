/**
 * API Service
 * Unified API service for multiple data sources with error handling
 */
import { supabase } from './supabaseClient';

// Library codes mapping to Location IDs (LID)
export const LIBRARY_CODES = {
  'mug': { name: 'Mugar Memorial Library', code: 'mug', lid: 19336 },
  'par': { name: 'Pardee Library', code: 'par', lid: 19818 },
  'pic': { name: 'Pickering Educational Resources Library', code: 'pic', lid: 18359 },
  'sci': { name: 'Science & Engineering Library', code: 'sci', lid: 20177 }
};

class ApiService {
  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    this.supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    this.bubBackendUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000';
    this.retryAttempts = 3;
    this.timeout = 10000;
    
    // Check if we're using Supabase REST API
    this.isSupabaseApi = this.bubBackendUrl.includes('supabase.co');
    
    // Default headers for Supabase REST API
    this.supabaseHeaders = {
      'apikey': this.supabaseKey,
      'Authorization': `Bearer ${this.supabaseKey}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Generic API request method with retry and timeout support
   */
  async makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    // Add Supabase headers if we're using Supabase API
    const headers = this.isSupabaseApi 
      ? { ...this.supabaseHeaders, ...options.headers }
      : options.headers;

    const requestOptions = {
      ...options,
      headers,
      signal: controller.signal
    };

    try {
      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      throw error;
    }
  }

  /**
   * Test connection to backend API (Supabase REST API or local backend)
   */
  async testBackendConnection() {
    try {
      if (this.isSupabaseApi) {
        // Test Supabase REST API with buildings endpoint
        const response = await this.makeRequest(`${this.bubBackendUrl}/buildings?select=count`, {
          method: 'GET',
          headers: {
            'Prefer': 'count=exact'
          }
        });
        return { success: true, connected: true, error: null };
      } else {
        // Test local backend API
        // Try health check endpoint first (simpler and faster)
        const response = await this.makeRequest(`${this.bubBackendUrl}/health`, {
          method: 'GET'
        });
        return { success: true, connected: true, error: null };
      }
    } catch (healthError) {
      // Fallback to buildings endpoint test
      try {
        const endpoint = this.isSupabaseApi 
          ? `${this.bubBackendUrl}/buildings` 
          : `${this.bubBackendUrl}/api/buildings`;
          
        await this.makeRequest(endpoint, {
          method: 'GET'
        });
        return { success: true, connected: true, error: null };
      } catch (error) {
        console.warn('Backend API connection failed:', error.message);
        return { success: false, connected: false, error: error.message };
      }
    }
  }

  /**
   * Test connection to Supabase with new table names
   */
  async testSupabaseConnection() {
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('id')
        .limit(1);
      
      if (error) throw error;
      return { success: true, connected: true, error: null };
    } catch (error) {
      console.warn('Supabase connection failed:', error.message);
      return { success: false, connected: false, error: error.message };
    }
  }

  /**
   * Get room availability from bub-backend
   */
  async getAvailability(params) {
    try {
      const response = await this.makeRequest(`${this.bubBackendUrl}/api/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      
      return {
        success: true,
        data: response,
        error: null
      };
    } catch (error) {
      console.log('API call failed, using mock data:', error.message);
      
      // Return mock data for demonstration
      const mockData = {
        slots: [
          {
            checksum: "mock765760965e8740b8700df9932933cb88",
            end: `${params.start}T09:00:00-05:00`,
            itemId: 168796,
            start: `${params.start}T08:00:00-05:00`,
            className: "s-lc-eq-period-available"
          },
          {
            checksum: "mockaf932e69f44341b0a109c979087b82f6",
            end: `${params.start}T10:00:00-05:00`,
            itemId: 168797,
            start: `${params.start}T09:00:00-05:00`,
            className: "s-lc-eq-period-booked"
          }
        ]
      };

      return {
        success: true,
        data: mockData,
        error: null,
        isMockData: true
      };
    }
  }

  /**
   * Get buildings from backend API (Supabase REST API or local backend)
   */
  async getBuildings() {
    try {
      // Use correct endpoint based on API type
      const endpoint = this.isSupabaseApi 
        ? `${this.bubBackendUrl}/buildings?select=*&available=eq.true&order=name`
        : `${this.bubBackendUrl}/api/buildings`;
      
      const response = await this.makeRequest(endpoint, {
        method: 'GET'
      });
      
      // Handle different response formats
      const buildings = this.isSupabaseApi ? response : (response.buildings || []);
      
      return {
        success: true,
        data: buildings,
        error: null,
        source: this.isSupabaseApi ? 'supabase-rest' : 'backend'
      };
    } catch (apiError) {
      console.warn('API buildings request failed, trying Supabase client:', apiError.message);
      
      try {
        const { data, error } = await supabase
          .from('buildings')
          .select('*, rooms(*)');

        if (error) throw error;

        return {
          success: true,
          data: data || [],
          error: null,
          source: 'supabase'
        };
      } catch (supabaseError) {
        console.warn('Failed to fetch buildings from Supabase:', supabaseError.message);
        return {
          success: false,
          data: [],
          error: supabaseError.message
        };
      }
    }
  }

  /**
   * Get bookings from new backend API
   */
  async getBookings(page = 1, limit = 10, filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      
      const response = await this.makeRequest(
        `${this.bubBackendUrl}/api/bookings?${queryParams}`,
        { method: 'GET' }
      );
      
      return {
        success: true,
        data: response,
        error: null
      };
    } catch (error) {
      console.warn('Failed to fetch bookings from backend:', error.message);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * Create a new booking via backend API
   */
  async createBooking(bookingData) {
    try {
      const response = await this.makeRequest(`${this.bubBackendUrl}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData)
      });
      
      return {
        success: true,
        data: response,
        error: null
      };
    } catch (error) {
      console.warn('Failed to create booking:', error.message);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * Update booking status via backend API
   */
  async updateBookingStatus(bookingId, status, reason = null) {
    try {
      const response = await this.makeRequest(
        `${this.bubBackendUrl}/api/bookings/${bookingId}/status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, reason })
        }
      );
      
      return {
        success: true,
        data: response,
        error: null
      };
    } catch (error) {
      console.warn('Failed to update booking status:', error.message);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * Get system configuration from backend API
   */
  async getSystemConfig() {
    try {
      const response = await this.makeRequest(`${this.bubBackendUrl}/api/system-config`, {
        method: 'GET'
      });
      
      return {
        success: true,
        data: response,
        error: null
      };
    } catch (error) {
      console.warn('Failed to fetch system config:', error.message);
      return {
        success: false,
        data: null,
        error: error.message
      };
    }
  }

  /**
   * Format time slot data for display
   */
  formatSlots(slots) {
    return slots.map(slot => ({
      id: slot.itemId,
      checksum: slot.checksum,
      startTime: slot.start,
      endTime: slot.end,
      duration: this.calculateDuration(slot.start, slot.end),
      available: slot.className === 's-lc-eq-period-available',
      itemId: slot.itemId,
      status: slot.className === 's-lc-eq-period-available' ? 'available' : 'booked'
    }));
  }

  /**
   * Calculate duration in minutes
   */
  calculateDuration(start, end) {
    const startTime = new Date(start);
    const endTime = new Date(end);
    return Math.round((endTime - startTime) / (1000 * 60));
  }

  /**
   * Get all libraries
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

  /**
   * Check backend server health
   */
  async checkServerStatus() {
    try {
      const connection = await this.testBackendConnection();
      return {
        success: connection.connected,
        online: connection.connected,
        message: connection.connected ? 'Backend server is running' : 'Backend server unavailable'
      };
    } catch (error) {
      return {
        success: false,
        online: false,
        message: 'Backend server connection failed'
      };
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;

// Export utility functions
export const {
  getAvailability,
  getBuildings,
  getBookings,
  createBooking,
  updateBookingStatus,
  getSystemConfig,
  formatSlots,
  getLibraries,
  isValidLibraryCode,
  getLibraryInfo,
  checkServerStatus,
  testBackendConnection,
  testSupabaseConnection
} = apiService;
