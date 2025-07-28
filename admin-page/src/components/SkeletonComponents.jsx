/**
 * Skeleton Components
 * Used to display loading states and connection error states
 */
import React from 'react';
import { Card, Skeleton, Alert, Button, Space, Table } from 'antd';
import { ReloadOutlined, DatabaseOutlined, CloudServerOutlined } from '@ant-design/icons';

// Basic skeleton component
export const BaseSkeleton = ({ rows = 3, loading = true }) => (
  <Card>
    <Skeleton active loading={loading} paragraph={{ rows }} />
  </Card>
);

// Table skeleton component
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

// Statistics card skeleton component
export const StatCardSkeleton = () => (
  <Card>
    <Skeleton.Input style={{ width: '100%', height: 20 }} active />
    <br />
    <br />
    <Skeleton.Input style={{ width: '60%', height: 40 }} active />
  </Card>
);

// Connection status indicator component
export const ConnectionStatus = ({ 
  connection,
  supabaseStatus, 
  backendStatus, 
  onRefresh, 
  loading = false,
  style
}) => {
  // Use either the connection object or individual status objects
  const effectiveSupabaseStatus = connection?.supabase || supabaseStatus || {};
  const effectiveBackendStatus = connection?.backend || backendStatus || {};

  const getStatusType = (status) => {
    if (status.configured && status.connected) return 'success';
    if (status.configured && !status.connected) return 'error';
    return 'warning';
  };

  const getBackendType = (status) => {
    return status.connected ? 'success' : 'error';
  };

  return (
    <Space direction="vertical" style={{ width: '100%', marginBottom: 16, ...style }}>
      {/* Supabase Status */}
      <Alert
        message={
          <Space>
            <DatabaseOutlined />
            Database Connection Status
          </Space>
        }
        description={
          effectiveSupabaseStatus.configured
            ? effectiveSupabaseStatus.connected
              ? '✅ Supabase database connection normal'
              : `❌ Database connection failed: ${effectiveSupabaseStatus.error}`
            : '⚠️ Supabase database not configured, using demo data'
        }
        type={getStatusType(effectiveSupabaseStatus)}
        showIcon
      />

      {/* API Server Status */}
      <Alert
        message={
          <Space>
            <CloudServerOutlined />
            API Server Status
          </Space>
        }
        description={
          effectiveBackendStatus.connected
            ? '✅ API connection normal (Supabase REST API)'
            : `❌ Unable to connect to API server: ${effectiveBackendStatus.error || 'Supabase REST API unavailable'}`
        }
        type={getBackendType(effectiveBackendStatus)}
        showIcon
        action={
          onRefresh && (
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              loading={loading}
            >
              Retry Connection
            </Button>
          )
        }
      />
    </Space>
  );
};

// Data unavailable placeholder
export const DataUnavailablePlaceholder = ({ 
  title = "Data Unavailable", 
  description = "Unable to connect to data source",
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
          Reload
        </Button>
      )}
    </div>
  </Card>
);

// Loading page layout skeleton
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
