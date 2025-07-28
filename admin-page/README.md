# BU Library Admin Dashboard

Professional admin dashboard for managing BU Library room bookings with real-time data integration.

## 🚀 Features

- **Connection-Aware Architecture**: Intelligent connection status monitoring
- **Skeleton Loading**: Professional loading states with skeleton components
- **Real-time Data**: Integration with Supabase and BU LibCal API
- **Multi-Service Integration**: Connects to bu-book and bub-backend systems
- **Responsive Design**: Mobile-friendly Ant Design interface

## 📁 Project Structure

```
admin-page/
├── src/
│   ├── components/
│   │   └── SkeletonComponents.jsx    # Loading skeleton components
│   ├── contexts/
│   │   └── ConnectionContext.jsx     # Connection state management
│   ├── pages/
│   │   ├── DashboardPage.jsx         # System overview
│   │   ├── BookingsPage.jsx          # Booking management
│   │   ├── LocationsPage.jsx         # Location management
│   │   ├── StatisticsPage.jsx        # Analytics & reports
│   │   ├── AvailabilityPage.jsx      # Availability management
│   │   └── DataMonitorPage.jsx       # Data monitoring
│   ├── services/
│   │   ├── supabaseClient.js         # Supabase connection
│   │   ├── bookingService.js         # Booking operations
│   │   ├── locationService.js        # Location data
│   │   ├── statsService.js           # Statistics
│   │   ├── apiService.js             # LibCal API integration
│   │   └── dataMonitorService.js     # Data monitoring
│   └── layouts/
│       └── MainLayout.jsx            # Main application layout
├── public/
└── package.json
```

## 🛠️ Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Supabase credentials
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

## 🔧 Configuration

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BACKEND_API_URL=http://localhost:5000
```

### Connection Context

The application uses a centralized connection context that monitors:
- Supabase database connection
- Backend API availability  
- Real-time connection status

## 📊 API Integration

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for detailed API specifications.

## 🎨 UI Components

- **ConnectionStatus**: Real-time connection indicator
- **TableSkeleton**: Loading state for tables
- **PageLoadingSkeleton**: Full page loading state
- **DataUnavailablePlaceholder**: Error/offline state

## 📱 Responsive Design

Built with Ant Design for professional appearance across all devices.

## 🔗 Related Projects

- [bu-book](../bu-book/): Main booking interface
- [bub-backend](../bub-backend/): Python backend API
