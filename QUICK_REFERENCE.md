# BU Library System - Quick Reference Guide

## 🔍 Field Mapping Reference

### Core Field Relationships

| Purpose | bu-book | bub-backend | admin-page | LibCal API |
|---------|---------|-------------|------------|------------|
| Building ID | `Building.ShortName` | `LIBRARY_LIDS.key` | `buildingShortName` | `library` |
| Building LID | `Building.lid` | `LIBRARY_LIDS.value` | `buildingLid` | `lid` param |
| Room ID | `Room.eid` | - | `roomEid` | `itemId` |
| Time Slot | `Slot.start/end` | - | `startDateTime/endDateTime` | `start/end` |
| Booking ID | `Slot.checksum` | - | `checksum` | `checksum` |

### Status Field Mapping

| Status Type | bu-book | LibCal | admin-page |
|-------------|---------|--------|------------|
| Room Available | `Room.available` | `className !== 'unavailable'` | `available` |
| Building Available | `Building.available` | Aggregated room status | `available` |
| Booking Status | - | `className` | `status` |

## 📡 API Endpoints Reference

### bub-backend Endpoints
```
POST /api/availability
Body: { library, start, end, start_time?, end_time? }
Response: { slots[], bookings[], isPreCreatedBooking, windowEnd }
```

### Supabase Queries
```sql
-- Get buildings and rooms
SELECT Buildings.*, Rooms.* 
FROM Buildings 
LEFT JOIN Rooms ON Buildings.id = Rooms.building_id;

-- Find building by short name
SELECT * FROM Buildings WHERE ShortName = 'mug';

-- Find room by EID
SELECT * FROM Rooms WHERE eid = 168796;
```

## 🎯 Common Code Snippets

### Fetch Building Availability
```javascript
// bu-book pattern
const buildingsWithAvailability = await fetchBuildingsWithAvailability();

// admin-page pattern  
const { data, error } = await supabase
  .from('Buildings')
  .select('*, Rooms(*)');
```

### Call LibCal API
```javascript
// Through bub-backend proxy
const response = await fetch('http://localhost:5000/api/availability', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    library: 'par',      // Building.ShortName
    start: '2025-07-27',
    end: '2025-07-27'
  })
});
```

### Room Status Check
```javascript
// bu-book pattern
const UNAVAILABLE_CLASSES = new Set([
  's-lc-eq-checkout',
  's-lc-eq-r-unavailable', 
  's-lc-eq-r-padding',
  'label-eq-unavailable',
  's-lc-eq-period-booked'
]);

const isAvailable = !className || !UNAVAILABLE_CLASSES.has(className);
```

### Data Transformation Example
```javascript
// LibCal Slot → admin-page Booking
const booking = {
  id: `${building.lid}-${slot.itemId}-${date}-${index}`,
  checksum: slot.checksum,
  roomEid: slot.itemId,
  roomTitle: room.title,
  buildingName: building.Name,
  startTime: dayjs(slot.start).format('HH:mm'),
  endTime: dayjs(slot.end).format('HH:mm'),
  status: determineBookingStatus(slot),
  isActive: dayjs().isBetween(slot.start, slot.end)
};
```

## 🔧 Debugging Tools

### Check API Connectivity
```javascript
// Test bub-backend
fetch('http://localhost:5000/api/availability', {
  method: 'POST',
  body: JSON.stringify({ library: 'mug', start: '2025-07-27', end: '2025-07-27' })
})
.then(r => r.json())
.then(console.log);

// Test Supabase
const { data, error } = await supabase.from('Buildings').select('count');
console.log('Buildings count:', data);
```

### Validate Data Integrity
```javascript
// Check Room.eid vs LibCal itemId matching
const missingRooms = slots.filter(slot => 
  !rooms.find(room => room.eid === slot.itemId)
);
console.log('Missing rooms:', missingRooms);

// Check Building.lid mapping
const { LIBRARY_LIDS } = require('../bub-backend/main.py');
buildings.forEach(b => {
  if (LIBRARY_LIDS[b.ShortName] !== b.lid) {
    console.warn(`LID mismatch: ${b.ShortName}`);
  }
});
```

## ⚡ Performance Optimization

### Batch API Calls
```javascript
// Parallel fetch for multiple buildings
const promises = buildings.map(building => 
  fetch('/api/availability', {
    method: 'POST',
    body: JSON.stringify({
      library: building.ShortName,
      start: date,
      end: date
    })
  })
);

const results = await Promise.allSettled(promises);
```

### Caching Strategy
```javascript
// Simple memory cache
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedAvailability(library, date) {
  const key = `${library}-${date}`;
  const cached = cache.get(key);
  
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
    return cached.data;
  }
  
  const data = await fetchAvailability(library, date);
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

## 📋 Deployment Checklist

### Development Environment
- [ ] bub-backend running on localhost:5000
- [ ] admin-page running on localhost:3000/3001
- [ ] bu-book running on localhost:5173
- [ ] Supabase connection configured

### Production Environment
- [ ] bub-backend CORS configuration
- [ ] LibCal API key configuration
- [ ] Supabase production database
- [ ] Error logging configuration

## 🚨 Troubleshooting

### LibCal API Errors
```
403 Forbidden → Check LibCal access permissions
500 Internal → Check bub-backend logs
CORS Error → Configure bub-backend CORS
```

### Supabase Errors  
```
Row Level Security → Check RLS policies
Connection Error → Verify connection string
Schema Error → Check table structure
```

### Data Mismatch Issues
```
Room.eid vs itemId → Update room data
Building.lid vs LIBRARY_LIDS → Sync mapping table
Timezone issues → Use consistent UTC conversion
```

---

**Quick Reference Version**: v1.0  
**Compatible Systems**: bu-book v1.0, bub-backend v1.0, admin-page v1.0
