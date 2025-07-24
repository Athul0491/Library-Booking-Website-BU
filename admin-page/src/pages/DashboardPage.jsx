// 仪表板页面 - 显示系统概览和关键指标
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
 * 仪表板页面组件
 * 显示系统的关键统计数据和最近活动
 */
const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [recentBookings, setRecentBookings] = useState([]);
  const [popularRooms, setPopularRooms] = useState([]);

  // 组件挂载时获取数据
  useEffect(() => {
    loadDashboardData();
  }, []);

  // 加载仪表板数据
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 获取统计数据
      const [statsData, bookingsData, roomsData] = await Promise.all([
        statsService.getOverviewStats(),
        statsService.getRecentBookings(),
        statsService.getPopularRooms()
      ]);

      setStats(statsData.data || {});
      setRecentBookings(bookingsData.data || []);
      setPopularRooms(roomsData.data || []);
    } catch (error) {
      console.error('加载仪表板数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 最近预订表格列配置
  const bookingColumns = [
    {
      title: '用户',
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
      title: '房间',
      dataIndex: 'roomName',
      key: 'roomName',
    },
    {
      title: '时间',
      dataIndex: 'timeSlot',
      key: 'timeSlot',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusConfig = {
          confirmed: { color: 'green', text: '已确认' },
          pending: { color: 'orange', text: '待确认' },
          cancelled: { color: 'red', text: '已取消' },
        };
        const config = statusConfig[status] || { color: 'default', text: status };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => console.log('查看预订详情:', record)}
        >
          查看
        </Button>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>仪表板</Title>
      <Paragraph>
        欢迎使用图书馆预订管理系统，这里是系统的整体概览和关键指标。
      </Paragraph>

      {/* 统计卡片区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日预订"
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
              title="活跃用户"
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
              title="可用房间"
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
              title="使用率"
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
        {/* 最近预订列表 */}
        <Col xs={24} lg={14}>
          <Card title="最近预订" extra={<Button type="link">查看全部</Button>}>
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

        {/* 热门房间和使用率 */}
        <Col xs={24} lg={10}>
          <Card title="热门房间" style={{ marginBottom: 16 }}>
            <List
              loading={loading}
              dataSource={popularRooms}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    title={item.name}
                    description={`今日预订 ${item.bookings} 次`}
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

          {/* 快速操作区域 */}
          <Card title="快速操作">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button type="primary" block onClick={() => console.log('新增预订')}>
                新增预订
              </Button>
              <Button block onClick={() => console.log('房间管理')}>
                房间管理
              </Button>
              <Button block onClick={() => console.log('导出报表')}>
                导出报表
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
