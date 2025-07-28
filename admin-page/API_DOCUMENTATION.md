# API Technical Documentation

## Overview

This document describes the API architecture and endpoints for the BU Library Booking System, which consists of three interconnected applications:

- **bub-backend**: Python Flask API proxy for LibCal integration
- **bu-book**: React frontend booking interface
- **admin-page**: React admin dashboard

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   admin-page    │    │    bu-book      │    │   bub-backend   │
│  (Admin Panel)  │    │ (User Frontend) │    │  (API Proxy)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐    ┌─────────────────┐
                    │    Supabase     │    │   BU LibCal     │
                    │   (Database)    │    │   (External)    │
                    └─────────────────┘    └─────────────────┘
```

## 1. bub-backend API

### Base URL
```
http://localhost:5000
```

### Endpoints

#### POST /api/availability
Fetches room availability from BU LibCal API.

**Request Body:**
```json
{
  "library": "mug",           // Library code (mug, par, pic, sci)
  "start": "2025-01-15",      // Start date (YYYY-MM-DD)
  "end": "2025-01-15",        // End date (YYYY-MM-DD)
  "start_time": "09:00",      // Optional: Start time (HH:MM)
  "end_time": "17:00"         // Optional: End time (HH:MM)
}
```

**Response:**
```json
{
  "slots": [
    {
      "itemId": 168796,
      "start": "2025-01-15T09:00:00-05:00",
      "end": "2025-01-15T10:00:00-05:00",
      "checksum": "abc123def456",
      "className": "s-lc-eq-period-available"
    }
  ]
}
```

**Library Mapping:**
- `mug` → Location ID 19336 (Mugar Memorial Library)
- `par` → Location ID 19818 (Pardee Library)  
- `pic` → Location ID 18359 (Pickering Educational Resources Library)
- `sci` → Location ID 20177 (Science & Engineering Library)

**Error Response:**
```json
{
  "error": "Invalid library prefix"
}
```

### Implementation Details

The backend acts as a proxy to the BU LibCal API, handling:
- Library code to Location ID (LID) mapping
- Date range normalization for LibCal API requirements
- Time filtering for precise slot selection
- CORS headers for frontend access

## 2. bu-book Frontend API Integration

### Supabase Database Access

**Connection:**
```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);
```

### Data Fetching Functions

#### fetchBuildingsWithAvailability()
Combines Supabase building data with LibCal availability.

**Return Type:**
```typescript
interface Building {
  id: number;
  Name: string;
  ShortName: string;
  Address: string;
  website: string;
  contacts: Record<string, string>;
  available: boolean;
  libcal_id: number;
  lid: number;
  Rooms?: Room[];
}
```

#### fetchLibCalAvailability()
Calls bub-backend availability endpoint.

**Parameters:**
```typescript
fetchLibCalAvailability(
  library: number,     // Library LID
  start: string,       // YYYY-MM-DD
  end: string,         // YYYY-MM-DD
  start_time?: string, // HH:MM
  end_time?: string    // HH:MM
): Promise<Slot[]>
```

## 3. Supabase Database Schema

### Buildings Table
```sql
CREATE TABLE Buildings (
  id SERIAL PRIMARY KEY,
  Name VARCHAR(255) NOT NULL,
  ShortName VARCHAR(10) NOT NULL,
  Address TEXT,
  website VARCHAR(255),
  contacts JSONB,
  available BOOLEAN DEFAULT true,
  libcal_id INTEGER,
  lid INTEGER UNIQUE NOT NULL
);
```

### Rooms Table
```sql
CREATE TABLE Rooms (
  id SERIAL PRIMARY KEY,
  building_id INTEGER REFERENCES Buildings(id),
  eid INTEGER UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  url VARCHAR(255),
  grouping VARCHAR(100),
  capacity INTEGER,
  gtype INTEGER,
  gBookingSelectableTime BOOLEAN DEFAULT true,
  hasInfo BOOLEAN DEFAULT false,
  thumbnail VARCHAR(255),
  filterIds INTEGER[],
  available BOOLEAN DEFAULT true
);
```

## 4. Admin Dashboard API Services

### Connection Context
Monitors connection status to multiple services:

```typescript
interface ConnectionState {
  supabase: {
    connected: boolean;
    loading: boolean;
    error: string | null;
  };
  backend: {
    connected: boolean;
    loading: boolean;
    error: string | null;
  };
  isDataAvailable: boolean;
  loading: boolean;
}
```

### Service Layer

#### locationService
```typescript
async getLocations(): Promise<{
  success: boolean;
  data: {
    buildings: Building[];
    rooms: Room[];
  };
}>
```

#### bookingService
```typescript
async getBookings(params: {
  status?: string;
  dateRange?: [string, string];
  library?: string;
}): Promise<{
  success: boolean;
  data: Booking[];
  total: number;
}>
```

#### statsService
```typescript
async getStatistics(params: {
  dateRange?: [Date, Date];
  selectedMetric?: string;
}): Promise<{
  success: boolean;
  data: {
    statsData: Statistics;
    roomStats: RoomStats[];
    userStats: UserStats[];
  };
}>
```

## 5. Data Flow

### Room Availability Check
1. **bu-book** → **Supabase**: Fetch building/room data
2. **bu-book** → **bub-backend**: Get availability slots
3. **bub-backend** → **BU LibCal**: Proxy API request
4. **BU LibCal** → **bub-backend**: Return slot data
5. **bub-backend** → **bu-book**: Filtered availability
6. **bu-book**: Merge building data with availability

### Admin Dashboard Data
1. **admin-page** → **Connection Context**: Check service status
2. **admin-page** → **Services**: Request data if connected
3. **Services** → **Supabase/Backend**: Fetch real data
4. **Services** → **admin-page**: Return formatted response
5. **admin-page**: Display data or skeleton loading

## 6. Error Handling

### Connection States
- **Connected**: Full functionality with real data
- **Loading**: Display skeleton components
- **Disconnected**: Show fallback UI with retry options

### API Error Responses
All services return standardized error format:
```json
{
  "success": false,
  "error": "Error description",
  "data": null
}
```

## 7. Environment Configuration

### Required Environment Variables

**bu-book & admin-page:**
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_API_URL=http://localhost:5000
```

