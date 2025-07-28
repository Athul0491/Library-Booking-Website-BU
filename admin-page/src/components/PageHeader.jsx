// ServerStatusBanner component - Reusable server connection status display
import React from 'react';
import { Card, Space, Tag, Alert } from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ApiOutlined
} from '@ant-design/icons';
import { useConnection } from '../contexts/ConnectionContext';
import { useDataSource } from '../contexts/DataSourceContext';
import ConnectionStatus from './ConnectionStatus';

/**
 * ServerStatusBanner component
 * Reusable server connection status banner for all pages
 * 
 * @param {Object} props
 * @param {Object} props.customStatus - Optional custom API status override
 * @param {boolean} props.showApiStatus - Whether to show the detailed API status card
 * @param {Object} props.style - Additional styles
 */
const ServerStatusBanner = ({ 
  customStatus = null,
  showApiStatus = true,
  style = {}
}) => {
  const connection = useConnection();
  const { dataSourceMode } = useDataSource();

  // Use custom status if provided, otherwise fall back to connection context
  const apiStatus = customStatus?.apiStatus || connection.apiStatus || 'disconnected';
  const connectionDetails = customStatus?.connectionDetails || connection.connectionDetails || {
    backend: 'unknown',
    database: 'unknown',
    lastUpdated: null,
    responseTime: null
  };
  const isConnecting = customStatus?.isConnecting || connection.isConnecting || false;

  return (
    <div style={{ marginBottom: 24, ...style }}>
      {/* Connection Status */}
      <ConnectionStatus 
        showDetails={true} 
        compact={false} 
        style={{ marginBottom: showApiStatus ? 16 : 0 }}
        customStatus={customStatus}
      />

      {/* API Connection Status Indicator (if connecting) */}
      {isConnecting && (
        <Alert
          message="Connecting to Data Service"
          description="Establishing connection to backend API and database services..."
          type="info"
          showIcon
          icon={<ClockCircleOutlined spin />}
          style={{ marginBottom: showApiStatus ? 16 : 0 }}
        />
      )}
      
      {/* Real-time API Status Card */}
      {showApiStatus && (
        <Card size="small">
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
                {dataSourceMode && (
                  <Tag color="blue">
                    Mode: {dataSourceMode}
                  </Tag>
                )}
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
      )}
    </div>
  );
};

export default ServerStatusBanner;
