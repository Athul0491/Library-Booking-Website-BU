/**
 * Location Service
 * Provides location and building data management using unified API service
 */
import apiService from './apiService';

/**
 * Mock building data for fallback when API is unavailable
 */
const mockBuildings = [
  {
    id: '1',
    name: 'Mugar Memorial Library',
    code: 'MUG',
    address: '771 Commonwealth Avenue, Boston, MA 02215',
    phone: '(617) 353-3732',
    hours: 'Mon-Thu: 8:00 AM - 2:00 AM, Fri: 8:00 AM - 10:00 PM, Sat: 10:00 AM - 10:00 PM, Sun: 10:00 AM - 2:00 AM',
    totalRooms: 15,
    availableRooms: 8,
    status: 'operational',
    features: ['24/7 Access', 'WiFi', 'Printing', 'Group Study Rooms'],
    lastUpdated: new Date().toISOString()
  },
  {
    id: '2', 
    name: 'Pardee Library',
    code: 'PAR',
    address: '154 Bay State Road, Boston, MA 02215',
    phone: '(617) 353-3738',
    hours: 'Mon-Fri: 8:00 AM - 12:00 AM, Sat-Sun: 10:00 AM - 12:00 AM',
    totalRooms: 8,
    availableRooms: 3,
    status: 'operational',
    features: ['WiFi', 'Quiet Study', 'Computer Lab'],
    lastUpdated: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Pickering Educational Resources Library', 
    code: 'PIC',
    address: '2 Silber Way, Boston, MA 02215',
    phone: '(617) 353-3734',
    hours: 'Mon-Fri: 8:00 AM - 9:00 PM, Sat-Sun: 12:00 PM - 6:00 PM',
    totalRooms: 5,
    availableRooms: 2,
    status: 'maintenance',
    features: ['Education Resources', 'WiFi', 'Multimedia Equipment'],
    lastUpdated: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Science & Engineering Library',
    code: 'SCI',
    address: '38 Cummington Mall, Boston, MA 02215', 
    phone: '(617) 353-3733',
    hours: 'Mon-Thu: 8:00 AM - 12:00 AM, Fri: 8:00 AM - 8:00 PM, Sat-Sun: 12:00 PM - 8:00 PM',
    totalRooms: 12,
    availableRooms: 7,
    status: 'operational',
    features: ['STEM Resources', 'Computer Lab', 'WiFi', 'Collaboration Spaces'],
    lastUpdated: new Date().toISOString()
  }
];

/**
 * Get all library buildings with current status
 * @returns {Promise<{success: boolean, data: Array, error: string|null}>}
 */
export const getBuildings = async () => {
  try {
    // Try to get real data from Supabase via apiService
    const result = await apiService.getBuildings();
    
    if (result.success && result.data && result.data.length > 0) {
      return {
        success: true,
        data: result.data,
        error: null
      };
    }

    // Fallback to mock data with warning
    console.warn('Using mock building data - API unavailable');
    return {
      success: true,
      data: mockBuildings,
      error: 'Using mock data - database connection unavailable'
    };
  } catch (error) {
    console.error('Failed to fetch buildings:', error);
    return {
      success: false,
      data: mockBuildings,
      error: 'Failed to fetch building data'
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
    const buildingsResult = await getBuildings();
    
    if (buildingsResult.success) {
      const building = buildingsResult.data.find(b => b.id === buildingId);
      
      if (building) {
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
    }
    
    return {
      success: false,
      data: null,
      error: buildingsResult.error
    };
  } catch (error) {
    console.error('Failed to fetch building by ID:', error);
    return {
      success: false,
      data: null,
      error: 'Failed to fetch building details'
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
    // This would typically make an API call to update the building
    // For now, return mock success
    console.log('Update building:', buildingId, updates);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const buildingResult = await getBuildingById(buildingId);
    
    if (buildingResult.success) {
      const updatedBuilding = {
        ...buildingResult.data,
        ...updates,
        lastUpdated: new Date().toISOString()
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
      error: 'Failed to update building'
    };
  }
};

/**
 * Get building statistics summary
 * @returns {Promise<{success: boolean, data: Object|null, error: string|null}>}
 */
export const getBuildingStats = async () => {
  try {
    const buildingsResult = await getBuildings();
    
    if (buildingsResult.success) {
      const buildings = buildingsResult.data;
      const stats = {
        totalBuildings: buildings.length,
        operationalBuildings: buildings.filter(b => b.status === 'operational').length,
        maintenanceBuildings: buildings.filter(b => b.status === 'maintenance').length,
        totalRooms: buildings.reduce((sum, b) => sum + (b.totalRooms || 0), 0),
        availableRooms: buildings.reduce((sum, b) => sum + (b.availableRooms || 0), 0),
        occupancyRate: 0
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
      error: 'Failed to fetch building statistics'
    };
  }
};

export default {
  getBuildings,
  getBuildingById, 
  updateBuilding,
  getBuildingStats
};
