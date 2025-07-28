# BUB Backend - Library Booking System API

A Flask-based REST API server for the Boston University Library Booking System.

## Features

- **LibCal Integration**: Proxy API for fetching room availability from LibCal
- **Database Operations**: Full CRUD operations for bookings, users, and buildings
- **Anonymous Booking**: Support for anonymous user booking without authentication
- **Monitoring Ready**: Built-in support for system monitoring and logging
- **CORS Enabled**: Cross-origin requests supported for frontend integration

## API Endpoints

### LibCal Proxy
- `POST /api/availability` - Get room availability from LibCal

### Buildings & Rooms
- `GET /api/buildings` - Get all available buildings
- `GET /api/buildings/<short_name>/rooms` - Get rooms for a specific building

### Bookings
- `POST /api/bookings` - Create a new booking
- `GET /api/bookings/<email>` - Get bookings by user email
- `PUT /api/bookings/<booking_id>` - Update booking status (e.g., cancel)

### System
- `GET /api/system-config` - Get system configuration

## Quick Start

### Prerequisites
- Python 3.8+
- PostgreSQL database
- pip (Python package manager)

### Installation

1. **Clone and navigate to backend directory**:
   ```bash
   cd bub-backend
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your database credentials:
   ```
   DB_HOST=localhost
   DB_NAME=library_booking
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_PORT=5432
   ```

4. **Set up database**:
   Run the `database_schema.sql` file in your PostgreSQL database to create all necessary tables.

5. **Start the server**:
   ```bash
   python main.py
   ```
   
   Or use the provided scripts:
   - Linux/Mac: `./start.sh`
   - Windows: `start.bat`

The server will start on `http://localhost:5000`

## Database Schema

The backend uses a PostgreSQL database with the following main tables:
- `Buildings` - Library building information
- `Rooms` - Room details for each building
- `UserProfiles` - Anonymous user profiles
- `Bookings` - Booking records
- `SystemConfig` - System configuration
- Monitoring tables: `AccessLogs`, `SystemStatus`, `ErrorLogs`, etc.

## API Usage Examples

### Get Buildings
```bash
curl http://localhost:5000/api/buildings
```

### Get Rooms for Mugar Library
```bash
curl http://localhost:5000/api/buildings/mug/rooms
```

### Create a Booking
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "user_email": "user@bu.edu",
    "user_name": "John Doe",
    "building_short_name": "mug",
    "room_eid": "12345",
    "booking_date": "2024-01-15",
    "start_time": "10:00",
    "end_time": "12:00",
    "purpose": "Study session"
  }'
```

### Get User Bookings
```bash
curl http://localhost:5000/api/bookings/user@bu.edu
```

### Cancel a Booking
```bash
curl -X PUT http://localhost:5000/api/bookings/booking-id \
  -H "Content-Type: application/json" \
  -d '{
    "status": "cancelled",
    "cancellation_reason": "Change of plans"
  }'
```

## LibCal Availability Endpoint

### `/api/availability` (POST)
Fetches room availability slots from BU LibCal for a given library, date, and time range.

**Request Payload:**
```json
{
  "library": "par",       // First 3 letters of library name (mug, par, pic, sci)
  "start": "2025-07-25",  // Start date (YYYY-MM-DD)
  "end": "2025-07-25",    // End date (YYYY-MM-DD)
  "start_time": "13:00",  // (Optional) Filter start time (HH:MM 24-hour)
  "end_time": "16:00"     // (Optional) Filter end time (HH:MM 24-hour)
}
```

## Development

### Project Structure
```
bub-backend/
├── main.py              # Main Flask application
├── requirements.txt     # Python dependencies
├── .env.example        # Environment variables template
├── start.sh           # Linux/Mac startup script
├── start.bat          # Windows startup script
└── README.md          # This file
```

### Environment Variables
- `DB_HOST` - Database host (default: localhost)
- `DB_NAME` - Database name (default: library_booking)
- `DB_USER` - Database username (default: postgres)
- `DB_PASSWORD` - Database password
- `DB_PORT` - Database port (default: 5432)
- `FLASK_ENV` - Flask environment (development/production)
- `FLASK_DEBUG` - Enable debug mode (True/False)

### Error Handling
The API includes comprehensive error handling:
- Database connection errors
- Invalid request data
- Missing required fields
- Resource not found errors
- LibCal API errors

### CORS Configuration
Cross-Origin Resource Sharing (CORS) is enabled for all origins to support frontend development. In production, configure specific allowed origins.

## Deployment

For production deployment:

1. Set `FLASK_ENV=production` in your environment
2. Configure proper database credentials
3. Use a production WSGI server like Gunicorn:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 main:app
   ```
4. Set up reverse proxy (nginx) for static files and SSL
5. Configure proper CORS origins for security

## Contributing

1. Follow PEP 8 style guidelines
2. Add type hints for new functions
3. Include error handling for database operations
4. Update this README for new endpoints or features
5. Test API endpoints before committing changes
