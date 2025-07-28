// Supabase service for admin dashboard operations
import { supabase } from '../lib/supabase';

/**
 * Supabase service for admin dashboard operations
 * Handles direct database interactions for admin functionality
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
        .from('bookings')
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
      return { success: false, error: error.message };
    }
  }

  /**
   * Get booking statistics
   */
  async getBookingStats() {
    try {
      const { data, error } = await this.client
        .from('bookings')
        .select('*');
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Calculate statistics
      const totalBookings = data.length;
      const recentBookings = data.filter(booking => {
        const bookingDate = new Date(booking.created_at);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return bookingDate >= sevenDaysAgo;
      }).length;
      
      return {
        success: true,
        data: {
          totalBookings,
          recentBookings,
          bookings: data
        }
      };
    } catch (error) {
      console.error('Error fetching booking stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all bookings with pagination
   */
  async getBookings(page = 1, limit = 10) {
    try {
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      
      const { data, error, count } = await this.client
        .from('bookings')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(start, end);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return {
        success: true,
        data: {
          bookings: data,
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user activity statistics
   */
  async getUserStats() {
    try {
      const { data, error } = await this.client
        .from('bookings')
        .select('user_email, created_at');
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Calculate user statistics
      const uniqueUsers = new Set(data.map(booking => booking.user_email)).size;
      const activeUsersThisWeek = new Set(
        data.filter(booking => {
          const bookingDate = new Date(booking.created_at);
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          return bookingDate >= sevenDaysAgo;
        }).map(booking => booking.user_email)
      ).size;
      
      return {
        success: true,
        data: {
          totalUsers: uniqueUsers,
          activeUsersThisWeek,
          totalBookings: data.length
        }
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get library usage statistics
   */
  async getLibraryStats() {
    try {
      const { data, error } = await this.client
        .from('bookings')
        .select('library, building_name, created_at');
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Calculate library usage
      const libraryUsage = {};
      data.forEach(booking => {
        const lib = booking.library || 'Unknown';
        if (!libraryUsage[lib]) {
          libraryUsage[lib] = {
            name: booking.building_name || lib,
            count: 0,
            recentCount: 0
          };
        }
        libraryUsage[lib].count++;
        
        // Count recent bookings (last 7 days)
        const bookingDate = new Date(booking.created_at);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (bookingDate >= sevenDaysAgo) {
          libraryUsage[lib].recentCount++;
        }
      });
      
      return {
        success: true,
        data: {
          libraryUsage: Object.entries(libraryUsage).map(([code, stats]) => ({
            code,
            ...stats
          })),
          totalBookings: data.length
        }
      };
    } catch (error) {
      console.error('Error fetching library stats:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create and export service instance
const supabaseService = new SupabaseService();
export default supabaseService;
