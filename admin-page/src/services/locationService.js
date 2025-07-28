/**
 * Location Service
 * Provides location and building data management using updated API service
 */
import apiService from './apiService';
import supabaseService from './supabaseService';

/**
 * Mock building data for fallback when API is unavailable
 * Updated to match new database schema
 */
const mockBuildings = [
  {
    id: '550e8400-e29b-41d4-a716-446655440101',
    name: 'Mugar Memorial Library',
    short_name: 'mug',
    address: '771 Commonwealth Avenue, Boston, MA 02215',
    phone: '(617) 353-3732',
    email: 'mugar@bu.edu',
    website: 'https://www.bu.edu/library/mugar/',
    latitude: 42.3505,
    longitude: -71.1054,
    description: 'Main library with extensive collections and study spaces',
    hours: 'Mon-Thu: 8:00 AM - 2:00 AM, Fri: 8:00 AM - 10:00 PM, Sat: 10:00 AM - 10:00 PM, Sun: 10:00 AM - 2:00 AM',
    accessibility_features: ['Wheelchair Access', 'Elevators', 'Accessible Restrooms'],
    amenities: ['24/7 Access', 'WiFi', 'Printing', 'Group Study Rooms', 'Cafe'],
    available: true,
    total_rooms: 15,
    available_rooms: 8,
    status: 'operational',
    created_at: new Date(Date.now() - 86400000 * 365).toISOString(), // 1 year ago
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440102',
    name: 'Pardee Library',
    short_name: 'par',
    address: '154 Bay State Road, Boston, MA 02215',
    phone: '(617) 353-3738',
    email: 'pardee@bu.edu',
    website: 'https://www.bu.edu/library/pardee/',
    latitude: 42.3489,
    longitude: -71.0967,
    description: 'Management and social sciences collection with quiet study areas',
    hours: 'Mon-Fri: 8:00 AM - 12:00 AM, Sat-Sun: 10:00 AM - 12:00 AM',
    accessibility_features: ['Wheelchair Access', 'Elevators'],
    amenities: ['WiFi', 'Quiet Study', 'Computer Lab', 'Printing'],
    available: true,
    total_rooms: 8,
    available_rooms: 3,
    status: 'operational',
    created_at: new Date(Date.now() - 86400000 * 300).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440103',
    name: 'Pickering Educational Resources Library',
    short_name: 'pic',
    address: '2 Silber Way, Boston, MA 02215',
    phone: '(617) 353-3734',
    email: 'pickering@bu.edu',
    website: 'https://www.bu.edu/library/pickering/',
    latitude: 42.3501,
    longitude: -71.1048,
    description: 'Educational resources and teacher preparation materials',
    hours: 'Mon-Fri: 8:00 AM - 9:00 PM, Sat-Sun: 12:00 PM - 6:00 PM',
    accessibility_features: ['Wheelchair Access'],
    amenities: ['Education Resources', 'WiFi', 'Multimedia Equipment'],
    available: true,
    total_rooms: 5,
    available_rooms: 2,
    status: 'maintenance',
    created_at: new Date(Date.now() - 86400000 * 200).toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440104',
    name: 'Science & Engineering Library',
    short_name: 'sci',
    address: '38 Cummington Mall, Boston, MA 02215',
    phone: '(617) 353-3733',
    email: 'scieng@bu.edu',
    website: 'https://www.bu.edu/library/sel/',
    latitude: 42.3496,
    longitude: -71.1043,
    description: 'Science, technology, engineering, and mathematics resources',
    hours: 'Mon-Thu: 8:00 AM - 12:00 AM, Fri: 8:00 AM - 8:00 PM, Sat-Sun: 12:00 PM - 8:00 PM',
    accessibility_features: ['Wheelchair Access', 'Elevators', 'Accessible Workstations'],
    amenities: ['STEM Resources', 'Computer Lab', 'WiFi', 'Collaboration Spaces', '3D Printing'],
    available: true,
    total_rooms: 12,
    available_rooms: 7,
    status: 'operational',
    created_at: new Date(Date.now() - 86400000 * 180).toISOString(),
    updated_at: new Date().toISOString()
  }
];

/**
 * Get all library buildings with current status
 * @param {Object} options - Options for fetching buildings
 * @returns {Promise<{success: boolean, data: Array, error: string|null}>}
 */
