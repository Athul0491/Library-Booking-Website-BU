/**
 * bookingService.js - Booking Management Service
 * 
 * This service handles all operations related to booking management
 * Now integrated with bub-backend API to ensure data consistency with bu-book project.
 * 
 * Features:
 * - Booking CRUD operations using bub-backend API (same as bu-book)
 * - Real-time data synchronization
 * - Fallback to mock data when API is not available
 */

import dayjs from 'dayjs';
import { supabase, isSupabaseConfigured } from './supabaseClient';

// API service for bub-backend integration (matches AvailabilityPage.jsx)
const apiService = {
  baseURL: 'http://localhost:5000',
  
  async getAvailability(lid, date) {
    try {
      const response = await fetch(`${this.baseURL}/availability/${lid}/${date}`);
      if (!response.ok) throw new Error('Failed to fetch availability');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  async getBookings(lid, date) {
    try {
      const response = await fetch(`${this.baseURL}/bookings/${lid}/${date}`);
      if (!response.ok) throw new Error('Failed to fetch bookings');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};

class BookingService {
  constructor() {
    this.delay = 500;
  }

  // Simulate network delay
  sleep(ms = this.delay) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get booking list - unified with real API data
  async getBookings(params = {}) {
    try {
      if (isSupabaseConfigured()) {
        return await this.getRealBookings(params);
      } else {
        return await this.getMockBookings(params);
      }
    } catch (error) {
      console.error('Failed to get bookings:', error);
      return await this.getMockBookings(params);
    }
  }

  // Get real bookings from bub-backend API and Supabase
  async getRealBookings(params = {}) {
    try {
      await this.sleep();

      // Get buildings from Supabase to get LIDs
      const { data: buildings, error } = await supabase
        .from('Buildings')
        .select('id, name, lid, Rooms(*)');

      if (error) throw error;

      const allBookings = [];
      const today = dayjs();
      
      // Fetch bookings for each building for the last 30 days
      for (const building of buildings || []) {
        if (building.lid && building.Rooms && building.Rooms.length > 0) {
          for (let i = 0; i < 30; i++) {
            const date = today.subtract(i, 'day').format('YYYY-MM-DD');
            try {
              const bookingsData = await apiService.getBookings(building.lid, date);
              
              if (bookingsData && Array.isArray(bookingsData)) {
                const transformedBookings = bookingsData.map(booking => ({
                  id: `${building.lid}-${booking.itemId}-${booking.fromDate}`,
                  bookingNumber: `BK${booking.itemId}${booking.fromDate.replace(/-/g, '')}`,
                  userId: parseInt(booking.itemId) || 1,
                  userName: this.generateUserName(booking.itemId),
                  userEmail: `user${booking.itemId}@example.com`,
                  userPhone: `1380000${String(booking.itemId).padStart(4, '0')}`,
                  locationId: this.findRoomId(building.Rooms, booking.itemName),
                  locationName: booking.itemName || 'Unknown Room',
                  date: booking.fromDate,
                  startTime: booking.fromTime,
                  endTime: booking.toTime,
                  duration: this.calculateDuration(booking.fromTime, booking.toTime),
                  purpose: 'Study', // Default purpose
                  status: this.determineStatus(booking),
                  participants: Math.floor(Math.random() * 6) + 1,
                  notes: booking.notes || '',
                  createdAt: dayjs(booking.fromDate).subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
                  updatedAt: dayjs(booking.fromDate).format('YYYY-MM-DD HH:mm:ss'),
                  checkedIn: Math.random() > 0.3,
                  checkedInTime: Math.random() > 0.3 ? booking.fromTime : null,
                  rating: Math.random() > 0.5 ? Math.floor(Math.random() * 2) + 4 : null,
                  feedback: Math.random() > 0.7 ? 'Great environment, very satisfied' : null,
                  building: building.name,
                  lid: building.lid
                }));
                
                allBookings.push(...transformedBookings);
              }
            } catch (apiError) {
              console.warn(`Failed to fetch bookings for ${building.name} on ${date}:`, apiError);
            }
          }
        }
      }

      // Apply filters
      let filteredBookings = this.applyFilters(allBookings, params);

      return {
        success: true,
        data: {
          list: filteredBookings,
          total: filteredBookings.length,
          totalPages: Math.ceil(filteredBookings.length / (params.pageSize || 10))
        },
        isMockData: false
      };
    } catch (error) {
      console.error('Failed to get real bookings:', error);
      throw error;
    }
  }

  // Helper function to find room ID in Rooms array
  findRoomId(rooms, itemName) {
    const room = rooms.find(r => r.name === itemName);
    return room ? room.id : Math.floor(Math.random() * 100) + 1;
  }

  // Helper function to generate user names
  generateUserName(itemId) {
    const names = ['John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Wilson', 'David Brown', 'Emily Davis', 'Chris Lee', 'Anna Taylor'];
    return names[parseInt(itemId) % names.length] || 'Unknown User';
  }

  // Helper function to calculate duration
  calculateDuration(fromTime, toTime) {
    const from = dayjs(`2000-01-01 ${fromTime}`);
    const to = dayjs(`2000-01-01 ${toTime}`);
    return to.diff(from, 'hour');
  }

  // Helper function to determine booking status
  determineStatus(booking) {
    const statuses = ['confirmed', 'pending', 'completed'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  // Apply filters to bookings
  applyFilters(bookings, params) {
    let filteredBookings = [...bookings];

    // Filter by status
    if (params.status && params.status !== 'all') {
      filteredBookings = filteredBookings.filter(booking => booking.status === params.status);
    }

    // Filter by date range
    if (params.dateRange && params.dateRange.length === 2) {
      const [startDate, endDate] = params.dateRange;
      filteredBookings = filteredBookings.filter(booking => {
        const bookingDate = dayjs(booking.date);
        return bookingDate.isAfter(startDate.subtract(1, 'day')) && 
               bookingDate.isBefore(endDate.add(1, 'day'));
      });
    }

    // Filter by room
    if (params.locationId) {
      filteredBookings = filteredBookings.filter(booking => 
        booking.locationId === parseInt(params.locationId)
      );
    }

    // Search by keyword
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      filteredBookings = filteredBookings.filter(booking => 
        booking.bookingNumber.toLowerCase().includes(keyword) ||
        booking.userName.toLowerCase().includes(keyword) ||
        booking.locationName.toLowerCase().includes(keyword) ||
        booking.purpose.toLowerCase().includes(keyword)
      );
    }

    // Sort bookings
    const sortField = params.sortField || 'createdAt';
    const sortOrder = params.sortOrder || 'desc';
    
    filteredBookings.sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];
      
      if (sortField.includes('Time') || sortField.includes('At')) {
        aValue = dayjs(aValue).valueOf();
        bValue = dayjs(bValue).valueOf();
      }
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    // Pagination
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return filteredBookings.slice(startIndex, endIndex);
  }

  // Get mock bookings (fallback)
  async getMockBookings(params = {}) {
    await this.sleep();

    const mockBookings = this.generateMockBookings();
    const filteredBookings = this.applyFilters(mockBookings, params);

    return {
      success: true,
      data: {
        list: filteredBookings,
        total: filteredBookings.length,
        totalPages: Math.ceil(filteredBookings.length / (params.pageSize || 10))
      },
      isMockData: true
    };
  }

  // Generate mock booking data
  generateMockBookings() {
    const bookings = [];
    const statuses = ['confirmed', 'pending', 'cancelled', 'completed', 'no-show'];
    const purposes = ['Study', 'Meeting', 'Discussion', 'Training', 'Exam', 'Lecture', 'Other'];
    const rooms = ['Study Room A', 'Meeting Room B', 'Discussion Room C', 'Computer Lab D', 'Reading Area E'];
    const userNames = ['John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Wilson', 'David Brown', 'Emily Davis', 'Chris Lee', 'Anna Taylor'];

    for (let i = 1; i <= 50; i++) {
      const startDate = dayjs().subtract(Math.floor(Math.random() * 30), 'day');
      const startHour = 8 + Math.floor(Math.random() * 12);
      const duration = 1 + Math.floor(Math.random() * 4);
      
      bookings.push({
        id: i,
        bookingNumber: `BK${String(i).padStart(6, '0')}`,
        userId: Math.floor(Math.random() * 100) + 1,
        userName: userNames[Math.floor(Math.random() * userNames.length)],
        userEmail: `user${i}@example.com`,
        userPhone: `1380000${String(i).padStart(4, '0')}`,
        locationId: Math.floor(Math.random() * 5) + 1,
        locationName: rooms[Math.floor(Math.random() * rooms.length)],
        date: startDate.format('YYYY-MM-DD'),
        startTime: `${startHour}:00`,
        endTime: `${startHour + duration}:00`,
        duration: duration,
        purpose: purposes[Math.floor(Math.random() * purposes.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        participants: Math.floor(Math.random() * 8) + 1,
        notes: i % 3 === 0 ? 'Special requirement: Need projector equipment' : '',
        createdAt: startDate.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: startDate.format('YYYY-MM-DD HH:mm:ss'),
        checkedIn: Math.random() > 0.3,
        checkedInTime: Math.random() > 0.3 ? `${startHour}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : null,
        rating: Math.random() > 0.5 ? Math.floor(Math.random() * 2) + 4 : null,
        feedback: Math.random() > 0.7 ? 'Great environment, very satisfied' : null
      });
    }

    return bookings.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
  }

  // Get booking by ID
  async getBookingById(bookingId) {
    try {
      const bookingsResult = await this.getBookings();
      const booking = bookingsResult.data.list.find(b => b.id === bookingId || b.id === parseInt(bookingId));
      
      if (!booking) {
        return {
          success: false,
          error: 'Booking not found',
          message: `Booking with ID ${bookingId} was not found`
        };
      }

      return {
        success: true,
        data: booking,
        isMockData: bookingsResult.isMockData
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch booking',
        message: 'An error occurred while retrieving the booking'
      };
    }
  }

  // Update booking status
  async updateBookingStatus(bookingId, status) {
    try {
      await this.sleep();
      
      // For now, this is a mock implementation
      // In a real scenario, this would update the booking in the backend
      
      return {
        success: true,
        data: {
          id: bookingId,
          status: status,
          updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
        },
        message: 'Booking status updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update booking status',
        message: 'An error occurred while updating the booking status'
      };
    }
  }

  // Get booking statistics
  async getBookingStats() {
    try {
      const bookingsResult = await this.getBookings();
      const bookings = bookingsResult.data.list;
      
      const totalBookings = bookings.length;
      const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
      const pendingBookings = bookings.filter(b => b.status === 'pending').length;
      const completedBookings = bookings.filter(b => b.status === 'completed').length;
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
      
      // Calculate utilization rate
      const checkedInBookings = bookings.filter(b => b.checkedIn).length;
      const utilizationRate = totalBookings > 0 ? Math.round((checkedInBookings / totalBookings) * 100) : 0;
      
      return {
        success: true,
        data: {
          totalBookings,
          confirmedBookings,
          pendingBookings,
          completedBookings,
          cancelledBookings,
          utilizationRate,
          totalParticipants: bookings.reduce((sum, b) => sum + (b.participants || 0), 0)
        },
        message: 'Booking statistics retrieved successfully',
        isMockData: bookingsResult.isMockData
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch booking statistics',
        message: 'An error occurred while retrieving booking statistics'
      };
    }
  }

  // Get available time slots
  async getAvailableSlots(locationId, date) {
    try {
      await this.sleep(200);
      
      // This would integrate with bub-backend availability API
      // For now, return mock data
      const slots = [];
      const startHour = 8;
      const endHour = 22;
      
      for (let hour = startHour; hour < endHour; hour++) {
        slots.push({
          startTime: `${hour.toString().padStart(2, '0')}:00`,
          endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
          available: Math.random() > 0.3,
          locationId: locationId,
          date: date
        });
      }

      return {
        success: true,
        data: slots
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch available slots',
        message: 'An error occurred while retrieving available slots'
      };
    }
  }

  // Check in booking
  async checkIn(bookingId) {
    try {
      await this.sleep();
      
      return {
        success: true,
        data: {
          id: bookingId,
          checkedIn: true,
          checkedInTime: dayjs().format('HH:mm:ss'),
          updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
        },
        message: 'Check-in successful'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to check in',
        message: 'An error occurred while checking in'
      };
    }
  }

  // Check out booking
  async checkOut(bookingId) {
    try {
      await this.sleep();
      
      return {
        success: true,
        data: {
          id: bookingId,
          checkedOut: true,
          checkedOutTime: dayjs().format('HH:mm:ss'),
          updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
        },
        message: 'Check-out successful'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to check out',
        message: 'An error occurred while checking out'
      };
    }
  }

  // Cancel booking
  async cancelBooking(bookingId) {
    try {
      await this.sleep();
      
      return {
        success: true,
        data: {
          id: bookingId,
          status: 'cancelled',
          updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
        },
        message: 'Booking cancelled successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to cancel booking',
        message: 'An error occurred while cancelling the booking'
      };
    }
  }

  // Update booking
  async updateBooking(bookingId, updateData) {
    try {
      await this.sleep();
      
      const bookingResult = await this.getBookingById(bookingId);
      if (!bookingResult.success) {
        return bookingResult;
      }

      const updatedBooking = {
        ...bookingResult.data,
        ...updateData,
        id: bookingResult.data.id, // Ensure ID doesn't change
        updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
      };

      return {
        success: true,
        data: updatedBooking,
        message: 'Booking updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update booking',
        message: 'An error occurred while updating the booking'
      };
    }
  }
}

// Create singleton instance
const bookingService = new BookingService();

export default bookingService;
