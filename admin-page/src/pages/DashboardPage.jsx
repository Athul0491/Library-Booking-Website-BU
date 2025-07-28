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
import { useConnection } from '../contexts/ConnectionContext';
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
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState({});
  const [buildingStats, setBuildingStats] = useState({});
  const [availabilityStats, setAvailabilityStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [libcalStatus, setLibcalStatus] = useState('unknown');

  // Load data when component mounts and connection is available
  useEffect(() => {
    if (connection.isDataAvailable) {
      loadDashboardData();
      // Refresh data every 30 seconds
      const interval = setInterval(loadDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [connection.isDataAvailable]);

  // Load comprehensive dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Parallel data loading for better performance
      const [
        overviewData,
        buildingsData,
        availabilityData,
        activityData
      ] = await Promise.all([
        statsService.getOverviewStats(),
        loadBuildingStatistics(),
        loadAvailabilityStatistics(),
        statsService.getRecentBookings()
      ]);

      setSystemStats(overviewData.data || {});
      setBuildingStats(buildingsData);
      setAvailabilityStats(availabilityData);
      setRecentActivity(activityData.data || []);
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load building statistics from Supabase (bu-book data)
  const loadBuildingStatistics = async () => {
    try {
      const response = await locationService.getLocations();
      const buildings = response.data?.buildings || [];
      const rooms = buildings.flatMap(b => b.Rooms || []);
      
      return {
        totalBuildings: buildings.length,
        totalRooms: rooms.length,
        availableBuildings: buildings.filter(b => b.available).length,
        availableRooms: rooms.filter(r => r.available).length,
        buildingsWithRooms: buildings.filter(b => b.Rooms && b.Rooms.length > 0).length,
        averageRoomsPerBuilding: buildings.length > 0 ? Math.round(rooms.length / buildings.length * 10) / 10 : 0
      };
    } catch (error) {
      console.error('Failed to load building statistics:', error);
      return {};
    }
  };

  // Load availability statistics from bub-backend API
  const loadAvailabilityStatistics = async () => {
    try {
      // Test bub-backend API health
      const testResponse = await fetch('http://localhost:5000/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          library: 'mug',
          start: new Date().toISOString().split('T')[0]
        })
      });
      
      if (testResponse.ok) {
        const data = await testResponse.json();
        setLibcalStatus('connected');
        return {
          totalSlots: data.slots?.length || 0,
          availableSlots: data.slots?.filter(s => s.available)?.length || 0,
          libcalApiStatus: 'healthy',
          lastUpdate: new Date().toISOString()
        };
      } else {
        setLibcalStatus('error');
        return { libcalApiStatus: 'error' };
      }
    } catch (error) {
      setLibcalStatus('disconnected');
      console.error('bub-backend API error:', error);
      return { libcalApiStatus: 'disconnected' };
    }
  };

  // Recent activity table columns (bu-book Slot format)
  const activityColumns = [
    {
      title: 'Activity Type',
      key: 'type',
      render: (_, record) => (
        <Space>
          <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
            {record.type === 'booking' ? <CalendarOutlined /> : <UserOutlined />}
          </Avatar>
          <span>{record.type === 'booking' ? 'Booking' : 'User Activity'}</span>
        </Space>
      ),
    },
    {
      title: 'Room/Building',
      dataIndex: ['room', 'title'],
      key: 'room',
      render: (title, record) => (
        <div>
          <strong>{title || record.room?.name || 'N/A'}</strong>
          {record.building && (
            <div style={{ color: '#666', fontSize: '12px' }}>
              {record.building.Name}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Time Slot',
      key: 'timeSlot',
      render: (_, record) => {
        if (!record.timeSlot || !record.timeSlot.start || !record.timeSlot.end) {
          return 'N/A';
        }
        // Handle bu-book Slot format with Date objects
        const start = new Date(record.timeSlot.start);
        const end = new Date(record.timeSlot.end);
        return (
          <div>
            <div>{start.toLocaleDateString()}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>
              {start.toLocaleTimeString()} - {end.toLocaleTimeString()}
            </div>
          </div>
        );
      }
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
      title: 'LibCal Data',
      key: 'libcalData',
      render: (_, record) => (
        <div style={{ fontSize: '12px', color: '#666' }}>
          {record.itemId && <div>Item ID: {record.itemId}</div>}
          {record.checksum && <div>Checksum: {record.checksum.substring(0, 8)}...</div>}
        </div>
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
      <ConnectionStatus />

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
            message={`LibCal API Status: ${libcalStatus}`}
            description={
              libcalStatus === 'connected' 
                ? 'bub-backend is connected to LibCal API and functioning normally.'
                : libcalStatus === 'disconnected'
                ? 'bub-backend API is not responding. Please check if the server is running on localhost:5000.'
                : 'Error connecting to LibCal API through bub-backend.'
            }
            type={libcalStatus === 'connected' ? 'success' : 'warning'}
            style={{ marginBottom: 24 }}
            showIcon
          />

          {/* Key Metrics Row */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
            <Statistic
              title="Total Buildings"
              value={buildingStats.totalBuildings || 0}
              prefix={<HomeOutlined />}
              suffix="buildings"
            />
            <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
              {buildingStats.availableBuildings || 0} available
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Rooms"
              value={buildingStats.totalRooms || 0}
              prefix={<TeamOutlined />}
              suffix="rooms"
            />
            <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
              {buildingStats.availableRooms || 0} available
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="LibCal Slots"
              value={availabilityStats.totalSlots || 0}
              prefix={<ClockCircleOutlined />}
              suffix="slots"
            />
            <div style={{ marginTop: 8, fontSize: '12px', color: '#666' }}>
              {availabilityStats.availableSlots || 0} available
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg Rooms/Building"
              value={buildingStats.averageRoomsPerBuilding || 0}
              precision={1}
              prefix={<EnvironmentOutlined />}
            />
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
                {buildingStats.buildingsWithRooms || 0} / {buildingStats.totalBuildings || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Room Availability Rate">
                <Progress 
                  percent={
                    buildingStats.totalRooms 
                      ? Math.round((buildingStats.availableRooms / buildingStats.totalRooms) * 100)
                      : 0
                  } 
                  size="small" 
                />
              </Descriptions.Item>
              <Descriptions.Item label="Building Availability Rate">
                <Progress 
                  percent={
                    buildingStats.totalBuildings
                      ? Math.round((buildingStats.availableBuildings / buildingStats.totalBuildings) * 100)
                      : 0
                  } 
                  size="small" 
                />
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <ApiOutlined />
                <span>LibCal API Health</span>
              </Space>
            }
            loading={loading}
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="API Status">
                <Tag 
                  color={libcalStatus === 'connected' ? 'green' : 'red'}
                  icon={libcalStatus === 'connected' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                >
                  {libcalStatus.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Available Slots">
                {availabilityStats.availableSlots || 0} / {availabilityStats.totalSlots || 0}
              </Descriptions.Item>
              <Descriptions.Item label="Slot Availability Rate">
                <Progress 
                  percent={
                    availabilityStats.totalSlots 
                      ? Math.round((availabilityStats.availableSlots / availabilityStats.totalSlots) * 100)
                      : 0
                  } 
                  size="small" 
                />
              </Descriptions.Item>
              <Descriptions.Item label="Last Update">
                {availabilityStats.lastUpdate 
                  ? new Date(availabilityStats.lastUpdate).toLocaleString()
                  : 'Never'
                }
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
              color: 'green',
              children: (
                <div>
                  <strong>Supabase Database</strong> - Buildings and Rooms data (bu-book)
                  <br />
                  <span style={{ color: '#666' }}>Connected and synced</span>
                </div>
              ),
            },
            {
              color: libcalStatus === 'connected' ? 'green' : 'red',
              children: (
                <div>
                  <strong>bub-backend API</strong> - LibCal availability proxy
                  <br />
                  <span style={{ color: '#666' }}>
                    Status: {libcalStatus} | Port: 5000
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
                    Auto-refresh every 30 seconds
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
