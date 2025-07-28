/**
 * Booking Service
 * Provides booking data management using unified API service with LibCal integration
 */
import apiService from './apiService';

/**
 * Mock booking data for fallback when API is unavailable
 */
const mockBookings = [
  {
    id: '1',
    userId: 'user001',
    userEmail: 'student1@bu.edu',
    userName: 'John Doe',
    buildingId: '1',
    buildingName: 'Mugar Memorial Library',
    roomId: 'room_168796',
    roomName: 'Group Study Room A',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '12:00',
    status: 'confirmed',
    bookingId: 'BK001',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    userId: 'user002',
    userEmail: 'student2@bu.edu',
    userName: 'Jane Smith',
    buildingId: '2',
    buildingName: 'Pardee Library',
    roomId: 'room_168799',
    roomName: 'Conference Room 1',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
    startTime: '14:00',
    endTime: '16:00',
    status: 'pending',
    bookingId: 'BK002',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    userId: 'user003',
    userEmail: 'student3@bu.edu',
    userName: 'Mike Johnson',
    buildingId: '4',
    buildingName: 'Science & Engineering Library',
    roomId: 'room_168802',
    roomName: 'Engineering Study Room',
    date: new Date().toISOString().split('T')[0],
    startTime: '16:00',
    endTime: '18:00',
    status: 'cancelled',
    bookingId: 'BK003',
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 86400000).toISOString()
  }
];

/**
 * Get all bookings with optional filtering
 * @param {Object} filters - Optional filters for bookings
 * @returns {Promise<{success: boolean, data: Array, error: string|null}>}
 */
export const getBookings = async (filters = {}) => {
  try {
    // This would typically call the real API
    // For now, using mock data with simulated filtering
    
    let filteredBookings = [...mockBookings];
    
    // Apply filters if provided
    if (filters.status) {
      filteredBookings = filteredBookings.filter(b => b.status === filters.status);
    }
    
    if (filters.date) {
      filteredBookings = filteredBookings.filter(b => b.date === filters.date);
    }
    
    if (filters.buildingId) {
      filteredBookings = filteredBookings.filter(b => b.buildingId === filters.buildingId);
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    console.warn('Using mock booking data - API integration in progress');
    return {
      success: true,
      data: filteredBookings,
      error: 'Using mock data - backend integration in progress'
    };
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    return {
      success: false,
      data: [],
      error: 'Failed to fetch booking data'
    };
  }
};

/**
 * Get booking by ID
 * @param {string} bookingId - The booking ID to fetch
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export const getBookingById = async (bookingId) => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const booking = mockBookings.find(b => b.id === bookingId || b.bookingId === bookingId);
    
    if (booking) {
      return {
        success: true,
        data: booking,
        error: null
      };
    }
    
    return {
      success: false,
      data: null,
      error: `Booking with ID ${bookingId} not found`
    };
  } catch (error) {
    console.error('Failed to fetch booking by ID:', error);
    return {
      success: false,
      data: null,
      error: 'Failed to fetch booking details'
    };
  }
};

/**
 * Get room availability for a specific date and library
 * Uses the apiService to get real LibCal data when available
 * @param {string} library - Library code (mug, par, pic, sci)
 * @param {string} date - Date in YYYY-MM-DD format
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export const getRoomAvailability = async (library, date) => {
  try {
    // Try to get real availability data from LibCal via apiService
    const result = await apiService.getAvailability(library, date, date);
    
    if (result.success) {
      return {
        success: true,
        data: result.data,
        error: null
      };
    }
    
    // Fallback to mock availability data
    const mockAvailability = {
      library,
      date,
      slots: [
        {
          start: '09:00',
          end: '10:00',
          available: true,
          roomId: 'room_001',
          roomName: 'Study Room A'
        },
        {
          start: '10:00',
          end: '11:00',
          available: false,
          roomId: 'room_001',
          roomName: 'Study Room A'
        },
        {
          start: '11:00',
          end: '12:00',
          available: true,
          roomId: 'room_001',
          roomName: 'Study Room A'
        }
      ]
    };
    
    console.warn('Using mock availability data - backend connection unavailable');
    return {
      success: true,
      data: mockAvailability,
      error: 'Using mock data - backend connection unavailable'
    };
  } catch (error) {
    console.error('Failed to fetch room availability:', error);
    return {
      success: false,
      data: null,
      error: 'Failed to fetch availability data'
    };
  }
};

/**
 * Create a new booking
 * @param {Object} bookingData - The booking information
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export const createBooking = async (bookingData) => {
  try {
    // This would typically send a POST request to create the booking
    // For now, simulate the creation
    
    const newBooking = {
      id: `${Date.now()}`,
      ...bookingData,
      bookingId: `BK${Date.now().toString().slice(-6)}`,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      success: true,
      data: newBooking,
      error: null
    };
  } catch (error) {
    console.error('Failed to create booking:', error);
    return {
      success: false,
      data: null,
      error: 'Failed to create booking'
    };
  }
};

/**
 * Update an existing booking
 * @param {string} bookingId - The booking ID to update
 * @param {Object} updates - The fields to update
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export const updateBooking = async (bookingId, updates) => {
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const bookingResult = await getBookingById(bookingId);
    
    if (bookingResult.success) {
      const updatedBooking = {
        ...bookingResult.data,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      return {
        success: true,
        data: updatedBooking,
        error: null
      };
    }
    
    return bookingResult;
  } catch (error) {
    console.error('Failed to update booking:', error);
    return {
      success: false,
      data: null,
      error: 'Failed to update booking'
    };
  }
};

/**
 * Cancel a booking
 * @param {string} bookingId - The booking ID to cancel
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export const cancelBooking = async (bookingId) => {
  try {
    const result = await updateBooking(bookingId, { 
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    });
    
    return result;
  } catch (error) {
    console.error('Failed to cancel booking:', error);
    return {
      success: false,
      data: null,
      error: 'Failed to cancel booking'
    };
  }
};

/**
 * Get booking statistics
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export const getBookingStats = async () => {
  try {
    const bookingsResult = await getBookings();
    
    if (bookingsResult.success) {
      const bookings = bookingsResult.data;
      const today = new Date().toISOString().split('T')[0];
      
      const stats = {
        totalBookings: bookings.length,
        confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
        pendingBookings: bookings.filter(b => b.status === 'pending').length,
        cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
        todayBookings: bookings.filter(b => b.date === today).length,
        upcomingBookings: bookings.filter(b => b.date > today && b.status === 'confirmed').length
      };
      
      return {
        success: true,
        data: stats,
        error: null
      };
    }
    
    return bookingsResult;
  } catch (error) {
    console.error('Failed to fetch booking stats:', error);
    return {
      success: false,
      data: null,
      error: 'Failed to fetch booking statistics'
    };
  }
};

export default {
  getBookings,
  getBookingById,
  getRoomAvailability,
  createBooking,
  updateBooking,
  cancelBooking,
  getBookingStats
};
