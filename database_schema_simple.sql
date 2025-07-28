-- ==============================================
-- BU Library Booking System Database Schema
-- SIMPLIFIED VERSION FOR ANONYMOUS BOOKING
-- ==============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- 1. CORE LIBRARY DATA TABLES
-- ==============================================

-- Buildings table (图书馆建筑表)
CREATE TABLE IF NOT EXISTS Buildings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,                    -- 建筑物全名
  short_name VARCHAR(10) NOT NULL UNIQUE,       -- 建筑物简称 (mug, par, pic, sci)
  address TEXT,                                  -- 建筑物地址
  website VARCHAR(255),                          -- 建筑物官网
  contacts JSONB DEFAULT '{}',                   -- 联系方式 (JSON 格式)
  available BOOLEAN DEFAULT true,               -- 是否有可用房间
  libcal_id INTEGER,                            -- LibCal 系统中的 ID
  lid INTEGER NOT NULL UNIQUE,                  -- LibCal Location ID (核心字段)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Rooms table (房间表)
CREATE TABLE IF NOT EXISTS Rooms (
  id SERIAL PRIMARY KEY,
  building_id INTEGER NOT NULL REFERENCES Buildings(id) ON DELETE CASCADE,
  eid INTEGER NOT NULL UNIQUE,                  -- LibCal Equipment ID (房间标识)
  name VARCHAR(255) NOT NULL,                   -- 房间显示名称
  url VARCHAR(255),                             -- LibCal 预订链接
  room_type VARCHAR(100),                       -- 房间类型/分组信息
  capacity INTEGER DEFAULT 6,                  -- 房间容量
  gtype INTEGER DEFAULT 1,                     -- LibCal 分组类型
  available BOOLEAN DEFAULT true,              -- 当前可用状态
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. USER AND BOOKING TABLES (ANONYMOUS)
-- ==============================================

-- User profiles table (用户档案表) - 匿名预订专用
CREATE TABLE IF NOT EXISTS UserProfiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,          -- 必填：联系邮箱
  full_name VARCHAR(255),                      -- 选填：用户姓名  
  phone VARCHAR(20),                           -- 选填：电话号码
  department VARCHAR(100),                     -- 选填：部门信息
  
  -- 匿名预订统计字段
  total_bookings INTEGER DEFAULT 0,           -- 总预订次数
  active_bookings INTEGER DEFAULT 0,          -- 当前活跃预订数
  cancelled_bookings INTEGER DEFAULT 0,       -- 取消预订次数
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- 最后活动时间
  
  -- 管理字段
  is_blocked BOOLEAN DEFAULT false,           -- 是否被管理员屏蔽
  block_reason TEXT,                          -- 屏蔽原因
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings table (预订记录表) - 匿名预订专用
CREATE TABLE IF NOT EXISTS Bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES UserProfiles(id) ON DELETE SET NULL, -- 关联用户档案
  user_email VARCHAR(255) NOT NULL,            -- 必填：预订者邮箱
  user_name VARCHAR(255),                      -- 选填：预订者姓名
  contact_phone VARCHAR(20),                   -- 选填：联系电话
  
  -- 建筑和房间信息
  building_id INTEGER NOT NULL REFERENCES Buildings(id),
  building_name VARCHAR(255) NOT NULL,         -- 冗余存储
  building_short_name VARCHAR(10) NOT NULL,    -- 冗余存储
  room_id INTEGER NOT NULL REFERENCES Rooms(id),
  room_eid INTEGER NOT NULL,                   -- LibCal Equipment ID
  room_name VARCHAR(255) NOT NULL,             -- 冗余存储
  room_capacity INTEGER,                       -- 冗余存储
  
  -- 预订时间信息
  booking_date DATE NOT NULL,                  -- 预订日期
  start_time TIME NOT NULL,                    -- 开始时间
  end_time TIME NOT NULL,                      -- 结束时间
  duration_minutes INTEGER NOT NULL,           -- 持续时间(分钟)
  
  -- 预订状态和标识
  status VARCHAR(20) DEFAULT 'pending',        -- pending, confirmed, active, completed, cancelled
  booking_reference VARCHAR(50) UNIQUE,        -- 预订参考号
  libcal_booking_id VARCHAR(100),             -- LibCal 系统预订 ID
  
  -- 元数据
  purpose TEXT,                                -- 预订目的 (选填)
  notes TEXT,                                  -- 预订备注
  cancellation_reason TEXT,                    -- 取消原因
  cancelled_at TIMESTAMP WITH TIME ZONE,      -- 取消时间
  confirmed_at TIMESTAMP WITH TIME ZONE,      -- 确认时间
  
  -- 系统字段
  ip_address INET,                             -- 预订时的IP地址
  user_agent TEXT,                             -- 用户代理信息
  session_id VARCHAR(100),                     -- 会话ID (用于匿名用户)
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 约束条件
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  CONSTRAINT valid_email CHECK (user_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- ==============================================
-- 3. SYSTEM CONFIGURATION
-- ==============================================

-- System Configuration (系统配置表)
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
-- 4. INDEXES FOR PERFORMANCE
-- ==============================================

-- Buildings table indexes
CREATE INDEX IF NOT EXISTS idx_buildings_short_name ON Buildings(short_name);
CREATE INDEX IF NOT EXISTS idx_buildings_lid ON Buildings(lid);
CREATE INDEX IF NOT EXISTS idx_buildings_available ON Buildings(available);

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

-- Apply update timestamp triggers
CREATE TRIGGER update_buildings_updated_at BEFORE UPDATE ON Buildings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON Rooms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON UserProfiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON Bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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

-- Buildings and Rooms are publicly accessible (read-only)
CREATE POLICY "Buildings are viewable by everyone" ON Buildings
    FOR SELECT USING (true);

CREATE POLICY "Rooms are viewable by everyone" ON Rooms
    FOR SELECT USING (true);

-- UserProfiles policies - Simple email-based access
CREATE POLICY "Users can view own profile by email" ON UserProfiles
    FOR SELECT USING (true);  -- Allow viewing for now, can be restricted later

CREATE POLICY "Users can update own profile" ON UserProfiles
    FOR UPDATE USING (true);  -- Allow updating for now, can be restricted later

CREATE POLICY "Anyone can create user profile" ON UserProfiles
    FOR INSERT WITH CHECK (true);

-- Bookings policies - Simple access for anonymous users
CREATE POLICY "Users can view bookings" ON Bookings
    FOR SELECT USING (true);  -- Allow viewing for now, can be restricted later

CREATE POLICY "Anyone can create bookings" ON Bookings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update bookings" ON Bookings
    FOR UPDATE USING (true);  -- Allow updating for now, can be restricted later

-- ==============================================
-- 7. INITIAL DATA SEEDING
-- ==============================================

-- Insert BU Libraries
INSERT INTO Buildings (name, short_name, address, website, lid, libcal_id) VALUES
('Mugar Memorial Library', 'mug', '771 Commonwealth Ave, Boston, MA 02215', 'https://www.bu.edu/library/mugar/', 19336, 19336),
('Pardee Library', 'par', '771 Commonwealth Ave, Boston, MA 02215', 'https://www.bu.edu/library/pardee/', 19818, 19818),
('Pickering Educational Resources Library', 'pic', '2 Silber Way, Boston, MA 02215', 'https://www.bu.edu/library/pickering/', 18359, 18359),
('Science & Engineering Library', 'sci', '38 Cummington Mall, Boston, MA 02215', 'https://www.bu.edu/library/sel/', 20177, 20177)
ON CONFLICT (short_name) DO NOTHING;

-- Insert system configuration
INSERT INTO SystemConfig (config_key, config_value, description) VALUES
('libcal_api_timeout', '5000', 'LibCal API timeout in milliseconds'),
('booking_window_days', '30', 'Number of days in advance users can book'),
('max_booking_duration_hours', '4', 'Maximum booking duration in hours'),
('maintenance_mode', 'false', 'System maintenance mode flag'),
('cache_duration_minutes', '5', 'API response cache duration'),
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

-- Server Access Logs (服务器访问日志表)
CREATE TABLE IF NOT EXISTS AccessLogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Request Information
  request_id VARCHAR(100) UNIQUE,              -- 请求唯一标识
  ip_address INET NOT NULL,                    -- 客户端IP地址
  user_agent TEXT,                             -- 用户代理字符串
  referer TEXT,                                -- 来源页面
  
  -- HTTP Request Details
  method VARCHAR(10) NOT NULL,                 -- HTTP方法 (GET, POST, etc.)
  url TEXT NOT NULL,                           -- 请求URL
  query_string TEXT,                           -- 查询参数
  request_headers JSONB DEFAULT '{}',          -- 请求头信息
  request_body TEXT,                           -- 请求体 (POST数据)
  
  -- Response Information
  status_code INTEGER NOT NULL,                -- HTTP状态码
  response_time_ms INTEGER,                    -- 响应时间(毫秒)
  response_size_bytes INTEGER,                 -- 响应大小(字节)
  response_headers JSONB DEFAULT '{}',         -- 响应头信息
  
  -- User Context
  user_email VARCHAR(255),                     -- 关联用户邮箱 (如果有)
  session_id VARCHAR(100),                     -- 会话ID
  
  -- Geographical Information
  country VARCHAR(100),                        -- 国家
  region VARCHAR(100),                         -- 地区/州
  city VARCHAR(100),                           -- 城市
  
  -- Timestamps
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Website Status Monitoring (网站运行状态监控表)
CREATE TABLE IF NOT EXISTS SystemStatus (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Service Information
  service_name VARCHAR(100) NOT NULL,          -- 服务名称 (frontend, backend, database)
  service_type VARCHAR(50) NOT NULL,           -- 服务类型 (web, api, db, external)
  endpoint_url TEXT,                           -- 监控端点URL
  
  -- Status Information
  status VARCHAR(20) NOT NULL,                 -- up, down, degraded, maintenance
  response_time_ms INTEGER,                    -- 响应时间(毫秒)
  status_code INTEGER,                         -- HTTP状态码
  
  -- Health Check Details
  health_check_type VARCHAR(50),               -- 健康检查类型 (http, tcp, custom)
  health_details JSONB DEFAULT '{}',           -- 健康检查详细信息
  
  -- Performance Metrics
  cpu_usage_percent DECIMAL(5,2),              -- CPU使用率
  memory_usage_percent DECIMAL(5,2),           -- 内存使用率
  disk_usage_percent DECIMAL(5,2),             -- 磁盘使用率
  active_connections INTEGER,                  -- 活跃连接数
  
  -- Availability Metrics
  uptime_seconds BIGINT,                       -- 运行时间(秒)
  downtime_seconds BIGINT DEFAULT 0,           -- 停机时间(秒)
  
  -- Error Information
  error_message TEXT,                          -- 错误信息
  error_count INTEGER DEFAULT 0,               -- 错误计数
  
  -- Timestamps
  check_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_success_at TIMESTAMP WITH TIME ZONE,   -- 最后成功时间
  last_failure_at TIMESTAMP WITH TIME ZONE,   -- 最后失败时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Error Logs (错误日志表)
CREATE TABLE IF NOT EXISTS ErrorLogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Error Classification
  error_level VARCHAR(20) NOT NULL,            -- ERROR, WARN, INFO, DEBUG, FATAL
  error_type VARCHAR(100) NOT NULL,            -- 错误类型 (DatabaseError, APIError, etc.)
  error_code VARCHAR(50),                      -- 错误代码
  error_category VARCHAR(50),                  -- 错误分类 (system, user, external)
  
  -- Error Details
  error_message TEXT NOT NULL,                 -- 错误消息
  error_description TEXT,                      -- 详细描述
  stack_trace TEXT,                            -- 堆栈跟踪
  error_context JSONB DEFAULT '{}',            -- 错误上下文信息
  
  -- Source Information
  service_name VARCHAR(100),                   -- 发生错误的服务
  component_name VARCHAR(100),                 -- 组件名称
  function_name VARCHAR(100),                  -- 函数名称
  file_path TEXT,                              -- 文件路径
  line_number INTEGER,                         -- 行号
  
  -- Request Context
  request_id VARCHAR(100),                     -- 关联请求ID
  user_email VARCHAR(255),                     -- 关联用户邮箱
  session_id VARCHAR(100),                     -- 会话ID
  ip_address INET,                             -- 客户端IP
  user_agent TEXT,                             -- 用户代理
  
  -- Environment Information
  environment VARCHAR(50) DEFAULT 'production', -- 环境 (development, staging, production)
  server_name VARCHAR(100),                    -- 服务器名称
  process_id INTEGER,                          -- 进程ID
  
  -- Resolution Information
  is_resolved BOOLEAN DEFAULT false,           -- 是否已解决
  resolved_by VARCHAR(255),                    -- 解决者
  resolved_at TIMESTAMP WITH TIME ZONE,       -- 解决时间
  resolution_notes TEXT,                       -- 解决说明
  
  -- Occurrence Information
  occurrence_count INTEGER DEFAULT 1,         -- 发生次数
  first_occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Metrics (性能指标表)
CREATE TABLE IF NOT EXISTS PerformanceMetrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Metric Information
  metric_name VARCHAR(100) NOT NULL,           -- 指标名称
  metric_type VARCHAR(50) NOT NULL,            -- 指标类型 (counter, gauge, histogram)
  metric_category VARCHAR(50),                 -- 指标分类 (api, database, frontend)
  
  -- Metric Values
  metric_value DECIMAL(15,4) NOT NULL,         -- 指标值
  metric_unit VARCHAR(20),                     -- 单位 (ms, bytes, count, percent)
  
  -- Context Information
  service_name VARCHAR(100),                   -- 服务名称
  endpoint_path TEXT,                          -- API端点路径
  operation_name VARCHAR(100),                 -- 操作名称
  
  -- Aggregation Information
  aggregation_type VARCHAR(20),                -- 聚合类型 (avg, min, max, sum, count)
  time_window_minutes INTEGER DEFAULT 1,       -- 时间窗口(分钟)
  
  -- Additional Context
  tags JSONB DEFAULT '{}',                     -- 标签信息
  metadata JSONB DEFAULT '{}',                 -- 元数据
  
  -- Timestamps
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API Rate Limiting Logs (API限流日志表)
CREATE TABLE IF NOT EXISTS RateLimitLogs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Client Information
  client_id VARCHAR(100),                      -- 客户端ID
  ip_address INET NOT NULL,                    -- 客户端IP
  user_email VARCHAR(255),                     -- 用户邮箱
  api_key VARCHAR(100),                        -- API密钥
  
  -- Request Information
  endpoint_path TEXT NOT NULL,                 -- API端点
  method VARCHAR(10) NOT NULL,                 -- HTTP方法
  
  -- Rate Limiting Information
  rate_limit_type VARCHAR(50) NOT NULL,        -- 限流类型 (per_minute, per_hour, per_day)
  limit_value INTEGER NOT NULL,                -- 限流阈值
  current_count INTEGER NOT NULL,              -- 当前计数
  remaining_requests INTEGER,                  -- 剩余请求数
  reset_time TIMESTAMP WITH TIME ZONE,        -- 重置时间
  
  -- Action Information
  action_taken VARCHAR(50) NOT NULL,           -- 采取的动作 (allowed, throttled, blocked)
  retry_after_seconds INTEGER,                 -- 重试等待时间
  
  -- Context
  window_start TIMESTAMP WITH TIME ZONE,      -- 时间窗口开始
  window_end TIMESTAMP WITH TIME ZONE,        -- 时间窗口结束
  
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

-- Apply update timestamp triggers to monitoring tables
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
CREATE POLICY "Admin can view access logs" ON AccessLogs
    FOR SELECT USING (true);  -- Will be restricted to admin users later

CREATE POLICY "Admin can view system status" ON SystemStatus
    FOR ALL USING (true);  -- Will be restricted to admin users later

CREATE POLICY "Admin can view error logs" ON ErrorLogs
    FOR ALL USING (true);  -- Will be restricted to admin users later

CREATE POLICY "Admin can view performance metrics" ON PerformanceMetrics
    FOR ALL USING (true);  -- Will be restricted to admin users later

CREATE POLICY "Admin can view rate limit logs" ON RateLimitLogs
    FOR SELECT USING (true);  -- Will be restricted to admin users later

-- ==============================================
-- 12. VIEWS FOR COMMON QUERIES
-- ==============================================

-- ==============================================
-- 12. VIEWS FOR COMMON QUERIES
-- ==============================================

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

-- Error Summary View (过去24小时错误统计)
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
    endpoint_path,
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
GROUP BY endpoint_path
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
HAVING COUNT(*) >= 5  -- 只显示出现5次以上的错误
ORDER BY error_count DESC
LIMIT 20;

-- ==============================================
-- 13. FUNCTIONS FOR MONITORING OPERATIONS
-- ==============================================

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
