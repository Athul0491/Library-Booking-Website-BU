// Main layout component - Contains sidebar, top navigation and content area
import React, { useState } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

/**
 * Main layout component
 * Provides the overall layout structure of the application
 */
const MainLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Menu items configuration
  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/locations',
      icon: <EnvironmentOutlined />,
      label: 'Locations',
    },
    {
      key: '/bookings',
      icon: <CalendarOutlined />,
      label: 'Bookings',
    },
    {
      key: '/availability',
      icon: <ClockCircleOutlined />,
      label: 'Availability',
    },
    {
      key: '/statistics',
      icon: <BarChartOutlined />,
      label: 'Statistics',
    },
  ];

  // User menu configuration
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
    },
  ];

  // Handle menu click
  const handleMenuClick = ({ key }) => {
    navigate(key);
  };

  // Handle user menu click
  const handleUserMenuClick = ({ key }) => {
    switch (key) {
      case 'logout':
        // Add logout logic here
        console.log('User logout');
        break;
      case 'profile':
        console.log('Open profile');
        break;
      case 'settings':
        console.log('Open settings');
        break;
      default:
        break;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed} 
        theme="dark"
        width={280}
        collapsedWidth={80}
      >
        {/* Logo area */}
        <div style={{ 
          height: '64px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          borderBottom: '1px solid #001529',
          padding: '0 16px'
        }}>
          <Title 
            level={4} 
            style={{ 
              color: 'white', 
              margin: 0,
              fontSize: collapsed ? '14px' : '16px',
              textAlign: 'center',
              lineHeight: '1.2',
              wordBreak: collapsed ? 'break-all' : 'normal',
              width: '100%'
            }}
          >
            {collapsed ? 'LMS' : 'Library Management System'}
          </Title>
        </div>
        
        {/* Navigation menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ 
            borderRight: 0,
            fontSize: '14px'
          }}
        />
      </Sider>

      <Layout>
        {/* Top navigation bar */}
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,21,41,.08)'
        }}>
          {/* Left side: collapse button and page title */}
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <Text strong style={{ fontSize: '16px' }}>
              {(() => {
                const pageMap = {
                  '/dashboard': 'Dashboard',
                  '/locations': 'Location Management',
                  '/bookings': 'Booking Management', 
                  '/availability': 'Availability Management',
                  '/statistics': 'Statistics & Reports'
                };
                return pageMap[location.pathname] || 'Library Management System';
              })()}
            </Text>
          </Space>

          {/* Right side: notifications and user info */}
          <Space>
            {/* Notification button */}
            <Button 
              type="text" 
              icon={<BellOutlined />} 
              style={{ fontSize: '16px' }}
              onClick={() => console.log('Open notifications')}
            />
            
            {/* User dropdown menu */}
            <Dropdown
              menu={{
                items: userMenuItems,
                onClick: handleUserMenuClick,
              }}
              placement="bottomRight"
              arrow
            >
              <Space style={{ cursor: 'pointer' }}>
                <Avatar size="small" icon={<UserOutlined />} />
                <Text>Administrator</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Main content area */}
        <Content style={{ 
          margin: '16px 24px',
          padding: '24px 32px',
          background: '#fff',
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'auto',
          minHeight: 'calc(100vh - 112px)'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
