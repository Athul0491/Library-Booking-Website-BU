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
import apiService from '../services/apiService';
import { useConnection } from '../contexts/ConnectionContext';
import { useDataSource } from '../contexts/DataSourceContext';
import ConnectionStatus from '../components/ConnectionStatus';

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
  const { 
    useRealData, 
    apiConfig, 
    autoRefreshEnabled, 
    refreshInterval,
    dataSourceMode,
    isBackendProxyMode,
    isMockDataMode,
    connectionStatus,
    addNotification 
  } = useDataSource();
  const [loading, setLoading] = useState(true);
  const [systemStats, setSystemStats] = useState({});
  const [buildingStats, setBuildingStats] = useState({});
  const [bookingStats, setBookingStats] = useState({});
  const [recentActivity, setRecentActivity] = useState([]);
  const [dataError, setDataError] = useState(null);
  
  // Connection and API status states
  const [isConnecting, setIsConnecting] = useState(false);
  const [apiStatus, setApiStatus] = useState('disconnected'); // 'connecting', 'connected', 'disconnected', 'error'
  const [connectionDetails, setConnectionDetails] = useState({
    backend: 'unknown',
    database: 'unknown',
    lastUpdated: null,
    responseTime: null
  });

  // Load data when component mounts and connection is available
  // Initial load when component mounts
  useEffect(() => {
    // Set initial connecting state
    setApiStatus('connecting');
    setConnectionDetails({
      backend: 'connecting',
      database: 'connecting',
      lastUpdated: null,
      responseTime: null
    });
    
    // Always try to load data when component mounts
    loadDashboardData();
  }, []);

  // Note: Removed automatic reload when connection becomes available to reduce API calls
  // Users can manually refresh data using the refresh button if needed

  // Load comprehensive dashboard data
  const loadDashboardData = async () => {
    const startTime = Date.now();
    
    try {
      setLoading(true);
      setDataError(null);
      setIsConnecting(true);
      setApiStatus('connecting');
      
      console.log('🔄 Starting connection to bub-backend...');
      
      // Always try optimized bub-backend dashboard API first
      try {
        console.log('🚀 Page opened - Automatically calling bub-backend API...');
        const dashboardResult = await apiService.getDashboardData();
        
        const responseTime = Date.now() - startTime;
        
        // Log connection status instead of detailed data
        console.log(`✅ Backend API Connected - Status: ${dashboardResult.success ? 'SUCCESS' : 'FAILED'}`);
        console.log(`⏱️ Response time: ${responseTime}ms`);
        
        if (dashboardResult.success) {
          const dashboardData = dashboardResult.data;
          
          // Update connection status - SUCCESS
          setApiStatus('connected');
          setConnectionDetails({
            backend: 'healthy',
            database: 'connected',
            lastUpdated: new Date().toISOString(),
            responseTime: responseTime
          });
          
          // Log data summary instead of detailed data
          console.log(`📊 Data Summary: ${dashboardData.buildings?.length || 0} buildings, ${dashboardData.stats?.total_rooms || 0} rooms`);
          console.log(`📈 Active Bookings: ${dashboardData.stats?.active_bookings || 0}`);
          
          // Set data from optimized dashboard response
          setSystemStats({
            total_buildings: dashboardData.stats.total_buildings,
            total_rooms: dashboardData.stats.total_rooms,
            total_bookings: dashboardData.stats.active_bookings,
            active_buildings: dashboardData.buildings.filter(b => b.available).length,
            available_rooms: dashboardData.stats.available_rooms || 0,
            active_bookings: dashboardData.stats.active_bookings,
            api_health_score: 95, // calculated from successful API response
            lastUpdated: dashboardData.timestamp
          });
          
          setBuildingStats({
            totalBuildings: dashboardData.stats.total_buildings,
            buildings: dashboardData.buildings,
            activeBuildings: dashboardData.buildings.filter(b => b.available).length
          });
          
          setBookingStats({
            totalBookings: dashboardData.stats.active_bookings,
            activeBookings: dashboardData.stats.active_bookings
          });
          
          // Add success notification
          addNotification({
            type: 'success',
            title: 'Data Loading Successful',
            message: 'Dashboard data successfully retrieved from bub-backend API on page load',
            timestamp: new Date().toISOString()
          });
          
          console.log('✅ Successfully loaded data from bub-backend API');
          setLoading(false);
          setIsConnecting(false);
          return; // Exit early if successful
        } else {
          throw new Error(dashboardResult.error || 'Backend API returned failure status');
        }
      } catch (dashboardError) {
        console.error('❌ bub-backend API failed:', dashboardError);
        
        // Update connection status - ERROR
        setApiStatus('error');
        setConnectionDetails({
          backend: 'unhealthy',
          database: 'error',
          lastUpdated: new Date().toISOString(),
          responseTime: Date.now() - startTime
        });
        
        // Add error notification
        addNotification({
          type: 'error',
          title: 'Backend API Failed',
          message: `bub-backend API call failed: ${dashboardError.message}. Falling back to individual services.`,
          timestamp: new Date().toISOString()
        });
        
        // Fall back to individual API calls only if backend fails
        console.log('🔄 Falling back to individual API calls...');
      }
      
      // Fallback to individual API calls when bub-backend fails
      console.log('📞 Calling individual service APIs...');
      const options = { forceUseMockData: !useRealData };
      
      const [
        statsResult,
        buildingsResult,
        bookingsResult
      ] = await Promise.all([
        statsService.getStatistics(apiConfig),
        locationService.getBuildingStats(),
        bookingService.getBookingStats()
      ]);

      // Log fallback API connection status
      console.log(`📊 Fallback APIs - Stats: ${statsResult.success ? 'SUCCESS' : 'FAILED'}`);
      console.log(`🏢 Buildings: ${buildingsResult.success ? 'SUCCESS' : 'FAILED'}`);
      console.log(`📅 Bookings: ${bookingsResult.success ? 'SUCCESS' : 'FAILED'}`);

      // Handle statistics data
      if (statsResult.success) {
        setSystemStats(statsResult.data?.statsData || {});
        console.log('✅ Fallback stats data loaded successfully');
      } else {
        console.warn('⚠️ Failed to load statistics from fallback:', statsResult.error);
      }

      // Handle building data
      if (buildingsResult.success) {
        setBuildingStats(buildingsResult.data || {});
        console.log('✅ Fallback building data loaded successfully');
      } else {
        console.warn('⚠️ Failed to load building statistics from fallback:', buildingsResult.error);
      }

      // Handle booking data
      if (bookingsResult.success) {
        setBookingStats(bookingsResult.data || {});
        setRecentActivity(bookingsResult.data?.bookings?.slice(0, 5) || []);
        console.log('✅ Fallback booking data loaded successfully');
      } else {
        console.warn('⚠️ Failed to load booking statistics from fallback:', bookingsResult.error);
      }
      
    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error);
      
      // Update connection status - TOTAL FAILURE
      setApiStatus('error');
      setConnectionDetails({
        backend: 'error',
        database: 'error',
        lastUpdated: new Date().toISOString(),
        responseTime: Date.now() - startTime
      });
      
      if (useRealData) {
        setDataError(error.message);
        
        // Add error notification
        addNotification({
          type: 'error',
          title: 'Data Loading Failed',
          message: `Error occurred while loading dashboard data: ${error.message}`,
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      setLoading(false);
      setIsConnecting(false);
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
      <ConnectionStatus 
        showDetails={true} 
        compact={false} 
        style={{ marginBottom: 24 }}
        customStatus={{
          apiStatus: apiStatus,
          connectionDetails: connectionDetails,
          isConnecting: isConnecting
        }}
      />

      {/* API Connection Status Indicator */}
      {isConnecting && (
        <Alert
          message="Connecting to Backend API"
          description="Establishing connection to bub-backend API service..."
          type="info"
          showIcon
          icon={<ClockCircleOutlined spin />}
          style={{ marginBottom: 16 }}
        />
      )}
      
      {/* Real-time API Status */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Space>
              <Tag 
                color={
                  apiStatus === 'connected' ? 'success' : 
                  apiStatus === 'connecting' ? 'processing' : 
                  apiStatus === 'error' ? 'error' : 'default'
                }
                icon={
                  apiStatus === 'connected' ? <CheckCircleOutlined /> :
                  apiStatus === 'connecting' ? <ClockCircleOutlined spin /> :
                  apiStatus === 'error' ? <CloseCircleOutlined /> :
                  <ApiOutlined />
                }
              >
                {apiStatus === 'connected' ? 'API Connected' :
                 apiStatus === 'connecting' ? 'Connecting...' :
                 apiStatus === 'error' ? 'API Error' :
                 'Disconnected'}
              </Tag>
              <Tag color={connectionDetails.backend === 'healthy' ? 'success' : 'error'}>
                Backend: {connectionDetails.backend}
              </Tag>
              <Tag color={connectionDetails.database === 'connected' ? 'success' : 'error'}>
                Database: {connectionDetails.database}
              </Tag>
            </Space>
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {connectionDetails.responseTime && `${connectionDetails.responseTime}ms`}
            {connectionDetails.lastUpdated && (
              <span style={{ marginLeft: 8 }}>
                Updated: {new Date(connectionDetails.lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Show appropriate content based on connection status and data mode */}
      {!useRealData ? (
        <Alert
          message="Mock Data Mode"
          description="Currently using simulated data for demonstration. To view real data, switch to backend proxy or direct Supabase mode in data source configuration."
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      ) : (
        <>
          {/* Dynamic System Status Alert */}
          <Alert
            message={`System Status: ${
              apiStatus === 'connected' ? 'Fully Operational' :
              apiStatus === 'connecting' ? 'Initializing...' :
              apiStatus === 'error' ? 'Service Issues' :
              'System Offline'
            }`}
            description={
              apiStatus === 'connected' 
                ? `bub-backend API is connected and functioning normally. Response time: ${connectionDetails.responseTime}ms`
                : apiStatus === 'connecting'
                ? 'Establishing connection to backend services. Please wait...'
                : apiStatus === 'error'
                ? 'Backend API is experiencing issues. Some features may be limited.'
                : 'System is not responding. Please check your connection.'
            }
            type={
              apiStatus === 'connected' ? 'success' :
              apiStatus === 'connecting' ? 'info' :
              'warning'
            }
            style={{ marginBottom: 24 }}
            showIcon
            icon={
              apiStatus === 'connecting' ? <ClockCircleOutlined spin /> : undefined
            }
          />

          {/* Key Metrics Row */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={12} lg={6}>
              <Card>
                <Statistic
                  title="Total Buildings"
                  value={systemStats.total_buildings || 0}
                  prefix={<HomeOutlined />}
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
                  value={
                    apiStatus === 'connected' ? 95 :
                    apiStatus === 'connecting' ? 50 :
                    apiStatus === 'error' ? 25 :
                    0
                  }
                  precision={0}
                  suffix="%"
                  prefix={<ApiOutlined />}
                  valueStyle={{
                    color: 
                      apiStatus === 'connected' ? '#52c41a' :
                      apiStatus === 'connecting' ? '#1890ff' :
                      apiStatus === 'error' ? '#ff4d4f' :
                      '#d9d9d9'
                  }}
                />
                <div style={{ 
                  marginTop: 8, 
                  fontSize: '12px', 
                  color: 
                    apiStatus === 'connected' ? '#52c41a' :
                    apiStatus === 'connecting' ? '#1890ff' :
                    apiStatus === 'error' ? '#ff4d4f' :
                    '#d9d9d9'
                }}>
                  Status: {
                    apiStatus === 'connected' ? 'Healthy' :
                    apiStatus === 'connecting' ? 'Initializing' :
                    apiStatus === 'error' ? 'Error' :
                    'Offline'
                  }
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
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Buildings with Rooms">
                    {buildingStats.totalBuildings || systemStats.total_buildings || 0} / {systemStats.total_buildings || 0}
                  </Descriptions.Item>
                  <Descriptions.Item label="Room Availability Rate">
                    <Progress 
                      percent={
                        systemStats.total_rooms 
                          ? Math.round(((systemStats.total_rooms - (systemStats.active_bookings || 0)) / systemStats.total_rooms) * 100)
                          : 100
                      } 
                      size="small" 
                      status="active"
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="Building Availability Rate">
                    <Progress 
                      percent={
                        systemStats.total_buildings
                          ? Math.round(((buildingStats.activeBuildings || systemStats.total_buildings || 0) / systemStats.total_buildings) * 100)
                          : 100
                      } 
                      size="small" 
                      status="active"
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="Average Rooms per Building">
                    {systemStats.total_buildings 
                      ? Math.round((systemStats.total_rooms / systemStats.total_buildings) * 10) / 10
                      : 0}
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
              >
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Booking Status">
                    <Tag 
                      color={systemStats.active_bookings > 0 ? 'green' : 'orange'}
                      icon={systemStats.active_bookings > 0 ? <CheckCircleOutlined /> : <ClockCircleOutlined />}
                    >
                      {systemStats.active_bookings > 0 ? 'ACTIVE BOOKINGS' : 'NO ACTIVE BOOKINGS'}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Active Bookings Today">
                    {systemStats.active_bookings || 0} total active
                  </Descriptions.Item>
                  <Descriptions.Item label="Room Utilization Rate">
                    <Progress 
                      percent={
                        systemStats.total_rooms 
                          ? Math.round((systemStats.active_bookings / systemStats.total_rooms) * 100)
                          : 0
                      } 
                      size="small" 
                      status="active"
                    />
                  </Descriptions.Item>
                  <Descriptions.Item label="System Health">
                    <Progress 
                      percent={
                        apiStatus === 'connected' ? 95 :
                        apiStatus === 'connecting' ? 50 :
                        apiStatus === 'error' ? 25 :
                        0
                      }
                      size="small"
                      status={
                        apiStatus === 'connected' ? 'success' :
                        apiStatus === 'connecting' ? 'active' :
                        apiStatus === 'error' ? 'exception' :
                        'exception'
                      }
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
              color: connection.isBackendConnected ? 'green' : 'red',
              children: (
                <div>
                  <strong>Database Connection</strong> - PostgreSQL database with booking data
                  <br />
                  <span style={{ color: '#666' }}>
                    Status: {connection.isBackendConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              ),
            },
            {
              color: connection.isBackendConnected ? 'green' : 'red',
              children: (
                <div>
                  <strong>bub-backend API</strong> - REST API server with database integration
                  <br />
                  <span style={{ color: '#666' }}>
                    Status: {connection.isBackendConnected ? 'Connected' : 'Disconnected'} | Port: 5000
                  </span>
                </div>
              ),
            },
            {
              color: connection.isSupabaseConnected ? 'green' : 'red',
              children: (
                <div>
                  <strong>Supabase Integration</strong> - Buildings and rooms data (bu-book)
                  <br />
                  <span style={{ color: '#666' }}>
                    Status: {connection.isSupabaseConnected ? 'Connected' : 'Disconnected'}
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