**bub-backend:**
```env
FLASK_ENV=development
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 8. API Testing

### Health Check Endpoints
- **bub-backend**: `GET /api/health` (implicit)
- **Supabase**: Connection test via client initialization
- **LibCal**: Availability request validation

### Sample Test Requests

**Test bub-backend availability:**
```bash
curl -X POST http://localhost:5000/api/availability \
  -H "Content-Type: application/json" \
  -d '{
    "library": "mug",
    "start": "2025-01-15",
    "end": "2025-01-15"
  }'
```

**Test Supabase connection:**
```typescript
const { data, error } = await supabase
  .from('Buildings')
  .select('*')
  .limit(1);
```

## 9. Rate Limiting & Performance

### LibCal API Considerations
- **Rate Limit**: Unknown, but reasonable usage recommended
- **Caching**: Consider implementing for repeated requests
- **Timeout**: 10 seconds for HTTP requests

### Optimization Strategies
- **Connection Pooling**: Managed by Supabase client
- **Request Batching**: Multiple room queries combined
- **Error Recovery**: Automatic retry with exponential backoff

## 10. Security Considerations

### API Security
- **CORS**: Configured for specific origins
- **Environment Variables**: Sensitive data in env files
- **Supabase RLS**: Row Level Security policies
- **Input Validation**: All API inputs validated

### Authentication Flow
Currently uses Supabase anonymous access. Future implementation should include:
- User authentication
- Role-based access control
- API key management for admin functions

---

## Contact & Support

For API questions or integration support, please refer to:
- Supabase Documentation
- BU LibCal API Documentation
- Project Repository Issues
