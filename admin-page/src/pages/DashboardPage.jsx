// Dashboard page - Real-time overview of bu-book and bub-backend system
import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Progress,
  List,
  Avatar,
  Typography,
  Space,
  Button,
  Alert,
  Descriptions,
  Timeline,
  Tooltip
} from 'antd';
import {
  UserOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EyeOutlined,
  HomeOutlined,
  TeamOutlined,
  LinkOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ApiOutlined,
  DatabaseOutlined
} from '@ant-design/icons';
import statsService from '../services/statsService';
import locationService from '../services/locationService';
import bookingService from '../services/bookingService';
import { useConnection } from '../contexts/ConnectionContext';
import { useDataSource } from '../contexts/DataSourceContext';
import { 
  ConnectionStatus, 
  TableSkeleton, 
  DataUnavailablePlaceholder,
  PageLoadingSkeleton 
} from '../components/SkeletonComponents';

const { Title, Paragraph } = Typography;

/**
 * Dashboard page component
 * Real-time overview of Library Booking System integrating:
 * - bu-book: Building and Room data from Supabase
 * - bub-backend: LibCal availability API proxy
 * - System health and statistics monitoring
 */
const DashboardPage = () => {
  const connection = useConnection();
  const { useRealData } = useDataSource();
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState({});
  const [buildingStats, setBuildingStats] = useState({});
  const [bookingStats, setBookingStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [dataError, setDataError] = useState(null);

  // Load data when component mounts and connection is available
  useEffect(() => {
    if (connection.isDataAvailable) {
      loadDashboardData();
      // Refresh data every 30 seconds
      const interval = setInterval(loadDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [connection.isDataAvailable, useRealData]);

  // Load comprehensive dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setDataError(null);
      
      // Use real data or mock data based on DataSource context
      const options = { forceUseMockData: !useRealData };
      
      // Parallel data loading for better performance
      const [
        statsResult,
        buildingsResult,
        bookingsResult
      ] = await Promise.all([
        statsService.getStatistics(options),
        locationService.getBuildingStats(),
        bookingService.getBookingStats()
      ]);

      // Handle statistics data
      if (statsResult.success) {
        setSystemStats(statsResult.data?.statsData || {});
      } else if (useRealData) {
        throw new Error(`Failed to load statistics: ${statsResult.error}`);
      }

      // Handle building data
      if (buildingsResult.success) {
        setBuildingStats(buildingsResult.data || {});
      } else if (useRealData) {
        console.warn('Failed to load building statistics:', buildingsResult.error);
      }

      // Handle booking data
      if (bookingsResult.success) {
        setBookingStats(bookingsResult.data || {});
        setRecentActivity(bookingsResult.data?.bookings?.slice(0, 5) || []);
      } else if (useRealData) {
        console.warn('Failed to load booking statistics:', bookingsResult.error);
      }
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      if (useRealData) {
        setDataError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Recent activity table columns (updated for new database schema)
  const activityColumns = [
    {
      title: 'Activity Type',
      key: 'type',
      render: (_, record) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
            <CalendarOutlined />
          </Avatar>
          <span>Booking</span>
        </Space>
      ),
    },
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div>
          <strong>{record.user_name || 'Unknown User'}</strong>
          <div style={{ color: '#666', fontSize: '12px' }}>
            {record.user_email}
          </div>
        </div>
      ),
    },
    {
      title: 'Room & Building',
      key: 'location',
      render: (_, record) => (
        <div>
          <strong>{record.room_name || 'N/A'}</strong>
          <div style={{ color: '#666', fontSize: '12px' }}>
            <EnvironmentOutlined style={{ marginRight: 4 }} />
            {record.building_name}
          </div>
        </div>
      ),
    },
    {
      title: 'Date & Time',
      key: 'datetime',
      render: (_, record) => (
        <div>
          <div>
            <CalendarOutlined style={{ marginRight: 4 }} />
            {record.booking_date}
          </div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            {record.start_time} - {record.end_time}
          </div>
        </div>
      )
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
          active: { color: 'blue', text: 'Active' }
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: 'Booking Reference',
      dataIndex: 'booking_reference',
      key: 'booking_reference',
      render: (ref) => (
        <code style={{ fontSize: '12px', color: '#666' }}>
          {ref}
        </code>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>System Dashboard</Title>
      <Paragraph>
        Real-time monitoring of Library Booking System - bu-book frontend, bub-backend API, and Supabase database integration.
      </Paragraph>

      {/* Connection Status */}
      <ConnectionStatus connection={connection} style={{ marginBottom: 24 }} />

      {/* Show appropriate content based on connection status */}
      {!connection.isDataAvailable ? (
        <DataUnavailablePlaceholder 
          title="Dashboard Data Unavailable"
          description="Dashboard requires active connections to display real-time system statistics and monitoring data."
        />
      ) : loading ? (
        <PageLoadingSkeleton />
      ) : (
        <>
          {/* System Status Alert */}
          <Alert
            message={`Backend API Status: ${connectionStatus}`}
            description={
              connectionStatus === 'connected' 
                ? 'bub-backend is connected and functioning normally.'
                : connectionStatus === 'disconnected'
                ? 'bub-backend API is not responding. Please check if the server is running on localhost:5000.'
                : 'Error connecting to bub-backend API.'
            }
            type={connectionStatus === 'connected' ? 'success' : 'warning'}
            style={{ marginBottom: 24 }}
            showIcon
          />

          {/* Key Metrics Row */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Buildings"
                  value={systemStats.total_buildings || 0}
                  prefix={<HomeOutlined />}
                  suffix="buildings"
                />
                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                  {systemStats.active_buildings || 0} active
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Rooms"
                  value={systemStats.total_rooms || 0}
                  prefix={<TeamOutlined />}
                  suffix="rooms"
                />
                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                  {systemStats.available_rooms || 0} available
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Bookings"
                  value={systemStats.total_bookings || 0}
                  prefix={<CalendarOutlined />}
                  suffix="bookings"
                />
                <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
                  {systemStats.active_bookings || 0} active today
                </div>
              </Card>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="API Health Score"
                  value={systemStats.api_health_score || 0}
                  precision={0}
                  suffix="%"
                  prefix={<ApiOutlined />}
                />
                <div style={{ marginTop: 8, fontSize: '12px', color: connectionStatus === 'connected' ? '#52c41a' : '#ff4d4f' }}>
                  Status: {connectionStatus}
                </div>
              </Card>
            </Col>
          </Row>

          {/* Detailed Analytics Row */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card 
                title={
                  <Space>
                    <DatabaseOutlined />
                    <span>Building & Room Analytics</span>
                  </Space>
                }
                loading={loading}
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Buildings with Rooms">
                    {systemStats.buildings_with_rooms || 0} / {systemStats.total_buildings || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="Room Availability Rate">
                    <Progress 
                      percent={
                        systemStats.total_rooms 
                          ? Math.round((systemStats.available_rooms / systemStats.total_rooms) * 100)
                          : 0
                      } 
                      size="small" 
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="Building Availability Rate">
                    <Progress 
                      percent={
                        systemStats.total_buildings
                          ? Math.round((systemStats.active_buildings / systemStats.total_buildings) * 100)
                          : 0
                      } 
                      size="small" 
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="Average Rooms per Building">
                    {systemStats.average_rooms_per_building || 0}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card 
                title={
                  <Space>
                    <CalendarOutlined />
                    <span>Booking Analytics</span>
                  </Space>
                }
                loading={loading}
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Booking Status">
                    <Tag 
                      color={systemStats.total_bookings > 0 ? 'green' : 'orange'}
                      icon={systemStats.total_bookings > 0 ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                    >
                      {systemStats.total_bookings > 0 ? 'ACTIVE' : 'NO BOOKINGS'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Active Bookings Today">
                    {systemStats.active_bookings || 0} / {systemStats.total_bookings || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="Booking Rate">
                    <Progress 
                      percent={
                        systemStats.total_rooms 
                          ? Math.round((systemStats.active_bookings / systemStats.total_rooms) * 100)
                          : 0
                      } 
                      size="small" 
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="System Health">
                    <Progress 
                      percent={systemStats.api_health_score || 0}
                      size="small"
                      status={systemStats.api_health_score > 80 ? 'success' : systemStats.api_health_score > 50 ? 'normal' : 'exception'}
                    />
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            </Col>
          </Row>

      {/* Recent Activity Table */}
      <Card 
        title={
          <Space>
            <CalendarOutlined />
            <span>Recent Activity</span>
          </Space>
        }
        style={{ marginTop: 24 }}
        extra={
          <Button 
            type="primary" 
            icon={<EyeOutlined />}
            onClick={loadDashboardData}
          >
            Refresh
          </Button>
        }
      >
        <Table
          columns={activityColumns}
          dataSource={recentActivity}
          loading={loading}
          rowKey={(record) => record.id || record.checksum || Math.random()}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showQuickJumper: true,
            showTotal: (total) => `Total ${total} activities`
          }}
          scroll={{ x: 800 }}
        />
      </Card>

      {/* System Integration Status Footer */}
      <Card 
        title="System Integration Status" 
        style={{ marginTop: 24 }}
        size="small"
      >
        <Timeline
          items={[
            {
              color: connection.database ? 'green' : 'red',
              children: (
                <div>
                  <strong>Database Connection</strong> - PostgreSQL database with booking data
                  <br />
                  <span style={{ color: '#666' }}>
                    Status: {connection.database ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              ),
            },
            {
              color: connection.backend ? 'green' : 'red',
              children: (
                <div>
                  <strong>bub-backend API</strong> - REST API server with database integration
                  <br />
                  <span style={{ color: '#666' }}>
                    Status: {connection.backend ? 'Connected' : 'Disconnected'} | Port: 5000
                  </span>
                </div>
              ),
            },
            {
              color: connection.supabase ? 'green' : 'red',
              children: (
                <div>
                  <strong>Supabase Integration</strong> - Buildings and rooms data (bu-book)
                  <br />
                  <span style={{ color: '#666' }}>
                    Status: {connection.supabase ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              ),
            },
            {
              color: 'blue',
              children: (
                <div>
                  <strong>Admin Dashboard</strong> - Real-time monitoring interface
                  <br />
                  <span style={{ color: '#666' }}>
                    Data Source: {useRealData ? 'Real Data' : 'Mock Data'} | Auto-refresh enabled
                  </span>
                </div>
              ),
            },
          ]}
        />
      </Card>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
