/**
 * Data Monitor Page - Monitor and manage data from all systems
 * 
 * This page provides comprehensive monitoring for:
 * - bub-backend API data
 * - bu-book frontend data usage
 * - Real-time availability data
 * - System health monitoring
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Alert,
  Button,
  Space,
  Typography,
  Tag,
  Progress,
  Divider,
  List,
  Badge,
  Tabs,
  Select,
  DatePicker,
  message,
  Spin
} from 'antd';
import {
  ApiOutlined,
  DatabaseOutlined,
  MonitorOutlined,
  ReloadOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import dataMonitorService from '../services/dataMonitorService';
import apiService, { LIBRARY_CODES } from '../services/apiService';
import { useConnection } from '../contexts/ConnectionContext';
import { useDataSource } from '../contexts/DataSourceContext';
import { 
  ConnectionStatus, 
  TableSkeleton, 
  DataUnavailablePlaceholder,
  PageLoadingSkeleton 
} from '../components/SkeletonComponents';
import ServerStatusBanner from '../components/ServerStatusBanner';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

/**
 * Data Monitor Dashboard Component
 */
const DataMonitorPage = () => {
  const connection = useConnection();
  const { useRealData } = useDataSource();
  const [loading, setLoading] = useState(false);
  const [systemHealth, setSystemHealth] = useState({});
  const [availabilityData, setAvailabilityData] = useState([]);
  const [buildingData, setBuildingData] = useState([]);
  const [apiStats, setApiStats] = useState({});
  const [selectedLibrary, setSelectedLibrary] = useState('mug');
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Load all data when component mounts
  useEffect(() => {
    loadAllData();
    // Disabled auto-refresh to reduce API calls - users can manually refresh if needed
    // if (useRealData) {
    //   const interval = setInterval(loadAllData, 30000);
    //   setRefreshInterval(interval);
    //   
    //   return () => {
    //     if (interval) clearInterval(interval);
    //   };
    // }
  }, [connection.isDataAvailable, useRealData]);

  // Initial load when component mounts
  useEffect(() => {
    loadAvailabilityData();
  }, []);

  // Reload when library or date changes
  useEffect(() => {
    loadAvailabilityData();
  }, [selectedLibrary, selectedDate]);

  // Note: Removed automatic reload when connection becomes available to reduce API calls
  // Users can manually refresh data using the refresh button if needed

  /**
   * Load all monitoring data
   */
  const loadAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        checkSystemHealth(),
        loadApiStats(),
        loadBuildingData()
      ]);
    } catch (error) {
      message.error('Failed to load monitoring data');
      console.error('Data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Check system health status
   */
  const checkSystemHealth = async () => {
    try {
      if (!useRealData) {
        // Use mock health data
        setSystemHealth({
          bubBackend: { status: 'healthy', message: 'Mock backend service running', responseTime: 45 },
          supabase: { status: 'healthy', message: 'Mock database connected', responseTime: 32 },
          libcal: { status: 'healthy', message: 'Mock LibCal API accessible', responseTime: 78 },
          adminPage: { status: 'running', message: 'Current session active', responseTime: 5 }
        });
        return;
      }

      const health = await dataMonitorService.checkSystemHealth();
      setSystemHealth(health);
    } catch (error) {
      console.error('Health check failed:', error);
      setSystemHealth({
        bubBackend: { status: 'error', message: 'Health check failed' },
        buBook: { status: 'unknown', message: 'Cannot check' },
        adminPage: { status: 'running', message: 'Current session active' }
      });
    }
  };

  /**
   * Load API usage statistics
   */
  const loadApiStats = async () => {
    try {
      if (!useRealData) {
        // Use mock API stats
        setApiStats({
          totalRequests: 1247,
          successRate: 98.5,
          avgResponseTime: 245,
          errorCount: 18,
          lastUpdated: new Date().toISOString()
        });
        return;
      }

      const stats = await dataMonitorService.getApiStats();
      setApiStats(stats);
    } catch (error) {
      console.error('API stats loading failed:', error);
      setApiStats({
        totalRequests: 0,
        successRate: 0,
        avgResponseTime: 0,
        errorCount: 0
      });
    }
  };

  /**
   * Load availability data for selected library and date
   */
  const loadAvailabilityData = async () => {
    try {
      const params = {
        library: selectedLibrary,
        start: selectedDate.format('YYYY-MM-DD'),
        end: selectedDate.format('YYYY-MM-DD'),
        start_time: '08:00',
        end_time: '22:00'
      };

      const result = await apiService.getAvailability(params);
      if (result.success) {
        const formattedSlots = apiService.formatSlots(result.data.slots || []);
        setAvailabilityData(formattedSlots);
      }
    } catch (error) {
      console.error('Availability data loading failed:', error);
      setAvailabilityData([]);
    }
  };

  /**
   * Load building and room data
   */
  const loadBuildingData = async () => {
    try {
      if (!useRealData) {
        // Use mock building data
        setBuildingData([
          { id: 1, name: 'Mugar Memorial Library', rooms: 15, active: 12, utilization: 80 },
          { id: 2, name: 'Pardee Library', rooms: 8, active: 6, utilization: 75 },
          { id: 3, name: 'Pickering Educational Resources Library', rooms: 12, active: 9, utilization: 67 },
          { id: 4, name: 'Science & Engineering Library', rooms: 20, active: 18, utilization: 90 }
        ]);
        return;
      }

      const buildings = await dataMonitorService.getBuildingData();
      setBuildingData(buildings);
    } catch (error) {
      console.error('Building data loading failed:', error);
      setBuildingData([]);
    }
  };

  /**
   * Get system status color
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  /**
   * Availability data table columns
   */
  const availabilityColumns = [
    {
      title: 'Time Slot',
      key: 'timeSlot',
      render: (_, record) => (
        <Space>
          <ClockCircleOutlined />
          {dayjs(record.startTime).format('HH:mm')} - {dayjs(record.endTime).format('HH:mm')}
        </Space>
      )
    },
    {
      title: 'Duration',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration) => `${duration} min`
    },
    {
      title: 'Status',
      dataIndex: 'available',
      key: 'available',
      render: (available) => (
        <Tag color={available ? 'green' : 'red'}>
          {available ? 'Available' : 'Booked'}
        </Tag>
      )
    },
    {
      title: 'Item ID',
      dataIndex: 'itemId',
      key: 'itemId'
    },
    {
      title: 'Checksum',
      dataIndex: 'checksum',
      key: 'checksum',
      render: (checksum) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
          {checksum ? checksum.substring(0, 8) + '...' : 'N/A'}
        </span>
      )
    }
  ];

  /**
   * Building data table columns
   */
  const buildingColumns = [
    {
      title: 'Building',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          <EnvironmentOutlined />
          <span>{name}</span>
          <Tag color={record.available ? 'green' : 'red'}>
            {record.available ? 'Available' : 'Full'}
          </Tag>
        </Space>
      )
    },
    {
      title: 'Library Code',
      dataIndex: 'code',
      key: 'code',
      render: (code) => <Tag>{code?.toUpperCase()}</Tag>
    },
    {
      title: 'Total Rooms',
      dataIndex: 'totalRooms',
      key: 'totalRooms'
    },
    {
      title: 'Available Rooms',
      dataIndex: 'availableRooms',
      key: 'availableRooms',
      render: (available, record) => (
        <Progress
          percent={record.totalRooms > 0 ? (available / record.totalRooms) * 100 : 0}
          size="small"
          format={() => `${available}/${record.totalRooms}`}
        />
      )
    }
  ];

  return (
    <div>
      <Title level={2}>Data Monitor Dashboard</Title>
      <Paragraph>
        Monitor data from bub-backend API, bu-book frontend, and real-time availability systems.
      </Paragraph>

      {/* Server Status Banner */}
      <ServerStatusBanner 
        useGlobalApi={true}
        showConnectionStatus={true}
        showApiStatusCard={false}
        showConnectingAlert={false}
        showRefreshButton={false}
        style={{ marginBottom: 24 }}
      />

      {/* Show loading skeleton when data is not available */}
      {!connection.isDataAvailable ? (
        <DataUnavailablePlaceholder 
          title="Data Monitor Unavailable"
          description="Data monitoring requires active connections to display system health and statistics."
        />
      ) : loading ? (
        <PageLoadingSkeleton />
      ) : (
        <>
          {/* System Health Overview */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Card>
                <Statistic
                  title="bub-backend Status"
                  value={systemHealth.bubBackend?.status || 'Unknown'}
                  prefix={
                    <Badge 
                      status={getStatusColor(systemHealth.bubBackend?.status)} 
                      icon={systemHealth.bubBackend?.status === 'running' ? <CheckCircleOutlined /> : <WarningOutlined />}
                    />
                  }
                  valueStyle={{ 
                    color: systemHealth.bubBackend?.status === 'running' ? '#3f8600' : '#cf1322' 
                  }}
                />
              </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="bu-book Frontend"
              value={systemHealth.buBook?.status || 'Unknown'}
              prefix={
                <Badge 
                  status={getStatusColor(systemHealth.buBook?.status)} 
                  icon={<MonitorOutlined />}
                />
              }
              valueStyle={{ 
                color: systemHealth.buBook?.status === 'running' ? '#3f8600' : '#cf1322' 
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Admin Page"
              value="Running"
              prefix={<Badge status="success" icon={<CheckCircleOutlined />} />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      {/* API Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Total API Requests"
              value={apiStats.totalRequests || 0}
              prefix={<ApiOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Success Rate"
              value={apiStats.successRate || 0}
              suffix="%"
              precision={1}
              valueStyle={{ 
                color: (apiStats.successRate || 0) > 90 ? '#3f8600' : '#cf1322' 
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Avg Response Time"
              value={apiStats.avgResponseTime || 0}
              suffix="ms"
              precision={0}
            />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card>
            <Statistic
              title="Error Count"
              value={apiStats.errorCount || 0}
              prefix={<WarningOutlined />}
              valueStyle={{ 
                color: (apiStats.errorCount || 0) > 0 ? '#cf1322' : '#3f8600' 
              }}
            />
          </Card>
        </Col>
      </Row>

      {/* Detailed Data Views */}
      <Card
        title="Data Details"
        extra={
          <Space>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={loadAllData}
              loading={loading}
            >
              Refresh All Data
            </Button>
          </Space>
        }
      >
        <Tabs defaultActiveKey="availability">
          <TabPane tab="Availability Data" key="availability">
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={12}>
                <Select
                  placeholder="Select Library"
                  style={{ width: '100%' }}
                  value={selectedLibrary}
                  onChange={setSelectedLibrary}
                >
                  {Object.entries(LIBRARY_CODES).map(([code, library]) => (
                    <Option key={code} value={code}>
                      <Space>
                        <EnvironmentOutlined />
                        {library.name}
                      </Space>
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={12}>
                <DatePicker
                  style={{ width: '100%' }}
                  value={selectedDate}
                  onChange={setSelectedDate}
                  format="YYYY-MM-DD"
                />
              </Col>
            </Row>
            
            <Alert
              message={`Showing ${availabilityData.length} time slots for ${LIBRARY_CODES[selectedLibrary]?.name} on ${selectedDate.format('YYYY-MM-DD')}`}
              type="info"
              style={{ marginBottom: 16 }}
            />

            <Table
              columns={availabilityColumns}
              dataSource={availabilityData}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              loading={loading}
            />
          </TabPane>

          <TabPane tab="Building Data" key="buildings">
            <Alert
              message="Building and room data from bu-book system integration"
              type="info"
              style={{ marginBottom: 16 }}
            />
            
            <Table
              columns={buildingColumns}
              dataSource={buildingData}
              rowKey="id"
              pagination={{ pageSize: 10 }}
              loading={loading}
            />
          </TabPane>

          <TabPane tab="System Logs" key="logs">
            <Alert
              message="System operation logs and API call history"
              type="info"
              style={{ marginBottom: 16 }}
            />
            
            <List
              dataSource={[
                { time: dayjs().format('YYYY-MM-DD HH:mm:ss'), event: 'System health check completed', status: 'success' },
                { time: dayjs().subtract(1, 'minute').format('YYYY-MM-DD HH:mm:ss'), event: 'API availability data refreshed', status: 'success' },
                { time: dayjs().subtract(3, 'minute').format('YYYY-MM-DD HH:mm:ss'), event: 'Building data synchronized', status: 'success' },
                { time: dayjs().subtract(5, 'minute').format('YYYY-MM-DD HH:mm:ss'), event: 'Backend connection established', status: 'success' }
              ]}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={
                      <Space>
                        <Tag color={getStatusColor(item.status)}>
                          {item.status.toUpperCase()}
                        </Tag>
                        <span>{item.event}</span>
                      </Space>
                    }
                    description={item.time}
                  />
                </List.Item>
              )}
            />
          </TabPane>
        </Tabs>
      </Card>
        </>
      )}
    </div>
  );
};

export default DataMonitorPage;
