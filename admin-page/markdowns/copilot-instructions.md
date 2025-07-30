# GitHub Copilot Project Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a React.js admin dashboard for a library booking management system, using Vite as the build tool.

## Tech Stack
- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **UI Library**: Ant Design (antd)
- **Routing**: React Router DOM
- **Calendar Component**: FullCalendar
- **Date Processing**: Day.js
- **State Management**: React Hooks (useState, useEffect)

## Project Structure
```
src/
├─ components/          # Reusable components
├─ layouts/            # Layout components
├─ pages/              # Page components
├─ services/           # API services and Mock data
└─ App.jsx            # Root component
```

## Code Standards
1. Use functional components and React Hooks
2. All code must include detailed English comments
3. Component names use PascalCase
4. File names use PascalCase
5. Use Ant Design component library components
6. API calls use real data sources (Supabase + bub-backend), with mock data fallback

## Data Sources
- Real API services with unified architecture
- Supabase for building/room data
- bub-backend proxy for LibCal API integration
- Mock data fallback for offline development

## Feature Modules
1. **Dashboard** - Overview statistics
2. **Location Management** - Manage library locations/rooms
3. **Booking Management** - View and manage time slot bookings
4. **Availability Control** - Set time slot availability
5. **Statistics Reports** - Booking and usage statistics

## Component Development Guidelines
- Each component should have clear props interface
- Use TypeScript type annotations (when applicable)
- Include loading state handling
- Error handling and user-friendly error messages
- Responsive design support
