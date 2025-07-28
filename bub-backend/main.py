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
# DATABASE API ENDPOINTS
# ==============================================

@app.route('/api/buildings', methods=['GET'])
def get_buildings():
    """Get all available buildings."""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT id, name, short_name, address, website, contacts, 
                       available, libcal_id, lid, created_at, updated_at
                FROM Buildings 
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
    """Get all rooms for a specific building."""
    conn = get_db_connection()
    if not conn:
        return jsonify({"error": "Database connection failed"}), 500
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT r.id, r.eid, r.name, r.url, r.room_type, r.capacity, 
                       r.gtype, r.available, r.created_at, r.updated_at,
                       b.name as building_name, b.short_name as building_short_name
                FROM Rooms r
                JOIN Buildings b ON r.building_id = b.id
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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
