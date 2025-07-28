/**
 * Direct API Service for Supabase REST API
 * This service directly calls Supabase REST API endpoints
 * instead of going through a local backend server
 */

class DirectApiService {
  constructor() {
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    this.apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    this.baseUrl = `${this.supabaseUrl}/rest/v1`;
    
    // Default headers for Supabase REST API
    this.defaultHeaders = {
      'apikey': this.apiKey,
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
  }

  /**
   * Make a request to Supabase REST API
   */
  async makeRequest(endpoint, options = {}) {
    try {
      const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
      
      const response = await fetch(url, {
        headers: {
          ...this.defaultHeaders,
          ...options.headers
        },
        ...options
      });

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
   * Get all buildings
   */
  async getBuildings() {
    try {
      const data = await this.makeRequest('/buildings?select=*&available=eq.true&order=name', {
        method: 'GET'
      });
      
      return { buildings: data };
    } catch (error) {
      console.error('Failed to fetch buildings:', error);
      throw error;
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
}

// Create and export a singleton instance
export const directApiService = new DirectApiService();
export default directApiService;
