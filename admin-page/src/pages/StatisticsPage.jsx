// Statistics & Reports page - View various data analysis and reports
import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Select,
  DatePicker,
  Button,
  Table,
  Progress,
  Typography,
  Space,
  message
} from 'antd';
import {
  DownloadOutlined,
  BarChartOutlined,
  PieChartOutlined,
  RiseOutlined,
  UsergroupAddOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import statsService from '../services/statsService';
import { useConnection } from '../contexts/ConnectionContext';
import { 
  ConnectionStatus, 
  TableSkeleton, 
  DataUnavailablePlaceholder,
  PageLoadingSkeleton 
} from '../components/SkeletonComponents';

const { Title, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

/**
 * Statistics & Reports page component
 * Display various data analysis and statistical reports
 */
const StatisticsPage = () => {
  const connection = useConnection();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [selectedMetric, setSelectedMetric] = useState('bookings');
  const [statsData, setStatsData] = useState({});
  const [roomStats, setRoomStats] = useState([]);
  const [userStats, setUserStats] = useState([]);

  // Load Statistics Data
  const loadStatistics = async () => {
    if (!connection.isDataAvailable) {
      console.log('⚠️ Data not available, skipping statistics load');
      return;
    }

    try {
      setLoading(true);
      
      // Use integrated statistics service that connects to real data sources
      const result = await statsService.getStatistics({
        dateRange,
        selectedMetric
      });

      if (result.success) {
        setStatsData(result.data.statsData);
        setRoomStats(result.data.roomStats);
        setUserStats(result.data.userStats);

        if (result.isMockData) {
          message.warning('Using mock data - connect Supabase for real data');
        } else {
          message.success('Statistics loaded from real data sources');
        }
      } else {
        message.error(`Failed to load statistics: ${result.error}`);
      }
    } catch (error) {
      console.error('Load Statistics Data Failed:', error);
      message.error('Failed to load statistics data');
    } finally {
      setLoading(false);
    }
  };

  // Load data when component mounts and connection is available
  useEffect(() => {
    if (connection.isDataAvailable) {
      loadStatistics();
    }
  }, [dateRange, selectedMetric, connection.isDataAvailable]);

  // ExportReport
  const exportReport = () => {
    // Mock export functionality
    console.log('Export Report', {
      dateRange,
      selectedMetric,
      data: { statsData, roomStats, userStats }
    });
    // In actual implementation, this would generate and download Excel or PDF files
  };

  // Room statistics table column configuration
  const roomColumns = [
    {
      title: 'RoomName',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'bookingTimes',
      dataIndex: 'bookings',
      key: 'bookings',
      sorter: (a, b) => a.bookings - b.bookings,
    },
    {
      title: 'usageRate',
      dataIndex: 'utilization',
      key: 'utilization',
      render: (rate) => (
        <Progress 
          percent={rate} 
          size="small" 
          status={rate > 80 ? 'exception' : rate > 60 ? 'active' : 'normal'}
        />
      ),
      sorter: (a, b) => a.utilization - b.utilization,
    },
  ];

  // User statistics table column configuration
  const userColumns = [
    {
      title: 'User Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'bookingTimes',
      dataIndex: 'bookings',
      key: 'bookings',
      sorter: (a, b) => a.bookings - b.bookings,
    },
    {
      title: 'Last Active',
      dataIndex: 'lastActive',
      key: 'lastActive',
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
    },
  ];

  return (
    <div>
      <Title level={2}>Statistics & Reports</Title>
      <Paragraph>
        View system statistics and analysis reports to understand booking status and usage trends.
      </Paragraph>

      {/* Connection Status */}
      <ConnectionStatus connection={connection} style={{ marginBottom: 24 }} />

      {/* Loading State */}
      {connection.loading && <PageLoadingSkeleton />}

      {/* No Connection State */}
      {!connection.loading && !connection.isDataAvailable && (
        <DataUnavailablePlaceholder 
          title="Statistics Data Unavailable"
          description="Cannot connect to the statistics service. Please check your connection and try again."
          onRetry={() => connection.refreshConnections()}
        />
      )}

      {/* Normal Data Display */}
      {!connection.loading && connection.isDataAvailable && (
        <>
          {/* Filter controls */}
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={12} md={8}>
                <Space>
                  <span>Time Range:</span>
                  <RangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    format="YYYY-MM-DD"
                  />
                </Space>
              </Col>
              <Col xs={24} sm={12} md={8}>
                <Space>
                  <span>Statistics Dimension:</span>
                  <Select
                    value={selectedMetric}
                    onChange={setSelectedMetric}
                    style={{ width: 120 }}
                  >
                    <Option value="bookings">Booking Count</Option>
                    <Option value="utilization">Usage Rate</Option>
                    <Option value="users">User Count</Option>
                  </Select>
                </Space>
              </Col>
              <Col xs={24} sm={24} md={8}>
                <Button 
                  type="primary" 
                  icon={<DownloadOutlined />}
                  onClick={exportReport}
                >
                  ExportReport
                </Button>
              </Col>
            </Row>
          </Card>

          {/* OverviewStatisticscard */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            <Col xs={12} sm={8}>
              <Card>
                <Statistic
                  title="Total Bookings"
                  value={statsData.totalBookings}
                  prefix={<BarChartOutlined />}
                  suffix={
                    <span style={{ fontSize: '12px', color: '#52c41a' }}>
                      ↑{statsData.bookingGrowth}%
                    </span>
                  }
                  loading={loading}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8}>
              <Card>
                <Statistic
                  title="ActiveUser"
                  value={statsData.totalUsers}
                  prefix={<UsergroupAddOutlined />}
                  suffix={
                    <span style={{ fontSize: '12px', color: '#52c41a' }}>
                      ↑{statsData.userGrowth}%
                    </span>
                  }
                  loading={loading}
                />
              </Card>
            </Col>
            <Col xs={12} sm={8}>
              <Card>
                <Statistic
                  title="AverageusageRate"
                  value={statsData.utilizationRate}
                  suffix="%"
                  prefix={<PieChartOutlined />}
                  loading={loading}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            {/* RoomStatistics */}
            <Col xs={24} lg={14}>
              <Card 
                title="RoomusageStatistics" 
                extra={<RiseOutlined />}
              >
                {loading ? (
                  <TableSkeleton rows={6} columns={3} />
                ) : (
                  <Table
                    columns={roomColumns}
                    dataSource={roomStats}
                    loading={loading}
                    rowKey="id"
                    pagination={false}
                    size="small"
                  />
                )}
              </Card>
            </Col>

            {/* User Activity Statistics */}
            <Col xs={24} lg={10}>
              <Card title="ActiveUserStatistics">
                {loading ? (
                  <TableSkeleton rows={5} columns={4} />
                ) : (
                  <Table
                    columns={userColumns}
                    dataSource={userStats}
                    loading={loading}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    size="small"
                  />
                )}
              </Card>
            </Col>
          </Row>

          {/* Trend chart area - reserved for chart components */}
          <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Card title="Usage Trend Chart" extra="Last 30 Days">
                <div style={{ 
                  height: 300, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  background: '#fafafa',
                  border: '1px dashed #d9d9d9'
                }}>
                  <div style={{ textAlign: 'center', color: '#999' }}>
                    <BarChartOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                    <br />
                    Chart Component Position
                    <br />
                    <small>Can integrate ECharts, D3.js and other chart libraries</small>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default StatisticsPage;
