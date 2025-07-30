-- ==============================================
-- BU Library Booking System Database Schema
-- SIMPLIFIED VERSION FOR ANONYMOUS BOOKING
-- ==============================================
--
-- IMPORTANT: SUPABASE NAMING CONVENTIONS
-- Supabase uses lowercase table names with underscores (snake_case)
-- While this schema shows PascalCase names for clarity, 
-- the actual tables in Supabase will be:
-- - Buildings -> buildings
-- - Rooms -> rooms  
-- - Bookings -> bookings
-- - UserProfiles -> user_profiles
-- - SystemConfig -> system_config
-- 
-- All API calls should use the lowercase names!
--

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- 1. CORE LIBRARY DATA TABLES
-- ==============================================

-- Buildings table (Library buildings)
CREATE TABLE IF NOT EXISTS Buildings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,                    -- Full building name
  short_name VARCHAR(10) NOT NULL UNIQUE,       -- Building abbreviation (mug, par, pic, sci)
  address TEXT,                                  -- Building address
  website VARCHAR(255),                          -- Building website
  contacts JSONB DEFAULT '{}',                   -- Contact information (JSON format)
  available BOOLEAN DEFAULT true,               -- Whether rooms are available
  libcal_id INTEGER,                            -- ID in LibCal system
  lid INTEGER NOT NULL UNIQUE,                  -- LibCal Location ID (core field)
  
  -- Geocoding fields for map integration
  latitude DECIMAL(10, 8) NULL,                 -- Latitude coordinate
  longitude DECIMAL(11, 8) NULL,                -- Longitude coordinate
  geocoded_at TIMESTAMP WITH TIME ZONE NULL,    -- When geocoding was performed
  geocoding_status VARCHAR(20) DEFAULT 'pending', -- pending, success, failed, manual
  geocoding_source VARCHAR(50) DEFAULT 'nominatim', -- nominatim, google, manual
  geocoding_accuracy VARCHAR(20) NULL,          -- Geocoding accuracy level
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints for geocoding
  CONSTRAINT valid_geocoding_status CHECK (geocoding_status IN ('pending', 'success', 'failed', 'manual')),
  CONSTRAINT valid_coordinates CHECK (
    (latitude IS NULL AND longitude IS NULL) OR 
    (latitude IS NOT NULL AND longitude IS NOT NULL AND 
     latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  )
);

