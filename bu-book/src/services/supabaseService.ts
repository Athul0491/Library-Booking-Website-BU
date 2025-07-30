/**
 * Supabase service for bu-book application
 * Handles direct database interactions for booking functionality
 * Updated for new database schema with proper table names
 */
import { supabase } from '../lib/supabase';

/**
 * Supabase service for bu-book operations
 */
class SupabaseService {
  constructor() {
    this.client = supabase;
  }

  /**
   * Test database connection
   */
  async testConnection() {
    try {
      const { data, error } = await this.client
        .from('buildings')
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.error('Supabase connection test failed:', error);
        return { success: false, error: error.message };
      }
      
      return { 
        success: true, 
        message: 'Successfully connected to Supabase',
        count: data 
      };
    } catch (error) {
      console.error('Supabase connection test error:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get all buildings with rooms
   * Updated to use new database schema
   */
  async getBuildings() {
    try {
      const { data, error } = await this.client
        .from('buildings')
        .select(`
          *,
          rooms (*)
        `);
      
      if (error) {
        console.error('Error fetching buildings:', error);
        return { success: false, data: [], error: error.message };
      }
      
      return {
        success: true,
        data: data || [],
        error: null
      };
    } catch (error) {
      console.error('Failed to fetch buildings:', error);
      return { success: false, data: [], error: String(error) };
    }
  }

  /**
   * Get building by ID with rooms
   */
  async getBuildingById(buildingId: string) {
    try {
      const { data, error } = await this.client
        .from('buildings')
        .select(`
          *,
          rooms (*)
        `)
        .eq('id', buildingId)
        .single();
      
      if (error) {
        console.error('Error fetching building by ID:', error);
        return { success: false, data: null, error: error.message };
      }
      
      return {
        success: true,
        data: data,
        error: null
      };
    } catch (error) {
      console.error('Failed to fetch building by ID:', error);
      return { success: false, data: null, error: String(error) };
    }
  }

  /**
   * Get all rooms with building information
   */
  async getRooms() {
    try {
      const { data, error } = await this.client
        .from('rooms')
        .select(`
          *,
          buildings (
            id,
            name,
            short_name,
            address
          )
        `);
      
      if (error) {
        console.error('Error fetching rooms:', error);
        return { success: false, data: [], error: error.message };
      }
      
      return {
        success: true,
        data: data || [],
        error: null
      };
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
      return { success: false, data: [], error: String(error) };
    }
  }

  /**
   * Get rooms by building ID
   */
  async getRoomsByBuilding(buildingId: string) {
    try {
      const { data, error } = await this.client
        .from('rooms')
        .select('*')
        .eq('building_id', buildingId);
      
      if (error) {
        console.error('Error fetching rooms by building:', error);
        return { success: false, data: [], error: error.message };
      }
      
      return {
        success: true,
        data: data || [],
        error: null
      };
    } catch (error) {
      console.error('Failed to fetch rooms by building:', error);
      return { success: false, data: [], error: String(error) };
    }
  }

  /**
   * Create a new booking
   */
  async createBooking(bookingData: any) {
    try {
      const { data, error } = await this.client
        .from('bookings')
        .insert([{
          ...bookingData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) {
        console.error('Error creating booking:', error);
        return { success: false, data: null, error: error.message };
      }
      
      return {
        success: true,
        data: data,
        error: null
      };
    } catch (error) {
      console.error('Failed to create booking:', error);
      return { success: false, data: null, error: String(error) };
    }
  }

  /**
   * Get bookings with optional filters
   */
  async getBookings(filters: any = {}) {
    try {
      let query = this.client
        .from('bookings')
        .select(`
          *,
          rooms (
            *,
            buildings (
              id,
              name,
              short_name
            )
          )
        `);

      // Apply filters
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.roomId) {
        query = query.eq('room_id', filters.roomId);
      }
      
      if (filters.startDate) {
        query = query.gte('start_time', filters.startDate);
      }
      
      if (filters.endDate) {
        query = query.lte('end_time', filters.endDate);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching bookings:', error);
        return { success: false, data: [], error: error.message };
      }
      
      return {
        success: true,
        data: data || [],
        error: null
      };
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      return { success: false, data: [], error: String(error) };
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId: string, status: string, cancellationReason?: string) {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };
      
      if (cancellationReason) {
        updateData.cancellation_reason = cancellationReason;
      }

      const { data, error } = await this.client
        .from('bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select()
        .single();
      
      if (error) {
        console.error('Error updating booking status:', error);
        return { success: false, data: null, error: error.message };
      }
      
      return {
        success: true,
        data: data,
        error: null
      };
    } catch (error) {
      console.error('Failed to update booking status:', error);
      return { success: false, data: null, error: String(error) };
    }
  }

  private client: typeof supabase;
}

// Create and export a singleton instance
const supabaseService = new SupabaseService();
export default supabaseService;
