# BU Library Booking System - Data Structure Documentation

## 📋 项目概述

本文档详细描述了 BU Library Booking System 三个子项目的数据结构和字段定义：
- **bu-book**: React TypeScript 前端应用
- **bub-backend**: Python Flask API 服务器
- **admin-page**: React 管理后台

## 🏗️ 核心数据结构

### 1. Building Interface (建筑物数据结构)

**来源**: `bu-book/src/types/building.ts`

```typescript
export interface Building {
  id: number;                    // 建筑物唯一标识符
  Name: string;                  // 建筑物全名
  ShortName: string;             // 建筑物简称 (mug, par, pic, sci)
  Address: string;               // 建筑物地址
  website: string;               // 建筑物官网
  contacts: Record<string, string>; // 联系方式 (JSON 对象)
  available: boolean;            // 是否有可用房间
  libcal_id: number;            // LibCal 系统中的 ID
  lid: number;                   // LibCal Location ID
  Rooms?: Room[];               // 关联的房间列表
}
```

**字段说明**:
- `ShortName`: 与 bub-backend 的 LIBRARY_LIDS 映射表对应
- `lid`: LibCal API 调用时的核心参数
- `available`: 基于实时房间可用性计算
- `Rooms`: 外键关联，包含该建筑下的所有房间

### 2. Room Interface (房间数据结构)

**来源**: `bu-book/src/types/building.ts`

```typescript
export interface Room {
  id: number;                    // 房间数据库唯一标识符
  building_id: number;           // 外键，关联 Building.id
  eid: number;                   // LibCal Equipment ID (LibCal 系统中的房间标识)
  title: string;                 // 房间显示名称
  url: string;                   // LibCal 预订链接
  grouping: string;              // 房间分组信息
  capacity: number;              // 房间容量
  gtype: number;                 // LibCal 分组类型
  gBookingSelectableTime: boolean; // 是否允许选择时间段
  hasInfo: boolean;              // 是否有详细信息
  thumbnail: string;             // 房间缩略图 URL
  filterIds: number[];           // LibCal 筛选器 ID 数组
  available: boolean;            // 当前可用状态
}
```

**字段说明**:
- `eid`: LibCal API 中识别房间的核心字段
- `building_id`: 与 Building 表的外键关系
- `available`: 基于实时 LibCal 数据计算
- `gtype`: LibCal 房间类型分类

### 3. Availability/Slot Interface (可用性数据结构)

**来源**: `bu-book/src/types/availability.ts`

```typescript
export interface Availability {
  slots: Slot[];                 // 时间段列表
  bookings: Slot[];             // 预订列表 (已预订的时间段)
  isPreCreatedBooking: boolean; // 是否为预创建预订
  windowEnd: boolean;           // 是否为窗口结束
}

export interface Slot {
  itemId: number;               // 对应 Room.eid
  start: Date;                  // 开始时间
  end: Date;                    // 结束时间
  checksum: string;             // LibCal 校验和
  className: string;            // CSS 类名 (状态标识)
}
```

**字段说明**:
- `itemId`: 与 Room.eid 一一对应
- `className`: 房间状态标识符，如 's-lc-eq-period-booked'
- `checksum`: LibCal 生成的唯一标识符

## 🔗 bub-backend API 规范

### LIBRARY_LIDS 映射表

**来源**: `bub-backend/main.py`

```python
LIBRARY_LIDS = {
    "mug": 19336,    # Mugar Memorial Library
    "par": 19818,    # Pardee Library  
    "pic": 18359,    # Pickering Educational Resources Library
    "sci": 20177     # Science & Engineering Library
}
```

### API 端点: `/api/availability`

**请求格式**:
```json
{
  "library": "par",           // Building.ShortName
  "start": "2025-07-25",      // 开始日期 (YYYY-MM-DD)
  "end": "2025-07-25",        // 结束日期 (YYYY-MM-DD)
  "start_time": "13:00",      // 可选: 筛选开始时间 (HH:MM)
  "end_time": "16:00"         // 可选: 筛选结束时间 (HH:MM)
}
```

