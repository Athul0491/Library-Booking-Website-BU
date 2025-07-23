import type { Slot } from '../types/availability';

export const fetchLibCalAvailability = async (
  lid: number,
  start: string,
  end: string
): Promise<Slot[]> => {
  try {
    const formData = new URLSearchParams({
      lid: String(lid),
      gid: '0',
      eid: '-1',
      seat: '0',
      seatId: '0',
      zone: '0',
      start,
      end,
      pageIndex: '0',
      pageSize: '18',
    });

    const res = await fetch('/api/availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const { slots } = await res.json();
    return slots;
  } catch (err) {
    console.error(`Failed to fetch LibCal availability for lid ${lid}:`, err);
    return [];
  }
};
