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
  Typography
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  CalendarOutlined,
  UserOutlined,
  HomeOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import bookingService from '../services/bookingService';

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Title } = Typography;

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();

  // Check In
  const handleCheckIn = async (bookingId) => {
    try {
      const response = await bookingService.checkIn(bookingId);
      if (response.success) {
        message.success('Check-in successful');
        fetchBookings();
      } else {
        message.error(response.message || 'Check-in failed');
      }
    } catch (error) {
      message.error('Check-in failed');
    }
  };

  // Check Out
  const handleCheckOut = async (bookingId) => {
    try {
      const response = await bookingService.checkOut(bookingId);
      if (response.success) {
        message.success('Check-out successful');
        fetchBookings();
      } else {
        message.error(response.message || 'Check-out failed');
      }
    } catch (error) {
      message.error('Check-out failed');
    }
  };

  // Load booking data using unified booking service
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getBookings({
        page: 1,
        pageSize: 100, // Get more records for the page
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        dateRange: selectedDateRange,
        keyword: searchText
      });
      
      if (response.success) {
        setBookings(response.data.list || []);
        setFilteredBookings(response.data.list || []);
        
        if (response.isMockData) {
          message.warning('Using mock data - connect Supabase for real booking data');
        } else {
          message.success('Booking data loaded from real data sources');
        }
      } else {
        message.error('Failed to load booking data');
        setBookings([]);
        setFilteredBookings([]);
      }
    } catch (error) {
      console.error('Load booking data failed:', error);
      message.error('Failed to load booking data');
      setBookings([]);
      setFilteredBookings([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings
  const filterBookings = () => {
    let filtered = [...bookings];

    // Search filter
    if (searchText) {
      filtered = filtered.filter(booking => 
        booking.guestName?.toLowerCase().includes(searchText.toLowerCase()) ||
        booking.roomNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
        booking.bookingId?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(booking => booking.status === selectedStatus);
    }

    // Date range filter
    if (selectedDateRange && selectedDateRange.length === 2) {
      filtered = filtered.filter(booking => {
        const bookingDate = new Date(booking.bookingDate);
        return bookingDate >= selectedDateRange[0].toDate() && 
               bookingDate <= selectedDateRange[1].toDate();
      });
    }

    setFilteredBookings(filtered);
  };

  // Status configuration
  const statusConfig = {
    'confirmed': { color: 'green', text: 'Confirmed' },
    'pending': { color: 'orange', text: 'Pending' },
    'cancelled': { color: 'red', text: 'Cancelled' },
    'completed': { color: 'blue', text: 'Completed' },
    'checked-in': { color: 'purple', text: 'Checked In' },
    'checked-out': { color: 'gray', text: 'Checked Out' }
  };

  // Status filter options
  const statusFilterOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'pending', label: 'Pending' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'completed', label: 'Completed' },
    { value: 'checked-in', label: 'Checked In' },
    { value: 'checked-out', label: 'Checked Out' }
  ];

  // Get status tag
  const getStatusTag = (status) => {
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // Table columns
  const columns = [
    {
      title: 'Booking ID',
      dataIndex: 'bookingId',
      key: 'bookingId',
      sorter: (a, b) => a.bookingId.localeCompare(b.bookingId),
      render: (text) => <span style={{ fontFamily: 'monospace' }}>{text}</span>
    },
    {
      title: 'Guest Name',
      dataIndex: 'guestName',
      key: 'guestName',
      sorter: (a, b) => a.guestName.localeCompare(b.guestName),
      render: (text) => (
        <Space>
          <UserOutlined />
          {text}
        </Space>
      )
    },
    {
      title: 'Room Number',
      dataIndex: 'roomNumber',
      key: 'roomNumber',
      sorter: (a, b) => a.roomNumber.localeCompare(b.roomNumber)
    },
    {
      title: 'Booking Date',
      dataIndex: 'bookingDate',
      key: 'bookingDate',
      sorter: (a, b) => new Date(a.bookingDate) - new Date(b.bookingDate),
      render: (date) => (
        <Space>
          <CalendarOutlined />
          {new Date(date).toLocaleDateString()}
        </Space>
      )
    },
    {
      title: 'Time Slot',
      dataIndex: 'timeSlot',
      key: 'timeSlot',
      render: (timeSlot) => `${timeSlot.start} - ${timeSlot.end}`
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: statusFilterOptions.slice(1).map(option => ({
        text: option.label,
        value: option.value
      })),
      onFilter: (value, record) => record.status === value,
      render: getStatusTag
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => viewBookingDetails(record)}
          >
            View Details
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => editBooking(record)}
          >
            Edit
          </Button>
          {record.status === 'confirmed' && (
            <Button 
              type="link" 
              icon={<CheckOutlined />} 
              onClick={() => handleCheckIn(record.bookingId)}
            >
              Check In
            </Button>
          )}
          {record.status === 'checked-in' && (
            <Button 
              type="link" 
              icon={<CloseOutlined />} 
              onClick={() => handleCheckOut(record.bookingId)}
            >
              Check Out
            </Button>
          )}
          <Popconfirm
            title="Are you sure you want to cancel this booking?"
            onConfirm={() => cancelBooking(record.bookingId)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger>
              Cancel
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  // View booking details
  const viewBookingDetails = (booking) => {
    setSelectedBooking(booking);
    setIsDetailModalVisible(true);
  };

  // Edit booking
  const editBooking = (booking) => {
    setSelectedBooking(booking);
    editForm.setFieldsValue(booking);
    setIsEditModalVisible(true);
  };

  // Cancel booking
  const cancelBooking = async (bookingId) => {
    try {
      const response = await bookingService.cancelBooking(bookingId);
      if (response.success) {
        message.success('Booking cancelled successfully');
        fetchBookings();
      } else {
        message.error(response.message || 'Failed to cancel booking');
      }
    } catch (error) {
      message.error('Failed to cancel booking');
    }
  };

  // Save booking changes
  const saveBookingChanges = async (values) => {
    try {
      const response = await bookingService.updateBooking(selectedBooking.bookingId, values);
      if (response.success) {
        message.success('Booking updated successfully');
        setIsEditModalVisible(false);
        fetchBookings();
      } else {
        message.error(response.message || 'Failed to update booking');
      }
    } catch (error) {
      message.error('Failed to update booking');
    }
  };

  // Calculate statistics
  const getStatistics = () => {
    const total = bookings.length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    const completed = bookings.filter(b => b.status === 'completed').length;

    return { total, confirmed, pending, cancelled, completed };
  };

  const stats = getStatistics();

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    filterBookings();
  }, [searchText, selectedStatus, selectedDateRange, bookings]);

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>Booking Management</Title>
      
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}>
          <Card>
            <Statistic
              title="Total Bookings"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Confirmed"
              value={stats.confirmed}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pending}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Cancelled"
              value={stats.cancelled}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col span={4}>
          <Card>
            <Statistic
              title="Completed"
              value={stats.completed}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 24 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Input
              placeholder="Search by guest name, room number, or booking ID"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={6}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by status"
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={statusFilterOptions}
            />
          </Col>
          <Col span={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={selectedDateRange}
              onChange={setSelectedDateRange}
              placeholder={['Start Date', 'End Date']}
            />
          </Col>
          <Col span={4}>
            <Space>
              <Button 
                type="primary" 
                icon={<ReloadOutlined />} 
                onClick={fetchBookings}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Bookings Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredBookings}
          rowKey="bookingId"
          loading={loading}
          pagination={{
            total: filteredBookings.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} bookings`
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* Booking Details Modal */}
      <Modal
        title="Booking Details"
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedBooking && (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <p><strong>Booking ID:</strong> {selectedBooking.bookingId}</p>
                <p><strong>Guest Name:</strong> {selectedBooking.guestName}</p>
                <p><strong>Room Number:</strong> {selectedBooking.roomNumber}</p>
                <p><strong>Status:</strong> {getStatusTag(selectedBooking.status)}</p>
              </Col>
              <Col span={12}>
                <p><strong>Booking Date:</strong> {new Date(selectedBooking.bookingDate).toLocaleDateString()}</p>
                <p><strong>Time Slot:</strong> {selectedBooking.timeSlot?.start} - {selectedBooking.timeSlot?.end}</p>
                <p><strong>Guest Count:</strong> {selectedBooking.guestCount || 1}</p>
                <p><strong>Contact:</strong> {selectedBooking.contactInfo}</p>
              </Col>
            </Row>
            {selectedBooking.notes && (
              <div>
                <p><strong>Notes:</strong></p>
                <p>{selectedBooking.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit Booking Modal */}
      <Modal
        title="Edit Booking"
        open={isEditModalVisible}
        onCancel={() => setIsEditModalVisible(false)}
        onOk={() => editForm.submit()}
        width={800}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={saveBookingChanges}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="guestName"
                label="Guest Name"
                rules={[{ required: true, message: 'Please enter guest name' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="roomNumber"
                label="Room Number"
                rules={[{ required: true, message: 'Please enter room number' }]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select options={statusFilterOptions.slice(1)} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="guestCount"
                label="Guest Count"
              >
                <Input type="number" min={1} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item
            name="contactInfo"
            label="Contact Information"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BookingsPage;
