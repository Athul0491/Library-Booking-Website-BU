# Library Booking Website - Boston University

<div align="center">
  <img src="https://img.shields.io/badge/React-18.0+-blue" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.0+-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/Python-3.9+-green" alt="Python">
  <img src="https://img.shields.io/badge/Flask-2.0+-green" alt="Flask">
  <img src="https://img.shields.io/badge/Supabase-Database-orange" alt="Supabase">
</div>

## 📚 Overview

A comprehensive library room booking system for Boston University students and faculty. This platform provides real-time room availability, seamless booking management, and administrative tools for library staff.

### 🎯 Key Features

- **Real-time Room Availability**: Live updates from LibCal API integration
- **Interactive Map Interface**: Visual room selection with Mapbox integration
- **Multi-language Support**: English and Chinese language options
- **Admin Dashboard**: Comprehensive room and booking management
- **Responsive Design**: Mobile-friendly interface for all devices
- **Analytics & Statistics**: Usage tracking and reporting tools

## 🏗️ Project Structure

```
Library-Booking-Website-BU/
├── admin-page/          # Admin dashboard (React + Vite)
├── bu-book/            # Main booking interface (React + TypeScript)
├── bub-backend/        # Flask backend API
└── README.md
```

### 📦 Frontend Applications

#### **bu-book** - Main Booking Interface
- **Tech Stack**: React 18, TypeScript, Vite
- **Features**: Room browsing, booking management, user interface
- **UI Library**: Ant Design, Mapbox GL JS
- **Port**: 5173 (development)

#### **admin-page** - Administrative Dashboard
- **Tech Stack**: React 18, JavaScript, Vite
- **Features**: Room management, booking oversight, analytics
- **UI Library**: Ant Design
- **Port**: 5174 (development)

### 🖥️ Backend Services

#### **bub-backend** - API Server
- **Tech Stack**: Python 3.9+, Flask, Supabase
- **Features**: LibCal integration, database management, API endpoints
- **Database**: Supabase (PostgreSQL)
- **Port**: 5000 (development)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0+ and npm
- **Python** 3.9+ and pip
- **Git** for version control

### 1. Clone Repository

```bash
git clone https://github.com/BarryShengyu/Library-Booking-Website-BU.git
cd Library-Booking-Website-BU
```

### 2. Backend Setup

```bash
cd bub-backend
pip install -r requirements.txt
python main.py
```

The backend API will be available at `http://localhost:5000`

### 3. Main Frontend Setup (bu-book)

```bash
cd bu-book
npm install
npm run dev
```

The main application will be available at `http://localhost:5173`

### 4. Admin Dashboard Setup (admin-page)

```bash
cd admin-page
npm install
npm run dev
```

The admin dashboard will be available at `http://localhost:5174`

## 🎨 Features Overview

### 👥 User Features

- **Browse Rooms**: Visual map interface with real-time availability
- **Search & Filter**: Find rooms by building, capacity, amenities
- **Make Bookings**: Simple reservation process with confirmation
- **Manage Reservations**: View, modify, or cancel existing bookings
- **Multi-language**: Switch between English and Chinese

### 🔧 Admin Features

- **Room Management**: Add, edit, and configure study rooms
- **Booking Oversight**: Monitor all reservations and usage
- **Analytics Dashboard**: Usage statistics and reporting
- **Maintenance Scheduling**: Manage room maintenance and closures
- **User Management**: Handle user accounts and permissions

### 📱 Technical Features

- **Real-time Updates**: Live synchronization with LibCal API
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Performance Optimized**: Lazy loading, code splitting, caching
- **Error Handling**: Comprehensive error reporting and recovery
- **Accessibility**: WCAG compliant interface design

## 🛠️ Development

### Available Scripts

#### Backend (bub-backend)
```bash
python main.py          # Start development server
```

#### Frontend (bu-book & admin-page)
```bash
npm run dev             # Start development server
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # Run ESLint
```

### 🔌 API Integration

The system integrates with:
- **LibCal API**: Real-time room availability and booking data
- **Supabase**: Database operations and authentication
- **Mapbox**: Interactive maps for room visualization

### 🌐 Environment Configuration

Create `.env` files in respective directories:

**bub-backend/.env**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
LIBCAL_API_KEY=your_libcal_key
```

**bu-book/.env**
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_MAPBOX_TOKEN=your_mapbox_token
```

## 📁 Project Architecture

### Frontend Architecture
- **Component-based**: Modular React components
- **State Management**: React Context API
- **Routing**: React Router v6
- **Styling**: CSS Modules + Ant Design
- **API Layer**: Axios with request/response interceptors

### Backend Architecture
- **RESTful API**: Flask with structured endpoints
- **Database Layer**: Supabase integration
- **External APIs**: LibCal API integration
- **Error Handling**: Centralized error management
- **CORS**: Configured for frontend origins

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style and conventions
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Ensure responsive design compatibility

## 📋 API Documentation

### Core Endpoints

#### Buildings
- `GET /api/buildings` - List all library buildings
- `GET /api/buildings/{id}` - Get building details

#### Rooms
- `GET /api/rooms` - List all study rooms
- `GET /api/rooms/{id}` - Get room details
- `POST /api/admin/v1/rooms` - Create new room (admin)
- `PUT /api/admin/v1/rooms/{id}` - Update room (admin)

#### Availability
- `GET /api/availability` - Get real-time availability
- `GET /api/availability/{room_id}` - Get room-specific availability

### Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Success",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 🐛 Troubleshooting

### Common Issues

**Backend Connection Issues**
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Verify environment variables
python -c "import os; print(os.getenv('SUPABASE_URL'))"
```

**Frontend Build Issues**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run type-check
```

**Database Connection Issues**
- Verify Supabase credentials in environment variables
- Check database connection and table structure
- Ensure proper row-level security policies

## 📊 Performance Monitoring

The application includes:
- **Error Tracking**: Console error logging
- **Performance Metrics**: React DevTools integration
- **API Monitoring**: Request/response timing
- **User Analytics**: Usage pattern tracking

## 🛡️ Security Features

- **Input Validation**: Server-side validation for all inputs
- **CORS Configuration**: Properly configured cross-origin requests
- **Environment Variables**: Secure credential management
- **SQL Injection Protection**: Parameterized queries
- **XSS Prevention**: Input sanitization

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 👨‍💻 Development Team

- **Project Lead**: Barry Shengyu
- **Frontend Development**: React/TypeScript specialists
- **Backend Development**: Python/Flask developers
- **UI/UX Design**: Ant Design implementation

## 📞 Support

For support and questions:
- **Issues**: Use GitHub Issues for bug reports
- **Documentation**: Check project wiki
- **Contact**: Reach out to project maintainers

---

<div align="center">
  <p>Built with ❤️ for Boston University Library System</p>
  <p>© 2024 Boston University - Library Booking System</p>
</div>
