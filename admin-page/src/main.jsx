/**
 * main.jsx - React Application Entry Point
 * 
 * This file serves as the entry point for the React application.
 * It configures internationalization (i18n) support and renders the main App component.
 * 
 * Features:
 * - Ant Design ConfigProvider for English UI localization
 * - Day.js configuration for English date formatting
 * - React StrictMode for development best practices
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import dayjs from 'dayjs';
import 'dayjs/locale/en';

import App from './App.jsx';
import './assets/styles/index.css';

// Configure dayjs to use English locale
dayjs.locale('en');

// Render the React application with English localization
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ConfigProvider locale={enUS}>
      <App />
    </ConfigProvider>
  </React.StrictMode>,
);