**响应格式**:
```json
{
  "bookings": [],
  "isPreCreatedBooking": false,
  "slots": [
    {
      "checksum": "765760965e8740b8700df9932933cb88",
      "end": "2025-07-25 13:30:00",
      "itemId": 168796,
      "start": "2025-07-25 13:00:00",
      "className": "s-lc-eq-period-booked"
    }
  ]
}
```

## 📊 admin-page 数据映射

### BookingsPage 数据结构

基于 LibCal API 和 bu-book 接口的统一数据模型：

```javascript
const bookingRecord = {
  // 唯一标识
  id: `${building.lid}-${booking.itemId}-${date}-${index}`,
  checksum: booking.checksum,

  // 房间信息 (来自 Room interface)
  roomId: room.id,
  roomTitle: room.title,
  roomEid: booking.itemId,      // = Room.eid
  roomCapacity: room.capacity,

  // 建筑信息 (来自 Building interface)
  buildingId: building.id,
  buildingName: building.Name,
  buildingShortName: building.ShortName,
  buildingLid: building.lid,

  // 时间信息 (来自 Slot interface)
  date: date,
  startTime: dayjs(booking.start).format('HH:mm'),
  endTime: dayjs(booking.end).format('HH:mm'),
  startDateTime: booking.start,
  endDateTime: booking.end,
  duration: dayjs(booking.end).diff(dayjs(booking.start), 'hour', true),

  // 状态信息
  status: 'confirmed|active|completed|pending',
  isActive: boolean,
  isPast: boolean,
  isFuture: boolean,
  className: booking.className
};
```

### LocationsPage 数据结构

完全基于 bu-book 的 Building 和 Room 接口：

```javascript
// Buildings 表格
const buildingColumns = [
  { dataIndex: 'Name', title: 'Building Name' },
  { dataIndex: 'ShortName', title: 'Short Name' },
  { dataIndex: 'Address', title: 'Address' },
  { dataIndex: 'lid', title: 'LibCal LID' },
  { dataIndex: 'available', title: 'Available' }
];

// Rooms 表格  
const roomColumns = [
  { dataIndex: 'title', title: 'Room Name' },
  { dataIndex: 'eid', title: 'EID' },
  { dataIndex: 'capacity', title: 'Capacity' },
  { dataIndex: 'gtype', title: 'Type' },
  { dataIndex: 'available', title: 'Available' }
];
```

### DashboardPage 统计数据

集成三个系统的数据源：

```javascript
const statisticsData = {
  // 来自 Supabase Buildings/Rooms 表
  totalBuildings: number,
  totalRooms: number,
  
  // 来自 bub-backend LibCal API
  totalSlots: number,
  availableSlots: number,
  totalBookings: number,
  
  // 计算字段
  utilizationRate: number,
  buildingAvailabilityRate: number,
  roomAvailabilityRate: number
};
```

## 🗄️ 数据库结构 (Supabase)

### Buildings 表

```sql
CREATE TABLE Buildings (
  id SERIAL PRIMARY KEY,
  Name VARCHAR(255) NOT NULL,
  ShortName VARCHAR(10) NOT NULL UNIQUE,
  Address TEXT,
  website VARCHAR(255),
  contacts JSONB,
  available BOOLEAN DEFAULT true,
  libcal_id INTEGER,
  lid INTEGER NOT NULL UNIQUE
);
```

### Rooms 表

```sql
CREATE TABLE Rooms (
  id SERIAL PRIMARY KEY,
  building_id INTEGER REFERENCES Buildings(id),
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
  available BOOLEAN DEFAULT true
);
```

## 🔄 数据流向

### 1. 数据获取流程

```
LibCal API → bub-backend → admin-page/bu-book
     ↓
Supabase Buildings/Rooms ← admin-page CRUD
```

