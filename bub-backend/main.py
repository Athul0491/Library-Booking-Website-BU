import requests
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from flask import Flask, request, jsonify
from flask_cors import CORS
from urllib.parse import urlencode
from datetime import datetime, timedelta
import uuid
import json
from typing import Optional, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('SUPABASE_ANON_KEY')
SUPABASE_SECRET_KEY = os.getenv('SUPABASE_SECRET_KEY')

# Database configuration
DATABASE_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'database': os.getenv('DB_NAME', 'library_booking'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
    'port': os.getenv('DB_PORT', '5432')
}

def get_db_connection():
    """Get database connection with error handling."""
    try:
        conn = psycopg2.connect(**DATABASE_CONFIG)
        conn.autocommit = True
        return conn
    except psycopg2.Error as e:
        print(f"Database connection error: {e}")
        return None

def make_supabase_request(endpoint: str, method: str = 'GET', data: Dict = None, use_secret_key: bool = False):
    """Make a request to Supabase REST API."""
    if not SUPABASE_URL:
        raise ValueError("SUPABASE_URL not configured")
    
    # Choose API key based on operation
    api_key = SUPABASE_SECRET_KEY if use_secret_key and SUPABASE_SECRET_KEY else SUPABASE_ANON_KEY
    if not api_key:
        raise ValueError("Supabase API key not configured")
    
    url = f"{SUPABASE_URL}/rest/v1{endpoint}"
    headers = {
        'apikey': api_key,
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    }
    
    try:
        if method == 'GET':
            response = requests.get(url, headers=headers)
        elif method == 'POST':
            response = requests.post(url, headers=headers, json=data)
        elif method == 'PATCH':
            response = requests.patch(url, headers=headers, json=data)
        elif method == 'DELETE':
            response = requests.delete(url, headers=headers)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")
        
        response.raise_for_status()
        return response.json() if response.content else None
    except requests.exceptions.RequestException as e:
        print(f"Supabase API error: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Response status: {e.response.status_code}")
            print(f"Response content: {e.response.text}")
        raise

# Mapping from 3-letter prefix to Location ID (LID)
LIBRARY_LIDS = {
    "mug": "19336",
    "par": "19818",
    "pic": "18359",
    "sci": "20177"
}
def parse_slot_time(time_str: str):
    """Parse LibCal time string handling different formats."""
    for fmt in ("%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%d %H:%M:%S"):
        try:
            return datetime.strptime(time_str, fmt)
        except ValueError:
            continue
    raise ValueError(f"Unrecognized time format: {time_str}")

@app.route('/api/availability', methods=['POST'])
def proxy_availability():
    try:
        # ✅ Get library + dates from request
        library_code = request.json.get("library", "")
        if not library_code or library_code not in LIBRARY_LIDS:
            return jsonify({"error": "Invalid library prefix"}), 400
        
        lid = LIBRARY_LIDS[library_code]

        start_date = request.json.get("start", datetime.today().strftime("%Y-%m-%d"))
        end_date = request.json.get("end", start_date)
        start_time = request.json.get("start_time", None)
        end_time = request.json.get("end_time", None)

        # ✅ If start == end, bump end by +1 day for LibCal API
        query_end_date = end_date
        if start_date == end_date:
            query_end_date = (datetime.strptime(start_date, "%Y-%m-%d") + timedelta(days=1)).strftime("%Y-%m-%d")

        # ✅ LibCal request
        url = "https://bu.libcal.com/spaces/availability/grid"
        headers = {
            "User-Agent": "Mozilla/5.0",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Origin": "https://bu.libcal.com",
            "Referer": "https://bu.libcal.com/allspaces"
        }
        payload = {
            "lid": lid,
            "gid": "0",
            "eid": "-1",
            "seat": "false",
            "seatId": "0",
            "zone": "0",
            "start": start_date,
            "end": query_end_date,
            "pageIndex": "0",
            "pageSize": "18"
        }

        res = requests.post(url, headers=headers, data=urlencode(payload))
        res.raise_for_status()
        data = res.json()

        # ✅ Filter slots back to original date & requested time range
        filtered_slots = []
        for slot in data.get("slots", []):
            slot_start = parse_slot_time(slot["start"])

            slot_date = slot_start.strftime("%Y-%m-%d")
            slot_time = slot_start.strftime("%H:%M")

            if slot_date == start_date:
                if start_time and slot_time < start_time:
                    continue
                if end_time and slot_time > end_time:
                    continue
                filtered_slots.append(slot)

        data["slots"] = filtered_slots
        return jsonify(data)

    except requests.exceptions.RequestException as e:
        print("LibCal request error:", e)
        return jsonify({"error": str(e)}), 500


