// 位置/Room服务 - 提供RoomManagement相关的API模拟
import dayjs from 'dayjs';

/**
 * 模拟位置/RoomData服务
 * 提供RoomCRUDActions和相关DataManagement
 */
class LocationService {
  constructor() {
    // 模拟延迟，真实API调用的Time
    this.delay = 500;
    
    // 模拟Data存储
    this.locations = [
      {
        id: 1,
        name: '自习室A',
        type: 'study',
        capacity: 50,
        floor: 1,
        building: '图书馆主楼',
        description: '安静的自习环境，配备个人座位和台灯',
        equipment: ['WiFi', '空调', '插座', '台灯'],
        status: 'active',
        price: 10,
        images: ['/images/study-room-a.jpg'],
        openTime: '08:00',
        closeTime: '22:00',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-15'
      },
      {
        id: 2,
        name: '会议室B',
        type: 'meeting',
        capacity: 12,
        floor: 2,
        building: '图书馆主楼',
        description: '适合小型会议和团队讨论',
        equipment: ['投影仪', 'WiFi', '空调', '白板', '音响'],
        status: 'active',
        price: 50,
        images: ['/images/meeting-room-b.jpg'],
        openTime: '09:00',
        closeTime: '21:00',
        createdAt: '2024-01-02',
        updatedAt: '2024-01-16'
      },
      {
        id: 3,
        name: '讨论室C',
        type: 'discussion',
        capacity: 8,
        floor: 1,
        building: '图书馆主楼',
        description: '小组讨论专用空间',
        equipment: ['WiFi', '空调', '白板'],
        status: 'active',
        price: 30,
        images: ['/images/discussion-room-c.jpg'],
        openTime: '08:00',
        closeTime: '22:00',
        createdAt: '2024-01-03',
        updatedAt: '2024-01-17'
      },
      {
        id: 4,
        name: '机房D',
        type: 'computer',
        capacity: 30,
        floor: 3,
        building: '图书馆主楼',
        description: '配备高性能电脑的学习空间',
        equipment: ['电脑', 'WiFi', '空调', '打印机'],
        status: 'maintenance',
        price: 20,
        images: ['/images/computer-room-d.jpg'],
        openTime: '09:00',
        closeTime: '20:00',
        createdAt: '2024-01-04',
        updatedAt: '2024-01-18'
      },
      {
        id: 5,
        name: '阅读区E',
        type: 'reading',
        capacity: 100,
        floor: 2,
        building: '图书馆主楼',
        description: 'Open式阅读区域，安静舒适',
        equipment: ['WiFi', '空调', '阅读灯'],
        status: 'active',
        price: 5,
        images: ['/images/reading-area-e.jpg'],
        openTime: '07:00',
        closeTime: '23:00',
        createdAt: '2024-01-05',
        updatedAt: '2024-01-19'
      }
    ];
  }

  // 模拟网络延迟
  sleep(ms = this.delay) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 获取所有RoomList
  async getLocations(params = {}) {
    await this.sleep();

    let filteredLocations = [...this.locations];

    // 按TypeFilter
    if (params.type && params.type !== 'all') {
      filteredLocations = filteredLocations.filter(loc => loc.type === params.type);
    }

    // 按StatusFilter
    if (params.status && params.status !== 'all') {
      filteredLocations = filteredLocations.filter(loc => loc.status === params.status);
    }

    // 按关键词Search
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      filteredLocations = filteredLocations.filter(loc => 
        loc.name.toLowerCase().includes(keyword) ||
        loc.description.toLowerCase().includes(keyword) ||
        loc.building.toLowerCase().includes(keyword)
      );
    }

    // 分页处理
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = filteredLocations.slice(start, end);

