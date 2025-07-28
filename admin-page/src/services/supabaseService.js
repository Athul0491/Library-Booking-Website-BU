// Supabase service for admin dashboard operations
import { supabase } from '../lib/supabase';

/**
 * Supabase service for admin dashboard operations
 * Handles direct database interactions for admin functionality
 * Updated for new database schema with proper table names
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
        .from('Bookings')
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
   * Get comprehensive booking statistics
   */
  async getBookingStats() {
    try {
      const { data, error } = await this.client
        .from('Bookings')
        .select(`
          id, user_email, user_name, booking_reference,
          building_name, building_short_name, room_name,
          booking_date, start_time, end_time, duration_minutes,
          status, purpose, notes, created_at, updated_at
        `);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Calculate comprehensive statistics
      const totalBookings = data.length;
      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentBookings = data.filter(booking => {
        const bookingDate = new Date(booking.created_at);
        return bookingDate >= sevenDaysAgo;
      }).length;
      
      const monthlyBookings = data.filter(booking => {
        const bookingDate = new Date(booking.created_at);
        return bookingDate >= thirtyDaysAgo;
      }).length;
      
      // Status breakdown
      const statusBreakdown = data.reduce((acc, booking) => {
        acc[booking.status] = (acc[booking.status] || 0) + 1;
        return acc;
      }, {});
      
      // Active bookings (confirmed, active, pending)
      const activeBookings = data.filter(booking => 
        ['confirmed', 'active', 'pending'].includes(booking.status)
      ).length;
      
      return {
        success: true,
        data: {
          totalBookings,
          recentBookings,
          monthlyBookings,
          activeBookings,
          statusBreakdown,
          bookings: data
        }
      };
    } catch (error) {
      console.error('Error fetching booking stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all bookings with pagination and filtering
   */
  async getBookings(page = 1, limit = 10, filters = {}) {
    try {
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      
      let query = this.client
        .from('Bookings')
        .select(`
          id, user_email, user_name, booking_reference,
          building_name, building_short_name, room_name,
          booking_date, start_time, end_time, duration_minutes,
          status, purpose, notes, created_at, updated_at
        `, { count: 'exact' })
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.building) {
        query = query.eq('building_short_name', filters.building);
      }
      if (filters.dateFrom) {
        query = query.gte('booking_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('booking_date', filters.dateTo);
      }
      if (filters.userEmail) {
        query = query.ilike('user_email', `%${filters.userEmail}%`);
      }
      
      const { data, error, count } = await query.range(start, end);
      
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
      const { data: bookingsData, error: bookingsError } = await this.client
        .from('Bookings')
        .select('user_email, created_at');
      
      if (bookingsError) {
        return { success: false, error: bookingsError.message };
      }
      
      const { data: profilesData, error: profilesError } = await this.client
        .from('UserProfiles')
        .select('email, total_bookings, active_bookings, cancelled_bookings, last_activity_at, created_at');
      
      if (profilesError) {
        return { success: false, error: profilesError.message };
      }
      
      // Calculate user statistics
      const uniqueUsers = new Set(bookingsData.map(booking => booking.user_email)).size;
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const activeUsersThisWeek = new Set(
        bookingsData.filter(booking => {
          const bookingDate = new Date(booking.created_at);
          return bookingDate >= sevenDaysAgo;
        }).map(booking => booking.user_email)
      ).size;
      
      // User profile statistics
      const totalProfiles = profilesData.length;
      const activeProfiles = profilesData.filter(profile => profile.active_bookings > 0).length;
      
      return {
        success: true,
        data: {
          totalUsers: uniqueUsers,
          totalProfiles,
          activeUsersThisWeek,
          activeProfiles,
          totalBookings: bookingsData.length,
          userProfiles: profilesData
        }
      };
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get building and room usage statistics
   */
  async getBuildingStats() {
    try {
      const { data: buildingsData, error: buildingsError } = await this.client
        .from('Buildings')
        .select('id, name, short_name, address, available, libcal_id, lid');
      
      if (buildingsError) {
        return { success: false, error: buildingsError.message };
      }
      
      const { data: bookingsData, error: bookingsError } = await this.client
        .from('Bookings')
        .select('building_short_name, building_name, room_name, created_at');
      
      if (bookingsError) {
        return { success: false, error: bookingsError.message };
      }
      
      // Calculate building usage
      const buildingUsage = {};
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      bookingsData.forEach(booking => {
        const buildingKey = booking.building_short_name || 'Unknown';
        if (!buildingUsage[buildingKey]) {
          buildingUsage[buildingKey] = {
            name: booking.building_name || buildingKey,
            shortName: buildingKey,
            count: 0,
            recentCount: 0,
            rooms: new Set()
          };
        }
        buildingUsage[buildingKey].count++;
        buildingUsage[buildingKey].rooms.add(booking.room_name);
        
        // Count recent bookings (last 7 days)
        const bookingDate = new Date(booking.created_at);
        if (bookingDate >= sevenDaysAgo) {
          buildingUsage[buildingKey].recentCount++;
        }
      });
      
      // Convert to array and add room counts
      const usageArray = Object.entries(buildingUsage).map(([code, stats]) => ({
        code,
        ...stats,
        uniqueRooms: stats.rooms.size,
        rooms: undefined // Remove Set object for JSON serialization
      }));
      
      return {
        success: true,
        data: {
          buildings: buildingsData,
          buildingUsage: usageArray,
          totalBookings: bookingsData.length
        }
      };
    } catch (error) {
      console.error('Error fetching building stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get system monitoring data
   */
  async getSystemStats() {
    try {
      // Get recent access logs
      const { data: accessLogs, error: accessError } = await this.client
        .from('AccessLogs')
        .select('method, url, status_code, response_time_ms, timestamp')
        .order('timestamp', { ascending: false })
        .limit(100);
      
      if (accessError) {
        console.warn('Could not fetch access logs:', accessError.message);
      }
      
      // Get error logs
      const { data: errorLogs, error: errorLogError } = await this.client
        .from('ErrorLogs')
        .select('error_level, error_type, error_message, service_name, created_at, is_resolved')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (errorLogError) {
        console.warn('Could not fetch error logs:', errorLogError.message);
      }
      
      // Get system status
      const { data: systemStatus, error: statusError } = await this.client
        .from('SystemStatus')
        .select('service_name, service_type, status, response_time_ms, check_timestamp')
        .order('check_timestamp', { ascending: false })
        .limit(20);
      
      if (statusError) {
        console.warn('Could not fetch system status:', statusError.message);
      }
      
      return {
        success: true,
        data: {
          accessLogs: accessLogs || [],
          errorLogs: errorLogs || [],
          systemStatus: systemStatus || [],
          hasMonitoring: !!(accessLogs || errorLogs || systemStatus)
        }
      };
    } catch (error) {
      console.error('Error fetching system stats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update booking status
   */
  async updateBookingStatus(bookingId, status, reason = null) {
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };
      
      if (status === 'cancelled' && reason) {
        updateData.cancellation_reason = reason;
        updateData.cancelled_at = new Date().toISOString();
      }
      
      const { data, error } = await this.client
        .from('Bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select();
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      return {
        success: true,
        data: data[0]
      };
    } catch (error) {
      console.error('Error updating booking status:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get system configuration
   */
  async getSystemConfig() {
    try {
      const { data, error } = await this.client
        .from('SystemConfig')
        .select('config_key, config_value, description, is_active')
        .eq('is_active', true);
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Convert to key-value object
      const config = {};
      data.forEach(item => {
        config[item.config_key] = item.config_value;
      });
      
      return {
        success: true,
        data: {
          config,
          configItems: data
        }
      };
    } catch (error) {
      console.error('Error fetching system config:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get dashboard overview data
   */
  async getDashboardOverview() {
    try {
      const [bookingStats, userStats, buildingStats, systemStats] = await Promise.all([
        this.getBookingStats(),
        this.getUserStats(),
        this.getBuildingStats(),
        this.getSystemStats()
      ]);
      
      return {
        success: true,
        data: {
          bookings: bookingStats.success ? bookingStats.data : {},
          users: userStats.success ? userStats.data : {},
          buildings: buildingStats.success ? buildingStats.data : {},
          system: systemStats.success ? systemStats.data : {}
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create and export service instance
const supabaseService = new SupabaseService();
export default supabaseService;
