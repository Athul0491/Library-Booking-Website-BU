// Dashboard page - Display system overview and key metrics
import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Progress,
  Calendar,
  List,
  Avatar,
  Typography,
  Space,
  Button
} from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined
} from '@ant-design/icons';
import statsService from '../services/statsService';

const { Title, Paragraph } = Typography;

/**
 * Dashboard page component
 * Display key statistical data and recent activities of the system
 */
const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentBookings, setRecentBookings] = useState([]);
  const [popularRooms, setPopularRooms] = useState([]);

  // 组件挂载时获取Data
  useEffect(() => {
    loadDashboardData();
  }, []);

  // LoadDashboardData
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 获取StatisticsData
      const [statsData, bookingsData, roomsData] = await Promise.all([
        statsService.getOverviewStats(),
        statsService.getRecentBookings(),
        statsService.getPopularRooms()
      ]);

      setStats(statsData.data || {});
      setRecentBookings(bookingsData.data || []);
      setPopularRooms(roomsData.data || []);
    } catch (error) {
      console.error('LoadDashboardDataFailed:', error);
    } finally {
      setLoading(false);
    }
  };

  // Recent预订表格列Configuration
  const bookingColumns = [
    {
      title: 'User',
      dataIndex: 'userName',
      key: 'userName',
      render: (name) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          {name}
        </Space>
      ),
    },
    {
      title: 'Room',
      dataIndex: 'roomName',
      key: 'roomName',
    },
    {
      title: 'Time',
      dataIndex: 'timeSlot',
      key: 'timeSlot',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          confirmed: { color: 'green', text: 'CompletedConfirm' },
          pending: { color: 'orange', text: 'PendingConfirm' },
          cancelled: { color: 'red', text: 'CompletedCancel' },
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => console.log('View预订Details:', record)}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Dashboard</Title>
      <Paragraph>
        欢迎使用图书馆Booking ManagementSystem，这里是System的整体Overview和关键指标。
      </Paragraph>

      {/* Statistics卡片区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Today预订"
              value={stats.todayBookings}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#3f8600' }}
              suffix={
                <span style={{ fontSize: '14px' }}>
                  <ArrowUpOutlined /> 12%
                </span>
              }
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="ActiveUser"
              value={stats.activeUsers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
              suffix={
                <span style={{ fontSize: '14px' }}>
                  <ArrowUpOutlined /> 8%
                </span>
              }
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Available Rooms"
              value={stats.availableRooms}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#52c41a' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Usage Rate"
              value={stats.utilizationRate}
              prefix={<ClockCircleOutlined />}
              suffix="%"
              valueStyle={{ color: '#faad14' }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Recent Bookings List */}
        <Col xs={24} lg={14}>
          <Card title="Recent Bookings" extra={<Button type="link">View All</Button>}>
            <Table
              columns={bookingColumns}
              dataSource={recentBookings}
              loading={loading}
              pagination={false}
              size="small"
              rowKey="id"
            />
          </Card>
        </Col>

        {/* PopularRoom和使用Rate */}
        <Col xs={24} lg={10}>
          <Card title="PopularRoom" style={{ marginBottom: 16 }}>
            <List
              loading={loading}
              dataSource={popularRooms}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.name}
                    description={`Today预订 ${item.bookings} 次`}
                  />
                  <Progress 
                    percent={item.usageRate} 
                    size="small" 
                    status={item.usageRate > 80 ? 'exception' : 'active'}
                  />
                </List.Item>
              )}
            />
          </Card>

          {/* 快速Actions区域 */}
          <Card title="快速Actions">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" block onClick={() => console.log('Add New预订')}>
                Add New预订
              </Button>
              <Button block onClick={() => console.log('RoomManagement')}>
                RoomManagement
              </Button>
              <Button block onClick={() => console.log('ExportReport')}>
                ExportReport
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
