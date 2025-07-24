// 预订服务 - 提供预订管理相关的API模拟
import dayjs from 'dayjs';

/**
 * 模拟预订数据服务
 * 提供预订CRUD操作和相关数据管理
 */
class BookingService {
  constructor() {
    // 模拟延迟，真实API调用的时间
    this.delay = 500;
    
    // 模拟预订数据存储
    this.bookings = this.generateMockBookings();
  }

  // 生成模拟预订数据
  generateMockBookings() {
    const bookings = [];
    const statuses = ['confirmed', 'pending', 'cancelled', 'completed', 'no-show'];
    const purposes = ['学习', '会议', '讨论', '培训', '考试', '讲座', '其他'];
    const rooms = ['自习室A', '会议室B', '讨论室C', '机房D', '阅读区E'];
    const userNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];

    for (let i = 1; i <= 50; i++) {
      const startDate = dayjs().subtract(Math.floor(Math.random() * 30), 'day');
      const startHour = 8 + Math.floor(Math.random() * 12);
      const duration = 1 + Math.floor(Math.random() * 4);
      
      bookings.push({
        id: i,
        bookingNumber: `BK${String(i).padStart(6, '0')}`,
        userId: Math.floor(Math.random() * 100) + 1,
        userName: userNames[Math.floor(Math.random() * userNames.length)],
        userEmail: `user${i}@example.com`,
        userPhone: `1380000${String(i).padStart(4, '0')}`,
        locationId: Math.floor(Math.random() * 5) + 1,
        locationName: rooms[Math.floor(Math.random() * rooms.length)],
        date: startDate.format('YYYY-MM-DD'),
        startTime: `${startHour}:00`,
        endTime: `${startHour + duration}:00`,
        duration: duration,
        purpose: purposes[Math.floor(Math.random() * purposes.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        price: (duration * (10 + Math.floor(Math.random() * 40))),
        participants: Math.floor(Math.random() * 8) + 1,
        notes: i % 3 === 0 ? '特殊需求：需要投影设备' : '',
        createdAt: startDate.subtract(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: startDate.format('YYYY-MM-DD HH:mm:ss'),
        checkedIn: Math.random() > 0.3,
        checkedInTime: Math.random() > 0.3 ? `${startHour}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}` : null,
        rating: Math.random() > 0.5 ? Math.floor(Math.random() * 2) + 4 : null,
        feedback: Math.random() > 0.7 ? '环境很好，很满意' : null
      });
    }

    return bookings.sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());
  }

  // 模拟网络延迟
  sleep(ms = this.delay) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 获取预订列表
  async getBookings(params = {}) {
    await this.sleep();

    let filteredBookings = [...this.bookings];

    // 按状态筛选
    if (params.status && params.status !== 'all') {
      filteredBookings = filteredBookings.filter(booking => booking.status === params.status);
    }

    // 按日期范围筛选
    if (params.dateRange && params.dateRange.length === 2) {
      const [startDate, endDate] = params.dateRange;
      filteredBookings = filteredBookings.filter(booking => {
        const bookingDate = dayjs(booking.date);
        return bookingDate.isAfter(startDate.subtract(1, 'day')) && 
               bookingDate.isBefore(endDate.add(1, 'day'));
      });
    }

    // 按房间筛选
    if (params.locationId) {
      filteredBookings = filteredBookings.filter(booking => 
        booking.locationId === parseInt(params.locationId)
      );
    }

    // 按关键词搜索
    if (params.keyword) {
      const keyword = params.keyword.toLowerCase();
      filteredBookings = filteredBookings.filter(booking => 
        booking.bookingNumber.toLowerCase().includes(keyword) ||
        booking.userName.toLowerCase().includes(keyword) ||
        booking.locationName.toLowerCase().includes(keyword) ||
        booking.purpose.toLowerCase().includes(keyword)
      );
    }

    // 排序
    if (params.sortBy) {
      filteredBookings.sort((a, b) => {
        const aValue = a[params.sortBy];
        const bValue = b[params.sortBy];
        
        if (params.sortOrder === 'desc') {
          return bValue > aValue ? 1 : -1;
        } else {
          return aValue > bValue ? 1 : -1;
        }
      });
    }

    // 分页处理
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = filteredBookings.slice(start, end);

    return {
      success: true,
      data: {
        list: paginatedData,
        total: filteredBookings.length,
        page,
        pageSize,
        summary: {
          totalRevenue: filteredBookings.reduce((sum, booking) => sum + booking.price, 0),
          confirmedCount: filteredBookings.filter(b => b.status === 'confirmed').length,
          pendingCount: filteredBookings.filter(b => b.status === 'pending').length,
          cancelledCount: filteredBookings.filter(b => b.status === 'cancelled').length
        }
      }
    };
  }

  // 获取单个预订详情
  async getBookingById(id) {
    await this.sleep();

    const booking = this.bookings.find(b => b.id === parseInt(id));
    
    if (!booking) {
      return {
        success: false,
        message: '预订不存在'
      };
    }

    // 添加一些额外的详细信息
    const detailedBooking = {
      ...booking,
      paymentStatus: Math.random() > 0.2 ? 'paid' : 'pending',
      paymentMethod: ['支付宝', '微信', '银行卡'][Math.floor(Math.random() * 3)],
      refundAmount: booking.status === 'cancelled' ? booking.price * 0.8 : 0,
      statusHistory: [
        { status: 'pending', timestamp: booking.createdAt, operator: '系统' },
        { status: booking.status, timestamp: booking.updatedAt, operator: '管理员' }
      ]
    };

    return {
      success: true,
      data: detailedBooking
    };
  }

  // 创建新预订
  async createBooking(bookingData) {
    await this.sleep();

    // 简单的数据验证
    if (!bookingData.userId || !bookingData.locationId || !bookingData.date || 
        !bookingData.startTime || !bookingData.endTime) {
      return {
        success: false,
        message: '请填写必要的预订信息'
      };
    }

    // 检查时间冲突
    const hasConflict = this.bookings.some(booking => 
      booking.locationId === parseInt(bookingData.locationId) &&
      booking.date === bookingData.date &&
      booking.status !== 'cancelled' &&
      (
        (bookingData.startTime >= booking.startTime && bookingData.startTime < booking.endTime) ||
        (bookingData.endTime > booking.startTime && bookingData.endTime <= booking.endTime) ||
        (bookingData.startTime <= booking.startTime && bookingData.endTime >= booking.endTime)
      )
    );

    if (hasConflict) {
      return {
        success: false,
        message: '该时间段已被预订'
      };
    }

    // 计算时长和价格
    const startHour = parseInt(bookingData.startTime.split(':')[0]);
    const endHour = parseInt(bookingData.endTime.split(':')[0]);
    const duration = endHour - startHour;
    const basePrice = 20; // 基础价格
    const price = duration * basePrice;

    // 创建新预订
    const newBooking = {
      id: Math.max(...this.bookings.map(b => b.id)) + 1,
      bookingNumber: `BK${String(Date.now()).slice(-6)}`,
      ...bookingData,
      duration,
      price,
      status: 'pending',
      participants: bookingData.participants || 1,
      notes: bookingData.notes || '',
      createdAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      checkedIn: false,
      checkedInTime: null,
      rating: null,
      feedback: null
    };

    this.bookings.unshift(newBooking);

    return {
      success: true,
      data: newBooking,
      message: '预订创建成功'
    };
  }

  // 更新预订状态
  async updateBookingStatus(id, status, operator = '管理员') {
    await this.sleep();

    const bookingIndex = this.bookings.findIndex(b => b.id === parseInt(id));
    
    if (bookingIndex === -1) {
      return {
        success: false,
        message: '预订不存在'
      };
    }

    const oldStatus = this.bookings[bookingIndex].status;
    
    // 状态变更验证
    if (oldStatus === 'completed' && status !== 'completed') {
      return {
        success: false,
        message: '已完成的预订无法修改状态'
      };
    }

    // 更新预订状态
    this.bookings[bookingIndex] = {
      ...this.bookings[bookingIndex],
      status,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };

    return {
      success: true,
      data: this.bookings[bookingIndex],
      message: `预订状态已更新为${this.getStatusText(status)}`
    };
  }

  // 签到
  async checkIn(id) {
    await this.sleep();

    const bookingIndex = this.bookings.findIndex(b => b.id === parseInt(id));
    
    if (bookingIndex === -1) {
      return {
        success: false,
        message: '预订不存在'
      };
    }

    const booking = this.bookings[bookingIndex];
    
    if (booking.status !== 'confirmed') {
      return {
        success: false,
        message: '只有确认状态的预订才能签到'
      };
    }

    if (booking.checkedIn) {
      return {
        success: false,
        message: '已经签到过了'
      };
    }

    // 更新签到状态
    this.bookings[bookingIndex] = {
      ...booking,
      checkedIn: true,
      checkedInTime: dayjs().format('HH:mm'),
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };

    return {
      success: true,
      data: this.bookings[bookingIndex],
      message: '签到成功'
    };
  }

  // 取消预订
  async cancelBooking(id, reason = '') {
    await this.sleep();

    const bookingIndex = this.bookings.findIndex(b => b.id === parseInt(id));
    
    if (bookingIndex === -1) {
      return {
        success: false,
        message: '预订不存在'
      };
    }

    const booking = this.bookings[bookingIndex];
    
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      return {
        success: false,
        message: '该预订无法取消'
      };
    }

    // 计算退款金额（提前24小时取消全额退款，否则扣除20%）
    const bookingTime = dayjs(`${booking.date} ${booking.startTime}`);
    const now = dayjs();
    const hoursUntilBooking = bookingTime.diff(now, 'hour');
    const refundRate = hoursUntilBooking >= 24 ? 1.0 : 0.8;
    const refundAmount = booking.price * refundRate;

    // 更新预订状态
    this.bookings[bookingIndex] = {
      ...booking,
      status: 'cancelled',
      cancelReason: reason,
      refundAmount,
      updatedAt: dayjs().format('YYYY-MM-DD HH:mm:ss')
    };

    return {
      success: true,
      data: this.bookings[bookingIndex],
      message: `预订已取消，退款金额：¥${refundAmount}`
    };
  }

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      'pending': '待确认',
      'confirmed': '已确认',
      'cancelled': '已取消',
      'completed': '已完成',
      'no-show': '未到场'
    };
    return statusMap[status] || status;
  }

  // 获取预订统计
  async getBookingStats(dateRange = null) {
    await this.sleep();

    let bookingsToAnalyze = this.bookings;

    // 按日期范围筛选
    if (dateRange && dateRange.length === 2) {
      const [startDate, endDate] = dateRange;
      bookingsToAnalyze = this.bookings.filter(booking => {
        const bookingDate = dayjs(booking.date);
        return bookingDate.isAfter(startDate.subtract(1, 'day')) && 
               bookingDate.isBefore(endDate.add(1, 'day'));
      });
    }

    const stats = {
      total: bookingsToAnalyze.length,
      confirmed: bookingsToAnalyze.filter(b => b.status === 'confirmed').length,
      pending: bookingsToAnalyze.filter(b => b.status === 'pending').length,
      cancelled: bookingsToAnalyze.filter(b => b.status === 'cancelled').length,
      completed: bookingsToAnalyze.filter(b => b.status === 'completed').length,
      noShow: bookingsToAnalyze.filter(b => b.status === 'no-show').length,
      totalRevenue: bookingsToAnalyze.reduce((sum, b) => sum + b.price, 0),
      avgDuration: bookingsToAnalyze.reduce((sum, b) => sum + b.duration, 0) / bookingsToAnalyze.length || 0,
      checkedInRate: bookingsToAnalyze.filter(b => b.checkedIn).length / bookingsToAnalyze.length || 0
    };

    return {
      success: true,
      data: stats
    };
  }

  // 批量操作
  async batchUpdateBookings(bookingIds, action, params = {}) {
    await this.sleep();

    const updatedBookings = [];
    
    for (const id of bookingIds) {
      const bookingIndex = this.bookings.findIndex(b => b.id === parseInt(id));
      if (bookingIndex !== -1) {
        switch (action) {
          case 'confirm':
            this.bookings[bookingIndex].status = 'confirmed';
            break;
          case 'cancel':
            this.bookings[bookingIndex].status = 'cancelled';
            this.bookings[bookingIndex].cancelReason = params.reason || '批量取消';
            break;
          case 'complete':
            this.bookings[bookingIndex].status = 'completed';
            break;
        }
        this.bookings[bookingIndex].updatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss');
        updatedBookings.push(this.bookings[bookingIndex]);
      }
    }

    return {
      success: true,
      data: updatedBookings,
      message: `成功${action === 'confirm' ? '确认' : action === 'cancel' ? '取消' : '完成'}${updatedBookings.length}个预订`
    };
  }

  // 获取可用时间段
  async getAvailableSlots(locationId, date) {
    await this.sleep(300);

    // 获取该房间当天的预订
    const dayBookings = this.bookings.filter(booking => 
      booking.locationId === parseInt(locationId) &&
      booking.date === date &&
      booking.status !== 'cancelled'
    );

    // 生成可用时间段（8:00-22:00，按小时划分）
    const slots = [];
    for (let hour = 8; hour < 22; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;
      const endTime = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      // 检查该时间段是否被预订
      const isBooked = dayBookings.some(booking => 
        booking.startTime <= startTime && booking.endTime > startTime
      );

      slots.push({
        startTime,
        endTime,
        available: !isBooked,
        price: 20 // 基础价格
      });
    }

    return {
      success: true,
      data: slots
    };
  }
}

// 创建单例实例
const bookingService = new BookingService();

export default bookingService;
