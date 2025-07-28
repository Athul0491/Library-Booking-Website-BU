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

  // Load data when component mounts
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load Dashboard Data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get Statistics Data
      const [statsData, bookingsData, roomsData] = await Promise.all([
        statsService.getOverviewStats(),
        statsService.getRecentBookings(),
        statsService.getPopularRooms()
      ]);

      setStats(statsData.data || {});
      setRecentBookings(bookingsData.data || []);
      setPopularRooms(roomsData.data || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Recent booking table column configuration
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
          confirmed: { color: 'green', text: 'Confirmed' },
          pending: { color: 'orange', text: 'Pending' },
          cancelled: { color: 'red', text: 'Cancelled' },
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
          onClick={() => console.log('View Booking Details:', record)}
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
        Welcome to the Library Booking Management System. Here you can find system overview and key metrics.
      </Paragraph>

      {/* Statistics card area */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Today's Bookings"
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
              title="Active User"
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

        {/* Popular Rooms and Usage Rate */}
        <Col xs={24} lg={10}>
          <Card title="Popular Rooms" style={{ marginBottom: 16 }}>
            <List
              loading={loading}
              dataSource={popularRooms}
              locale={{ emptyText: 'No data available' }}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.name}
                    description={`Today's bookings: ${item.bookings} times`}
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

          {/* Quick Actions area */}
          <Card title="Quick Actions">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" block onClick={() => console.log('Add New Booking')}>
                Add New Booking
              </Button>
              <Button block onClick={() => console.log('Room Management')}>
                Room Management
              </Button>
              <Button block onClick={() => console.log('Export Report')}>
                Export Report
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
