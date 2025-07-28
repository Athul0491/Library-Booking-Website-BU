/**
 * Data Source Configuration Component
 * Allows users to configure data source mode and auto-refresh settings
 */
import React from 'react';
import {
  Card,
  Space,
  Switch,
  Select,
  Radio,
  Typography,
  Divider,
  Tag,
  Tooltip,
  InputNumber,
  Alert
} from 'antd';
import {
  ApiOutlined,
  DatabaseOutlined,
  ExperimentOutlined,
  ReloadOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useDataSource, DATA_SOURCE_MODES } from '../contexts/DataSourceContext';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const DataSourceConfig = () => {
  const {
    dataSourceMode,
    setDataSourceMode,
    dataSourceLabel,
    dataSourceDescription,
    autoRefreshEnabled,
    setAutoRefreshEnabled,
    refreshInterval,
    setRefreshInterval,
    isBackendProxyMode,
    isDirectSupabaseMode,
    isMockDataMode
  } = useDataSource();

  const dataSourceOptions = [
    {
      value: DATA_SOURCE_MODES.BACKEND_PROXY,
      label: 'Backend Proxy',
      description: 'Optimized and secure API calls through backend server',
      icon: <ApiOutlined />,
      color: 'green',
      recommended: true
    },
    {
      value: DATA_SOURCE_MODES.DIRECT_SUPABASE,
      label: 'Direct Supabase',
      description: 'Direct connection to Supabase database (legacy mode)',
      icon: <DatabaseOutlined />,
      color: 'blue',
      recommended: false
    },
    {
      value: DATA_SOURCE_MODES.MOCK_DATA,
      label: 'Mock Data',
      description: 'Demo data for testing and development purposes',
      icon: <ExperimentOutlined />,
      color: 'orange',
      recommended: false
    }
  ];

  const refreshIntervalOptions = [
    { value: 30000, label: '30 seconds' },
    { value: 60000, label: '1 minute' },
    { value: 120000, label: '2 minutes' },
    { value: 300000, label: '5 minutes' },
    { value: 600000, label: '10 minutes' }
  ];

  const handleDataSourceChange = (e) => {
    setDataSourceMode(e.target.value);
  };

  const handleRefreshIntervalChange = (value) => {
    setRefreshInterval(value);
  };

  const getCurrentModeInfo = () => {
    return dataSourceOptions.find(option => option.value === dataSourceMode);
  };

  const currentMode = getCurrentModeInfo();

  return (
    <Card 
      title={
        <Space>
          <ApiOutlined />
          <span>Data Source Configuration</span>
        </Space>
      }
      size="small"
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Current Status */}
        <Alert
          message={
            <Space>
              <span>Current Mode:</span>
              <Tag color={currentMode?.color} icon={currentMode?.icon}>
                {currentMode?.label}
                {currentMode?.recommended && <span> (Recommended)</span>}
              </Tag>
            </Space>
          }
          description={currentMode?.description}
          type={isBackendProxyMode ? 'success' : isMockDataMode ? 'warning' : 'info'}
          showIcon
        />

        {/* Data Source Selection */}
        <div>
          <Title level={5}>
            <DatabaseOutlined /> Data Source Mode
          </Title>
          <Radio.Group 
            value={dataSourceMode} 
            onChange={handleDataSourceChange}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {dataSourceOptions.map(option => (
                <Radio 
                  key={option.value} 
                  value={option.value}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    padding: '8px',
                    border: dataSourceMode === option.value ? '1px solid #1890ff' : '1px solid transparent',
                    borderRadius: '6px',
                    backgroundColor: dataSourceMode === option.value ? '#f6ffed' : 'transparent'
                  }}
                >
                  <Space direction="vertical" size="small" style={{ marginLeft: '8px' }}>
                    <Space>
                      {option.icon}
                      <Text strong>{option.label}</Text>
                      {option.recommended && <Tag color="green" size="small">Recommended</Tag>}
                    </Space>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {option.description}
                    </Text>
                  </Space>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </div>

        <Divider />

        {/* Auto Refresh Settings */}
        <div>
          <Title level={5}>
            <ReloadOutlined /> Auto Refresh Settings
          </Title>
          
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <Space>
              <Switch
                checked={autoRefreshEnabled}
                onChange={setAutoRefreshEnabled}
                disabled={isMockDataMode}
              />
              <Text>Enable automatic data refresh</Text>
              {isMockDataMode && (
                <Tooltip title="Auto refresh is disabled for mock data mode">
                  <Text type="secondary">(disabled for mock data)</Text>
                </Tooltip>
              )}
            </Space>

            {autoRefreshEnabled && !isMockDataMode && (
              <Space>
                <ClockCircleOutlined />
                <Text>Refresh interval:</Text>
                <Select
                  value={refreshInterval}
                  onChange={handleRefreshIntervalChange}
                  style={{ width: 120 }}
                  size="small"
                >
                  {refreshIntervalOptions.map(option => (
                    <Option key={option.value} value={option.value}>
                      {option.label}
                    </Option>
                  ))}
                </Select>
              </Space>
            )}
          </Space>
        </div>

        {/* Performance Recommendations */}
        {isBackendProxyMode && (
          <Alert
            message="Performance Optimized"
            description="Backend proxy mode provides the best performance with optimized API calls and reduced network overhead."
            type="success"
            showIcon
          />
        )}

        {isDirectSupabaseMode && (
          <Alert
            message="Legacy Mode"
            description="Direct Supabase mode is provided for compatibility. Consider switching to Backend Proxy for better performance and security."
            type="warning"
            showIcon
          />
        )}
      </Space>
    </Card>
  );
};

export default DataSourceConfig;
