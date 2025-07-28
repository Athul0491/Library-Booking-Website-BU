/**
 * locationService.js - Location/Room Management Service
 * 
 * This service handles all operations related to room and location management
 * Now integrated with Supabase to ensure data consistency with bu-book project.
 * 
 * Features:
 * - Room CRUD operations using Supabase (same as bu-book)
 * - Real-time data synchronization
 * - Fallback to mock data when Supabase is not configured
 */

import dayjs from 'dayjs';
import { supabase, isSupabaseConfigured } from './supabaseClient';

class LocationService {
  constructor() {
    this.delay = 500;
  }

  // Simulate network delay
  sleep(ms = this.delay) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get all locations from Supabase (same data as bu-book)
  async getLocations(filters = {}) {
    try {
      if (isSupabaseConfigured()) {
        return await this.getRealLocations(filters);
      } else {
        return await this.getMockLocations(filters);
      }
    } catch (error) {
      console.error('Failed to get locations:', error);
      return await this.getMockLocations(filters);
    }
  }

  // Get real locations from Supabase (return buildings and rooms separately)
  async getRealLocations(filters = {}) {
    try {
      await this.sleep();
      
      const { data: buildings, error } = await supabase
        .from('Buildings')
        .select('*, Rooms(*)');

      if (error) throw error;

      return {
        success: true,
        data: {
          buildings: buildings || [],
          rooms: buildings?.flatMap(building => 
            building.Rooms?.map(room => ({
              ...room,
              building_name: building.Name
            })) || []
          ) || [],
          total: buildings?.length || 0
        },
        isMockData: false
      };
    } catch (error) {
      console.error('Failed to get real locations:', error);
      throw error;
    }
  }

  // Determine room type based on name
  getRoomType(roomName) {
    const name = roomName.toLowerCase();
    if (name.includes('study')) return 'study_room';
    if (name.includes('meeting') || name.includes('conference')) return 'conference_room';
    if (name.includes('computer') || name.includes('lab')) return 'computer_lab';
    if (name.includes('discussion')) return 'discussion_room';
    if (name.includes('reading')) return 'reading_room';
    if (name.includes('group')) return 'group_room';
    return 'study_room'; // default
  }

  // Get equipment based on room type
  getEquipmentByType(type) {
    const equipmentMap = {
      'study_room': ['Whiteboard', 'Power Outlets', 'WiFi'],
      'conference_room': ['Projector', 'Conference Table', 'Video Conferencing', 'Whiteboard'],
      'computer_lab': ['Computers', 'Printer', 'WiFi', 'Power Outlets'],
      'discussion_room': ['Whiteboard', 'Chairs', 'WiFi'],
      'reading_room': ['Quiet Environment', 'Reading Lamps', 'WiFi'],
      'group_room': ['Whiteboard', 'Round Table', 'WiFi']
    };
    return equipmentMap[type] || ['WiFi', 'Power Outlets'];
  }

  // Get mock locations (fallback)
  async getMockLocations(filters = {}) {
    await this.sleep();
    
    const mockLocations = [
      {
        id: 1,
        name: 'Study Room A101',
        type: 'study_room',
        capacity: 4,
        building: 'Mugar Memorial Library',
        floor: 1,
        equipment: ['Whiteboard', 'Power Outlets', 'WiFi'],
        description: 'Quiet study room perfect for small group work',
        isActive: true,
        createdAt: dayjs().subtract(30, 'days').toISOString(),
        updatedAt: dayjs().subtract(1, 'days').toISOString()
      },
      {
        id: 2,
        name: 'Conference Room B205',
        type: 'conference_room',
        capacity: 12,
        building: 'Howard Gotlieb Archival Research Center',
        floor: 2,
        equipment: ['Projector', 'Conference Table', 'Video Conferencing', 'Whiteboard'],
        description: 'Large conference room with presentation capabilities',
        isActive: true,
        createdAt: dayjs().subtract(25, 'days').toISOString(),
        updatedAt: dayjs().subtract(2, 'days').toISOString()
      },
      {
        id: 3,
        name: 'Computer Lab C301',
        type: 'computer_lab',
        capacity: 20,
        building: 'Science & Engineering Library',
        floor: 3,
        equipment: ['Computers', 'Printers', 'Scanners', 'Large Display'],
        description: 'Computer lab with latest software and high-speed internet',
        isActive: true,
        createdAt: dayjs().subtract(20, 'days').toISOString(),
        updatedAt: dayjs().subtract(3, 'days').toISOString()
      },
      {
        id: 4,
        name: 'Discussion Room D102',
        type: 'discussion_room',
        capacity: 6,
        building: 'Mugar Memorial Library',
        floor: 1,
        equipment: ['Whiteboard', 'Round Table', 'WiFi'],
        description: 'Interactive space for group discussions and brainstorming',
        isActive: true,
        createdAt: dayjs().subtract(18, 'days').toISOString(),
        updatedAt: dayjs().subtract(1, 'day').toISOString()
      },
      {
        id: 5,
        name: 'Reading Room E404',
        type: 'reading_room',
        capacity: 1,
        building: 'Howard Gotlieb Archival Research Center',
        floor: 4,
        equipment: ['Reading Lamp', 'Comfortable Chair', 'WiFi'],
        description: 'Quiet individual reading space with excellent lighting',
        isActive: false,
        createdAt: dayjs().subtract(15, 'days').toISOString(),
        updatedAt: dayjs().subtract(5, 'days').toISOString()
      }
    ];

    // Apply filters
    let filteredLocations = mockLocations;
    if (filters.type) {
      filteredLocations = filteredLocations.filter(loc => loc.type === filters.type);
    }
    if (filters.building) {
      filteredLocations = filteredLocations.filter(loc => 
        loc.building.toLowerCase().includes(filters.building.toLowerCase())
      );
    }
    if (filters.active !== undefined) {
      filteredLocations = filteredLocations.filter(loc => loc.isActive === filters.active);
    }

    return {
      success: true,
      data: {
        list: filteredLocations,
        total: filteredLocations.length
      },
      isMockData: true
    };
  }

