/**
 * API Service for Admin Page
 * This service calls the backend proxy instead of directly calling Supabase
 * Backend proxy provides admin-specific endpoints with optimized data structures
 */

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
    // Use backend proxy instead of direct Supabase
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    this.baseUrl = `${this.backendUrl}/api/admin/v1`;
    
    console.log('ApiService Debug:', {
      backendUrl: this.backendUrl,
      baseUrl: this.baseUrl,
      mode: 'backend-proxy'
    });
    
    console.log('ApiService initialized successfully (backend proxy mode)');
  }

  /**
   * Make a request to backend proxy API
   * @param {string} endpoint - API endpoint
   * @param {object} options - Request options
   */
  async makeRequest(endpoint, options = {}) {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
      
      const defaultHeaders = {
        'Content-Type': 'application/json'
      };
      
      const requestOptions = {
        headers: {
          ...defaultHeaders,
          ...options.headers
        },
        ...options
      };
      
      // Debug: Log request details
      console.log('Making backend request to:', url);
      console.log('Request method:', requestOptions.method || 'GET');
      
      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      // Handle empty responses
      if (response.status === 204) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Backend API request failed:', error);
      throw error;
    }
  }

  /**
   * Health check - test if backend is accessible
   */
  async healthCheck() {
    try {
      console.log('Testing backend connection...');
      const response = await fetch(`${this.backendUrl}/api/health`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        status: 'healthy',
        message: 'Backend proxy is accessible',
        timestamp: new Date().toISOString(),
        backend: data
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Backend proxy error: ${error.message}`,
        timestamp: new Date().toISOString(),
        backend: null
      };
    }
  }

  /**
   * Test backend connection (for compatibility)
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
   * Test Supabase connection (for compatibility)
   */
  async testSupabaseConnection() {
    // This now tests the backend's Supabase connection
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
      console.log('Fetching dashboard data...');
      const response = await this.makeRequest('/dashboard', {
        method: 'GET'
      });
      
      if (response.success) {
        return {
          success: true,
          data: response.data,
          error: null,
          source: 'backend-proxy'
        };
      } else {
        throw new Error(response.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      return {
        success: false,
        data: null,
        error: error.message,
        source: 'backend-proxy'
      };
    }
  }

  /**
   * Get all buildings
   */
  async getBuildings() {
    try {
      console.log('Fetching buildings...');
      const response = await this.makeRequest('/buildings', {
        method: 'GET'
      });
      
      if (response.success) {
        return { 
          success: true,
          data: response.buildings,
          buildings: response.buildings, // For compatibility
          count: response.count,
          error: null,
          source: 'backend-proxy'
        };
      } else {
        throw new Error(response.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to fetch buildings:', error);
      return {
        success: false,
        data: [],
        buildings: [],
        error: error.message,
        source: 'backend-proxy'
      };
    }
  }

  /**
   * Get building by ID
   */
  async getBuildingById(id) {
    try {
      // Use buildings endpoint with filter, but this is not optimized
      const response = await this.makeRequest('/buildings', {
        method: 'GET'
      });
      
      if (response.success) {
        const building = response.buildings.find(b => b.id === id);
        return building || null;
      } else {
        throw new Error(response.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to fetch building:', error);
      throw error;
    }
  }

  /**
   * Update building (placeholder - would need backend endpoint)
   */
  async updateBuilding(id, updates) {
    try {
      console.warn('updateBuilding: Backend endpoint not implemented yet');
      throw new Error('Update building endpoint not yet implemented in backend');
    } catch (error) {
      console.error('Failed to update building:', error);
      throw error;
    }
  }

  /**
   * Get all rooms with building information (more efficient than the old getRoomsByBuilding approach)
   */
  async getAllRooms() {
    try {
      console.log('Fetching all rooms with building info...');
      const response = await this.makeRequest('/rooms', {
        method: 'GET'
      });
      
      if (response.success) {
        return { 
          success: true,
          data: {
            rooms: response.rooms,
            count: response.count
          }
        };
      } else {
        return {
          success: false,
          error: response.error || 'Unknown error'
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
      console.log('Fetching comprehensive statistics...');
      const response = await this.makeRequest('/stats', {
        method: 'GET'
      });
      
      if (response.success) {
        return {
          success: true,
          stats: response.stats,
          error: null,
          source: 'backend-proxy'
        };
      } else {
        throw new Error(response.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      return {
        success: false,
        stats: null,
        error: error.message,
        source: 'backend-proxy'
      };
    }
  }

  /**
   * Get bookings with optional filters (placeholder - would need backend endpoint)
   */
  async getBookings(filters = {}) {
    try {
      console.warn('getBookings: Backend endpoint not implemented yet');
      // For now, return empty bookings as this would require backend implementation
      return { 
        bookings: [],
        message: 'Bookings endpoint not yet implemented in backend proxy'
      };
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      throw error;
    }
  }

  /**
   * Create a new booking (placeholder - would need backend endpoint)
   */
  async createBooking(bookingData) {
    try {
      console.warn('createBooking: Backend endpoint not implemented yet');
      throw new Error('Create booking endpoint not yet implemented in backend proxy');
    } catch (error) {
      console.error('Failed to create booking:', error);
      throw error;
    }
  }

  /**
   * Update booking status (placeholder - would need backend endpoint)
   */
  async updateBookingStatus(bookingId, status, cancellationReason = null) {
    try {
      console.warn('updateBookingStatus: Backend endpoint not implemented yet');
      throw new Error('Update booking status endpoint not yet implemented in backend proxy');
    } catch (error) {
      console.error('Failed to update booking status:', error);
      throw error;
    }
  }

  /**
   * Get system configuration (placeholder - would need backend endpoint)
   */
  async getSystemConfig() {
    try {
      console.warn('getSystemConfig: Backend endpoint not implemented yet');
      return null;
    } catch (error) {
      console.error('Failed to fetch system config:', error);
      throw error;
    }
  }

  /**
   * Update system configuration (placeholder - would need backend endpoint)
   */
  async updateSystemConfig(config) {
    try {
      console.warn('updateSystemConfig: Backend endpoint not implemented yet');
      throw new Error('Update system config endpoint not yet implemented in backend proxy');
    } catch (error) {
      console.error('Failed to update system config:', error);
      throw error;
    }
  }

  /**
   * Placeholder method for availability checking
   * This would need to be implemented based on your LibCal integration
   */
  async checkAvailability(params) {
    // TODO: Implement LibCal availability checking
    console.warn('checkAvailability method not yet implemented');
    return {
      success: false,
      error: 'Availability checking not yet implemented',
      data: null
    };
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
