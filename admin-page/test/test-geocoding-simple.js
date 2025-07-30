// Quick test for geocoding functionality
// Run this in browser console to test geocoding API

async function testGeocodingAPI() {
    const testAddress = "771 Commonwealth Ave, Boston, MA 02215";

    try {
        console.log('🧪 Testing Nominatim API directly...');

        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
            `format=json&` +
            `q=${encodeURIComponent(testAddress + ', Boston, MA, USA')}&` +
            `limit=1&` +
            `countrycodes=us&` +
            `bounded=1&` +
            `viewbox=-71.15,-71.05,42.30,42.40`,
            {
                headers: {
                    'User-Agent': 'BU-Library-Admin-Panel/1.0'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.length > 0) {
            const result = data[0];
            console.log('✅ Geocoding successful:', {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                display_name: result.display_name,
                confidence: result.importance || 0.5
            });
            return true;
        } else {
            console.log('❌ No results found');
            return false;
        }
    } catch (error) {
        console.error('❌ Geocoding test failed:', error);
        return false;
    }
}

// Auto-run test
testGeocodingAPI();

console.log(`
🧪 Geocoding Test Instructions:
1. Open browser developer tools (F12)
2. Go to Console tab
3. This test should automatically run
4. Check the output above

If you see "✅ Geocoding successful", the API is working.
If you see "❌", there might be a network issue or API problem.
`);