  // Get location by ID
  async getLocationById(locationId) {
    try {
      const locationsResult = await this.getLocations();
      const location = locationsResult.data.list.find(loc => loc.id === parseInt(locationId));
      
      if (!location) {
        return {
          success: false,
          error: 'Location not found',
          message: `Location with ID ${locationId} was not found`
        };
      }

      return {
        success: true,
        data: location,
        isMockData: locationsResult.isMockData
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch location',
        message: 'An error occurred while retrieving the location'
      };
    }
  }

  // Create new location (mock implementation for now)
  async createLocation(locationData) {
    try {
      await this.sleep();
      
      // Generate new ID
      const newId = Date.now();
      
      const newLocation = {
        id: newId,
        name: locationData.name,
        type: locationData.type,
        capacity: parseInt(locationData.capacity),
        building: locationData.building,
        floor: parseInt(locationData.floor),
        equipment: locationData.equipment || [],
        description: locationData.description || '',
        isActive: locationData.isActive !== false,
        createdAt: dayjs().toISOString(),
        updatedAt: dayjs().toISOString()
      };

      return {
        success: true,
        data: newLocation,
        message: 'Location created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create location',
        message: 'An error occurred while creating the location'
      };
    }
  }

  // Update location (mock implementation for now)
  async updateLocation(locationId, updateData) {
    try {
      await this.sleep();
      
      const locationResult = await this.getLocationById(locationId);
      if (!locationResult.success) {
        return locationResult;
      }

      const updatedLocation = {
        ...locationResult.data,
        ...updateData,
        id: locationResult.data.id, // Ensure ID doesn't change
        updatedAt: dayjs().toISOString()
      };

      return {
        success: true,
        data: updatedLocation,
        message: 'Location updated successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to update location',
        message: 'An error occurred while updating the location'
      };
    }
  }

  // Delete location (mock implementation for now)
  async deleteLocation(locationId) {
    try {
      await this.sleep();
      
      const locationResult = await this.getLocationById(locationId);
      if (!locationResult.success) {
        return locationResult;
      }

      return {
        success: true,
        data: { id: locationId },
        message: 'Location deleted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to delete location',
        message: 'An error occurred while deleting the location'
      };
    }
  }

  // Get room types
  async getRoomTypes() {
    try {
      await this.sleep(100);
      
      const roomTypes = [
        { value: 'study_room', label: 'Study Room' },
        { value: 'conference_room', label: 'Conference Room' },
        { value: 'computer_lab', label: 'Computer Lab' },
        { value: 'discussion_room', label: 'Discussion Room' },
        { value: 'reading_room', label: 'Reading Room' },
        { value: 'group_room', label: 'Group Room' }
      ];

      return {
        success: true,
        data: roomTypes,
        message: 'Room types retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch room types',
        message: 'An error occurred while retrieving room types'
      };
    }
  }

  // Get equipment options
  async getEquipmentOptions() {
    try {
      await this.sleep(100);
      
      const equipmentOptions = [
        'Whiteboard', 'Projector', 'Computer', 'WiFi', 'Power Outlets',
        'Conference Table', 'Video Conferencing', 'Printer', 'Scanner',
        'Reading Lamp', 'Round Table', 'Comfortable Chair', 'Large Display'
      ];

      return {
        success: true,
        data: equipmentOptions,
        message: 'Equipment options retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch equipment options',
        message: 'An error occurred while retrieving equipment options'
      };
    }
  }

