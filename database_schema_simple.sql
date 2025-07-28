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
('cache_duration_minutes', '5', 'API response cache duration')
ON CONFLICT (config_key) DO NOTHING;

-- ==============================================
-- 8. VIEWS FOR COMMON QUERIES
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

-- Success message
SELECT 'BU Library Booking System (Anonymous) database schema created successfully!' as result;
