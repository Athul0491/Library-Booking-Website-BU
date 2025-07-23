import requests
from flask import Flask, request, jsonify
import re


app = Flask(__name__)



@app.route('/api/availability', methods=['POST'])
def proxy_availability():
    try:
        libcal_url = 'https://bu.libcal.com/spaces/availability/grid'
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Referer': 'https://bu.libcal.com/spaces?lid=19336&gid=40742',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        }
        libcal_response = requests.post(libcal_url, data=request.form, headers=headers)

        # If LibCal errors, forward that too
        libcal_response.raise_for_status()
        return jsonify(libcal_response.json())

    except requests.exceptions.RequestException as e:
        print("LibCal request error:", e)
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