  // Get location statistics
  async getLocationStats() {
    try {
      await this.sleep();
      
      const locationsResult = await this.getLocations();
      const locations = locationsResult.data.list;
      const roomTypesResult = await this.getRoomTypes();
      const roomTypes = roomTypesResult.data;
      
      const totalLocations = locations.length;
      const activeLocations = locations.filter(loc => loc.isActive).length;
      const locationsByType = roomTypes.map(type => ({
        type: type.value,
        label: type.label,
        count: locations.filter(loc => loc.type === type.value).length
      }));
      
      const totalCapacity = locations.reduce((sum, loc) => sum + loc.capacity, 0);
      const avgCapacity = totalLocations > 0 ? Math.round(totalCapacity / totalLocations) : 0;
      
      return {
        success: true,
        data: {
          totalLocations,
          activeLocations,
          inactiveLocations: totalLocations - activeLocations,
          locationsByType,
          totalCapacity,
          avgCapacity
        },
        message: 'Location statistics retrieved successfully',
        isMockData: locationsResult.isMockData
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to fetch location statistics',
        message: 'An error occurred while retrieving location statistics'
      };
    }
  }

  // ================== Building CRUD Operations ==================

  // Create a new building
  async createBuilding(buildingData) {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('Buildings')
          .insert([buildingData])
          .select();

        if (error) throw error;
        return { success: true, data: data[0] };
      } else {
        // Mock implementation
        await this.sleep();
        return { 
          success: true, 
          data: { id: Date.now(), ...buildingData }
        };
      }
    } catch (error) {
      console.error('Failed to create building:', error);
      throw error;
    }
  }

  // Update a building
  async updateBuilding(buildingId, updateData) {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('Buildings')
          .update(updateData)
          .eq('id', buildingId)
          .select();

        if (error) throw error;
        return { success: true, data: data[0] };
      } else {
        // Mock implementation
        await this.sleep();
        return { 
          success: true, 
          data: { id: buildingId, ...updateData }
        };
      }
    } catch (error) {
      console.error('Failed to update building:', error);
      throw error;
    }
  }

  // Delete a building
  async deleteBuilding(buildingId) {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('Buildings')
          .delete()
          .eq('id', buildingId);

        if (error) throw error;
        return { success: true };
      } else {
        // Mock implementation
        await this.sleep();
        return { success: true };
      }
    } catch (error) {
      console.error('Failed to delete building:', error);
      throw error;
    }
  }

  // ================== Room CRUD Operations ==================

  // Create a new room
  async createRoom(roomData) {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('Rooms')
          .insert([roomData])
          .select();

        if (error) throw error;
        return { success: true, data: data[0] };
      } else {
        // Mock implementation
        await this.sleep();
        return { 
          success: true, 
          data: { id: Date.now(), ...roomData }
        };
      }
    } catch (error) {
      console.error('Failed to create room:', error);
      throw error;
    }
  }

  // Update a room
  async updateRoom(roomId, updateData) {
    try {
      if (isSupabaseConfigured()) {
        const { data, error } = await supabase
          .from('Rooms')
          .update(updateData)
          .eq('id', roomId)
          .select();

        if (error) throw error;
        return { success: true, data: data[0] };
      } else {
        // Mock implementation
        await this.sleep();
        return { 
          success: true, 
          data: { id: roomId, ...updateData }
        };
      }
    } catch (error) {
      console.error('Failed to update room:', error);
      throw error;
    }
  }

  // Delete a room
  async deleteRoom(roomId) {
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('Rooms')
          .delete()
          .eq('id', roomId);

        if (error) throw error;
        return { success: true };
      } else {
        // Mock implementation
        await this.sleep();
        return { success: true };
      }
    } catch (error) {
      console.error('Failed to delete room:', error);
      throw error;
    }
  }
}

// Create and export service instance
const locationService = new LocationService();

export const getLocations = (filters) => locationService.getLocations(filters);
export const getLocationById = (locationId) => locationService.getLocationById(locationId);
export const createLocation = (locationData) => locationService.createLocation(locationData);
export const updateLocation = (locationId, updateData) => locationService.updateLocation(locationId, updateData);
export const deleteLocation = (locationId) => locationService.deleteLocation(locationId);
export const getRoomTypes = () => locationService.getRoomTypes();
export const getEquipmentOptions = () => locationService.getEquipmentOptions();
export const getLocationStats = () => locationService.getLocationStats();

// Building operations
export const createBuilding = (buildingData) => locationService.createBuilding(buildingData);
export const updateBuilding = (buildingId, updateData) => locationService.updateBuilding(buildingId, updateData);
export const deleteBuilding = (buildingId) => locationService.deleteBuilding(buildingId);

// Room operations  
export const createRoom = (roomData) => locationService.createRoom(roomData);
export const updateRoom = (roomId, updateData) => locationService.updateRoom(roomId, updateData);
export const deleteRoom = (roomId) => locationService.deleteRoom(roomId);

// Default export
export default {
  getLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
  getRoomTypes,
  getEquipmentOptions,
  getLocationStats,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  createRoom,
  updateRoom,
  deleteRoom
};
