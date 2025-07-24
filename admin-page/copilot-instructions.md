# GitHub Copilot 项目说明

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## 项目概述
这是一个图书馆预订管理系统的 React.js 管理后台，使用 Vite 作为构建工具。

## 技术栈
- **前端框架**: React 18
- **构建工具**: Vite
- **UI 库**: Ant Design (antd)
- **路由**: React Router DOM
- **日历组件**: FullCalendar
- **日期处理**: Day.js
- **状态管理**: React Hooks (useState, useEffect)

## 项目结构
```
src/
├─ components/          # 可复用组件
├─ layouts/            # 布局组件
├─ pages/              # 页面组件
├─ services/           # API 服务和 Mock 数据
└─ App.jsx            # 根组件
```

## 代码规范
1. 使用函数式组件和 React Hooks
2. 所有代码必须包含详细的中文注释
3. 组件名使用 PascalCase
4. 文件名使用 PascalCase
5. 使用 Ant Design 组件库提供的组件
6. API 调用使用 mock 数据，便于后续替换真实 API

## Mock 数据说明
- 所有 API 服务都使用 mock 数据
- 数据库连接字段留空或使用占位符
- 便于开发完成后替换真实的 API 端点

## 功能模块
1. **仪表板** - 概览统计信息
2. **场地管理** - 管理图书馆场地/房间
3. **预订管理** - 查看和管理时段预订
4. **可用性控制** - 设置时段的可用性
5. **统计报表** - 预订和使用统计

## 组件开发指南
- 每个组件都应该有清晰的props接口
- 使用TypeScript类型注释（如果适用）
- 包含loading状态处理
- 错误处理和用户友好的错误信息
- 响应式设计支持
