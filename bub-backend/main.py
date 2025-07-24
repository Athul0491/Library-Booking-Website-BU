import requests
from flask import Flask, request, jsonify
from urllib.parse import urlencode
from datetime import datetime, timedelta

app = Flask(__name__)

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
        lid = request.json.get("library", "")
        if not lid:
            return jsonify({"error": "Invalid library prefix"}), 400

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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
