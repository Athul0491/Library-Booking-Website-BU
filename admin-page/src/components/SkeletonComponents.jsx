/**
 * Skeleton Components
 * 用于显示加载状态和连接错误状态
 */
import React from 'react';
import { Card, Skeleton, Alert, Button, Space, Table } from 'antd';
import { ReloadOutlined, DatabaseOutlined, CloudServerOutlined } from '@ant-design/icons';

// 基础骨架屏组件
export const BaseSkeleton = ({ rows = 3, loading = true }) => (
  <Card>
    <Skeleton active loading={loading} paragraph={{ rows }} />
  </Card>
);

// 表格骨架屏
export const TableSkeleton = ({ columns = 4, rows = 6 }) => {
  const skeletonColumns = Array.from({ length: columns }, (_, index) => ({
    title: <Skeleton.Input style={{ width: 100 }} active size="small" />,
    dataIndex: `col${index}`,
    key: `col${index}`,
    render: () => <Skeleton.Input active size="small" />
  }));

  const skeletonData = Array.from({ length: rows }, (_, index) => ({
    key: index,
    ...Object.fromEntries(
      Array.from({ length: columns }, (_, i) => [`col${i}`, null])
    )
  }));

  return (
    <Table
      columns={skeletonColumns}
      dataSource={skeletonData}
      pagination={false}
      loading={false}
    />
  );
};

// 统计卡片骨架屏
export const StatCardSkeleton = () => (
  <Card>
    <Skeleton.Input style={{ width: '100%', height: 20 }} active />
    <br />
    <br />
    <Skeleton.Input style={{ width: '60%', height: 40 }} active />
  </Card>
);

// 连接状态提示组件
export const ConnectionStatus = ({ 
  supabaseStatus, 
  backendStatus, 
  onRefresh, 
  loading = false 
}) => {
  const getStatusType = (status) => {
    if (status.configured && status.connected) return 'success';
    if (status.configured && !status.connected) return 'error';
    return 'warning';
  };

  const getBackendType = (status) => {
    return status.available ? 'success' : 'error';
  };

  return (
    <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
      {/* Supabase状态 */}
      <Alert
        message={
          <Space>
            <DatabaseOutlined />
            数据库连接状态
          </Space>
        }
        description={
          supabaseStatus.configured
            ? supabaseStatus.connected
              ? '✅ Supabase数据库连接正常'
              : `❌ 数据库连接失败: ${supabaseStatus.error}`
            : '⚠️ Supabase数据库未配置，使用演示数据'
        }
        type={getStatusType(supabaseStatus)}
        showIcon
      />

      {/* 后端服务器状态 */}
      <Alert
        message={
          <Space>
            <CloudServerOutlined />
            后端服务器状态
          </Space>
        }
        description={
          backendStatus.available
            ? '✅ 后端服务器连接正常 (localhost:5000)'
            : `❌ 无法连接到后端服务器: ${backendStatus.error || 'localhost:5000 不可用'}`
        }
        type={getBackendType(backendStatus)}
        showIcon
        action={
          <Button
            size="small"
            icon={<ReloadOutlined />}
            onClick={onRefresh}
            loading={loading}
          >
            重试连接
          </Button>
        }
      />
    </Space>
  );
};

// 数据不可用时的占位符
export const DataUnavailablePlaceholder = ({ 
  title = "数据不可用", 
  description = "无法连接到数据源",
  onRefresh 
}) => (
  <Card>
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <DatabaseOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
      <h3 style={{ color: '#999' }}>{title}</h3>
      <p style={{ color: '#666', marginBottom: '24px' }}>{description}</p>
      {onRefresh && (
        <Button
          type="primary"
          icon={<ReloadOutlined />}
          onClick={onRefresh}
        >
          重新加载
        </Button>
      )}
    </div>
  </Card>
);

// 加载中的页面布局
export const PageLoadingSkeleton = ({ title }) => (
  <div>
    <div style={{ marginBottom: 16 }}>
      <Skeleton.Input style={{ width: 200, height: 32 }} active />
    </div>
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <BaseSkeleton rows={2} />
      <TableSkeleton />
    </Space>
  </div>
);

export default {
  BaseSkeleton,
  TableSkeleton,
  StatCardSkeleton,
  ConnectionStatus,
  DataUnavailablePlaceholder,
  PageLoadingSkeleton
};