    return {
      success: true,
      data: {
        list: paginatedData,
        total: filteredLocations.length,
        page,
        pageSize
      }
    };
  }

  // 获取单个RoomDetails
  async getLocationById(id) {
    await this.sleep();

    const location = this.locations.find(loc => loc.id === parseInt(id));
    
    if (!location) {
      return {
        success: false,
        message: 'Room不存在'
      };
    }

    // Add一些额外的详细Information
    const detailedLocation = {
      ...location,
      bookingHistory: await this.getLocationBookingHistory(id),
      utilization: Math.floor(Math.random() * 40) + 50, // 模拟使用Rate
      rating: (Math.random() * 1.5 + 3.5).toFixed(1), // 模拟Rating
      lastMaintenance: dayjs().subtract(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD')
    };

    return {
      success: true,
      data: detailedLocation
    };
  }

  // 创建新Room
  async createLocation(locationData) {
    await this.sleep();

    // 简单的Data验证
    if (!locationData.name || !locationData.type || !locationData.capacity) {
      return {
        success: false,
        message: '请填写必要的RoomInformation'
      };
    }

    // 检查RoomName是否重复
    const existingLocation = this.locations.find(loc => loc.name === locationData.name);
    if (existingLocation) {
      return {
        success: false,
        message: 'RoomNameCompleted存在'
      };
    }

    // 创建新Room
    const newLocation = {
      id: Math.max(...this.locations.map(loc => loc.id)) + 1,
      ...locationData,
      equipment: locationData.equipment || [],
      status: locationData.status || 'active',
      images: locationData.images || [],
      createdAt: dayjs().format('YYYY-MM-DD'),
      updatedAt: dayjs().format('YYYY-MM-DD')
    };

    this.locations.push(newLocation);

    return {
      success: true,
      data: newLocation,
      message: 'Room创建Success'
    };
  }

  // 更新RoomInformation
  async updateLocation(id, locationData) {
    await this.sleep();

    const locationIndex = this.locations.findIndex(loc => loc.id === parseInt(id));
    
    if (locationIndex === -1) {
      return {
        success: false,
        message: 'Room不存在'
      };
    }

    // 如果更新Name，检查是否重复
    if (locationData.name && locationData.name !== this.locations[locationIndex].name) {
      const existingLocation = this.locations.find(loc => 
        loc.name === locationData.name && loc.id !== parseInt(id)
      );
      if (existingLocation) {
        return {
          success: false,
          message: 'RoomNameCompleted存在'
        };
      }
    }

    // 更新RoomInformation
    this.locations[locationIndex] = {
      ...this.locations[locationIndex],
      ...locationData,
      id: parseInt(id), // 确保ID不被覆盖
      updatedAt: dayjs().format('YYYY-MM-DD')
    };

    return {
      success: true,
      data: this.locations[locationIndex],
      message: 'RoomInformation更新Success'
    };
  }

  // DeleteRoom
  async deleteLocation(id) {
    await this.sleep();

    const locationIndex = this.locations.findIndex(loc => loc.id === parseInt(id));
    
    if (locationIndex === -1) {
      return {
        success: false,
        message: 'Room不存在'
      };
    }

    // 检查是否有Not完成的预订
    const hasActiveBookings = Math.random() > 0.7; // 模拟30%的概Rate有Active预订
    if (hasActiveBookings) {
      return {
        success: false,
        message: '该Room还有Not完成的预订，无法Delete'
      };
    }

    // DeleteRoom
    this.locations.splice(locationIndex, 1);

    return {
      success: true,
      message: 'RoomDeleteSuccess'
    };
  }

  // 获取RoomType选项
  async getRoomTypes() {
    await this.sleep(200);

    return {
      success: true,
      data: [
        { value: 'study', label: '自习室', icon: '📚' },
        { value: 'meeting', label: '会议室', icon: '🏢' },
        { value: 'discussion', label: '讨论室', icon: '💬' },
        { value: 'computer', label: '机房', icon: '💻' },
        { value: 'reading', label: '阅读区', icon: '📖' },
        { value: 'group', label: '小组室', icon: '👥' },
        { value: 'multimedia', label: '多媒体室', icon: '🎬' }
      ]
    };
  }

  // 获取AvailableEquipmentList
  async getAvailableEquipment() {
    await this.sleep(200);

    return {
      success: true,
      data: [
        '投影仪', 'WiFi', '空调', '白板', '音响', '电脑', 
        '打印机', '插座', '台灯', '阅读灯', '摄像Equipment', 
        '话筒', '桌椅', '储物柜', '饮水机'
      ]
    };
  }

  // 获取Room预订历史
  async getLocationBookingHistory(locationId, limit = 10) {
    await this.sleep(300);

    const history = [];
    for (let i = 0; i < limit; i++) {
      history.push({
        id: i + 1,
        userName: `User${Math.floor(Math.random() * 100) + 1}`,
        date: dayjs().subtract(Math.floor(Math.random() * 30), 'day').format('YYYY-MM-DD'),
        startTime: `${8 + Math.floor(Math.random() * 10)}:00`,
        endTime: `${10 + Math.floor(Math.random() * 10)}:00`,
        status: ['completed', 'cancelled', 'no-show'][Math.floor(Math.random() * 3)],
        purpose: '学习讨论'
      });
    }

    return history.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
  }

  // 批量更新RoomStatus
  async batchUpdateStatus(locationIds, status) {
    await this.sleep();

    const updatedLocations = [];
    
    for (const id of locationIds) {
      const locationIndex = this.locations.findIndex(loc => loc.id === parseInt(id));
      if (locationIndex !== -1) {
        this.locations[locationIndex].status = status;
        this.locations[locationIndex].updatedAt = dayjs().format('YYYY-MM-DD');
        updatedLocations.push(this.locations[locationIndex]);
      }
    }

    return {
      success: true,
      data: updatedLocations,
      message: `Success更新${updatedLocations.length}个Room的Status`
    };
  }
}

// 创建单例实例
const locationService = new LocationService();

export default locationService;
