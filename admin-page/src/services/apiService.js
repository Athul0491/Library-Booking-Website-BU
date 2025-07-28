// API Service - Connect to real backend API
import axios from 'axios';

/**
 * API basic configuration
 */
const API_BASE_URL = 'http://localhost:5000'; // Backend server address

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

/**
 * Library code mapping
 */
export const LIBRARY_CODES = {
  'mug': { name: 'Mugar Memorial Library', code: 'mug' },
  'par': { name: 'Pardee Library', code: 'par' },
  'pic': { name: 'Pickering Educational Resources Library', code: 'pic' },
  'sci': { name: 'Science & Engineering Library', code: 'sci' }
};

/**
 * API Service Class
 */
class ApiService {
  /**
   * Get room availability
   * @param {Object} params - Query parameters
   * @param {string} params.library - Library code (mug, par, pic, sci)
   * @param {string} params.start - Start date (YYYY-MM-DD)
   * @param {string} params.end - End date (YYYY-MM-DD)
   * @param {string} [params.start_time] - Start time (HH:MM)
   * @param {string} [params.end_time] - End time (HH:MM)
   * @returns {Promise} API response
   */
  async getAvailability(params) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/availability`, params, {
        timeout: 5000
      });
      return {
        success: true,
        data: response.data,
        error: null
      };
    } catch (error) {
      console.log('API call failed, using mock data:', error.message);
      
      // Return mock data
      const mockData = {
        bookings: [],
        isPreCreatedBooking: false,
        slots: [
          {
            checksum: "mock765760965e8740b8700df9932933cb88",
            end: `${params.start} 09:00:00`,
            itemId: 168796,
            start: `${params.start} 08:00:00`
          },
          {
            checksum: "mockaf932e69f44341b0a109c979087b82f6",
            end: `${params.start} 10:00:00`,
            itemId: 168797,
            start: `${params.start} 09:00:00`
          },
          {
            checksum: "mock123456789abcdef",
            end: `${params.start} 11:00:00`,
            itemId: 168798,
            start: `${params.start} 10:00:00`
          },
          {
            checksum: "mockabcdef123456789",
            end: `${params.start} 14:00:00`,
            itemId: 168799,
            start: `${params.start} 13:00:00`
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
   * Format time slot data
   * @param {Array} slots - Raw time slot data
   * @returns {Array} Formatted time slot data
   */
  formatSlots(slots) {
    return slots.map(slot => ({
      id: slot.itemId,
      checksum: slot.checksum,
      startTime: slot.start,
      endTime: slot.end,
      duration: this.calculateDuration(slot.start, slot.end),
      available: true,
      itemId: slot.itemId
    }));
  }

  /**
   * Calculate duration (minutes)
   * @param {string} start - Start time
   * @param {string} end - End time
   * @returns {number} Duration (minutes)
   */
  calculateDuration(start, end) {
    const startTime = new Date(start);
    const endTime = new Date(end);
    return Math.round((endTime - startTime) / (1000 * 60));
  }

  /**
   * Get all library list
   * @returns {Array} Library list
   */
  getLibraries() {
    return Object.values(LIBRARY_CODES);
  }

  /**
   * Validate library code
   * @param {string} code - Library code
   * @returns {boolean} Is valid
   */
  isValidLibraryCode(code) {
    return Object.keys(LIBRARY_CODES).includes(code);
  }

  /**
   * Get library information
   * @param {string} code - Library code
   * @returns {Object|null} Library information
   */
  getLibraryInfo(code) {
    return LIBRARY_CODES[code] || null;
  }

  /**
   * Check backend server status
   * @returns {Promise} Server status
   */
  async checkServerStatus() {
    try {
      // Try a simple health check
      const response = await axios.get(`${API_BASE_URL}/api/availability`, {
        timeout: 2000
      });
      return {
        success: true,
        online: true,
        message: 'Server running normally'
      };
    } catch (error) {
      console.log('Backend server not available:', error.message);
      return {
        success: false,
        online: false,
        message: 'Backend server not started, using mock data mode'
      };
    }
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;

// Export common methods
export const {
  getAvailability,
  formatSlots,
  getLibraries,
  isValidLibraryCode,
  getLibraryInfo,
  checkServerStatus
} = apiService;
