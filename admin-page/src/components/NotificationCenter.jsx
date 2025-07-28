/**
 * Notification Center Component
 * Displays system notifications for connection status, API errors, etc.
 */
import React from 'react';
import { 
  notification, 
  List, 
  Card, 
  Space, 
  Typography, 
  Button, 
  Tag, 
  Badge,
  Popover,
  Empty
} from 'antd';
import { 
  BellOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  CloseCircleOutlined,
  DeleteOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { useDataSource } from '../contexts/DataSourceContext';

const { Text } = Typography;

const NotificationCenter = () => {
  const { 
    notifications, 
    removeNotification, 
    clearNotifications 
  } = useDataSource();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <BellOutlined />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // Less than 1 minute
      return 'Just now';
    } else if (diff < 3600000) { // Less than 1 hour
      return `${Math.floor(diff / 60000)} minutes ago`;
    } else if (diff < 86400000) { // Less than 1 day
      return `${Math.floor(diff / 3600000)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const notificationContent = (
    <div style={{ width: 350, maxHeight: 400, overflow: 'auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 8,
        borderBottom: '1px solid #f0f0f0'
      }}>
        <Text strong>System Notifications</Text>
        {notifications.length > 0 && (
          <Button 
            type="text" 
            size="small" 
            icon={<ClearOutlined />}
            onClick={clearNotifications}
          >
            Clear
          </Button>
        )}
      </div>
      
      {notifications.length === 0 ? (
        <Empty 
          description="No notifications" 
          style={{ margin: '20px 0' }}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          size="small"
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              style={{ padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}
              actions={[
                <Button 
                  type="text" 
                  size="small" 
                  icon={<DeleteOutlined />}
                  onClick={() => removeNotification(item.id)}
                />
              ]}
            >
              <List.Item.Meta
                avatar={getNotificationIcon(item.type)}
                title={
                  <Space>
                    <Text strong style={{ fontSize: '13px' }}>
                      {item.title}
                    </Text>
                    <Tag 
                      color={getNotificationColor(item.type)} 
                      size="small"
                    >
                      {item.type === 'success' ? 'Success' : 
                       item.type === 'warning' ? 'Warning' : 
                       item.type === 'error' ? 'Error' : 'Info'}
                    </Tag>
                  </Space>
                }
                description={
                  <div>
                    <Text style={{ fontSize: '12px', display: 'block' }}>
                      {item.message}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '11px' }}>
                      {formatTime(item.timestamp)}
                    </Text>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </div>
  );

  return (
    <Popover
      content={notificationContent}
      title={null}
      trigger="click"
      placement="bottomRight"
      overlayStyle={{ zIndex: 1050 }}
    >
      <Badge count={notifications.length} size="small" offset={[-2, 2]}>
        <Button 
          type="text" 
          icon={<BellOutlined />} 
          style={{ fontSize: '16px' }}
        />
      </Badge>
    </Popover>
  );
};

export default NotificationCenter;
