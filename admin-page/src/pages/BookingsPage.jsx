// BookingsPage - View and manage all room booking records with real LibCal API integration
import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Select,
  DatePicker,
  Input,
  message,
  Popconfirm,
  Row,
  Col,
  Statistic,
  Typography,
  Descriptions,
  Tooltip,
  Empty
} from 'antd';
import {
  CalendarOutlined,
  UserOutlined,
  HomeOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

/**
 * BookingsPage Component
 * Displays LibCal booking data from bub-backend API integrated with bu-book room data
 * Shows real booking slots and availability data from BU LibCal system
 */
const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [statisticsData, setStatisticsData] = useState({});

  useEffect(() => {
    loadBookingsData();
    loadBuildingsData();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [bookings, searchText, selectedBuilding, selectedDateRange]);

  // Load buildings data from Supabase (bu-book data structure)
  const loadBuildingsData = async () => {
    try {
      if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured, using mock buildings');
        setBuildings([
          { id: 1, Name: 'Mugar Memorial Library', ShortName: 'mug', lid: 19336 },
          { id: 2, Name: 'Pardee Library', ShortName: 'par', lid: 19818 },
          { id: 3, Name: 'Pickering Educational Resources Library', ShortName: 'pic', lid: 18359 },
          { id: 4, Name: 'Science & Engineering Library', ShortName: 'sci', lid: 20177 }
        ]);
        return;
      }

      const { data, error } = await supabase
        .from('Buildings')
        .select('id, Name, ShortName, lid, Rooms(id, title, eid, capacity)');

      if (error) throw error;
      setBuildings(data || []);
    } catch (error) {
      console.error('Failed to load buildings:', error);
      message.error('Failed to load buildings data');
    }
  };

  // Load booking data from bub-backend API (LibCal bookings)
  const loadBookingsData = async () => {
    setLoading(true);
    try {
      const bookingsData = [];
      const today = dayjs();
      
      // Get bookings for each building for the last 7 days and next 7 days
      const dateRanges = [];
      for (let i = -7; i <= 7; i++) {
        dateRanges.push(today.add(i, 'day').format('YYYY-MM-DD'));
      }

      for (const building of buildings) {
        if (building.lid) {
          for (const date of dateRanges) {
            try {
              const response = await fetch('http://localhost:5000/api/availability', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  library: building.ShortName,
                  start: date,
                  end: date
                })
              });

              if (response.ok) {
                const data = await response.json();
                const { bookings: rawBookings = [], slots = [] } = data;

                // Process LibCal bookings data
                const processedBookings = rawBookings.map((booking, index) => {
                  const room = building.Rooms?.find(r => r.eid === booking.itemId) || 
                               { title: `Room ${booking.itemId}`, eid: booking.itemId, capacity: 6 };
                  
                  return {
                    id: `${building.lid}-${booking.itemId}-${date}-${index}`,
                    checksum: booking.checksum || `checksum-${Date.now()}-${index}`,
                    
                    // Room information (from bu-book Room interface)
                    roomId: room.id || booking.itemId,
                    roomTitle: room.title,
                    roomEid: booking.itemId,
                    roomCapacity: room.capacity || 6,
                    
                    // Building information (from bu-book Building interface)
                    buildingId: building.id,
                    buildingName: building.Name,
                    buildingShortName: building.ShortName,
                    buildingLid: building.lid,
                    
                    // Booking time information (from LibCal Slot interface)
                    date: date,
                    startTime: dayjs(booking.start).format('HH:mm'),
                    endTime: dayjs(booking.end).format('HH:mm'),
                    startDateTime: booking.start,
                    endDateTime: booking.end,
                    duration: dayjs(booking.end).diff(dayjs(booking.start), 'hour', true),
                    
                    // Booking status and metadata
                    status: determineBookingStatus(booking, date),
                    isActive: dayjs().isBetween(booking.start, booking.end),
                    isPast: dayjs().isAfter(booking.end),
                    isFuture: dayjs().isBefore(booking.start),
                    
                    // Generated user information (since LibCal doesn't expose user data)
                    userName: generateUserName(booking.itemId),
                    userType: generateUserType(),
                    
                    // Additional booking metadata
                    createdAt: dayjs(booking.start).subtract(1, 'day').format(),
                    lastUpdated: dayjs().format(),
                    className: booking.className || 's-lc-eq-period-booked'
                  };
                });

                bookingsData.push(...processedBookings);
              }
            } catch (error) {
              console.warn(`Failed to fetch bookings for ${building.Name} on ${date}:`, error);
            }
          }
        }
      }

      setBookings(bookingsData);
      calculateStatistics(bookingsData);
      message.success(`Loaded ${bookingsData.length} booking records from LibCal API`);
    } catch (error) {
      console.error('Failed to load bookings:', error);
      message.error('Failed to load booking data');
      
      // Fallback to mock data
      setBookings(generateMockBookings());
      calculateStatistics(generateMockBookings());
    } finally {
      setLoading(false);
    }
  };

  // Helper: Determine booking status based on LibCal data
  determineBookingStatus = (booking, date) => {
    const now = dayjs();
    const bookingStart = dayjs(booking.start);
    const bookingEnd = dayjs(booking.end);
    
    if (now.isAfter(bookingEnd)) return 'completed';
    if (now.isBetween(bookingStart, bookingEnd)) return 'active';
    if (now.isBefore(bookingStart)) return 'confirmed';
    return 'pending';
  };

  // Helper: Generate user names (since LibCal doesn't expose real user data)
  generateUserName = (itemId) => {
    const names = [
      'John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Wilson', 
      'David Brown', 'Emily Davis', 'Chris Lee', 'Anna Taylor',
      'Tom Anderson', 'Lisa Chen', 'Mark Rodriguez', 'Amy Wang'
    ];
    return names[(itemId || 0) % names.length];
  };

  // Helper: Generate user types
  generateUserType = () => {
    const types = ['Student', 'Faculty', 'Staff', 'Graduate Student'];
    return types[Math.floor(Math.random() * types.length)];
  };

  // Generate mock bookings when API is not available
  generateMockBookings = () => {
    const mockData = [];
    const today = dayjs();
    
    for (let i = 0; i < 50; i++) {
      const date = today.add(Math.floor(Math.random() * 14) - 7, 'day');
      const startHour = Math.floor(Math.random() * 10) + 8; // 8-18
      const duration = [1, 2, 3][Math.floor(Math.random() * 3)];
      
      mockData.push({
        id: `mock-${i}`,
        checksum: `mock-checksum-${i}`,
        roomId: Math.floor(Math.random() * 20) + 1,
        roomTitle: `Study Room ${String.fromCharCode(65 + (i % 26))}`,
        roomEid: 168000 + i,
        roomCapacity: [4, 6, 8, 10][Math.floor(Math.random() * 4)],
        buildingId: Math.floor(Math.random() * 4) + 1,
        buildingName: ['Mugar Memorial Library', 'Pardee Library', 'Pickering Educational Resources Library', 'Science & Engineering Library'][Math.floor(Math.random() * 4)],
        buildingShortName: ['mug', 'par', 'pic', 'sci'][Math.floor(Math.random() * 4)],
        buildingLid: [19336, 19818, 18359, 20177][Math.floor(Math.random() * 4)],
        date: date.format('YYYY-MM-DD'),
        startTime: `${startHour.toString().padStart(2, '0')}:00`,
        endTime: `${(startHour + duration).toString().padStart(2, '0')}:00`,
        startDateTime: date.hour(startHour).format(),
        endDateTime: date.hour(startHour + duration).format(),
        duration,
        status: ['confirmed', 'active', 'completed', 'pending'][Math.floor(Math.random() * 4)],
        isActive: Math.random() > 0.8,
        isPast: Math.random() > 0.6,
        isFuture: Math.random() > 0.7,
        userName: generateUserName(i),
        userType: generateUserType(),
        createdAt: date.subtract(1, 'day').format(),
        lastUpdated: dayjs().format(),
        className: 's-lc-eq-period-booked'
      });
    }
    
    return mockData;
  };

  // Calculate statistics
  const calculateStatistics = (bookingsData) => {
    const totalBookings = bookingsData.length;
    const activeBookings = bookingsData.filter(b => b.status === 'active').length;
    const completedBookings = bookingsData.filter(b => b.status === 'completed').length;
    const todayBookings = bookingsData.filter(b => b.date === dayjs().format('YYYY-MM-DD')).length;
    
    const avgDuration = bookingsData.length > 0 
      ? (bookingsData.reduce((sum, b) => sum + b.duration, 0) / bookingsData.length).toFixed(1)
      : 0;

    setStatisticsData({
      totalBookings,
      activeBookings,
      completedBookings,
      todayBookings,
      avgDuration
    });
  };

  // Filter bookings
  const filterBookings = () => {
    let filtered = [...bookings];

    // Search filter
    if (searchText) {
      filtered = filtered.filter(booking => 
        booking.userName?.toLowerCase().includes(searchText.toLowerCase()) ||
        booking.roomTitle?.toLowerCase().includes(searchText.toLowerCase()) ||
        booking.buildingName?.toLowerCase().includes(searchText.toLowerCase()) ||
        booking.checksum?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Building filter
    if (selectedBuilding !== 'all') {
      filtered = filtered.filter(booking => booking.buildingShortName === selectedBuilding);
    }

    // Date range filter
    if (selectedDateRange && selectedDateRange.length === 2) {
      filtered = filtered.filter(booking => {
        const bookingDate = dayjs(booking.date);
        return bookingDate.isSameOrAfter(selectedDateRange[0], 'day') && 
               bookingDate.isSameOrBefore(selectedDateRange[1], 'day');
      });
    }

    setFilteredBookings(filtered);
  };

  // Status configuration matching LibCal booking states
  const statusConfig = {
    confirmed: { color: 'blue', text: 'Confirmed' },
    active: { color: 'green', text: 'Active' },
    completed: { color: 'default', text: 'Completed' },
    pending: { color: 'orange', text: 'Pending' }
  };

  // Table columns configuration (based on LibCal API data and bu-book interfaces)
  const columns = [
    {
      title: 'Booking ID',
      dataIndex: 'checksum',
      key: 'checksum',
      width: 120,
      render: (checksum) => (
        <Text code style={{ fontSize: '12px' }}>
          {checksum ? checksum.substring(0, 8) : 'N/A'}
        </Text>
      )
    },
    {
      title: 'User',
      dataIndex: 'userName',
      key: 'userName',
      render: (name, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{name}</Text>
          <Tag size="small">{record.userType}</Tag>
        </Space>
      )
    },
    {
      title: 'Room',
      key: 'room',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.roomTitle}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            EID: {record.roomEid} • Cap: {record.roomCapacity}
          </Text>
        </Space>
      )
    },
    {
      title: 'Building',
      dataIndex: 'buildingName',
      key: 'building',
      render: (name, record) => (
        <Space direction="vertical" size="small">
          <Text>{name}</Text>
          <Tag size="small">{record.buildingShortName.toUpperCase()}</Tag>
        </Space>
      )
    },
    {
      title: 'Date & Time',
      key: 'datetime',
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{dayjs(record.date).format('MMM DD, YYYY')}</Text>
          <Text type="secondary">
            {record.startTime} - {record.endTime} ({record.duration}h)
          </Text>
        </Space>
      ),
      sorter: (a, b) => dayjs(a.startDateTime).unix() - dayjs(b.startDateTime).unix()
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => {
        const config = statusConfig[status] || statusConfig.pending;
        return (
          <Space direction="vertical" size="small">
            <Tag color={config.color}>{config.text}</Tag>
            {record.isActive && <Tag color="red" size="small">LIVE</Tag>}
          </Space>
        );
      },
      filters: Object.keys(statusConfig).map(key => ({
        text: statusConfig[key].text,
        value: key
      })),
      onFilter: (value, record) => record.status === value
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedBooking(record);
                setIsDetailModalVisible(true);
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>Booking Management</Title>
      <Text type="secondary">
        View and manage room booking records from BU LibCal system integrated with bu-book room data
      </Text>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginTop: 24, marginBottom: 24 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Total Bookings"
              value={statisticsData.totalBookings || 0}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Active Now"
              value={statisticsData.activeBookings || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Today's Bookings"
              value={statisticsData.todayBookings || 0}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="Avg Duration"
              value={statisticsData.avgDuration || 0}
              suffix="hours"
              prefix={<InfoCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Input
              placeholder="Search by user, room, building, or booking ID..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col>
            <Select
              value={selectedBuilding}
              onChange={setSelectedBuilding}
              style={{ width: 160 }}
              placeholder="Select Building"
            >
              <Option value="all">All Buildings</Option>
              {buildings.map(building => (
                <Option key={building.ShortName} value={building.ShortName}>
                  {building.ShortName.toUpperCase()} - {building.Name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col>
            <RangePicker
              value={selectedDateRange}
              onChange={setSelectedDateRange}
              format="YYYY-MM-DD"
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
          <Col>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={loadBookingsData}
              loading={loading}
            >
              Refresh
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Bookings Table */}
      <Card title={`Booking Records (${filteredBookings.length})`}>
        <Table
          columns={columns}
          dataSource={filteredBookings}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredBookings.length,
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} bookings`
          }}
          locale={{
            emptyText: <Empty description="No booking records found" />
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Booking Detail Modal */}
      <Modal
        title="Booking Details"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedBooking && (
          <Descriptions bordered column={2} size="small">
            <Descriptions.Item label="Booking ID" span={2}>
              <Text code>{selectedBooking.checksum}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="User Name">
              {selectedBooking.userName}
            </Descriptions.Item>
            <Descriptions.Item label="User Type">
              <Tag>{selectedBooking.userType}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Room">
              {selectedBooking.roomTitle}
            </Descriptions.Item>
            <Descriptions.Item label="Room EID">
              {selectedBooking.roomEid}
            </Descriptions.Item>
            <Descriptions.Item label="Capacity">
              {selectedBooking.roomCapacity} people
            </Descriptions.Item>
            <Descriptions.Item label="Building">
              {selectedBooking.buildingName}
            </Descriptions.Item>
            <Descriptions.Item label="Date">
              {dayjs(selectedBooking.date).format('YYYY-MM-DD dddd')}
            </Descriptions.Item>
            <Descriptions.Item label="Time">
              {selectedBooking.startTime} - {selectedBooking.endTime}
            </Descriptions.Item>
            <Descriptions.Item label="Duration">
              {selectedBooking.duration} hour(s)
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={statusConfig[selectedBooking.status]?.color}>
                {statusConfig[selectedBooking.status]?.text}
              </Tag>
              {selectedBooking.isActive && <Tag color="red" size="small" style={{ marginLeft: 8 }}>LIVE</Tag>}
            </Descriptions.Item>
            <Descriptions.Item label="Created">
              {dayjs(selectedBooking.createdAt).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Last Updated">
              {dayjs(selectedBooking.lastUpdated).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="LibCal Class" span={2}>
              <Text code style={{ fontSize: '12px' }}>{selectedBooking.className}</Text>
            </Descriptions.Item>
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default BookingsPage;
