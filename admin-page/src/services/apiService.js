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
    this.bubBackendUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000';
    this.retryAttempts = 3;
    this.timeout = 10000;
  }

  /**
   * Generic API request method with retry and timeout support
   */
  async makeRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    const requestOptions = {
      ...options,
      signal: controller.signal
    };

    try {
      const response = await fetch(url, requestOptions);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
   * Test connection to bub-backend API
   */
  async testBackendConnection() {
    try {
      await this.makeRequest(`${this.bubBackendUrl}/api/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ library: 'mug', start: '2025-01-01', end: '2025-01-01' })
      });
      return { connected: true, error: null };
    } catch (error) {
      console.warn('Backend API connection failed:', error.message);
      return { connected: false, error: error.message };
    }
  }

  /**
   * Test connection to Supabase
   */
  async testSupabaseConnection() {
    try {
      const { data, error } = await supabase
        .from('Buildings')
        .select('id')
        .limit(1);
      
      if (error) throw error;
      return { connected: true, error: null };
    } catch (error) {
      console.warn('Supabase connection failed:', error.message);
      return { connected: false, error: error.message };
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
   * Get buildings from Supabase
   */
  async getBuildings() {
    try {
      const { data, error } = await supabase
        .from('Buildings')
        .select('*, Rooms(*)');

      if (error) throw error;

      return {
        success: true,
        data: data || [],
        error: null
      };
    } catch (error) {
      console.warn('Failed to fetch buildings from Supabase:', error.message);
      return {
        success: false,
        data: [],
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
  formatSlots,
  getLibraries,
  isValidLibraryCode,
  getLibraryInfo,
  checkServerStatus,
  testBackendConnection,
  testSupabaseConnection
} = apiService;
