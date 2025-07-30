/**
 * Connection Status Component
 * Displays the current connection status for backend and data sources
 */
import React from 'react';
import { Card, Badge, Space, Typography, Button, Tag, Tooltip, Alert } from 'antd';
import { 
  ApiOutlined, 
  DatabaseOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';
import { useDataSource } from '../contexts/DataSourceContext';
import { useConnection } from '../contexts/ConnectionContext';

const { Text, Paragraph } = Typography;

const ConnectionStatus = ({ showDetails = true, compact = false, customStatus = null, onRefresh = null }) => {
  const { 
    connectionStatus: dataSourceConnectionStatus, 
    testConnection, 
    dataSourceMode, 
    dataSourceLabel,
    isBackendProxyMode,
    isDirectSupabaseMode,
    isMockDataMode 
  } = useDataSource();

  // Get real connection status from ConnectionContext
  const {
    connectionStatus: realConnectionStatus,
    refreshConnections,
    isSupabaseConnected,
    isBackendConnected,
    isLoading
  } = useConnection();

  // Use custom status if provided, otherwise use real connection status
  const currentStatus = customStatus || {
    apiStatus: realConnectionStatus.backend.connected ? 'connected' : 'disconnected',
    connectionDetails: {
      backend: realConnectionStatus.backend.connected ? 'healthy' : 'unhealthy',
      database: realConnectionStatus.supabase.connected ? 'healthy' : 'unhealthy',
      lastUpdated: realConnectionStatus.lastFullCheck,
      responseTime: null
    },
    isConnecting: isLoading
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'degraded':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'unhealthy':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <QuestionCircleOutlined style={{ color: '#d9d9d9' }} />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'healthy':
        return 'Healthy';
      case 'degraded':
        return 'Degraded';
      case 'unhealthy':
        return 'Unhealthy';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'degraded':
        return 'warning';
      case 'unhealthy':
        return 'error';
      default:
        return 'default';
    }
  };

  // Map apiStatus to legacy status format
  const mapApiStatusToLegacy = (apiStatus) => {
    switch (apiStatus) {
      case 'connected':
        return 'healthy';
      case 'connecting':
        return 'degraded';
      case 'error':
        return 'unhealthy';
      default:
        return 'unknown';
    }
  };

  // Get effective backend and supabase status
  const effectiveBackendStatus = customStatus 
    ? mapApiStatusToLegacy(currentStatus.apiStatus)
    : (realConnectionStatus.backend.connected ? 'healthy' : 'unhealthy');
  
  const effectiveSupabaseStatus = customStatus
    ? (currentStatus.connectionDetails.database === 'connected' ? 'healthy' : 
       currentStatus.connectionDetails.database === 'error' ? 'unhealthy' :
       currentStatus.connectionDetails.database === 'connecting' ? 'degraded' :
       currentStatus.apiStatus === 'connected' ? 'healthy' :
       currentStatus.apiStatus === 'connecting' ? 'degraded' : 'unhealthy')
    : (realConnectionStatus.supabase.connected ? 'healthy' : 'unhealthy');

  if (compact) {
    return (
      <Space size="small">
        <Badge 
          status={getStatusColor(effectiveBackendStatus)} 
          text={
            <Space size="small">
              <ApiOutlined />
              <Text style={{ fontSize: '12px' }} title={`Backend API Status${currentStatus.connectionDetails.responseTime ? ` - ${currentStatus.connectionDetails.responseTime}ms` : ''}`}>
                Backend: {getStatusText(effectiveBackendStatus)}
                {currentStatus.isConnecting && ' (Connecting...)'}
              </Text>
            </Space>
          }
        />
        
        {isBackendProxyMode && (
          <Badge 
            status={getStatusColor(effectiveSupabaseStatus)} 
            text={
              <Space size="small">
                <DatabaseOutlined />
                <Text style={{ fontSize: '12px' }} title={`Database Connection Status${currentStatus.connectionDetails.lastUpdated ? ` - Updated: ${new Date(currentStatus.connectionDetails.lastUpdated).toLocaleTimeString()}` : ''}`}>
                  Supabase: {getStatusText(effectiveSupabaseStatus)}
                </Text>
              </Space>
            }
          />
        )}
        
        <Button 
          type="text" 
          size="small" 
          icon={<ReloadOutlined />}
          onClick={onRefresh || refreshConnections}
          title={onRefresh ? "Refresh Global Data" : "Test Connection"}
          loading={isLoading}
        />
      </Space>
    );
  }

  if (!showDetails) {
    return null;
  }

  return (
    <Card 
      title={
        <Space>
          <ApiOutlined />
          Connection Status
        </Space>
      }
      size="small"
      extra={
        <Button 
          type="text" 
          size="small" 
          icon={<ReloadOutlined />}
          onClick={onRefresh || refreshConnections}
          loading={isLoading}
        >
          {onRefresh ? "Refresh Global" : "Refresh"}
        </Button>
      }
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* Current Data Source */}
        <div>
          <Text strong>Current Data Source: </Text>
          <Tag color={isMockDataMode ? 'orange' : isBackendProxyMode ? 'blue' : 'green'}>
            {dataSourceLabel}
          </Tag>
        </div>

        {/* Backend Status */}
        {!isMockDataMode && (
          <div>
            <Space>
              {getStatusIcon(effectiveBackendStatus)}
              <Text strong>Backend Server: </Text>
              <Tag color={getStatusColor(effectiveBackendStatus)}>
                {getStatusText(effectiveBackendStatus)}
                {currentStatus.isConnecting && ' (Connecting...)'}
              </Tag>
              {currentStatus.connectionDetails.responseTime && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {currentStatus.connectionDetails.responseTime}ms
                </Text>
              )}
            </Space>
            
            {currentStatus.connectionDetails.lastUpdated && (
              <div style={{ marginLeft: '24px', marginTop: '4px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Last Updated: {new Date(currentStatus.connectionDetails.lastUpdated).toLocaleString()}
                </Text>
              </div>
            )}
            
            {realConnectionStatus.backend.error && (
              <div style={{ marginLeft: '24px', marginTop: '4px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Error: {realConnectionStatus.backend.error}
                </Text>
              </div>
            )}
          </div>
        )}

        {/* Supabase Status (when using backend proxy) */}
        {isBackendProxyMode && !isMockDataMode && (
          <div>
            <Space>
              {getStatusIcon(effectiveSupabaseStatus)}
              <Text strong>Supabase Database: </Text>
              <Tag color={getStatusColor(effectiveSupabaseStatus)}>
                {getStatusText(effectiveSupabaseStatus)}
              </Tag>
            </Space>
          </div>
        )}

        {/* Last Check Time */}
        {realConnectionStatus.lastFullCheck && (
          <div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Last Check: {new Date(realConnectionStatus.lastFullCheck).toLocaleTimeString()}
            </Text>
          </div>
        )}

        {/* Connection Issues Alert */}
        {(!realConnectionStatus.backend.connected || !realConnectionStatus.supabase.connected) && (
          <Alert
            message="Connection Issues"
            description="Some services are inaccessible, which may affect data retrieval. Please check network connection or contact administrator."
            type="warning"
            showIcon
            style={{ marginTop: '8px' }}
          />
        )}

        {/* Mock Data Notice */}
        {isMockDataMode && (
          <Alert
            message="Mock Data Mode"
            description="Currently using mock data, will not connect to real data sources."
            type="info"
            showIcon
          />
        )}
      </Space>
    </Card>
  );
};

export default ConnectionStatus;
