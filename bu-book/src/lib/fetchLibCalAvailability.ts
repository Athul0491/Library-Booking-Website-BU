import type { Slot } from '../types/availability';

export const fetchLibCalAvailability = async (
  library: number,
  start: string,
  end: string,
  start_time?: string,
  end_time?: string
): Promise<Slot[]> => {
  try {
    const res = await fetch('/api/availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        library,      // id
        start,        // 'YYYY-MM-DD'
        end,          // 'YYYY-MM-DD'
        start_time,   // optional: 'HH:MM' 24hr format
        end_time      // optional: 'HH:MM' 24hr format
      }),
    });

    const { slots } = await res.json();
    return slots || [];
  } catch (err) {
    console.error(`❌ Failed to fetch LibCal availability for library ${library}:`, err);
    return [];
  }
};
