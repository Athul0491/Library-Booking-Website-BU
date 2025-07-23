import { supabase } from './supabase'
import dayjs from 'dayjs';
import { fetchLibCalAvailability } from './fetchLibCalAvailability';
import { getRoomAvailability } from './getRoomAvailability';
import type { Building } from '../types/building';

export const fetchBuildingsWithAvailability = async (): Promise<Building[]> => {
  const { data, error } = await supabase
    .from('Buildings')
    .select('*, Rooms(*)');

  if (error || !data) {
    console.error('Error fetching buildings:', error?.message);
    return [];
  }

  const start = dayjs().format('YYYY-MM-DD');
  const end = dayjs().add(1, 'day').format('YYYY-MM-DD');

  const buildings: Building[] = await Promise.all(
    data.map(async (b) => {
      if (!b.Rooms || b.Rooms.length === 0) {
        return { ...b, available: false, Rooms: [] };
      }

      const slots = await fetchLibCalAvailability(b.lid, start, end);
      const Rooms = getRoomAvailability(b.Rooms, slots);

      return {
        ...b,
        available: Rooms.some((r) => r.available),
        Rooms,
      };
    })
  );

  return buildings;
};
