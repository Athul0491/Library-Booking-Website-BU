// Booking Management页面 - View和Management所有预订记录
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
  SearchOutlined,
  ReloadOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import bookingService from '../services/bookingService';

const { Title, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

/**
 * Booking Management页面组件
 * 提供预订记录的View、Search、Filter和StatusManagement功能
 */
const BookingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [searchForm] = Form.useForm();
  const [summary, setSummary] = useState({});

  // Status选项
  const statusOptions = [
    { value: 'all', label: '全部Status' },
    { value: 'pending', label: 'PendingConfirm' },
    { value: 'confirmed', label: 'CompletedConfirm' },
    { value: 'cancelled', label: 'CompletedCancel' },
    { value: 'completed', label: 'Completed' },
    { value: 'no-show', label: 'No Show' }
  ];

  // 组件挂载时LoadData
  useEffect(() => {
    loadBookings();
  }, []);

  // Load预订Data
  const loadBookings = async (params = {}) => {
    try {
      setLoading(true);
      const response = await bookingService.getBookings(params);
      
      if (response.success) {
        setBookings(response.data.list);
        setFilteredBookings(response.data.list);
        setSummary(response.data.summary);
      } else {
        message.error('Load预订DataFailed');
      }
    } catch (error) {
      console.error('Load预订DataFailed:', error);
      message.error('Load预订DataFailed');
    } finally {
      setLoading(false);
    }
  };

  // Search处理
  const handleSearch = async (values) => {
    const params = {};
    
    if (values.status && values.status !== 'all') {
      params.status = values.status;
    }
    
    if (values.dateRange && values.dateRange.length === 2) {
      params.dateRange = values.dateRange;
    }
    
    if (values.keyword) {
      params.keyword = values.keyword;
    }

    await loadBookings(params);
  };

  // ResetSearch
  const handleReset = () => {
    searchForm.resetFields();
    loadBookings();
  };

  // View预订Details
  const viewBookingDetail = async (record) => {
    try {
      const response = await bookingService.getBookingById(record.id);
      if (response.success) {
        setSelectedBooking(response.data);
        setDetailModalVisible(true);
      } else {
        message.error('获取预订DetailsFailed');
      }
    } catch (error) {
      console.error('获取预订DetailsFailed:', error);
      message.error('获取预订DetailsFailed');
    }
  };

  // 更新预订Status
  const updateBookingStatus = async (bookingId, status) => {
    try {
      const response = await bookingService.updateBookingStatus(bookingId, status);
      if (response.success) {
        message.success(response.message);
        loadBookings(); // 重新LoadData
      } else {
        message.error(response.message);
      }
    } catch (error) {
      console.error('更新预订StatusFailed:', error);
      message.error('更新预订StatusFailed');
    }
  };

  // 签到
  const handleCheckIn = async (bookingId) => {
    try {
      const response = await bookingService.checkIn(bookingId);
      if (response.success) {
        message.success(response.message);
        loadBookings();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      console.error('签到Failed:', error);
      message.error('签到Failed');
    }
  };

  // Cancel预订
  const handleCancel = async (bookingId) => {
    try {
      const response = await bookingService.cancelBooking(bookingId, 'Management员Cancel');
      if (response.success) {
        message.success(response.message);
        loadBookings();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      console.error('Cancel预订Failed:', error);
      message.error('Cancel预订Failed');
    }
  };

  // 获取Status标签
  const getStatusTag = (status) => {
    const statusConfig = {
      pending: { color: 'orange', text: 'PendingConfirm' },
      confirmed: { color: 'blue', text: 'CompletedConfirm' },
      cancelled: { color: 'red', text: 'CompletedCancel' },
      completed: { color: 'green', text: 'Completed' },
      'no-show': { color: 'default', text: 'No Show' }
    };
    
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列Configuration
  const columns = [
    {
      title: '预订编号',
      dataIndex: 'bookingNumber',
      key: 'bookingNumber',
      width: 120,
    },
    {
      title: 'User姓名',
      dataIndex: 'userName',
      key: 'userName',
      width: 100,
    },
    {
      title: 'Room',
      dataIndex: 'locationName',
      key: 'locationName',
      width: 120,
    },
    {
      title: '预订Date',
      dataIndex: 'date',
      key: 'date',
      width: 110,
      render: (date) => dayjs(date).format('MM-DD'),
    },
    {
      title: 'Time段',
      key: 'timeSlot',
      width: 140,
      render: (_, record) => `${record.startTime} - ${record.endTime}`,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: getStatusTag,
    },
    {
      title: '金额',
      dataIndex: 'price',
      key: 'price',
      width: 80,
      render: (price) => `¥${price}`,
    },
    {
      title: '签到',
      dataIndex: 'checkedIn',
      key: 'checkedIn',
      width: 80,
      render: (checkedIn) => checkedIn ? <Tag color="green">Completed签到</Tag> : <Tag>Not签到</Tag>,
    },
    {
      title: 'Actions',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => viewBookingDetail(record)}
          >
            Details
          </Button>
          
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => updateBookingStatus(record.id, 'confirmed')}
            >
              Confirm
            </Button>
          )}
          
          {record.status === 'confirmed' && !record.checkedIn && (
            <Button
              type="link"
              size="small"
              onClick={() => handleCheckIn(record.id)}
            >
              签到
            </Button>
          )}
          
          {(record.status === 'pending' || record.status === 'confirmed') && (
            <Popconfirm
              title="确定要Cancel这个预订吗？"
              onConfirm={() => handleCancel(record.id)}
              okText="确定"
              cancelText="Cancel"
            >
              <Button
                type="link"
                size="small"
                icon={<CloseOutlined />}
                danger
              >
                Cancel
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Booking Management</Title>
      <Paragraph>
        Management所有的Room预订记录，包括Confirm预订、处理Cancel和View详细Information。
      </Paragraph>

      {/* StatisticsOverview */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总预订数"
              value={summary.totalRevenue ? Object.values(summary).reduce((a, b) => typeof b === 'number' ? a + b : a, 0) : 0}
              prefix="📊"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="CompletedConfirm"
              value={summary.confirmedCount || 0}
              prefix="✅"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="PendingConfirm"
              value={summary.pendingCount || 0}
              prefix="⏳"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总Revenue"
              value={summary.totalRevenue || 0}
              prefix="¥"
              precision={0}
            />
          </Card>
        </Col>
      </Row>

      {/* Search表单 */}
      <Card style={{ marginBottom: 16 }}>
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
          style={{ gap: 16 }}
        >
          <Form.Item name="keyword" style={{ minWidth: 200 }}>
            <Input
              placeholder="Search预订编号、User名或Room"
              prefix={<SearchOutlined />}
            />
          </Form.Item>
          
          <Form.Item name="status">
            <Select placeholder="选择Status" style={{ width: 120 }}>
              {statusOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="dateRange">
            <RangePicker placeholder={['StartDate', 'EndDate']} />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Search
              </Button>
              <Button onClick={handleReset}>
                Reset
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => loadBookings()}>
                Refresh
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 预订List */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredBookings}
          loading={loading}
          rowKey="id"
          pagination={{
            total: filteredBookings.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条记录`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 预订Details模态框 */}
      <Modal
        title="预订Details"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={600}
      >
        {selectedBooking && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <strong>预订编号：</strong>{selectedBooking.bookingNumber}
              </Col>
              <Col span={12}>
                <strong>Status：</strong>{getStatusTag(selectedBooking.status)}
              </Col>
              <Col span={12}>
                <strong>User姓名：</strong>{selectedBooking.userName}
              </Col>
              <Col span={12}>
                <strong>ContactEmail：</strong>{selectedBooking.userEmail}
              </Col>
              <Col span={12}>
                <strong>ContactPhone：</strong>{selectedBooking.userPhone}
              </Col>
              <Col span={12}>
                <strong>Room：</strong>{selectedBooking.locationName}
              </Col>
              <Col span={12}>
                <strong>预订Date：</strong>{selectedBooking.date}
              </Col>
              <Col span={12}>
                <strong>Time段：</strong>{selectedBooking.startTime} - {selectedBooking.endTime}
              </Col>
              <Col span={12}>
                <strong>Duration：</strong>{selectedBooking.duration} Hours
              </Col>
              <Col span={12}>
                <strong>Number of People：</strong>{selectedBooking.participants} 人
              </Col>
              <Col span={12}>
                <strong>金额：</strong>¥{selectedBooking.price}
              </Col>
              <Col span={12}>
                <strong>签到Status：</strong>
                {selectedBooking.checkedIn ? (
                  <Tag color="green">Completed签到 ({selectedBooking.checkedInTime})</Tag>
                ) : (
                  <Tag>Not签到</Tag>
                )}
              </Col>
              <Col span={24}>
                <strong>预订用途：</strong>{selectedBooking.purpose}
              </Col>
              {selectedBooking.notes && (
                <Col span={24}>
                  <strong>Notes：</strong>{selectedBooking.notes}
                </Col>
              )}
              <Col span={12}>
                <strong>创建Time：</strong>{dayjs(selectedBooking.createdAt).format('YYYY-MM-DD HH:mm')}
              </Col>
              <Col span={12}>
                <strong>更新Time：</strong>{dayjs(selectedBooking.updatedAt).format('YYYY-MM-DD HH:mm')}
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookingsPage;
