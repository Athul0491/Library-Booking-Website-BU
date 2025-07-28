# BU Library System - API Integration Guide

## 🔌 API Integration Overview

This document provides detailed technical specifications for integrating with the BU Library Booking System APIs, including LibCal integration, Supabase operations, and inter-service communication.

## 🏗️ System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│    bu-book      │    │   bub-backend    │    │   admin-page    │
│  (Frontend)     │◄──►│   (API Proxy)    │◄──►│  (Dashboard)    │
│                 │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                        │
         │                        │                        │
         ▼                        ▼                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Database                            │
│                 (Buildings & Rooms)                            │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌──────────────────┐
                    │   LibCal API     │
                    │  (BU Library)    │
                    └──────────────────┘
```

## 📡 API Endpoints

### 1. bub-backend API

#### Base URL
```
Development: http://localhost:5000
Production: https://your-domain.com
```

#### Authentication
```javascript
// No authentication required for availability endpoint
// Future endpoints may require API keys
```

#### Endpoints

##### POST `/api/availability`

**Purpose**: Retrieve room availability and booking data from LibCal

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "library": "par",               // Required: Building short name
  "start": "2025-07-27",          // Required: Start date (YYYY-MM-DD)
  "end": "2025-07-27",            // Required: End date (YYYY-MM-DD)
  "start_time": "09:00",          // Optional: Filter start time (HH:MM)
  "end_time": "17:00"             // Optional: Filter end time (HH:MM)
}
```

**Response Body**:
```json
{
  "slots": [
    {
      "itemId": 168796,           // Room EID (matches Room.eid)
      "start": "2025-07-27 09:00:00",
      "end": "2025-07-27 09:30:00",
      "checksum": "abc123...",    // LibCal unique identifier
      "className": "s-lc-eq-period-available"
    }
  ],
  "bookings": [
    {
      "itemId": 168797,
      "start": "2025-07-27 10:00:00",
      "end": "2025-07-27 11:00:00",
      "checksum": "def456...",
      "className": "s-lc-eq-period-booked"
    }
  ],
  "isPreCreatedBooking": false,
  "windowEnd": false
}
```

**Error Responses**:
```json
// 400 Bad Request
{
  "error": "Invalid library prefix",
  "details": "Library code must be one of: mug, par, pic, sci"
}

// 500 Internal Server Error
{
  "error": "LibCal API error",
  "details": "Failed to fetch data from LibCal service"
}
```

**Usage Examples**:

```javascript
// Basic availability check
const checkAvailability = async (library, date) => {
  try {
    const response = await fetch('http://localhost:5000/api/availability', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        library: library,
        start: date,
        end: date
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Availability check failed:', error);
    throw error;
  }
};

// Time-filtered availability check
const checkTimeRangeAvailability = async (library, date, startTime, endTime) => {
  return await fetch('http://localhost:5000/api/availability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      library,
      start: date,
      end: date,
      start_time: startTime,
      end_time: endTime
    })
  }).then(r => r.json());
};
```

### 2. Supabase Database API

#### Configuration
```javascript
// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseKey);
};
```

#### Buildings Operations

```javascript
// Get all buildings with rooms
const getBuildingsWithRooms = async () => {
  const { data, error } = await supabase
    .from('Buildings')
    .select(`
      id,
      Name,
      ShortName,
      Address,
      website,
      contacts,
      available,
      libcal_id,
      lid,
      Rooms (
        id,
        eid,
        title,
        capacity,
        gtype,
        available
      )
    `);

  if (error) throw error;
  return data;
};

// Get building by short name
const getBuildingByShortName = async (shortName) => {
  const { data, error } = await supabase
    .from('Buildings')
    .select('*')
    .eq('ShortName', shortName)
    .single();

  if (error) throw error;
  return data;
};

// Create new building
const createBuilding = async (buildingData) => {
  const { data, error } = await supabase
    .from('Buildings')
    .insert([buildingData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update building
const updateBuilding = async (id, updates) => {
  const { data, error } = await supabase
    .from('Buildings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

#### Rooms Operations

```javascript
// Get rooms by building
const getRoomsByBuilding = async (buildingId) => {
  const { data, error } = await supabase
    .from('Rooms')
    .select('*')
    .eq('building_id', buildingId);

  if (error) throw error;
  return data;
};

// Get room by EID
const getRoomByEid = async (eid) => {
  const { data, error } = await supabase
    .from('Rooms')
    .select('*')
    .eq('eid', eid)
    .single();

  if (error) throw error;
  return data;
};

// Batch insert rooms
const insertRooms = async (roomsData) => {
  const { data, error } = await supabase
    .from('Rooms')
    .insert(roomsData)
    .select();

  if (error) throw error;
  return data;
};

