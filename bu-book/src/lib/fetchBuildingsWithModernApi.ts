/**
 * Enhanced buildings fetcher with new API service integration
 * Combines Supabase data with LibCal availability checking
 */
import apiService from '../services/apiService';
import dayjs from 'dayjs';
import { fetchLibCalAvailability } from './fetchLibCalAvailability';
import { getRoomAvailability } from './getRoomAvailability';

// Define interfaces for the new data structure
export interface ModernRoom {
  id: string;
  name: string;
  room_name: string;
  eid: number;
  capacity: number;
  room_type: string;
  available: boolean;
  is_active: boolean;
  building_id: string;
  // Legacy fields for compatibility
  title?: string;
  url?: string;
  grouping?: string;
  gtype?: number;
  gBookingSelectableTime?: boolean;
  hasInfo?: boolean;
  thumbnail?: string;
  filterIds?: number[];
}

export interface ModernBuilding {
  id: string;
  name: string;
  short_name: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  hours?: string;
  accessibility_features?: string[];
  amenities?: string[];
  available: boolean;
  total_rooms?: number;
  available_rooms?: number;
  status: string;
  created_at: string;
  updated_at: string;
  // LibCal integration
  libcal_id?: number;
  lid?: number;
  rooms?: ModernRoom[];
  // Legacy compatibility
  Name?: string;
  ShortName?: string;
  Address?: string;
  contacts?: Record<string, string>;
  Rooms?: any[];
}

/**
 * Fetch buildings with availability using new API service
 */
export const fetchBuildingsWithModernApi = async (): Promise<ModernBuilding[]> => {
  try {
    // First, try to get buildings from new API
    const result = await apiService.getBuildings();
    
    if (!result.success || !result.data) {
      console.warn('Failed to fetch buildings from modern API, falling back to legacy method');
      return [];
    }

    const buildings = result.data;
    const start = dayjs().format('YYYY-MM-DD');
    const end = dayjs().add(1, 'day').format('YYYY-MM-DD');

    // Process each building with availability data
    const buildingsWithAvailability: ModernBuilding[] = await Promise.all(
      buildings.map(async (building: any) => {
        // Transform to modern building structure
        const modernBuilding: ModernBuilding = {
          id: building.id,
          name: building.name || building.Name,
          short_name: building.short_name || building.ShortName,
          address: building.address || building.Address,
          phone: building.phone,
          email: building.email,
          website: building.website,
          latitude: building.latitude,
          longitude: building.longitude,
          description: building.description,
          hours: building.hours,
          accessibility_features: building.accessibility_features,
          amenities: building.amenities,
          available: false, // Will be calculated
          total_rooms: building.total_rooms,
          available_rooms: building.available_rooms,
          status: building.status || 'operational',
          created_at: building.created_at,
          updated_at: building.updated_at,
          libcal_id: building.libcal_id,
          lid: building.lid,
          rooms: [],
          // Legacy compatibility
          Name: building.name || building.Name,
          ShortName: building.short_name || building.ShortName,
          Address: building.address || building.Address,
          contacts: building.contacts || {},
          Rooms: []
        };

        // Process rooms if available
        if (building.rooms && building.rooms.length > 0) {
          // If we have libcal_id or lid, fetch availability from LibCal
          let slots: any[] = [];
          if (building.libcal_id || building.lid) {
            try {
              slots = await fetchLibCalAvailability(
                building.libcal_id || building.lid, 
                start, 
                end
              );
            } catch (error) {
              console.warn(`Failed to fetch LibCal availability for building ${building.id}:`, error);
            }
          }

          // Transform rooms to modern structure
          const modernRooms: ModernRoom[] = building.rooms.map((room: any) => ({
            id: room.id,
            name: room.name || room.room_name || room.title,
            room_name: room.room_name || room.name || room.title,
            eid: room.eid || room.id,
            capacity: room.capacity || 0,
            room_type: room.room_type || 'study',
            available: room.available || false,
            is_active: room.is_active !== false,
            building_id: room.building_id || building.id,
            // Legacy compatibility
            title: room.title || room.name,
            url: room.url || '',
            grouping: room.grouping || '',
            gtype: room.gtype || 0,
            gBookingSelectableTime: room.gBookingSelectableTime || false,
            hasInfo: room.hasInfo || false,
            thumbnail: room.thumbnail || '',
            filterIds: room.filterIds || []
          }));

          // Apply availability from LibCal if we have slots
          let roomsWithAvailability: ModernRoom[] = modernRooms;
          if (slots.length > 0) {
            const legacyRooms = modernRooms.map(room => ({
              id: room.eid,
              building_id: parseInt(room.building_id),
              eid: room.eid,
              title: room.title || room.name,
              url: room.url || '',
              grouping: room.grouping || '',
              capacity: room.capacity,
              gtype: room.gtype || 0,
              gBookingSelectableTime: room.gBookingSelectableTime || false,
              hasInfo: room.hasInfo || false,
              thumbnail: room.thumbnail || '',
              filterIds: room.filterIds || [],
              available: room.available
            }));
            
            const updatedLegacyRooms = getRoomAvailability(legacyRooms, slots);
            
            // Map back to modern rooms with updated availability
            roomsWithAvailability = modernRooms.map((modernRoom, index) => ({
              ...modernRoom,
              available: updatedLegacyRooms[index]?.available || false
            }));
          }

          modernBuilding.rooms = roomsWithAvailability;
          modernBuilding.Rooms = roomsWithAvailability; // Legacy compatibility
          modernBuilding.available = roomsWithAvailability.some(room => room.available);
          modernBuilding.available_rooms = roomsWithAvailability.filter(room => room.available).length;
          modernBuilding.total_rooms = roomsWithAvailability.length;
        }

        return modernBuilding;
      })
    );

    return buildingsWithAvailability;

  } catch (error) {
    console.error('Error in fetchBuildingsWithModernApi:', error);
    return [];
  }
};

/**
 * Backward compatible function that falls back to legacy method if modern API fails
 */
export const fetchBuildingsWithAvailability = async (): Promise<ModernBuilding[]> => {
  try {
    // Try modern API first
    const modernResult = await fetchBuildingsWithModernApi();
    
    if (modernResult.length > 0) {
      return modernResult;
    }

    // If modern API returns no results, we could fall back to legacy method
    // For now, just return empty array
    console.warn('Modern API returned no buildings');
    return [];

  } catch (error) {
    console.error('Error fetching buildings with availability:', error);
    return [];
  }
};