### 2. 可用性检查流程

```
1. bu-book 获取 Buildings (含 Rooms)
2. 调用 bub-backend /api/availability 
3. 匹配 Room.eid 与 Slot.itemId
4. 计算 Room.available 状态
5. 聚合 Building.available 状态
```

### 3. 预订数据流程

```
1. LibCal 系统 (实际预订)
2. bub-backend 代理 API 获取 bookings
3. admin-page 展示预订记录
4. 匹配 Room/Building 信息
```

## 🏷️ 状态分类系统

### Room 可用性状态

基于 LibCal className 字段：

```javascript
const UNAVAILABLE_CLASSES = new Set([
  's-lc-eq-checkout',           // 已借出
  's-lc-eq-r-unavailable',     // 不可用
  's-lc-eq-r-padding',         // 填充时间
  'label-eq-unavailable',      // 标记不可用
  's-lc-eq-period-booked'      // 已预订
]);
```

### Booking 状态分类

```javascript
const statusConfig = {
  confirmed: { color: 'blue', text: 'Confirmed' },    // 已确认
  active: { color: 'green', text: 'Active' },         // 进行中
  completed: { color: 'default', text: 'Completed' }, // 已完成
  pending: { color: 'orange', text: 'Pending' }       // 待处理
};
```

## 🔧 开发指南

### 添加新建筑步骤

1. **Supabase**: 在 Buildings 表中插入新记录
2. **bub-backend**: 在 LIBRARY_LIDS 中添加映射
3. **bu-book**: 数据会自动同步
4. **admin-page**: 自动识别新建筑

### 添加新房间步骤

1. **获取 LibCal 房间数据** (通过 LibCal API)
2. **使用 RoomGenerator 组件** 批量导入
3. **验证 Room.eid** 与 LibCal itemId 匹配
4. **测试可用性检查** 功能

### 修改字段注意事项

⚠️ **警告**: 以下字段修改需要同步更新多个系统：

- `Building.ShortName` ↔ `LIBRARY_LIDS` keys
- `Building.lid` ↔ `LIBRARY_LIDS` values  
- `Room.eid` ↔ LibCal `itemId`
- `Slot.itemId` ↔ `Room.eid`

## 📈 性能优化建议

### 1. 数据缓存策略

- **Buildings/Rooms**: 长期缓存 (24小时)
- **Availability**: 短期缓存 (5分钟)
- **Bookings**: 实时获取

### 2. API 调用优化

- 批量获取多日数据
- 并行调用多个建筑
- 错误重试机制

### 3. 前端优化

- 虚拟滚动 (大量数据)
- 懒加载房间详情
- 本地状态管理

## 🐛 常见问题解决

### LibCal API 超时
```javascript
// 增加超时处理
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);

fetch(url, { 
  signal: controller.signal,
  timeout: 5000 
});
```

### Room.eid 不匹配
```javascript
// 验证 eid 存在性
const room = building.Rooms?.find(r => r.eid === booking.itemId) || {
  title: `Unknown Room ${booking.itemId}`,
  eid: booking.itemId,
  capacity: 6
};
```

### 日期时区问题
```javascript
// 统一使用 dayjs UTC
const startTime = dayjs.utc(booking.start).local().format('HH:mm');
```

## 📝 维护检查清单

### 每周检查
- [ ] LibCal API 连接状态
- [ ] bub-backend 服务健康
- [ ] Supabase 数据库连接

### 每月检查  
- [ ] 新增/变更的建筑物
- [ ] 房间信息更新
- [ ] API 性能监控

### 学期开始检查
- [ ] LibCal 系统配置变更
- [ ] 新图书馆/房间添加
- [ ] 用户权限更新

---

**文档版本**: v1.0  
**最后更新**: 2025-07-27  
**维护者**: GitHub Copilot  
**相关系统**: bu-book, bub-backend, admin-page
