import re
import json
import requests
from flask import Flask, jsonify
import asyncio
import re
from playwright.sync_api import Page, expect


app = Flask(__name__)

# URL for the Mugar Library spaces page
#Hardcode for now but we need to have this be editable from the admin panel
ROOMS_URL = 'https://bu.libcal.com/allspaces'

async def fetch_resources():
    # launch Playwright, open a Chromium page, let the page JS populate `resources`
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto(ROOMS_URL, wait_until="networkidle")
        # now `resources` is defined in-page
        rooms = await page.evaluate("resources")
        await browser.close()
        return rooms

def fetch_rooms():
    """
    Fetches the rooms endpoint, scrapes the `resources.push({...})` blocks,
    normalizes them into JSON, and returns a list of room dicts.
    """
    resp = requests.get(ROOMS_URL)
    resp.raise_for_status()
    html = resp.text

    # Match JS object literals inside resources.push(...) calls
    pattern = re.compile(r'resources\.push\(\s*(\{[\s\S]*?\})\s*\);')
    rooms = []

    for match in pattern.finditer(html):
        obj_text = match.group(1)
        # Quote unquoted keys for valid JSON
        obj_json_text = re.sub(r"(\b[a-zA-Z_][a-zA-Z0-9_]*\b)\s*:", r'"\1":', obj_text)
        try:
            room = json.loads(obj_json_text)
            rooms.append(room)
        except json.JSONDecodeError:
            continue

    return rooms



@app.route('/')
def home():
    return "Welcome to the BU Library Booking Website!"


@app.route('/remote/rooms')
def api_rooms():
    """
    Returns a JSON array of study rooms for Mugar Library, scraped in real-time.
    """
    rooms = asyncio.run(fetch_resources())
    return jsonify(rooms)


if __name__ == '__main__':
    app.run(debug=True)