// Update room availability
const updateRoomAvailability = async (roomId, available) => {
  const { data, error } = await supabase
    .from('Rooms')
    .update({ available })
    .eq('id', roomId)
    .select()
    .single();

  if (error) throw error;
  return data;
};
```

## 🔄 Data Synchronization

### Real-time Availability Updates

```javascript
// Availability synchronization service
class AvailabilitySync {
  constructor() {
    this.updateInterval = 5 * 60 * 1000; // 5 minutes
    this.isRunning = false;
  }

  async start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.updateAllBuildingsAvailability();
    }, this.updateInterval);
    
    // Initial update
    await this.updateAllBuildingsAvailability();
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
  }

  async updateAllBuildingsAvailability() {
    try {
      const buildings = await getBuildingsWithRooms();
      const updatePromises = buildings.map(building => 
        this.updateBuildingAvailability(building)
      );
      
      await Promise.allSettled(updatePromises);
    } catch (error) {
      console.error('Failed to update availability:', error);
    }
  }

  async updateBuildingAvailability(building) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const availabilityData = await checkAvailability(building.ShortName, today);
      
      // Update room availability based on slots
      const roomUpdates = building.Rooms.map(room => {
        const roomSlots = availabilityData.slots.filter(slot => 
          slot.itemId === room.eid
        );
        
        const isAvailable = roomSlots.some(slot => 
          !this.isUnavailableClass(slot.className)
        );
        
        return updateRoomAvailability(room.id, isAvailable);
      });

      await Promise.all(roomUpdates);

      // Update building availability
      const buildingAvailable = building.Rooms.some(room => room.available);
      await updateBuilding(building.id, { available: buildingAvailable });

    } catch (error) {
      console.warn(`Failed to update ${building.Name}:`, error);
    }
  }

  isUnavailableClass(className) {
    const unavailableClasses = [
      's-lc-eq-checkout',
      's-lc-eq-r-unavailable',
      's-lc-eq-r-padding',
      'label-eq-unavailable',
      's-lc-eq-period-booked'
    ];
    return unavailableClasses.includes(className);
  }
}

// Usage
const syncService = new AvailabilitySync();
syncService.start();
```

### Batch Data Processing

```javascript
// Batch processing utilities
class BatchProcessor {
  constructor(batchSize = 10, delayMs = 100) {
    this.batchSize = batchSize;
    this.delayMs = delayMs;
  }

  async processInBatches(items, processor) {
    const results = [];
    
    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);
      const batchPromises = batch.map(processor);
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        results.push(...batchResults);
        
        // Delay between batches to avoid rate limiting
        if (i + this.batchSize < items.length) {
          await new Promise(resolve => setTimeout(resolve, this.delayMs));
        }
      } catch (error) {
        console.error(`Batch processing error at index ${i}:`, error);
      }
    }
    
    return results;
  }
}

// Example usage
const processor = new BatchProcessor(5, 200);

const updateMultipleBuildings = async (buildings) => {
  return processor.processInBatches(buildings, async (building) => {
    return await updateBuildingAvailability(building);
  });
};
```

## 🛡️ Error Handling

### API Error Handler

```javascript
class APIError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

const handleAPIResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new APIError(
      errorData.error || 'API request failed',
      response.status,
      errorData.details
    );
  }
  return response.json();
};

// Retry mechanism
const withRetry = async (fn, maxRetries = 3, delayMs = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      console.warn(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2; // Exponential backoff
    }
  }
};

// Usage
const safeAPICall = async (library, date) => {
  return withRetry(async () => {
    const response = await fetch('http://localhost:5000/api/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ library, start: date, end: date })
    });
    
    return handleAPIResponse(response);
  });
};
```

### Circuit Breaker Pattern

```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000, monitor = 30000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.monitor = monitor;
    this.reset();
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }

  async call(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.timeout) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
    }
    this.successCount++;
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount
    };
  }
}

// Usage
const libCalBreaker = new CircuitBreaker(3, 30000);

const safeLibCalCall = async (library, date) => {
  return libCalBreaker.call(async () => {
    return await checkAvailability(library, date);
  });
};
```

## 📊 Performance Monitoring

### API Performance Metrics

```javascript
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  startTimer(operation) {
    const startTime = performance.now();
    return {
      end: () => {
        const duration = performance.now() - startTime;
        this.recordMetric(operation, duration);
        return duration;
      }
    };
  }

  recordMetric(operation, duration) {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }
    
    const measurements = this.metrics.get(operation);
    measurements.push({
      duration,
      timestamp: Date.now()
    });

    // Keep only last 100 measurements
    if (measurements.length > 100) {
      measurements.shift();
    }
  }

  getMetrics(operation) {
    const measurements = this.metrics.get(operation) || [];
    if (measurements.length === 0) return null;

    const durations = measurements.map(m => m.duration);
    const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    return {
      operation,
      count: measurements.length,
      average: avg,
      min,
      max,
      latest: durations[durations.length - 1]
    };
  }

  getAllMetrics() {
    const results = {};
    for (const operation of this.metrics.keys()) {
      results[operation] = this.getMetrics(operation);
    }
    return results;
  }
}

