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
  Space
} from 'antd';
import {
  DownloadOutlined,
  BarChartOutlined,
  PieChartOutlined,
  RiseOutlined,
  UsergroupAddOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

/**
 * Statistics & Reports page component
 * Display various data analysis and statistical reports
 */
const StatisticsPage = () => {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [selectedMetric, setSelectedMetric] = useState('bookings');
  const [statsData, setStatsData] = useState({});
  const [roomStats, setRoomStats] = useState([]);
  const [userStats, setUserStats] = useState([]);

  // Load data when component mounts
  useEffect(() => {
    loadStatistics();
  }, [dateRange, selectedMetric]);

  // Load Statistics Data
  const loadStatistics = async () => {
    try {
      setLoading(true);
      
      // Mock API call
      const mockStatsData = {
        totalBookings: 1248,
        totalUsers: 456,
        totalRevenue: 12450,
        avgBookingDuration: 2.5,
        bookingGrowth: 15.6,
        userGrowth: 8.3,
        revenueGrowth: 22.1,
        utilizationRate: 68.5
      };

      const mockRoomStats = [
        { id: 1, name: 'Study Room A', bookings: 156, utilization: 85, revenue: 3120 },
        { id: 2, name: 'Meeting Room B', bookings: 89, utilization: 72, revenue: 2670 },
        { id: 3, name: 'Discussion Room C', bookings: 124, utilization: 68, revenue: 2480 },
        { id: 4, name: 'Computer Lab D', bookings: 67, utilization: 45, revenue: 1340 },
        { id: 5, name: 'Reading Area E', bookings: 203, utilization: 92, revenue: 4060 },
      ];

      const mockUserStats = [
        { id: 1, name: 'John Smith', email: 'john.smith@example.com', bookings: 15, lastActive: '2024-01-20' },
        { id: 2, name: 'Sarah Johnson', email: 'sarah.johnson@example.com', bookings: 12, lastActive: '2024-01-19' },
        { id: 3, name: 'Michael Brown', email: 'michael.brown@example.com', bookings: 18, lastActive: '2024-01-21' },
        { id: 4, name: 'Emily Davis', email: 'emily.davis@example.com', bookings: 9, lastActive: '2024-01-18' },
        { id: 5, name: 'David Wilson', email: 'david.wilson@example.com', bookings: 21, lastActive: '2024-01-22' },
      ];

      setStatsData(mockStatsData);
      setRoomStats(mockRoomStats);
      setUserStats(mockUserStats);
    } catch (error) {
      console.error('Load Statistics Data Failed:', error);
    } finally {
      setLoading(false);
    }
  };

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
    {
      title: 'Revenue',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue) => `¥${revenue}`,
      sorter: (a, b) => a.revenue - b.revenue,
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
                <Option value="revenue">Revenue</Option>
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
        <Col xs={12} sm={6}>
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
        <Col xs={12} sm={6}>
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
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={statsData.totalRevenue}
              prefix="¥"
              suffix={
                <span style={{ fontSize: '12px', color: '#52c41a' }}>
                  ↑{statsData.revenueGrowth}%
                </span>
              }
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
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
            <Table
              columns={roomColumns}
              dataSource={roomStats}
              loading={loading}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>

        {/* User Activity Statistics */}
        <Col xs={24} lg={10}>
          <Card title="ActiveUserStatistics">
            <Table
              columns={userColumns}
              dataSource={userStats}
              loading={loading}
              rowKey="id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
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
    </div>
  );
};

export default StatisticsPage;
