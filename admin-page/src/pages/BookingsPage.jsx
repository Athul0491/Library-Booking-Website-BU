// 预订管理页面 - 查看和管理所有预订记录
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
 * 预订管理页面组件
 * 提供预订记录的查看、搜索、筛选和状态管理功能
 */
const BookingsPage = () => {
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [searchForm] = Form.useForm();
  const [summary, setSummary] = useState({});

  // 状态选项
  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'pending', label: '待确认' },
    { value: 'confirmed', label: '已确认' },
    { value: 'cancelled', label: '已取消' },
    { value: 'completed', label: '已完成' },
    { value: 'no-show', label: '未到场' }
  ];

  // 组件挂载时加载数据
  useEffect(() => {
    loadBookings();
  }, []);

  // 加载预订数据
  const loadBookings = async (params = {}) => {
    try {
      setLoading(true);
      const response = await bookingService.getBookings(params);
      
      if (response.success) {
        setBookings(response.data.list);
        setFilteredBookings(response.data.list);
        setSummary(response.data.summary);
      } else {
        message.error('加载预订数据失败');
      }
    } catch (error) {
      console.error('加载预订数据失败:', error);
      message.error('加载预订数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 搜索处理
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

  // 重置搜索
  const handleReset = () => {
    searchForm.resetFields();
    loadBookings();
  };

  // 查看预订详情
  const viewBookingDetail = async (record) => {
    try {
      const response = await bookingService.getBookingById(record.id);
      if (response.success) {
        setSelectedBooking(response.data);
        setDetailModalVisible(true);
      } else {
        message.error('获取预订详情失败');
      }
    } catch (error) {
      console.error('获取预订详情失败:', error);
      message.error('获取预订详情失败');
    }
  };

  // 更新预订状态
  const updateBookingStatus = async (bookingId, status) => {
    try {
      const response = await bookingService.updateBookingStatus(bookingId, status);
      if (response.success) {
        message.success(response.message);
        loadBookings(); // 重新加载数据
      } else {
        message.error(response.message);
      }
    } catch (error) {
      console.error('更新预订状态失败:', error);
      message.error('更新预订状态失败');
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
      console.error('签到失败:', error);
      message.error('签到失败');
    }
  };

  // 取消预订
  const handleCancel = async (bookingId) => {
    try {
      const response = await bookingService.cancelBooking(bookingId, '管理员取消');
      if (response.success) {
        message.success(response.message);
        loadBookings();
      } else {
        message.error(response.message);
      }
    } catch (error) {
      console.error('取消预订失败:', error);
      message.error('取消预订失败');
    }
  };

  // 获取状态标签
  const getStatusTag = (status) => {
    const statusConfig = {
      pending: { color: 'orange', text: '待确认' },
      confirmed: { color: 'blue', text: '已确认' },
      cancelled: { color: 'red', text: '已取消' },
      completed: { color: 'green', text: '已完成' },
      'no-show': { color: 'default', text: '未到场' }
    };
    
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // 表格列配置
  const columns = [
    {
      title: '预订编号',
      dataIndex: 'bookingNumber',
      key: 'bookingNumber',
      width: 120,
    },
    {
      title: '用户姓名',
      dataIndex: 'userName',
      key: 'userName',
      width: 100,
    },
    {
      title: '房间',
      dataIndex: 'locationName',
      key: 'locationName',
      width: 120,
    },
    {
      title: '预订日期',
      dataIndex: 'date',
      key: 'date',
      width: 110,
      render: (date) => dayjs(date).format('MM-DD'),
    },
    {
      title: '时间段',
      key: 'timeSlot',
      width: 140,
      render: (_, record) => `${record.startTime} - ${record.endTime}`,
    },
    {
      title: '状态',
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
      render: (checkedIn) => checkedIn ? <Tag color="green">已签到</Tag> : <Tag>未签到</Tag>,
    },
    {
      title: '操作',
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
            详情
          </Button>
          
          {record.status === 'pending' && (
            <Button
              type="link"
              size="small"
              icon={<CheckOutlined />}
              onClick={() => updateBookingStatus(record.id, 'confirmed')}
            >
              确认
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
              title="确定要取消这个预订吗？"
              onConfirm={() => handleCancel(record.id)}
              okText="确定"
              cancelText="取消"
            >
              <Button
                type="link"
                size="small"
                icon={<CloseOutlined />}
                danger
              >
                取消
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>预订管理</Title>
      <Paragraph>
        管理所有的房间预订记录，包括确认预订、处理取消和查看详细信息。
      </Paragraph>

      {/* 统计概览 */}
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
              title="已确认"
              value={summary.confirmedCount || 0}
              prefix="✅"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="待确认"
              value={summary.pendingCount || 0}
              prefix="⏳"
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总收入"
              value={summary.totalRevenue || 0}
              prefix="¥"
              precision={0}
            />
          </Card>
        </Col>
      </Row>

      {/* 搜索表单 */}
      <Card style={{ marginBottom: 16 }}>
        <Form
          form={searchForm}
          layout="inline"
          onFinish={handleSearch}
          style={{ gap: 16 }}
        >
          <Form.Item name="keyword" style={{ minWidth: 200 }}>
            <Input
              placeholder="搜索预订编号、用户名或房间"
              prefix={<SearchOutlined />}
            />
          </Form.Item>
          
          <Form.Item name="status">
            <Select placeholder="选择状态" style={{ width: 120 }}>
              {statusOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="dateRange">
            <RangePicker placeholder={['开始日期', '结束日期']} />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                搜索
              </Button>
              <Button onClick={handleReset}>
                重置
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => loadBookings()}>
                刷新
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* 预订列表 */}
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

      {/* 预订详情模态框 */}
      <Modal
        title="预订详情"
        visible={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
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
                <strong>状态：</strong>{getStatusTag(selectedBooking.status)}
              </Col>
              <Col span={12}>
                <strong>用户姓名：</strong>{selectedBooking.userName}
              </Col>
              <Col span={12}>
                <strong>联系邮箱：</strong>{selectedBooking.userEmail}
              </Col>
              <Col span={12}>
                <strong>联系电话：</strong>{selectedBooking.userPhone}
              </Col>
              <Col span={12}>
                <strong>房间：</strong>{selectedBooking.locationName}
              </Col>
              <Col span={12}>
                <strong>预订日期：</strong>{selectedBooking.date}
              </Col>
              <Col span={12}>
                <strong>时间段：</strong>{selectedBooking.startTime} - {selectedBooking.endTime}
              </Col>
              <Col span={12}>
                <strong>时长：</strong>{selectedBooking.duration} 小时
              </Col>
              <Col span={12}>
                <strong>人数：</strong>{selectedBooking.participants} 人
              </Col>
              <Col span={12}>
                <strong>金额：</strong>¥{selectedBooking.price}
              </Col>
              <Col span={12}>
                <strong>签到状态：</strong>
                {selectedBooking.checkedIn ? (
                  <Tag color="green">已签到 ({selectedBooking.checkedInTime})</Tag>
                ) : (
                  <Tag>未签到</Tag>
                )}
              </Col>
              <Col span={24}>
                <strong>预订用途：</strong>{selectedBooking.purpose}
              </Col>
              {selectedBooking.notes && (
                <Col span={24}>
                  <strong>备注：</strong>{selectedBooking.notes}
                </Col>
              )}
              <Col span={12}>
                <strong>创建时间：</strong>{dayjs(selectedBooking.createdAt).format('YYYY-MM-DD HH:mm')}
              </Col>
              <Col span={12}>
                <strong>更新时间：</strong>{dayjs(selectedBooking.updatedAt).format('YYYY-MM-DD HH:mm')}
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default BookingsPage;
