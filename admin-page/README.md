# BU Library Admin Dashboard

Professional admin dashboard for managing BU Library room bookings with direct Supabase integration.

## 🚀 Features

- **Direct Supabase Integration**: Now uses Supabase directly instead of backend proxy
- **Connection-Aware Architecture**: Intelligent connection status monitoring
- **Skeleton Loading**: Professional loading states with skeleton components
- **Real-time Data**: Direct integration with Supabase database
- **Serverless Architecture**: No need for separate backend server
- **Responsive Design**: Mobile-friendly Ant Design interface

## � Migration Status

**✅ MIGRATED TO SUPABASE** - This project has been successfully migrated from Flask backend to direct Supabase API calls.

### What Changed:
- Removed dependency on `bub-backend` Python server
- Updated `apiService.js` to use `supabaseService.js` directly
- Environment variables now use `VITE_SUPABASE_*` instead of `VITE_BACKEND_URL`
- All API methods now call Supabase database directly

## �📁 Project Structure

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
│   │   ├── apiService.js             # Main API service (now uses Supabase)
│   │   ├── supabaseService.js        # Direct Supabase operations
│   │   ├── locationService.js        # Location management
│   │   ├── bookingService.js         # Booking operations
│   │   └── statsService.js           # Statistics & analytics
│   └── lib/
│       └── supabase.js               # Supabase client configuration
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
   # Environment is already configured with real Supabase credentials
   # Check .env.local file for current configuration
   # See SUPABASE_SETUP_GUIDE.md for detailed setup instructions
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

See [API_DOCUMENTATION.md](./markdowns/API_DOCUMENTATION.md) for detailed API specifications.

## 📚 Technical Documentation

All technical documentation has been organized in the [`markdowns/`](./markdowns/) folder:

- **Database**: Field mappings and data structure documentation
- **Geocoding**: Analysis, debugging guides, and fix reports  
- **API**: Integration guides and specifications
- **Supabase**: Setup guides and troubleshooting
- **Development**: Copilot instructions and console cleanup

See [`markdowns/README.md`](./markdowns/README.md) for a complete documentation index.

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
