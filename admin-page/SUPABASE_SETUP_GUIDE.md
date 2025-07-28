# Supabase 配置指南 (Supabase Configuration Guide)

这个指南将帮助你配置Supabase数据库，解决"Supabase not configured, using mock buildings"的问题。

## 🚀 快速设置步骤

### 1. 获取Supabase凭据

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 登录你的账户（如果没有账户请先注册）
3. 选择你的项目，或者创建一个新项目
4. 进入 **Settings** → **API**
5. 复制以下信息：
   - **Project URL** (类似: `https://your-project-id.supabase.co`)
   - **anon public key** (长字符串，以 `eyJ` 开头)

### 2. 配置环境变量

1. 在 `admin-page` 文件夹中，找到 `.env.local` 文件
2. 更新以下行：

```env
VITE_SUPABASE_URL=https://your-actual-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

**示例：**
```env
VITE_SUPABASE_URL=https://abcdefghijklmn.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1uIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODc4NzY1NDMsImV4cCI6MjAwMzQ1MjU0M30.example-signature
```

### 3. 设置数据库表

1. 在Supabase Dashboard中，进入 **SQL Editor**
2. 复制并运行以下SQL脚本：

```sql
-- 创建Buildings表
CREATE TABLE IF NOT EXISTS Buildings (
  id SERIAL PRIMARY KEY,
  Name VARCHAR(255) NOT NULL,
  ShortName VARCHAR(10) NOT NULL UNIQUE,
  Address TEXT,
  website VARCHAR(255),
  contacts JSONB,
  available BOOLEAN DEFAULT true,
  libcal_id INTEGER,
  lid INTEGER NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 创建Rooms表
CREATE TABLE IF NOT EXISTS Rooms (
  id SERIAL PRIMARY KEY,
  building_id INTEGER REFERENCES Buildings(id) ON DELETE CASCADE,
  eid INTEGER NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  url VARCHAR(255),
  grouping VARCHAR(100),
  capacity INTEGER DEFAULT 6,
  gtype INTEGER,
  gBookingSelectableTime BOOLEAN DEFAULT true,
  hasInfo BOOLEAN DEFAULT false,
  thumbnail VARCHAR(255),
  filterIds INTEGER[],
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 创建索引以提高性能
CREATE INDEX IF NOT EXISTS idx_rooms_building_id ON Rooms(building_id);
CREATE INDEX IF NOT EXISTS idx_rooms_eid ON Rooms(eid);
CREATE INDEX IF NOT EXISTS idx_buildings_lid ON Buildings(lid);
CREATE INDEX IF NOT EXISTS idx_buildings_shortname ON Buildings(ShortName);

-- 插入示例建筑数据
INSERT INTO Buildings (Name, ShortName, Address, lid, libcal_id) VALUES
  ('Mugar Memorial Library', 'mug', '771 Commonwealth Avenue, Boston, MA 02215', 19336, 19336),
  ('Pardee Library', 'par', '771 Commonwealth Avenue, Boston, MA 02215', 19818, 19818),
  ('Pickering Educational Resources Library', 'pic', '2 Silber Way, Boston, MA 02215', 18359, 18359),
  ('Science & Engineering Library', 'sci', '38 Cummington Mall, Boston, MA 02215', 20177, 20177)
ON CONFLICT (ShortName) DO UPDATE SET
  Name = EXCLUDED.Name,
  Address = EXCLUDED.Address,
  lid = EXCLUDED.lid,
  libcal_id = EXCLUDED.libcal_id,
  updated_at = TIMEZONE('utc', NOW());
```

### 4. 重启开发服务器

1. 在终端中停止当前运行的开发服务器 (Ctrl+C)
2. 重新启动服务器：

```bash
npm run dev
```

### 5. 验证配置

检查开发服务器控制台和浏览器控制台中的连接状态：

```bash
# 启动开发服务器
npm run dev
```

在浏览器中访问 http://localhost:3000 并查看：
- Connection Status组件应该显示连接状态
- 控制台不应显示"Supabase not configured"消息
- 各页面应正确加载数据或显示skeleton loading状态

## 🔧 故障排除

### 问题1：仍然显示"Supabase not configured"

**解决方案：**
1. 确保 `.env.local` 文件在正确的位置 (`admin-page` 文件夹根目录)
2. 检查环境变量名称是否正确 (`VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`)
3. 重启开发服务器

### 问题2：数据库连接错误

**解决方案：**
1. 验证Supabase项目URL和密钥是否正确
2. 确保Supabase项目状态正常
3. 检查网络连接

### 问题3：表不存在错误

**解决方案：**
1. 确保已在Supabase SQL Editor中运行了表创建脚本
2. 检查表名称大小写 (`Buildings` 和 `Rooms`)
3. 验证表权限设置

### 问题4：权限错误

**解决方案：**
1. 在Supabase Dashboard中，进入 **Authentication** → **Policies**
2. 确保为Buildings和Rooms表启用了Row Level Security
3. 添加适当的策略允许读取访问

## 📊 验证数据

成功配置后，你应该能看到：

1. **LocationsPage**: 显示4个建筑物 (mug, par, pic, sci)
2. **BookingsPage**: 不再显示mock数据警告
3. **DashboardPage**: 显示真实的统计数据

## 🔄 同步bu-book配置

为了确保数据一致性，也需要为bu-book项目配置相同的Supabase凭据：

1. 在 `bu-book` 文件夹中更新 `.env.local` 文件
2. 使用相同的 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 值

## 📝 完成检查清单

- [ ] 获取Supabase项目凭据
- [ ] 更新 `admin-page/.env.local` 文件
- [ ] 在Supabase中运行数据库设置SQL
- [ ] 重启开发服务器
- [ ] 验证BookingsPage不再显示mock数据警告
- [ ] 检查LocationsPage显示真实建筑数据
- [ ] (可选) 为bu-book配置相同凭据

## 🎉 完成！

配置完成后，你的admin-page将能够：
- 从Supabase数据库读取真实的建筑和房间数据
- 与bu-book和bub-backend共享相同的数据源
- 显示一致的统计信息和房间可用性

如果遇到任何问题，请检查浏览器控制台的错误信息，或参考上面的故障排除部分。