export const getBuildings = async (options = {}) => {
  try {
    // Use the updated API service (now with direct Supabase REST API)
    const result = await apiService.getBuildings();
    
    if (result && result.success) {
      return {
        success: true,
        data: result.data || result.buildings,
        error: null
      };
    }
  } catch (error) {
    console.warn('API service failed, trying Supabase service:', error.message);
    
    // Fallback to Supabase service
    try {
      const result = await supabaseService.getBuildings(options);
      
      if (result.success) {
        return result;
      } else {
        console.warn('Supabase query failed, using mock data:', result.error);
      }
    } catch (supabaseError) {
      console.warn('Supabase service unavailable, using mock data:', supabaseError.message);
    }
  }

  // Fallback to mock data
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    let filteredBuildings = [...mockBuildings];
    
    // Apply filters if provided
    if (options.status) {
      filteredBuildings = filteredBuildings.filter(b => b.status === options.status);
    }
    
    if (options.available !== undefined) {
      filteredBuildings = filteredBuildings.filter(b => b.available === options.available);
    }
    
    console.warn('Using mock building data - Database connection in progress');
    return {
      success: true,
      data: filteredBuildings,
      error: null
    };
  } catch (error) {
    console.error('Failed to fetch buildings:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get detailed information for a specific building
 * @param {string} buildingId - The building ID to fetch
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export const getBuildingById = async (buildingId) => {
  try {
    // Try to get data from Supabase first
    const result = await supabaseService.getBuildingById(buildingId);
    
    if (result.success) {
      return result;
    } else {
      console.warn('Supabase query failed, using mock data:', result.error);
    }
  } catch (error) {
    console.warn('Supabase service unavailable, using mock data:', error.message);
  }
  
  // Fallback to mock data
  try {
    const building = mockBuildings.find(b => b.id === buildingId);
    
    if (building) {
      await new Promise(resolve => setTimeout(resolve, 100));
      return {
        success: true,
        data: building,
        error: null
      };
    }
    
    return {
      success: false,
      data: null,
      error: `Building with ID ${buildingId} not found`
    };
  } catch (error) {
    console.error('Failed to fetch building by ID:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Update building information
 * @param {string} buildingId - The building ID to update
 * @param {Object} updates - The fields to update
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export const updateBuilding = async (buildingId, updates) => {
  try {
    // Try to update in Supabase first
    const result = await supabaseService.updateBuilding(buildingId, updates);
    
    if (result.success) {
      return result;
    } else {
      console.warn('Supabase update failed, using mock response:', result.error);
    }
  } catch (error) {
    console.warn('Supabase service unavailable, using mock response:', error.message);
  }
  
  // Fallback to mock response
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const buildingResult = await getBuildingById(buildingId);
    
    if (buildingResult.success) {
      const updatedBuilding = {
        ...buildingResult.data,
        ...updates,
        updated_at: new Date().toISOString()
      };
      
      return {
        success: true,
        data: updatedBuilding,
        error: null
      };
    }
    
    return buildingResult;
  } catch (error) {
    console.error('Failed to update building:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get building statistics summary
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export const getBuildingStats = async () => {
  try {
    // Try to get stats from Supabase first
    const result = await supabaseService.getBuildingStats();
    
    if (result.success) {
      return result;
    } else {
      console.warn('Supabase stats query failed, using mock data:', result.error);
    }
  } catch (error) {
    console.warn('Supabase service unavailable, using mock data:', error.message);
  }
  
  // Fallback to mock data
  try {
    const buildingsResult = await getBuildings();
    
    if (buildingsResult.success) {
      const buildings = buildingsResult.data;
      const stats = {
        totalBuildings: buildings.length,
        activeBuildings: buildings.filter(b => b.available).length,
        operationalBuildings: buildings.filter(b => b.status === 'operational').length,
        maintenanceBuildings: buildings.filter(b => b.status === 'maintenance').length,
        totalRooms: buildings.reduce((sum, b) => sum + (b.total_rooms || 0), 0),
        availableRooms: buildings.reduce((sum, b) => sum + (b.available_rooms || 0), 0),
        occupancyRate: 0,
        buildings: buildings
      };
      
      stats.occupancyRate = stats.totalRooms > 0 
        ? ((stats.totalRooms - stats.availableRooms) / stats.totalRooms * 100).toFixed(1)
        : 0;
      
      return {
        success: true,
        data: stats,
        error: null
      };
    }
    
    return buildingsResult;
  } catch (error) {
    console.error('Failed to fetch building stats:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

/**
 * Get rooms for a specific building
 * @param {string} buildingId - The building ID
 * @param {Object} options - Options for fetching rooms
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export const getRoomsByBuilding = async (buildingId, options = {}) => {
  try {
    // Try to get data from Supabase first
    const result = await supabaseService.getRoomsByBuilding(buildingId, options);
    
    if (result.success) {
      return result;
    } else {
      console.warn('Supabase query failed, using mock data:', result.error);
    }
  } catch (error) {
    console.warn('Supabase service unavailable, using mock data:', error.message);
  }

  // Fallback to mock data
  try {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Mock room data for the building
    const mockRooms = [
      {
        id: '1',
        name: 'Study Room A',
        room_name: 'Study Room A',
        eid: 1001,
        capacity: 4,
        room_type: 'Group Study',
        available: true,
        is_active: true,
        building_id: buildingId
      },
      {
        id: '2',
        name: 'Study Room B',
        room_name: 'Study Room B',
        eid: 1002,
        capacity: 6,
        room_type: 'Group Study',
        available: true,
        building_id: buildingId
      },
      {
        id: '3',
        name: 'Conference Room',
        room_name: 'Conference Room',
        eid: 1003,
        capacity: 12,
        room_type: 'Conference',
        available: false,
        building_id: buildingId
      }
    ];
    
    console.warn('Using mock room data - Database connection in progress');
    return {
      success: true,
      data: { rooms: mockRooms },
      error: null
    };
  } catch (error) {
    console.error('Failed to fetch rooms:', error);
    return {
      success: false,
      data: null,
      error: error.message
    };
  }
};

export default {
  getBuildings,
  getAllBuildings: getBuildings, // Alias for getBuildings
  getBuildingById, 
  updateBuilding,
  getBuildingStats,
  getRoomsByBuilding
};
