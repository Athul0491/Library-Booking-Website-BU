// 统计报表页面 - 查看各种数据分析和报表
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
 * 统计报表页面组件
 * 显示各种数据分析和统计报表
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

  // 组件挂载时加载数据
  useEffect(() => {
    loadStatistics();
  }, [dateRange, selectedMetric]);

  // 加载统计数据
  const loadStatistics = async () => {
    try {
      setLoading(true);
      
      // 模拟API调用
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
        { id: 1, name: '自习室A', bookings: 156, utilization: 85, revenue: 3120 },
        { id: 2, name: '会议室B', bookings: 89, utilization: 72, revenue: 2670 },
        { id: 3, name: '讨论室C', bookings: 124, utilization: 68, revenue: 2480 },
        { id: 4, name: '机房D', bookings: 67, utilization: 45, revenue: 1340 },
        { id: 5, name: '阅读区E', bookings: 203, utilization: 92, revenue: 4060 },
      ];

      const mockUserStats = [
        { id: 1, name: '张三', email: 'zhangsan@example.com', bookings: 15, lastActive: '2024-01-20' },
        { id: 2, name: '李四', email: 'lisi@example.com', bookings: 12, lastActive: '2024-01-19' },
        { id: 3, name: '王五', email: 'wangwu@example.com', bookings: 18, lastActive: '2024-01-21' },
        { id: 4, name: '赵六', email: 'zhaoliu@example.com', bookings: 9, lastActive: '2024-01-18' },
        { id: 5, name: '钱七', email: 'qianqi@example.com', bookings: 21, lastActive: '2024-01-22' },
      ];

      setStatsData(mockStatsData);
      setRoomStats(mockRoomStats);
      setUserStats(mockUserStats);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 导出报表
  const exportReport = () => {
    // 模拟导出功能
    console.log('导出报表', {
      dateRange,
      selectedMetric,
      data: { statsData, roomStats, userStats }
    });
    // 实际实现中这里会生成并下载Excel或PDF文件
  };

  // 房间统计表格列配置
  const roomColumns = [
    {
      title: '房间名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '预订次数',
      dataIndex: 'bookings',
      key: 'bookings',
      sorter: (a, b) => a.bookings - b.bookings,
    },
    {
      title: '使用率',
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
      title: '收入',
      dataIndex: 'revenue',
      key: 'revenue',
      render: (revenue) => `¥${revenue}`,
      sorter: (a, b) => a.revenue - b.revenue,
    },
  ];

  // 用户统计表格列配置
  const userColumns = [
    {
      title: '用户名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: '预订次数',
      dataIndex: 'bookings',
      key: 'bookings',
      sorter: (a, b) => a.bookings - b.bookings,
    },
    {
      title: '最后活跃',
      dataIndex: 'lastActive',
      key: 'lastActive',
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
    },
  ];

  return (
    <div>
      <Title level={2}>统计报表</Title>
      <Paragraph>
        查看系统的各项统计数据和分析报表，了解预订情况和使用趋势。
      </Paragraph>

      {/* 筛选控件 */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Space>
              <span>时间范围:</span>
              <RangePicker
                value={dateRange}
                onChange={setDateRange}
                format="YYYY-MM-DD"
              />
            </Space>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space>
              <span>统计维度:</span>
              <Select
                value={selectedMetric}
                onChange={setSelectedMetric}
                style={{ width: 120 }}
              >
                <Option value="bookings">预订数</Option>
                <Option value="revenue">收入</Option>
                <Option value="utilization">使用率</Option>
                <Option value="users">用户数</Option>
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={24} md={8}>
            <Button 
              type="primary" 
              icon={<DownloadOutlined />}
              onClick={exportReport}
            >
              导出报表
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 概览统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总预订数"
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
              title="活跃用户"
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
              title="总收入"
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
              title="平均使用率"
              value={statsData.utilizationRate}
              suffix="%"
              prefix={<PieChartOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* 房间统计 */}
        <Col xs={24} lg={14}>
          <Card 
            title="房间使用统计" 
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

        {/* 用户活跃度统计 */}
        <Col xs={24} lg={10}>
          <Card title="活跃用户统计">
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

      {/* 趋势图区域 - 预留给图表组件 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="使用趋势图" extra="近30天">
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
                图表组件位置
                <br />
                <small>可以集成 ECharts、D3.js 等图表库</small>
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default StatisticsPage;
