// 主应用组件 - 图书馆预订管理系统的根组件
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';

// 导入页面组件
import DashboardPage from './pages/DashboardPage';
import LocationsPage from './pages/LocationsPage';
import BookingsPage from './pages/BookingsPage';
import AvailabilityPage from './pages/AvailabilityPage';
import StatisticsPage from './pages/StatisticsPage';

/**
 * 主应用组件
 * 负责路由配置和整体布局
 */
const App = () => {
  return (
    <Router>
      <MainLayout>
        <Routes>
          {/* 默认路由 - 重定向到仪表板 */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 仪表板页面 - 显示系统概览和关键指标 */}
          <Route path="/dashboard" element={<DashboardPage />} />
          
          {/* 场地管理页面 - 管理图书馆房间和场地信息 */}
          <Route path="/locations" element={<LocationsPage />} />
          
          {/* 预订管理页面 - 查看和管理所有预订记录 */}
          <Route path="/bookings" element={<BookingsPage />} />
          
          {/* 时间可用性管理页面 - 控制时间段的开放状态 */}
          <Route path="/availability" element={<AvailabilityPage />} />
          
          {/* 统计报表页面 - 查看各种数据分析和报表 */}
          <Route path="/statistics" element={<StatisticsPage />} />
          
          {/* 404 页面 - 处理未找到的路由 */}
          <Route 
            path="*" 
            element={
              <div style={{ 
                padding: '50px', 
                textAlign: 'center', 
                color: '#999' 
              }}>
                <h2>页面未找到</h2>
                <p>请检查URL地址是否正确</p>
              </div>
            } 
          />
        </Routes>
      </MainLayout>
    </Router>
  );
};

export default App;
