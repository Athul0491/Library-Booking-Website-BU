// 应用程序入口文件
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

import App from './App.jsx';
import './assets/styles/index.css';

// Settings dayjs 中文locale
dayjs.locale('zh-cn');

/**
 * 应用程序根组件渲染
 * 使用 Ant Design 的 ConfigProvider 提供中文国际化Support
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