-- Rooms table (Room information)
CREATE TABLE IF NOT EXISTS Rooms (
  id SERIAL PRIMARY KEY,
  building_id INTEGER NOT NULL REFERENCES Buildings(id) ON DELETE CASCADE,
  eid INTEGER NOT NULL UNIQUE,                  -- LibCal Equipment ID (room identifier)
  name VARCHAR(255) NOT NULL,                   -- Room display name
  url VARCHAR(255),                             -- LibCal booking link
  room_type VARCHAR(100),                       -- Room type/group information
  capacity INTEGER DEFAULT 6,                  -- Room capacity
  gtype INTEGER DEFAULT 1,                     -- LibCal group type
  available BOOLEAN DEFAULT true,              -- Current availability status
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. USER AND BOOKING TABLES (ANONYMOUS)
-- ==============================================

-- User profiles table (User profile information) - For anonymous booking
CREATE TABLE IF NOT EXISTS UserProfiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,          -- Required: Contact email
  full_name VARCHAR(255),                      -- Optional: User name  
  phone VARCHAR(20),                           -- Optional: Phone number
  department VARCHAR(100),                     -- Optional: Department information
  
  -- Anonymous booking statistics fields
  total_bookings INTEGER DEFAULT 0,           -- Total booking count
  active_bookings INTEGER DEFAULT 0,          -- Current active bookings
  cancelled_bookings INTEGER DEFAULT 0,       -- Cancelled booking count
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Last activity time
  
  -- Management fields
  is_blocked BOOLEAN DEFAULT false,           -- Whether blocked by admin
  block_reason TEXT,                          -- Block reason
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table (Booking records) - For anonymous booking
CREATE TABLE IF NOT EXISTS Bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES UserProfiles(id) ON DELETE SET NULL, -- Associated user profile
  user_email VARCHAR(255) NOT NULL,            -- Required: Booker's email
  user_name VARCHAR(255),                      -- Optional: Booker's name
  contact_phone VARCHAR(20),                   -- Optional: Contact phone
  
  -- Building and room information
  building_id INTEGER NOT NULL REFERENCES Buildings(id),
  building_name VARCHAR(255) NOT NULL,         -- Redundant storage
  building_short_name VARCHAR(10) NOT NULL,    -- Redundant storage
  room_id INTEGER NOT NULL REFERENCES Rooms(id),
  room_eid INTEGER NOT NULL,                   -- LibCal Equipment ID
  room_name VARCHAR(255) NOT NULL,             -- Redundant storage
  room_capacity INTEGER,                       -- Redundant storage
  
  -- Booking time information
  booking_date DATE NOT NULL,                  -- Booking date
  start_time TIME NOT NULL,                    -- Start time
  end_time TIME NOT NULL,                      -- End time
  duration_minutes INTEGER NOT NULL,           -- Duration in minutes
  
  -- Booking status and identifiers
  status VARCHAR(20) DEFAULT 'pending',        -- pending, confirmed, active, completed, cancelled
  booking_reference VARCHAR(50) UNIQUE,        -- Booking reference number
  libcal_booking_id VARCHAR(100),             -- LibCal system booking ID
  
  -- Metadata
  purpose TEXT,                                -- Booking purpose (optional)
  notes TEXT,                                  -- Booking notes
  cancellation_reason TEXT,                    -- Cancellation reason
  cancelled_at TIMESTAMP WITH TIME ZONE,      -- Cancellation time
  confirmed_at TIMESTAMP WITH TIME ZONE,      -- Confirmation time
  
  -- System fields
  ip_address INET,                             -- IP address when booking
  user_agent TEXT,                             -- User agent information
  session_id VARCHAR(100),                     -- Session ID (for anonymous users)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint conditions
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  CONSTRAINT valid_email CHECK (user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ==============================================
-- 3. GEOCODING TABLES
-- ==============================================

-- Geocoding History Table (地理编码历史记录表)
CREATE TABLE IF NOT EXISTS GeocodingHistory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  building_id INTEGER NOT NULL REFERENCES Buildings(id) ON DELETE CASCADE,
  
  -- Address Information
  original_address TEXT NOT NULL,               -- Original address used for geocoding
  formatted_address TEXT,                       -- Formatted address returned by service
  
  -- Coordinates
  latitude DECIMAL(10, 8) NULL,                 -- Resulting latitude
  longitude DECIMAL(11, 8) NULL,                -- Resulting longitude
  
  -- Geocoding Service Information
  service_provider VARCHAR(50) NOT NULL,        -- nominatim, google, mapbox, manual
  service_response JSONB DEFAULT '{}',          -- Full API response
  confidence_score DECIMAL(3, 2),               -- Confidence score (0.00 to 1.00)
  accuracy_level VARCHAR(20),                   -- street, city, region, country
  
  -- Status and Results
  status VARCHAR(20) NOT NULL,                  -- success, failed, partial
  error_message TEXT,                           -- Error message if failed
  processing_time_ms INTEGER,                   -- Processing time in milliseconds
  
  -- Request Context
  requested_by VARCHAR(255),                    -- Who requested the geocoding
  request_ip INET,                              -- IP address of request
  user_agent TEXT,                              -- User agent
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,               -- Whether this is the active geocoding result
  notes TEXT,                                   -- Additional notes
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_geocoding_status CHECK (status IN ('success', 'failed', 'partial')),
  CONSTRAINT valid_confidence CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  CONSTRAINT valid_coordinates_history CHECK (
    (latitude IS NULL AND longitude IS NULL) OR 
    (latitude IS NOT NULL AND longitude IS NOT NULL AND 
     latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  )
);

-- ==============================================
-- 4. SYSTEM CONFIGURATION
-- ==============================================

-- System Configuration (System configuration table)
CREATE TABLE IF NOT EXISTS SystemConfig (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 5. INDEXES FOR PERFORMANCE
-- ==============================================

-- Buildings table indexes
CREATE INDEX IF NOT EXISTS idx_buildings_short_name ON Buildings(short_name);
CREATE INDEX IF NOT EXISTS idx_buildings_lid ON Buildings(lid);
CREATE INDEX IF NOT EXISTS idx_buildings_available ON Buildings(available);
CREATE INDEX IF NOT EXISTS idx_buildings_geocoding_status ON Buildings(geocoding_status);
CREATE INDEX IF NOT EXISTS idx_buildings_coordinates ON Buildings(latitude, longitude);

-- GeocodingHistory table indexes
CREATE INDEX IF NOT EXISTS idx_geocoding_history_building_id ON GeocodingHistory(building_id);
CREATE INDEX IF NOT EXISTS idx_geocoding_history_created_at ON GeocodingHistory(created_at);
CREATE INDEX IF NOT EXISTS idx_geocoding_history_status ON GeocodingHistory(status);
CREATE INDEX IF NOT EXISTS idx_geocoding_history_provider ON GeocodingHistory(service_provider);
CREATE INDEX IF NOT EXISTS idx_geocoding_history_active ON GeocodingHistory(is_active);

-- Rooms table indexes
CREATE INDEX IF NOT EXISTS idx_rooms_building_id ON Rooms(building_id);
CREATE INDEX IF NOT EXISTS idx_rooms_eid ON Rooms(eid);
CREATE INDEX IF NOT EXISTS idx_rooms_available ON Rooms(available);

-- UserProfiles table indexes
CREATE INDEX IF NOT EXISTS idx_userprofiles_email ON UserProfiles(email);

-- Bookings table indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON Bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_email ON Bookings(user_email);
CREATE INDEX IF NOT EXISTS idx_bookings_building_id ON Bookings(building_id);
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON Bookings(room_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON Bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON Bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON Bookings(booking_reference);
CREATE INDEX IF NOT EXISTS idx_bookings_session_id ON Bookings(session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON Bookings(created_at);

-- ==============================================
-- 5. TRIGGERS FOR AUTOMATIC UPDATES
-- ==============================================

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update timestamp triggers (with IF NOT EXISTS equivalent)
DROP TRIGGER IF EXISTS update_buildings_updated_at ON Buildings;
CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON Buildings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_geocoding_history_updated_at ON GeocodingHistory;
CREATE TRIGGER update_geocoding_history_updated_at BEFORE UPDATE ON GeocodingHistory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rooms_updated_at ON Rooms;
CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON Rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON UserProfiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON UserProfiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bookings_updated_at ON Bookings;
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON Bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_config_updated_at ON SystemConfig;
CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON SystemConfig
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES - SIMPLIFIED
-- ==============================================

-- Enable RLS on tables
ALTER TABLE Buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE Rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE UserProfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE Bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE GeocodingHistory ENABLE ROW LEVEL SECURITY;

-- Buildings and Rooms are publicly accessible (read-only)
DROP POLICY IF EXISTS "Buildings are viewable by everyone" ON Buildings;
CREATE POLICY "Buildings are viewable by everyone" ON Buildings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Rooms are viewable by everyone" ON Rooms;
CREATE POLICY "Rooms are viewable by everyone" ON Rooms
    FOR SELECT USING (true);

-- GeocodingHistory policies - Admin access only
DROP POLICY IF EXISTS "Admin can view geocoding history" ON GeocodingHistory;
CREATE POLICY "Admin can view geocoding history" ON GeocodingHistory
    FOR SELECT USING (true);  -- Will be restricted to admin users later

DROP POLICY IF EXISTS "Admin can manage geocoding history" ON GeocodingHistory;
CREATE POLICY "Admin can manage geocoding history" ON GeocodingHistory
    FOR ALL USING (true);  -- Will be restricted to admin users later

-- UserProfiles policies - Simple email-based access
DROP POLICY IF EXISTS "Users can view own profile by email" ON UserProfiles;
CREATE POLICY "Users can view own profile by email" ON UserProfiles
    FOR SELECT USING (true);  -- Allow viewing for now, can be restricted later

DROP POLICY IF EXISTS "Users can update own profile" ON UserProfiles;
CREATE POLICY "Users can update own profile" ON UserProfiles
    FOR UPDATE USING (true);  -- Allow updating for now, can be restricted later

DROP POLICY IF EXISTS "Anyone can create user profile" ON UserProfiles;
CREATE POLICY "Anyone can create user profile" ON UserProfiles
    FOR INSERT WITH CHECK (true);

-- Bookings policies - Simple access for anonymous users
DROP POLICY IF EXISTS "Users can view bookings" ON Bookings;
CREATE POLICY "Users can view bookings" ON Bookings
    FOR SELECT USING (true);  -- Allow viewing for now, can be restricted later

DROP POLICY IF EXISTS "Anyone can create bookings" ON Bookings;
CREATE POLICY "Anyone can create bookings" ON Bookings
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update bookings" ON Bookings;
CREATE POLICY "Users can update bookings" ON Bookings
    FOR UPDATE USING (true);  -- Allow updating for now, can be restricted later

-- ==============================================
-- 7. INITIAL DATA SEEDING
-- ==============================================

-- Insert BU Libraries with geocoding data
INSERT INTO Buildings (name, short_name, address, website, lid, libcal_id, latitude, longitude, geocoded_at, geocoding_status, geocoding_source) VALUES
('Mugar Memorial Library', 'mug', '771 Commonwealth Ave, Boston, MA 02215', 'https://www.bu.edu/library/mugar/', 19336, 19336, 42.35042, -71.10644, NOW(), 'manual', 'manual'),
('Pardee Library', 'par', '771 Commonwealth Ave, Boston, MA 02215', 'https://www.bu.edu/library/pardee/', 19818, 19818, 42.34897, -71.09854, NOW(), 'manual', 'manual'),
('Pickering Educational Resources Library', 'pic', '2 Silber Way, Boston, MA 02215', 'https://www.bu.edu/library/pickering/', 18359, 18359, 42.35015, -71.10485, NOW(), 'manual', 'manual'),
('Science & Engineering Library', 'sci', '38 Cummington Mall, Boston, MA 02215', 'https://www.bu.edu/library/sel/', 20177, 20177, 42.34968, -71.10445, NOW(), 'manual', 'manual')
ON CONFLICT (short_name) DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    geocoded_at = EXCLUDED.geocoded_at,
    geocoding_status = EXCLUDED.geocoding_status,
    geocoding_source = EXCLUDED.geocoding_source;

-- Insert system configuration
INSERT INTO SystemConfig (config_key, config_value, description) VALUES
('libcal_api_timeout', '5000', 'LibCal API timeout in milliseconds'),
('booking_window_days', '30', 'Number of days in advance users can book'),
('max_booking_duration_hours', '4', 'Maximum booking duration in hours'),
('maintenance_mode', 'false', 'System maintenance mode flag'),
('cache_duration_minutes', '5', 'API response cache duration'),
-- Geocoding Configuration
('geocoding_enabled', 'true', 'Enable automatic geocoding for new addresses'),
('geocoding_provider', 'nominatim', 'Primary geocoding service provider (nominatim, google)'),
('geocoding_timeout_ms', '5000', 'Geocoding API timeout in milliseconds'),
('geocoding_rate_limit_per_hour', '1000', 'Geocoding rate limit per hour'),
('geocoding_cache_duration_days', '30', 'Cache geocoding results for X days'),
('auto_geocode_on_address_update', 'true', 'Automatically geocode when address is updated'),
('fallback_coordinates_enabled', 'true', 'Use fallback coordinates for failed geocoding'),
('fallback_latitude', '42.35018', 'Default fallback latitude (BU campus center)'),
('fallback_longitude', '-71.10498', 'Default fallback longitude (BU campus center)'),
-- Monitoring Configuration
('monitoring_enabled', 'true', 'Enable system monitoring and logging'),
('log_retention_days', '90', 'Number of days to retain access logs'),
('error_log_retention_days', '30', 'Number of days to retain resolved error logs'),
('performance_metrics_retention_days', '7', 'Number of days to retain performance metrics'),
('health_check_interval_minutes', '5', 'Health check interval in minutes'),
('alert_threshold_error_count', '10', 'Error count threshold for alerts'),
('alert_threshold_response_time_ms', '5000', 'Response time threshold for alerts'),
('rate_limit_per_minute', '100', 'Default API rate limit per minute'),
('rate_limit_per_hour', '1000', 'Default API rate limit per hour'),
('enable_geo_tracking', 'false', 'Enable geographical tracking of requests')
ON CONFLICT (config_key) DO NOTHING;

-- ==============================================
-- 8. SYSTEM MONITORING AND LOGGING TABLES
-- ==============================================

-- Server Access Logs (Server access log table)
CREATE TABLE IF NOT EXISTS AccessLogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Request Information
  request_id VARCHAR(100) UNIQUE,              -- Unique request identifier
  ip_address INET NOT NULL,                    -- Client IP address
  user_agent TEXT,                             -- User agent string
  referer TEXT,                                -- Referring page
  
  -- HTTP Request Details
  method VARCHAR(10) NOT NULL,                 -- HTTP method (GET, POST, etc.)
  url TEXT NOT NULL,                           -- Request URL
  query_string TEXT,                           -- Query parameters
  request_headers JSONB DEFAULT '{}',          -- Request headers
  request_body TEXT,                           -- Request body (POST data)
  
  -- Response Information
  status_code INTEGER NOT NULL,                -- HTTP status code
  response_time_ms INTEGER,                    -- Response time in milliseconds
  response_size_bytes INTEGER,                 -- Response size in bytes
  response_headers JSONB DEFAULT '{}',         -- Response headers
  
  -- User Context
  user_email VARCHAR(255),                     -- Associated user email (if any)
  session_id VARCHAR(100),                     -- Session ID
  
  -- Geographical Information
  country VARCHAR(100),                        -- Country
  region VARCHAR(100),                         -- Region/State
  city VARCHAR(100),                           -- City
  
  -- Timestamps
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Website Status Monitoring (Website operational status monitoring table)
CREATE TABLE IF NOT EXISTS SystemStatus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Service Information
  service_name VARCHAR(100) NOT NULL,          -- Service name (frontend, backend, database)
  service_type VARCHAR(50) NOT NULL,           -- Service type (web, api, db, external)
  endpoint_url TEXT,                           -- Monitoring endpoint URL
  
  -- Status Information
  status VARCHAR(20) NOT NULL,                 -- up, down, degraded, maintenance
  response_time_ms INTEGER,                    -- Response time in milliseconds
  status_code INTEGER,                         -- HTTP status code
  
  -- Health Check Details
  health_check_type VARCHAR(50),               -- Health check type (http, tcp, custom)
  health_details JSONB DEFAULT '{}',           -- Health check detailed information
  
  -- Performance Metrics
  cpu_usage_percent DECIMAL(5,2),              -- CPU usage percentage
  memory_usage_percent DECIMAL(5,2),           -- Memory usage percentage
  disk_usage_percent DECIMAL(5,2),             -- Disk usage percentage
  active_connections INTEGER,                  -- Active connection count
  
  -- Availability Metrics
  uptime_seconds BIGINT,                       -- Uptime in seconds
  downtime_seconds BIGINT DEFAULT 0,           -- Downtime in seconds
  
  -- Error Information
  error_message TEXT,                          -- Error message
  error_count INTEGER DEFAULT 0,               -- Error count
  
  -- Timestamps
  check_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_success_at TIMESTAMP WITH TIME ZONE,   -- Last success time
  last_failure_at TIMESTAMP WITH TIME ZONE,   -- Last failure time
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error Logs (Error log table)
CREATE TABLE IF NOT EXISTS ErrorLogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Error Classification
  error_level VARCHAR(20) NOT NULL,            -- ERROR, WARN, INFO, DEBUG, FATAL
  error_type VARCHAR(100) NOT NULL,            -- Error type (DatabaseError, APIError, etc.)
  error_code VARCHAR(50),                      -- Error code
  error_category VARCHAR(50),                  -- Error category (system, user, external)
  
  -- Error Details
  error_message TEXT NOT NULL,                 -- Error message
  error_description TEXT,                      -- Detailed description
  stack_trace TEXT,                            -- Stack trace
  error_context JSONB DEFAULT '{}',            -- Error context information
  
  -- Source Information
  service_name VARCHAR(100),                   -- Service where error occurred
  component_name VARCHAR(100),                 -- Component name
  function_name VARCHAR(100),                  -- Function name
  file_path TEXT,                              -- File path
  line_number INTEGER,                         -- Line number
  
  -- Request Context
  request_id VARCHAR(100),                     -- Associated request ID
  user_email VARCHAR(255),                     -- Associated user email
  session_id VARCHAR(100),                     -- Session ID
  ip_address INET,                             -- Client IP
  user_agent TEXT,                             -- User agent
  
  -- Environment Information
  environment VARCHAR(50) DEFAULT 'production', -- Environment (development, staging, production)
  server_name VARCHAR(100),                    -- Server name
  process_id INTEGER,                          -- Process ID
  
  -- Resolution Information
  is_resolved BOOLEAN DEFAULT false,           -- Whether resolved
  resolved_by VARCHAR(255),                    -- Resolver
  resolved_at TIMESTAMP WITH TIME ZONE,       -- Resolution time
  resolution_notes TEXT,                       -- Resolution notes
  
  -- Occurrence Information
  occurrence_count INTEGER DEFAULT 1,         -- Occurrence count
  first_occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Metrics (Performance metrics table)
CREATE TABLE IF NOT EXISTS PerformanceMetrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Metric Information
  metric_name VARCHAR(100) NOT NULL,           -- Metric name
  metric_type VARCHAR(50) NOT NULL,            -- Metric type (counter, gauge, histogram)
  metric_category VARCHAR(50),                 -- Metric category (api, database, frontend)
  
  -- Metric Values
  metric_value DECIMAL(15,4) NOT NULL,         -- Metric value
  metric_unit VARCHAR(20),                     -- Unit (ms, bytes, count, percent)
  
  -- Context Information
  service_name VARCHAR(100),                   -- Service name
  endpoint_path TEXT,                          -- API endpoint path
  operation_name VARCHAR(100),                 -- Operation name
  
  -- Aggregation Information
  aggregation_type VARCHAR(20),                -- Aggregation type (avg, min, max, sum, count)
  time_window_minutes INTEGER DEFAULT 1,       -- Time window in minutes
  
  -- Additional Context
  tags JSONB DEFAULT '{}',                     -- Tag information
  metadata JSONB DEFAULT '{}',                 -- Metadata
  
  -- Timestamps
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Rate Limiting Logs (API rate limiting log table)
CREATE TABLE IF NOT EXISTS RateLimitLogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Client Information
  client_id VARCHAR(100),                      -- Client ID
  ip_address INET NOT NULL,                    -- Client IP
  user_email VARCHAR(255),                     -- User email
  api_key VARCHAR(100),                        -- API key
  
  -- Request Information
  endpoint_path TEXT NOT NULL,                 -- API endpoint
  method VARCHAR(10) NOT NULL,                 -- HTTP method
  
  -- Rate Limiting Information
  rate_limit_type VARCHAR(50) NOT NULL,        -- Rate limit type (per_minute, per_hour, per_day)
  limit_value INTEGER NOT NULL,                -- Rate limit threshold
  current_count INTEGER NOT NULL,              -- Current count
  remaining_requests INTEGER,                  -- Remaining requests
  reset_time TIMESTAMP WITH TIME ZONE,        -- Reset time
  
  -- Action Information
  action_taken VARCHAR(50) NOT NULL,           -- Action taken (allowed, throttled, blocked)
  retry_after_seconds INTEGER,                 -- Retry wait time
  
  -- Context
  window_start TIMESTAMP WITH TIME ZONE,      -- Time window start
  window_end TIMESTAMP WITH TIME ZONE,        -- Time window end
  
  -- Timestamps
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 9. INDEXES FOR MONITORING TABLES
-- ==============================================

-- AccessLogs indexes
CREATE INDEX IF NOT EXISTS idx_access_logs_timestamp ON AccessLogs(timestamp);
CREATE INDEX IF NOT EXISTS idx_access_logs_ip_address ON AccessLogs(ip_address);
CREATE INDEX IF NOT EXISTS idx_access_logs_status_code ON AccessLogs(status_code);
CREATE INDEX IF NOT EXISTS idx_access_logs_user_email ON AccessLogs(user_email);
CREATE INDEX IF NOT EXISTS idx_access_logs_session_id ON AccessLogs(session_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_method_url ON AccessLogs(method, url);

-- SystemStatus indexes
CREATE INDEX IF NOT EXISTS idx_system_status_service ON SystemStatus(service_name, service_type);
CREATE INDEX IF NOT EXISTS idx_system_status_timestamp ON SystemStatus(check_timestamp);
CREATE INDEX IF NOT EXISTS idx_system_status_status ON SystemStatus(status);

-- ErrorLogs indexes
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON ErrorLogs(error_level);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON ErrorLogs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_service ON ErrorLogs(service_name);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON ErrorLogs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_request_id ON ErrorLogs(request_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON ErrorLogs(is_resolved);

-- PerformanceMetrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON PerformanceMetrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON PerformanceMetrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_service ON PerformanceMetrics(service_name);

-- RateLimitLogs indexes
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_ip ON RateLimitLogs(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_timestamp ON RateLimitLogs(timestamp);
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_endpoint ON RateLimitLogs(endpoint_path);

-- ==============================================
-- 10. TRIGGERS FOR MONITORING TABLES
-- ==============================================

-- Apply update timestamp triggers to monitoring tables (with IF NOT EXISTS equivalent)
DROP TRIGGER IF EXISTS update_error_logs_updated_at ON ErrorLogs;
CREATE TRIGGER update_error_logs_updated_at BEFORE UPDATE ON ErrorLogs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- 11. RLS POLICIES FOR MONITORING TABLES
-- ==============================================

-- Enable RLS on monitoring tables
ALTER TABLE AccessLogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE SystemStatus ENABLE ROW LEVEL SECURITY;
ALTER TABLE ErrorLogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE PerformanceMetrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE RateLimitLogs ENABLE ROW LEVEL SECURITY;

-- Admin-only access policies for monitoring data
DROP POLICY IF EXISTS "Admin can view access logs" ON AccessLogs;
CREATE POLICY "Admin can view access logs" ON AccessLogs
    FOR SELECT USING (true);  -- Will be restricted to admin users later

DROP POLICY IF EXISTS "Admin can view system status" ON SystemStatus;
CREATE POLICY "Admin can view system status" ON SystemStatus
    FOR ALL USING (true);  -- Will be restricted to admin users later

DROP POLICY IF EXISTS "Admin can view error logs" ON ErrorLogs;
CREATE POLICY "Admin can view error logs" ON ErrorLogs
    FOR ALL USING (true);  -- Will be restricted to admin users later

DROP POLICY IF EXISTS "Admin can view performance metrics" ON PerformanceMetrics;
CREATE POLICY "Admin can view performance metrics" ON PerformanceMetrics
    FOR ALL USING (true);  -- Will be restricted to admin users later

DROP POLICY IF EXISTS "Admin can view rate limit logs" ON RateLimitLogs;
CREATE POLICY "Admin can view rate limit logs" ON RateLimitLogs
    FOR SELECT USING (true);  -- Will be restricted to admin users later

-- ==============================================
-- 12. VIEWS FOR COMMON QUERIES
-- ==============================================

-- ==============================================
-- 12. VIEWS FOR COMMON QUERIES
-- ==============================================

-- View for buildings with geocoding status
CREATE OR REPLACE VIEW buildings_with_geocoding AS
SELECT 
    b.id,
    b.name,
    b.short_name,
    b.address,
    b.website,
    b.available,
    b.latitude,
    b.longitude,
    b.geocoding_status,
    b.geocoding_source,
    b.geocoded_at,
    b.created_at,
    b.updated_at,
    -- Count of rooms in each building
    COUNT(r.id) as room_count,
    -- Latest geocoding attempt
    gh.service_provider as last_geocoding_provider,
    gh.confidence_score as last_confidence_score,
    gh.accuracy_level as last_accuracy_level
FROM Buildings b
LEFT JOIN Rooms r ON b.id = r.building_id
LEFT JOIN GeocodingHistory gh ON b.id = gh.building_id AND gh.is_active = true
GROUP BY 
    b.id, b.name, b.short_name, b.address, b.website, b.available,
    b.latitude, b.longitude, b.geocoding_status, b.geocoding_source, b.geocoded_at,
    b.created_at, b.updated_at, gh.service_provider, gh.confidence_score, gh.accuracy_level;

-- View for active bookings with room and building details
CREATE OR REPLACE VIEW active_bookings_view AS
SELECT 
    b.id,
    b.user_email,
    b.user_name,
    b.booking_reference,
    b.booking_date,
    b.start_time,
    b.end_time,
    b.duration_minutes,
    b.status,
    b.created_at,
    -- Building details
    bld.name as building_name,
    bld.short_name as building_short_name,
    bld.address as building_address,
    -- Room details
    r.name as room_name,
    r.eid as room_eid,
    r.capacity as room_capacity,
    r.room_type as room_type
FROM Bookings b
JOIN Buildings bld ON b.building_id = bld.id
JOIN Rooms r ON b.room_id = r.id
WHERE b.status IN ('confirmed', 'active', 'pending');

-- System Health Dashboard View
CREATE OR REPLACE VIEW system_health_dashboard AS
SELECT 
    service_name,
    service_type,
    status,
    AVG(response_time_ms) as avg_response_time,
    MAX(response_time_ms) as max_response_time,
    COUNT(*) as check_count,
    COUNT(CASE WHEN status = 'up' THEN 1 END) as success_count,
    ROUND(
        COUNT(CASE WHEN status = 'up' THEN 1 END) * 100.0 / COUNT(*), 2
    ) as availability_percentage,
    MAX(check_timestamp) as last_check,
    MAX(last_success_at) as last_success
FROM SystemStatus
WHERE check_timestamp >= NOW() - INTERVAL '24 hours'
GROUP BY service_name, service_type, status
ORDER BY service_name, service_type;

-- Error Summary View (Error statistics for past 24 hours)
CREATE OR REPLACE VIEW error_summary_24h AS
SELECT 
    error_level,
    error_type,
    service_name,
    COUNT(*) as error_count,
    COUNT(DISTINCT error_message) as unique_errors,
    MAX(created_at) as latest_occurrence,
    COUNT(CASE WHEN is_resolved = false THEN 1 END) as unresolved_count
FROM ErrorLogs 
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY error_level, error_type, service_name
ORDER BY error_count DESC, latest_occurrence DESC;

-- API Performance Summary
CREATE OR REPLACE VIEW api_performance_summary AS
SELECT 
    url as endpoint_path,
    COUNT(*) as request_count,
    AVG(response_time_ms) as avg_response_time,
    MIN(response_time_ms) as min_response_time,
    MAX(response_time_ms) as max_response_time,
    COUNT(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END) as success_count,
    COUNT(CASE WHEN status_code >= 400 THEN 1 END) as error_count,
    ROUND(
        COUNT(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END) * 100.0 / COUNT(*), 2
    ) as success_rate
FROM AccessLogs 
WHERE timestamp >= NOW() - INTERVAL '24 hours'
  AND url IS NOT NULL
GROUP BY url
ORDER BY request_count DESC;

-- Top Error Sources
CREATE OR REPLACE VIEW top_error_sources AS
SELECT 
    service_name,
    component_name,
    function_name,
    error_type,
    COUNT(*) as error_count,
    MAX(last_occurred_at) as latest_occurrence,
    STRING_AGG(DISTINCT error_message, '; ' ORDER BY error_message) as sample_messages
FROM ErrorLogs
WHERE created_at >= NOW() - INTERVAL '7 days'
  AND is_resolved = false
GROUP BY service_name, component_name, function_name, error_type
HAVING COUNT(*) >= 5  -- Only show errors that occurred 5+ times
ORDER BY error_count DESC
LIMIT 20;

-- ==============================================
-- 13. FUNCTIONS FOR MONITORING OPERATIONS
-- ==============================================

-- Function to update building geocoding result
CREATE OR REPLACE FUNCTION update_building_geocoding(
    p_building_id INTEGER,
    p_latitude DECIMAL(10,8),
    p_longitude DECIMAL(11,8),
    p_status VARCHAR(20),
    p_source VARCHAR(50),
    p_accuracy VARCHAR(20) DEFAULT NULL,
    p_confidence DECIMAL(3,2) DEFAULT NULL,
    p_formatted_address TEXT DEFAULT NULL,
    p_service_response JSONB DEFAULT '{}',
    p_requested_by VARCHAR(255) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    history_id UUID;
    original_addr TEXT;
BEGIN
    -- Get original address
    SELECT address INTO original_addr FROM Buildings WHERE id = p_building_id;
    
    -- Start transaction
    BEGIN
        -- Update buildings table
        UPDATE Buildings 
        SET 
            latitude = p_latitude,
            longitude = p_longitude,
            geocoding_status = p_status,
            geocoding_source = p_source,
            geocoding_accuracy = p_accuracy,
            geocoded_at = NOW()
        WHERE id = p_building_id;
        
        -- Deactivate previous geocoding history
        UPDATE GeocodingHistory 
        SET is_active = false 
        WHERE building_id = p_building_id;
        
        -- Insert new geocoding history record
        INSERT INTO GeocodingHistory (
            building_id, original_address, formatted_address, latitude, longitude,
            service_provider, service_response, confidence_score, accuracy_level,
            status, requested_by, is_active
        ) VALUES (
            p_building_id, original_addr, p_formatted_address, p_latitude, p_longitude,
            p_source, p_service_response, p_confidence, p_accuracy,
            p_status, p_requested_by, true
        ) RETURNING id INTO history_id;
        
        RETURN history_id;
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to mark buildings for geocoding
CREATE OR REPLACE FUNCTION mark_buildings_for_geocoding(
    p_building_ids INTEGER[] DEFAULT NULL
) RETURNS TABLE(building_id INTEGER, building_name VARCHAR(255), address TEXT) AS $$
BEGIN
    -- If no specific buildings provided, mark all without coordinates or failed geocoding
    IF p_building_ids IS NULL THEN
        UPDATE Buildings 
        SET geocoding_status = 'pending' 
        WHERE (latitude IS NULL OR longitude IS NULL) 
           OR geocoding_status = 'failed';
    ELSE
        -- Mark specific buildings
        UPDATE Buildings 
        SET geocoding_status = 'pending' 
        WHERE id = ANY(p_building_ids);
    END IF;
    
    -- Return marked buildings
    RETURN QUERY
    SELECT b.id, b.name, b.address 
    FROM Buildings b 
    WHERE b.geocoding_status = 'pending'
    ORDER BY b.created_at;
END;
$$ LANGUAGE plpgsql;

-- Function to get buildings needing geocoding
CREATE OR REPLACE FUNCTION get_buildings_for_geocoding()
RETURNS TABLE(
    building_id INTEGER, 
    building_name VARCHAR(255), 
    address TEXT,
    last_attempt TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        b.id,
        b.name,
        b.address,
        MAX(gh.created_at) as last_attempt
    FROM Buildings b
    LEFT JOIN GeocodingHistory gh ON b.id = gh.building_id
    WHERE b.geocoding_status = 'pending' 
       OR (b.latitude IS NULL AND b.address IS NOT NULL)
    GROUP BY b.id, b.name, b.address
    ORDER BY last_attempt NULLS FIRST, b.created_at;
END;
$$ LANGUAGE plpgsql;

-- Function to log API access
CREATE OR REPLACE FUNCTION log_api_access(
    p_method VARCHAR(10),
    p_url TEXT,
    p_status_code INTEGER,
    p_response_time_ms INTEGER,
    p_ip_address INET,
    p_user_agent TEXT DEFAULT NULL,
    p_user_email VARCHAR(255) DEFAULT NULL,
    p_session_id VARCHAR(100) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO AccessLogs (
        method, url, status_code, response_time_ms, 
        ip_address, user_agent, user_email, session_id
    ) VALUES (
        p_method, p_url, p_status_code, p_response_time_ms,
        p_ip_address, p_user_agent, p_user_email, p_session_id
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to log errors
CREATE OR REPLACE FUNCTION log_error(
    p_error_level VARCHAR(20),
    p_error_type VARCHAR(100),
    p_error_message TEXT,
    p_service_name VARCHAR(100) DEFAULT NULL,
    p_component_name VARCHAR(100) DEFAULT NULL,
    p_request_id VARCHAR(100) DEFAULT NULL,
    p_user_email VARCHAR(255) DEFAULT NULL,
    p_error_context JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    error_id UUID;
BEGIN
    INSERT INTO ErrorLogs (
        error_level, error_type, error_message, service_name,
        component_name, request_id, user_email, error_context
    ) VALUES (
        p_error_level, p_error_type, p_error_message, p_service_name,
        p_component_name, p_request_id, p_user_email, p_error_context
    ) RETURNING id INTO error_id;
    
    RETURN error_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update system status
CREATE OR REPLACE FUNCTION update_system_status(
    p_service_name VARCHAR(100),
    p_service_type VARCHAR(50),
    p_status VARCHAR(20),
    p_response_time_ms INTEGER DEFAULT NULL,
    p_health_details JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    status_id UUID;
BEGIN
    INSERT INTO SystemStatus (
        service_name, service_type, status, response_time_ms, health_details
    ) VALUES (
        p_service_name, p_service_type, p_status, p_response_time_ms, p_health_details
    ) RETURNING id INTO status_id;
    
    RETURN status_id;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 14. DATA RETENTION POLICIES
-- ==============================================

-- Function to cleanup old monitoring data
CREATE OR REPLACE FUNCTION cleanup_monitoring_data() RETURNS TEXT AS $$
DECLARE
    deleted_access_logs INTEGER;
    deleted_error_logs INTEGER;
    deleted_performance_metrics INTEGER;
    deleted_rate_limit_logs INTEGER;
    result_text TEXT;
BEGIN
    -- Delete access logs older than 90 days
    DELETE FROM AccessLogs WHERE created_at < NOW() - INTERVAL '90 days';
    GET DIAGNOSTICS deleted_access_logs = ROW_COUNT;
    
    -- Delete resolved error logs older than 30 days
    DELETE FROM ErrorLogs 
    WHERE created_at < NOW() - INTERVAL '30 days' 
      AND is_resolved = true;
    GET DIAGNOSTICS deleted_error_logs = ROW_COUNT;
    
    -- Delete performance metrics older than 7 days
    DELETE FROM PerformanceMetrics WHERE created_at < NOW() - INTERVAL '7 days';
    GET DIAGNOSTICS deleted_performance_metrics = ROW_COUNT;
    
    -- Delete rate limit logs older than 30 days
    DELETE FROM RateLimitLogs WHERE created_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS deleted_rate_limit_logs = ROW_COUNT;
    
    result_text := FORMAT(
        'Cleanup completed: Access logs: %s, Error logs: %s, Performance metrics: %s, Rate limit logs: %s',
        deleted_access_logs, deleted_error_logs, deleted_performance_metrics, deleted_rate_limit_logs
    );
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'BU Library Booking System (Anonymous) database schema with monitoring created successfully!' as result;
SELECT 'Monitoring tables added: AccessLogs, SystemStatus, ErrorLogs, PerformanceMetrics, RateLimitLogs' as monitoring_info;
SELECT 'Geocoding functionality added: Buildings table updated with lat/lng fields, GeocodingHistory table created' as geocoding_info;
SELECT 'Geocoding functions available: update_building_geocoding(), mark_buildings_for_geocoding(), get_buildings_for_geocoding()' as geocoding_functions;