# ==============================================
# ADMIN API ENDPOINTS
# ==============================================

@app.route('/api/admin/v1/dashboard', methods=['GET'])
def get_admin_dashboard():
    """Get all data needed for admin dashboard in one call."""
    try:
        dashboard_data = {
            "timestamp": datetime.now().isoformat(),
            "buildings": [],
            "stats": {
                "total_buildings": 0,
                "total_rooms": 0,
                "active_bookings": 0
            }
        }
        
        # Get buildings data
        if SUPABASE_URL and SUPABASE_ANON_KEY:
            print("Admin Dashboard: Fetching buildings from Supabase")
            buildings = make_supabase_request('/buildings?select=*&available=eq.true&order=name')
            dashboard_data["buildings"] = buildings
            dashboard_data["stats"]["total_buildings"] = len(buildings)
            
            # Get total rooms count
            rooms = make_supabase_request('/rooms?select=id&available=eq.true')
            dashboard_data["stats"]["total_rooms"] = len(rooms)
            
            # Get active bookings count (if bookings table exists)
            try:
                bookings = make_supabase_request('/bookings?select=id&status=eq.confirmed')
                dashboard_data["stats"]["active_bookings"] = len(bookings)
            except:
                dashboard_data["stats"]["active_bookings"] = 0
        
        print(f"Admin Dashboard: Returning {len(dashboard_data['buildings'])} buildings")
        return jsonify({
            "success": True,
            "data": dashboard_data
        })
        
    except Exception as e:
        print(f"Admin Dashboard error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/admin/v1/buildings', methods=['GET'])
def get_admin_buildings():
    """Get buildings data for admin interface."""
    try:
        if SUPABASE_URL and SUPABASE_ANON_KEY:
            print("Admin: Fetching buildings from Supabase")
            data = make_supabase_request('/buildings?select=*&available=eq.true&order=name')
            return jsonify({
                "success": True,
                "buildings": data,
                "count": len(data)
            })
        else:
            return jsonify({
                "success": False,
                "error": "Supabase not configured"
            }), 500
            
    except Exception as e:
        print(f"Admin buildings error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/admin/v1/buildings/<short_name>/rooms', methods=['GET'])
def get_admin_rooms(short_name: str):
    """Get rooms for a specific building for admin interface."""
    try:
        if SUPABASE_URL and SUPABASE_ANON_KEY:
            print(f"Admin: Fetching rooms for building {short_name}")
            
            # Get building ID
            buildings = make_supabase_request(f'/buildings?short_name=eq.{short_name}&select=id,name')
            if not buildings:
                return jsonify({
                    "success": False,
                    "error": "Building not found"
                }), 404
            
            building_info = buildings[0]
            
            # Get rooms
            rooms = make_supabase_request(f'/rooms?building_id=eq.{building_info["id"]}&available=eq.true&select=*&order=name')
            
            return jsonify({
                "success": True,
                "building": building_info,
                "rooms": rooms,
                "count": len(rooms)
            })
        else:
            return jsonify({
                "success": False,
                "error": "Supabase not configured"
            }), 500
            
    except Exception as e:
        print(f"Admin rooms error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/admin/v1/stats', methods=['GET'])
def get_admin_stats():
    """Get comprehensive statistics for admin dashboard."""
    try:
        if SUPABASE_URL and SUPABASE_ANON_KEY:
            print("Admin: Fetching comprehensive statistics")
            stats = {
                "buildings": {"total": 0, "available": 0},
                "rooms": {"total": 0, "available": 0, "by_building": {}},
                "bookings": {"total": 0, "confirmed": 0, "pending": 0},
                "system": {"last_updated": datetime.now().isoformat()}
            }
            
            # Buildings stats
            all_buildings = make_supabase_request('/buildings?select=id,name,available')
            stats["buildings"]["total"] = len(all_buildings)
            stats["buildings"]["available"] = len([b for b in all_buildings if b.get("available", False)])
            
            # Rooms stats
            all_rooms = make_supabase_request('/rooms?select=id,building_id,available')
            stats["rooms"]["total"] = len(all_rooms)
            stats["rooms"]["available"] = len([r for r in all_rooms if r.get("available", False)])
            
            # Group rooms by building
            building_rooms = {}
            for room in all_rooms:
                building_id = room.get("building_id")
                if building_id:
                    if building_id not in building_rooms:
                        building_rooms[building_id] = {"total": 0, "available": 0}
                    building_rooms[building_id]["total"] += 1
                    if room.get("available", False):
                        building_rooms[building_id]["available"] += 1
            
            # Map building IDs to names
            for building in all_buildings:
                building_id = building["id"]
                building_name = building["name"]
                if building_id in building_rooms:
                    stats["rooms"]["by_building"][building_name] = building_rooms[building_id]
            
            # Bookings stats (if bookings table exists)
            try:
                all_bookings = make_supabase_request('/bookings?select=id,status')
                stats["bookings"]["total"] = len(all_bookings)
                stats["bookings"]["confirmed"] = len([b for b in all_bookings if b.get("status") == "confirmed"])
                stats["bookings"]["pending"] = len([b for b in all_bookings if b.get("status") == "pending"])
            except:
                print("Bookings table not accessible, setting default values")
                stats["bookings"] = {"total": 0, "confirmed": 0, "pending": 0}
            
            return jsonify({
                "success": True,
                "stats": stats
            })
        else:
            return jsonify({
                "success": False,
                "error": "Supabase not configured"
            }), 500
            
    except Exception as e:
        print(f"Admin stats error: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# ==============================================
# DATABASE API ENDPOINTS
# ==============================================

@app.route('/api/buildings', methods=['GET'])
def get_buildings():
    """Get all available buildings using Supabase REST API or direct database connection."""
    # Try Supabase first, fallback to direct database
    try:
        if SUPABASE_URL and SUPABASE_ANON_KEY:
            print("Using Supabase REST API for buildings")
            data = make_supabase_request('/buildings?select=*&available=eq.true&order=name')
            return jsonify({"buildings": data})
    except Exception as e:
        print(f"Supabase request failed, trying direct database: {e}")
    
    # Fallback to direct database connection
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Use lowercase table name for Supabase compatibility
            cur.execute("""
                SELECT id, name, short_name, address, website, contacts, 
                       available, libcal_id, lid, created_at, updated_at
                FROM buildings 
                WHERE available = true
                ORDER BY name
            """)
            buildings = cur.fetchall()
            
            # Convert to JSON serializable format
            result = []
            for building in buildings:
                building_dict = dict(building)
                # Convert datetime objects to strings
                if building_dict['created_at']:
                    building_dict['created_at'] = building_dict['created_at'].isoformat()
                if building_dict['updated_at']:
                    building_dict['updated_at'] = building_dict['updated_at'].isoformat()
                result.append(building_dict)
            
            return jsonify({"buildings": result})
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Database query failed"}), 500
    finally:
        conn.close()

@app.route('/api/buildings/<short_name>/rooms', methods=['GET'])
def get_rooms_by_building(short_name: str):
    """Get all rooms for a specific building using Supabase REST API or direct database connection."""
    # Try Supabase first, fallback to direct database
    try:
        if SUPABASE_URL and SUPABASE_ANON_KEY:
            print(f"Using Supabase REST API for rooms in building: {short_name}")
            # First get building ID by short_name
            buildings = make_supabase_request(f'/buildings?short_name=eq.{short_name}&select=id')
            if not buildings:
                return jsonify({"error": "Building not found"}), 404
            
            building_id = buildings[0]['id']
            # Then get rooms for that building
            data = make_supabase_request(f'/rooms?building_id=eq.{building_id}&available=eq.true&select=*&order=name')
            return jsonify({"rooms": data})
    except Exception as e:
        print(f"Supabase request failed, trying direct database: {e}")
    
    # Fallback to direct database connection
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Use lowercase table names for Supabase compatibility
            cur.execute("""
                SELECT r.id, r.eid, r.name, r.url, r.room_type, r.capacity, 
                       r.gtype, r.available, r.created_at, r.updated_at,
                       b.name as building_name, b.short_name as building_short_name
                FROM rooms r
                JOIN buildings b ON r.building_id = b.id
                WHERE b.short_name = %s AND r.available = true
                ORDER BY r.name
            """, (short_name,))
            rooms = cur.fetchall()
            
            # Convert to JSON serializable format
            result = []
            for room in rooms:
                room_dict = dict(room)
                # Convert datetime objects to strings
                if room_dict['created_at']:
                    room_dict['created_at'] = room_dict['created_at'].isoformat()
                if room_dict['updated_at']:
                    room_dict['updated_at'] = room_dict['updated_at'].isoformat()
                result.append(room_dict)
            
            return jsonify({"rooms": result})
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Database query failed"}), 500
    finally:
        conn.close()

@app.route('/api/bookings', methods=['POST'])
def create_booking():
    """Create a new booking."""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        data = request.json
        required_fields = ['user_email', 'building_short_name', 'room_eid', 'booking_date', 'start_time', 'end_time']
        
        # Validate required fields
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Generate booking reference
        booking_reference = f"BU{datetime.now().strftime('%Y%m%d')}{str(uuid.uuid4())[:8].upper()}"
        
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get building and room information
            cur.execute("""
                SELECT b.id as building_id, b.name as building_name, b.short_name,
                       r.id as room_id, r.name as room_name, r.capacity as room_capacity
                FROM Buildings b
                JOIN Rooms r ON r.building_id = b.id
                WHERE b.short_name = %s AND r.eid = %s
            """, (data['building_short_name'], data['room_eid']))
            
            room_info = cur.fetchone()
            if not room_info:
                return jsonify({"error": "Building or room not found"}), 404
            
            # Calculate duration
            start_time = datetime.strptime(data['start_time'], '%H:%M').time()
            end_time = datetime.strptime(data['end_time'], '%H:%M').time()
            start_datetime = datetime.combine(datetime.today(), start_time)
            end_datetime = datetime.combine(datetime.today(), end_time)
            duration_minutes = int((end_datetime - start_datetime).total_seconds() / 60)
            
            # Create user profile if doesn't exist
            cur.execute("""
                INSERT INTO UserProfiles (email, full_name, phone, department)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (email) DO UPDATE SET
                    full_name = COALESCE(EXCLUDED.full_name, UserProfiles.full_name),
                    phone = COALESCE(EXCLUDED.phone, UserProfiles.phone),
                    department = COALESCE(EXCLUDED.department, UserProfiles.department),
                    updated_at = NOW()
                RETURNING id
            """, (
                data['user_email'],
                data.get('user_name'),
                data.get('contact_phone'),
                data.get('department')
            ))
            
            user_profile = cur.fetchone()
            user_id = user_profile['id']
            
            # Create booking
            cur.execute("""
                INSERT INTO Bookings (
                    user_id, user_email, user_name, contact_phone,
                    building_id, building_name, building_short_name,
                    room_id, room_eid, room_name, room_capacity,
                    booking_date, start_time, end_time, duration_minutes,
                    booking_reference, purpose, notes,
                    ip_address, user_agent, session_id
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                ) RETURNING id, booking_reference, created_at
            """, (
                user_id,
                data['user_email'],
                data.get('user_name'),
                data.get('contact_phone'),
                room_info['building_id'],
                room_info['building_name'],
                room_info['short_name'],
                room_info['room_id'],
                data['room_eid'],
                room_info['room_name'],
                room_info['room_capacity'],
                data['booking_date'],
                data['start_time'],
                data['end_time'],
                duration_minutes,
                booking_reference,
                data.get('purpose'),
                data.get('notes'),
                request.environ.get('REMOTE_ADDR'),
                request.headers.get('User-Agent'),
                data.get('session_id')
            ))
            
            booking = cur.fetchone()
            
            # Update user profile booking counts
            cur.execute("""
                UPDATE UserProfiles SET 
                    total_bookings = total_bookings + 1,
                    active_bookings = active_bookings + 1,
                    last_activity_at = NOW()
                WHERE id = %s
            """, (user_id,))
            
            return jsonify({
                "success": True,
                "booking_id": str(booking['id']),
                "booking_reference": booking['booking_reference'],
                "created_at": booking['created_at'].isoformat()
            })
            
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Failed to create booking"}), 500
    except ValueError as e:
        return jsonify({"error": f"Invalid data format: {str(e)}"}), 400
    finally:
        conn.close()

@app.route('/api/bookings/<email>', methods=['GET'])
def get_bookings_by_email(email: str):
    """Get all bookings for a user by email."""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT id, user_email, user_name, booking_reference,
                       building_name, building_short_name, room_name,
                       booking_date, start_time, end_time, duration_minutes,
                       status, purpose, notes, created_at, updated_at
                FROM Bookings 
                WHERE user_email = %s
                ORDER BY created_at DESC
            """, (email,))
            bookings = cur.fetchall()
            
            # Convert to JSON serializable format
            result = []
            for booking in bookings:
                booking_dict = dict(booking)
                # Convert datetime and time objects to strings
                if booking_dict['booking_date']:
                    booking_dict['booking_date'] = booking_dict['booking_date'].isoformat()
                if booking_dict['start_time']:
                    booking_dict['start_time'] = str(booking_dict['start_time'])
                if booking_dict['end_time']:
                    booking_dict['end_time'] = str(booking_dict['end_time'])
                if booking_dict['created_at']:
                    booking_dict['created_at'] = booking_dict['created_at'].isoformat()
                if booking_dict['updated_at']:
                    booking_dict['updated_at'] = booking_dict['updated_at'].isoformat()
                booking_dict['id'] = str(booking_dict['id'])
                result.append(booking_dict)
            
            return jsonify({"bookings": result})
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Database query failed"}), 500
    finally:
        conn.close()

@app.route('/api/bookings/<booking_id>', methods=['PUT'])
def update_booking_status(booking_id: str):
    """Update booking status (e.g., cancel booking)."""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        data = request.json
        status = data.get('status')
        cancellation_reason = data.get('cancellation_reason')
        
        if not status:
            return jsonify({"error": "Status is required"}), 400
        
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Update booking
            if status == 'cancelled':
                cur.execute("""
                    UPDATE Bookings SET 
                        status = %s,
                        cancellation_reason = %s,
                        cancelled_at = NOW(),
                        updated_at = NOW()
                    WHERE id = %s
                    RETURNING user_id, status
                """, (status, cancellation_reason, booking_id))
            else:
                cur.execute("""
                    UPDATE Bookings SET 
                        status = %s,
                        updated_at = NOW()
                    WHERE id = %s
                    RETURNING user_id, status
                """, (status, booking_id))
            
            result = cur.fetchone()
            if not result:
                return jsonify({"error": "Booking not found"}), 404
            
            # Update user profile booking counts if cancelled
            if status == 'cancelled':
                cur.execute("""
                    UPDATE UserProfiles SET 
                        active_bookings = GREATEST(active_bookings - 1, 0),
                        cancelled_bookings = cancelled_bookings + 1,
                        last_activity_at = NOW()
                    WHERE id = %s
                """, (result['user_id'],))
            
            return jsonify({
                "success": True,
                "status": result['status']
            })
            
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Failed to update booking"}), 500
    finally:
        conn.close()

@app.route('/api/system-config', methods=['GET'])
def get_system_config():
    """Get system configuration."""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT config_key, config_value, description
                FROM SystemConfig 
                WHERE is_active = true
                ORDER BY config_key
            """)
            configs = cur.fetchall()
            
            # Convert to key-value format
            result = {}
            for config in configs:
                result[config['config_key']] = config['config_value']
            
            return jsonify({"config": result})
    except psycopg2.Error as e:
        print(f"Database error: {e}")
        return jsonify({"error": "Database query failed"}), 500
    finally:
        conn.close()

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to test database and Supabase connectivity."""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "services": {}
    }
    
    # Test Supabase connection
    try:
        if SUPABASE_URL and SUPABASE_ANON_KEY:
            data = make_supabase_request('/buildings?select=count', use_secret_key=False)
            health_status["services"]["supabase_api"] = {
                "status": "healthy",
                "message": "Supabase REST API accessible"
            }
        else:
            health_status["services"]["supabase_api"] = {
                "status": "not_configured",
                "message": "Supabase configuration missing"
            }
    except Exception as e:
        health_status["services"]["supabase_api"] = {
            "status": "error",
            "message": f"Supabase API error: {str(e)}"
        }
        health_status["status"] = "degraded"
    
    # Test direct database connection
    try:
        conn = get_db_connection()
        if conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                cur.fetchone()
            conn.close()
            health_status["services"]["database"] = {
                "status": "healthy",
                "message": "Direct database connection successful"
            }
        else:
            health_status["services"]["database"] = {
                "status": "error",
                "message": "Database connection failed"
            }
            health_status["status"] = "unhealthy"
    except Exception as e:
        health_status["services"]["database"] = {
            "status": "error",
            "message": f"Database error: {str(e)}"
        }
        health_status["status"] = "unhealthy"
    
    # Set overall status based on core functionality
    # For admin interface, Supabase API access is more important than direct DB
    if health_status["services"]["supabase_api"]["status"] == "healthy":
        # If Supabase is working, system is functional even if direct DB fails
        if health_status["status"] == "unhealthy":
            health_status["status"] = "degraded"
        return jsonify(health_status), 200
    elif health_status["status"] == "degraded":
        return jsonify(health_status), 206  # Partial Content
    else:
        return jsonify(health_status), 503  # Service Unavailable


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
