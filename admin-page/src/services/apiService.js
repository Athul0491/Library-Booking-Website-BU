/**
 * API Service for Supabase REST API
 * This service directly calls Supabase REST API endpoints
 * Replaces the old backend-dependent implementation
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
    // Debug: Log all import.meta.env to see what's available
    console.log('All environment variables:', import.meta.env);
    
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    this.apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    this.baseUrl = `${this.supabaseUrl}/rest/v1`;
    
    // Debug: Check if environment variables are loaded
    console.log('ApiService Debug:', {
      supabaseUrl: this.supabaseUrl,
      hasApiKey: !!this.apiKey,
      apiKeyLength: this.apiKey ? this.apiKey.length : 0,
      apiKeyPreview: this.apiKey ? this.apiKey.substring(0, 20) + '...' : 'NULL'
    });
    
    // Throw error if essential config is missing
    if (!this.supabaseUrl || !this.apiKey) {
      throw new Error('Missing Supabase configuration. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
    }
    
    // Default headers for Supabase REST API
    this.defaultHeaders = {
      'apikey': this.apiKey,
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
    
    // Debug: Log default headers
    console.log('Default headers:', this.defaultHeaders);
  }

  /**
   * Make a request to Supabase REST API
   */
  async makeRequest(endpoint, options = {}) {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
      
      const requestOptions = {
        headers: {
          ...this.defaultHeaders,
          ...options.headers
        },
        ...options
      };
      
      // Debug: Log request details
      console.log('Making request to:', url);
      console.log('Request headers:', requestOptions.headers);
      
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
      console.error('API request failed:', error);
      throw error;
    }
  }

  /**
   * Health check - test if Supabase is accessible
   */
  async healthCheck() {
    try {
      // Simple query to test connection
      const data = await this.makeRequest('/buildings?select=count', {
        method: 'GET',
        headers: {
          'Prefer': 'count=exact'
        }
      });
      
      return {
        status: 'healthy',
        message: 'Supabase REST API is accessible',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Supabase REST API error: ${error.message}`,
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
   * Get all buildings
   */
  async getBuildings() {
    try {
      const data = await this.makeRequest('/buildings?select=*&available=eq.true&order=name', {
        method: 'GET'
      });
      
      return { 
        success: true,
        data: data,
        buildings: data, // For compatibility
        error: null,
        source: 'supabase-rest'
      };
    } catch (error) {
      console.error('Failed to fetch buildings:', error);
      return {
        success: false,
        data: [],
        buildings: [],
        error: error.message,
        source: 'supabase-rest'
      };
    }
  }

  /**
   * Get building by ID
   */
  async getBuildingById(id) {
    try {
      const data = await this.makeRequest(`/buildings?id=eq.${id}&select=*`, {
        method: 'GET'
      });
      
      return data[0] || null;
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
      const data = await this.makeRequest(`/buildings?id=eq.${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      
      return data[0] || null;
    } catch (error) {
      console.error('Failed to update building:', error);
      throw error;
    }
  }

  /**
   * Get rooms by building short name
   */
  async getRoomsByBuilding(shortName) {
    try {
      const data = await this.makeRequest(`/rooms?building_short_name=eq.${shortName}&select=*&order=room_name`, {
        method: 'GET'
      });
      
      return { rooms: data };
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      throw error;
    }
  }

  /**
   * Get bookings with optional filters
   */
  async getBookings(filters = {}) {
    try {
      let query = '/bookings?select=*';
      
      // Add filters
      if (filters.building) {
        query += `&building_short_name=eq.${filters.building}`;
      }
      if (filters.status) {
        query += `&status=eq.${filters.status}`;
      }
      if (filters.startDate) {
        query += `&booking_date=gte.${filters.startDate}`;
      }
      if (filters.endDate) {
        query += `&booking_date=lte.${filters.endDate}`;
      }
      
      query += '&order=created_at.desc';
      
      const data = await this.makeRequest(query, {
        method: 'GET'
      });
      
      return { bookings: data };
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      throw error;
    }
  }

  /**
   * Create a new booking
   */
  async createBooking(bookingData) {
    try {
      const data = await this.makeRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData)
      });
      
      return data[0] || null;
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
      const updates = { 
        status,
        updated_at: new Date().toISOString()
      };
      
      if (cancellationReason) {
        updates.cancellation_reason = cancellationReason;
      }
      
      const data = await this.makeRequest(`/bookings?id=eq.${bookingId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
      
      return data[0] || null;
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
      const data = await this.makeRequest('/system_status?select=*&order=created_at.desc&limit=1', {
        method: 'GET'
      });
      
      return data[0] || null;
    } catch (error) {
      console.error('Failed to fetch system config:', error);
      throw error;
    }
  }

  /**
   * Update system configuration
   */
  async updateSystemConfig(config) {
    try {
      const data = await this.makeRequest('/system_status', {
        method: 'POST',
        body: JSON.stringify({
          ...config,
          created_at: new Date().toISOString()
        })
      });
      
      return data[0] || null;
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