// Usage
const monitor = new PerformanceMonitor();

const monitoredAPICall = async (library, date) => {
  const timer = monitor.startTimer('availability_check');
  try {
    const result = await checkAvailability(library, date);
    timer.end();
    return result;
  } catch (error) {
    timer.end();
    throw error;
  }
};

// Get performance report
const getPerformanceReport = () => {
  return monitor.getAllMetrics();
};
```

## 🔧 Testing

### API Testing Utilities

```javascript
// Test utilities for API integration
class APITestUtils {
  static async testBubBackendConnection() {
    try {
      const response = await fetch('http://localhost:5000/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          library: 'mug',
          start: '2025-07-27',
          end: '2025-07-27'
        })
      });
      
      return {
        success: response.ok,
        status: response.status,
        data: response.ok ? await response.json() : null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async testSupabaseConnection() {
    try {
      const { data, error } = await supabase
        .from('Buildings')
        .select('count')
        .limit(1);

      return {
        success: !error,
        error: error?.message,
        configured: isSupabaseConfigured()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        configured: false
      };
    }
  }

  static async validateDataIntegrity() {
    const issues = [];

    try {
      // Check Building-Room relationships
      const buildings = await getBuildingsWithRooms();
      
      for (const building of buildings) {
        // Check LIBRARY_LIDS mapping
        if (!LIBRARY_LIDS[building.ShortName]) {
          issues.push(`Missing LIBRARY_LIDS mapping for ${building.ShortName}`);
        }

        // Check LID consistency
        if (LIBRARY_LIDS[building.ShortName] !== building.lid) {
          issues.push(`LID mismatch for ${building.ShortName}`);
        }

        // Check rooms have valid EIDs
        for (const room of building.Rooms || []) {
          if (!room.eid) {
            issues.push(`Room ${room.title} missing EID`);
          }
        }
      }
    } catch (error) {
      issues.push(`Data validation error: ${error.message}`);
    }

    return issues;
  }

  static async runHealthCheck() {
    const results = {};
    
    results.bubBackend = await this.testBubBackendConnection();
    results.supabase = await this.testSupabaseConnection();
    results.dataIntegrity = await this.validateDataIntegrity();
    
    results.overall = {
      healthy: results.bubBackend.success && 
               results.supabase.success && 
               results.dataIntegrity.length === 0,
      timestamp: new Date().toISOString()
    };

    return results;
  }
}

// Usage in components
const HealthCheck = () => {
  const [healthStatus, setHealthStatus] = useState(null);
  
  useEffect(() => {
    const checkHealth = async () => {
      const status = await APITestUtils.runHealthCheck();
      setHealthStatus(status);
    };
    
    checkHealth();
    const interval = setInterval(checkHealth, 5 * 60 * 1000); // Every 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  if (!healthStatus) return <div>Checking system health...</div>;

  return (
    <div>
      <h3>System Health Status</h3>
      <div>Overall: {healthStatus.overall.healthy ? '✅ Healthy' : '❌ Issues Detected'}</div>
      <div>bub-backend: {healthStatus.bubBackend.success ? '✅' : '❌'}</div>
      <div>Supabase: {healthStatus.supabase.success ? '✅' : '❌'}</div>
      <div>Data Integrity: {healthStatus.dataIntegrity.length === 0 ? '✅' : `❌ ${healthStatus.dataIntegrity.length} issues`}</div>
    </div>
  );
};
```

## 🚀 Deployment Configuration

### Environment Variables

```bash
# .env.development
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_BUB_BACKEND_URL=http://localhost:5000

# .env.production
REACT_APP_SUPABASE_URL=your_production_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_production_supabase_anon_key
REACT_APP_BUB_BACKEND_URL=https://your-production-api.com
```

### CORS Configuration

```python
# bub-backend CORS setup
from flask_cors import CORS

app = Flask(__name__)

# Development CORS
if app.config.get('ENV') == 'development':
    CORS(app, origins=['http://localhost:3000', 'http://localhost:3001'])
else:
    # Production CORS
    CORS(app, origins=['https://your-admin-domain.com', 'https://your-frontend-domain.com'])
```

### Docker Configuration

```dockerfile
# Dockerfile for bub-backend
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["python", "main.py"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  bub-backend:
    build: ./bub-backend
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
    
  admin-page:
    build: ./admin-page
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_BUB_BACKEND_URL=http://bub-backend:5000
    depends_on:
      - bub-backend
```

---

**API Integration Guide Version**: v1.0  
**Last Updated**: 2025-07-27  
**Compatibility**: bu-book v1.0, bub-backend v1.0, admin-page v1.0
