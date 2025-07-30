# BU Library Booking System - Supabase Database API Guide

## 📋 Table of Contents

- [Overview](#overview)
- [Database Schema](#database-schema)
- [API Usage Examples](#api-usage-examples)
- [Geocoding Features](#geocoding-features)
- [Monitoring & Analytics](#monitoring--analytics)
- [Security & Row Level Security](#security--row-level-security)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This directory contains the complete database schema and API documentation for the BU Library Booking System. The system is built on Supabase (PostgreSQL) and supports anonymous booking, real-time updates, geocoding integration, and comprehensive monitoring.

### Key Features

- **Anonymous Booking System** - No user registration required
- **Real-time Updates** - Live availability status
- **Geocoding Integration** - Automatic address-to-coordinates conversion
- **Comprehensive Monitoring** - Access logs, error tracking, performance metrics
- **Row Level Security** - Fine-grained access control
- **RESTful API** - Standard HTTP methods with JSON responses

## 🗄️ Database Schema

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `buildings` | Library buildings/locations | `id`, `name`, `short_name`, `address`, `latitude`, `longitude` |
| `rooms` | Individual bookable rooms | `id`, `building_id`, `eid`, `name`, `capacity` |
| `bookings` | Booking records | `id`, `user_email`, `building_id`, `room_id`, `booking_date`, `status` |
| `user_profiles` | User information | `id`, `email`, `full_name`, `total_bookings` |
| `geocoding_history` | Geocoding audit trail | `id`, `building_id`, `latitude`, `longitude`, `status` |

### System Tables

| Table | Purpose |
|-------|---------|
| `system_config` | System configuration parameters |
| `access_logs` | HTTP request logging |
| `error_logs` | Error tracking and debugging |
| `system_status` | Service health monitoring |
| `performance_metrics` | Performance tracking |

## 🚀 API Usage Examples

### Authentication Setup

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://your-project.supabase.co'
const supabaseKey = 'your-anon-key'
const supabase = createClient(supabaseUrl, supabaseKey)
```

### 1. Building Operations

#### Get All Buildings with Geocoding Data

```javascript
// Fetch all available buildings with location coordinates
const { data: buildings, error } = await supabase
  .from('buildings_with_geocoding')
  .select('*')
  .eq('available', true)
  .order('name')

console.log('Buildings:', buildings)
// Returns: id, name, short_name, address, latitude, longitude, geocoding_status, room_count
```

#### Get Specific Building Details

```javascript
// Get detailed information for a specific building
const { data: building, error } = await supabase
  .from('buildings')
  .select(`
    *,
    rooms (
      id,
      name,
      capacity,
      available,
      room_type
    )
  `)
  .eq('short_name', 'mug')
  .single()
```

#### Update Building Address (Triggers Geocoding)

```javascript
// Update building address - this will trigger re-geocoding
const { data, error } = await supabase
  .from('buildings')
  .update({
    address: '771 Commonwealth Ave, Boston, MA 02215',
    geocoding_status: 'pending'  // Mark for re-geocoding
  })
  .eq('id', buildingId)
```

### 2. Room Operations

#### Get Available Rooms

```javascript
// Get all available rooms with building information
const { data: availableRooms, error } = await supabase
  .from('rooms')
  .select(`
    *,
    buildings (
      name,
      short_name,
      address,
      latitude,
      longitude
    )
  `)
  .eq('available', true)
  .order('name')
```

#### Search Rooms by Capacity

```javascript
// Find rooms that can accommodate specific group size
const { data: rooms, error } = await supabase
  .from('rooms')
  .select(`
    *,
    buildings (name, short_name, address)
  `)
  .gte('capacity', minCapacity)
  .eq('available', true)
  .order('capacity')
```

### 3. Booking Operations

#### Create New Booking

```javascript
// Create a new booking (anonymous)
const bookingData = {
  user_email: 'student@bu.edu',
  user_name: 'John Doe',
  contact_phone: '+1-617-555-0123',
  building_id: 1,
  building_name: 'Mugar Memorial Library',
  building_short_name: 'mug',
  room_id: 101,
  room_eid: 12345,
  room_name: 'Study Room A',
  booking_date: '2024-03-15',
  start_time: '14:00:00',
  end_time: '16:00:00',
  duration_minutes: 120,
  purpose: 'Group study session',
  session_id: 'sess_abc123'
}

const { data: booking, error } = await supabase
  .from('bookings')
  .insert(bookingData)
  .select()
  .single()

console.log('New booking:', booking.booking_reference)
```

#### Get User's Bookings

```javascript
// Get all bookings for a specific user
const { data: userBookings, error } = await supabase
  .from('active_bookings_view')
  .select('*')
  .eq('user_email', 'student@bu.edu')
  .order('booking_date', { ascending: true })
```

#### Cancel Booking

```javascript
// Cancel an existing booking
const { data, error } = await supabase
  .from('bookings')
  .update({
    status: 'cancelled',
    cancellation_reason: 'Plans changed',
    cancelled_at: new Date().toISOString()
  })
  .eq('booking_reference', 'BK-ABC123')
```

### 4. Real-time Subscriptions

#### Subscribe to Room Availability Changes

```javascript
// Listen for real-time room availability updates
const subscription = supabase
  .channel('room-changes')
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'rooms',
      filter: 'building_id=eq.1'
    },
    (payload) => {
      console.log('Room availability changed:', payload.new)
      // Update UI with new availability status
    }
  )
  .subscribe()
```

#### Subscribe to New Bookings

```javascript
// Listen for new bookings in real-time
const bookingSubscription = supabase
  .channel('new-bookings')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'bookings'
    },
    (payload) => {
      console.log('New booking created:', payload.new)
      // Update dashboard or send notifications
    }
  )
  .subscribe()
```

## 🗺️ Geocoding Features

### Automated Geocoding

The system automatically converts building addresses to coordinates using OpenStreetMap's Nominatim service.

#### Check Buildings Needing Geocoding

```javascript
// Get list of buildings that need geocoding
const { data: pendingBuildings, error } = await supabase
  .rpc('get_buildings_for_geocoding')

console.log('Buildings needing geocoding:', pendingBuildings)
```

#### Update Geocoding Results

```javascript
// Update building coordinates after geocoding
const { data, error } = await supabase
  .rpc('update_building_geocoding', {
    p_building_id: 1,
    p_latitude: 42.35042,
    p_longitude: -71.10644,
    p_status: 'success',
    p_source: 'nominatim',
    p_confidence: 0.95,
    p_formatted_address: '771 Commonwealth Ave, Boston, MA 02215, USA',
    p_service_response: {
      provider: 'nominatim',
      response_time_ms: 234
    },
    p_requested_by: 'admin@bu.edu'
  })
```

#### Mark Buildings for Re-geocoding

```javascript
// Mark specific buildings for re-geocoding
const { data, error } = await supabase
  .rpc('mark_buildings_for_geocoding', {
    p_building_ids: [1, 2, 3]
  })

// Or mark all buildings with failed/missing coordinates
const { data: allPending, error: markError } = await supabase
  .rpc('mark_buildings_for_geocoding')
```

### Geocoding History and Audit

```javascript
// Get geocoding history for a building
const { data: history, error } = await supabase
  .from('geocoding_history')
  .select('*')
  .eq('building_id', 1)
  .eq('is_active', true)
  .order('created_at', { ascending: false })
```

## 📊 Monitoring & Analytics

### System Health Monitoring

```javascript
// Get current system health status
const { data: healthStatus, error } = await supabase
  .from('system_health_dashboard')
  .select('*')
  .order('service_name')

console.log('System health:', healthStatus)
```

### Error Tracking

```javascript
// Get recent errors (last 24 hours)
const { data: recentErrors, error } = await supabase
  .from('error_summary_24h')
  .select('*')
  .order('error_count', { ascending: false })
  .limit(10)
```

### API Performance Analytics

```javascript
// Get API performance metrics
const { data: apiMetrics, error } = await supabase
  .from('api_performance_summary')
  .select('*')
  .order('request_count', { ascending: false })
  .limit(20)
```

### Log API Access

```javascript
// Log API access for monitoring
const { data, error } = await supabase
  .rpc('log_api_access', {
    p_method: 'GET',
    p_url: '/api/buildings',
    p_status_code: 200,
    p_response_time_ms: 145,
    p_ip_address: '192.168.1.100',
    p_user_agent: 'Mozilla/5.0...',
    p_user_email: 'user@bu.edu',
    p_session_id: 'sess_xyz789'
  })
```

## 🔒 Security & Row Level Security

### Current RLS Policies

The system uses Row Level Security (RLS) to control data access:

```sql
-- Buildings and Rooms: Public read access
-- Bookings: Users can view/create/update their own bookings
-- UserProfiles: Users can manage their own profiles
-- Monitoring: Admin access only (will be restricted)
```

### Anonymous User Access

For anonymous booking, the system uses email-based identification:

```javascript
// Anonymous booking flow
const userEmail = 'student@bu.edu'

// 1. Create or get user profile
const { data: profile, error: profileError } = await supabase
  .from('user_profiles')
  .upsert({
    email: userEmail,
    full_name: 'John Doe',
    last_activity_at: new Date().toISOString()
  })
  .select()
  .single()

// 2. Create booking linked to profile
const { data: booking, error: bookingError } = await supabase
  .from('bookings')
  .insert({
    user_id: profile.id,
    user_email: userEmail,
    // ... other booking details
  })
```

## ✅ Best Practices

### 1. Error Handling

```javascript
async function safeApiCall() {
  try {
    const { data, error } = await supabase
      .from('buildings')
      .select('*')
    
    if (error) {
      console.error('Supabase error:', error.message)
      // Log error for monitoring
      await supabase.rpc('log_error', {
        p_error_level: 'ERROR',
        p_error_type: 'DatabaseError',
        p_error_message: error.message,
        p_service_name: 'frontend',
        p_component_name: 'buildings-api'
      })
      return null
    }
    
    return data
  } catch (exception) {
    console.error('Network error:', exception)
    return null
  }
}
```

### 2. Efficient Queries

```javascript
// ✅ Good: Select only needed fields
const { data } = await supabase
  .from('buildings')
  .select('id, name, short_name, latitude, longitude')
  .eq('available', true)

// ❌ Avoid: Selecting all fields when not needed
const { data } = await supabase
  .from('buildings')
  .select('*')
```

### 3. Real-time Connection Management

```javascript
// Properly manage subscriptions
let subscription = null

function setupRealtime() {
  // Clean up existing subscription
  if (subscription) {
    subscription.unsubscribe()
  }
  
  subscription = supabase
    .channel('room-updates')
    .on('postgres_changes', { /* config */ }, handleUpdate)
    .subscribe()
}

function cleanup() {
  if (subscription) {
    subscription.unsubscribe()
    subscription = null
  }
}
```

### 4. Caching Strategy

```javascript
// Implement client-side caching for static data
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes
let buildingsCache = null
let cacheTimestamp = null

async function getCachedBuildings() {
  const now = Date.now()
  
  if (buildingsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
    return buildingsCache
  }
  
  const { data: buildings, error } = await supabase
    .from('buildings_with_geocoding')
    .select('*')
    .eq('available', true)
  
  if (!error) {
    buildingsCache = buildings
    cacheTimestamp = now
  }
  
  return buildings
}
```

## 🐛 Troubleshooting

### Common Issues

#### 1. RLS Permission Denied

```javascript
// Error: "permission denied for table buildings"
// Solution: Check RLS policies or use service role key for admin operations

// For admin operations, use service role:
const adminSupabase = createClient(supabaseUrl, serviceRoleKey)
```

#### 2. Geocoding Rate Limits

```javascript
// Error: Too many geocoding requests
// Solution: Implement rate limiting and queuing

async function geocodeWithRateLimit(addresses) {
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
  
  for (let i = 0; i < addresses.length; i++) {
    await geocodeAddress(addresses[i])
    
    // Wait 1 second between requests
    if (i < addresses.length - 1) {
      await delay(1000)
    }
  }
}
```

#### 3. Real-time Connection Issues

```javascript
// Handle connection errors
supabase
  .channel('my-channel')
  .on('postgres_changes', {}, handleChange)
  .on('error', (error) => {
    console.error('Real-time error:', error)
    // Implement reconnection logic
    setTimeout(setupRealtime, 5000)
  })
  .subscribe()
```

### Debug Mode

Enable debug logging for development:

```javascript
// Add to your app initialization
if (process.env.NODE_ENV === 'development') {
  // Enable Supabase debug logging
  localStorage.setItem('supabase.debug', 'true')
}
```

### Performance Monitoring

Monitor query performance:

```javascript
async function monitoredQuery(queryName, queryFn) {
  const startTime = performance.now()
  
  try {
    const result = await queryFn()
    const duration = performance.now() - startTime
    
    // Log performance metric
    await supabase.rpc('log_performance_metric', {
      metric_name: `query_${queryName}`,
      metric_value: duration,
      metric_unit: 'ms'
    })
    
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    
    // Log error with timing
    await supabase.rpc('log_error', {
      p_error_level: 'ERROR',
      p_error_type: 'QueryError',
      p_error_message: `Query ${queryName} failed: ${error.message}`,
      p_error_context: { duration_ms: duration }
    })
    
    throw error
  }
}
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [OpenStreetMap Nominatim API](https://nominatim.org/release-docs/develop/api/Overview/)

## 🤝 Contributing

When making changes to the database schema:

1. **Test in development environment first**
2. **Create migration scripts for schema changes**
3. **Update this documentation**
4. **Add appropriate indexes for new queries**
5. **Update RLS policies if needed**

---

**Last Updated:** 2025-07-29  
**Schema Version:** 1.2.0 (with Geocoding Support)  
**API Version:** v1  
