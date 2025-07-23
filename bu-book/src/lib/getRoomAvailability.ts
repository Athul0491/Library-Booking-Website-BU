import type { Room } from '../types/building';
import type { Slot } from '../types/availability';

const UNAVAILABLE_CLASSES = new Set([
  's-lc-eq-checkout',
  's-lc-eq-r-unavailable',
  's-lc-eq-r-padding',
  'label-eq-unavailable',
  's-lc-eq-period-booked',
]);

export const getRoomAvailability = (rooms: Room[], slots: Slot[]): Room[] => {
  const now = new Date();

  return rooms.map((r) => {
    const slotNow = slots.find((slot) => {
      if (slot.itemId !== r.eid) return false;
      const start = new Date(slot.start);
      const end = new Date(slot.end);
      return now >= start && now < end;
    });

    const className = slotNow?.className || null;
    const isAvailable = !className || !UNAVAILABLE_CLASSES.has(className);

    return { ...r, available: isAvailable };
  });
};
