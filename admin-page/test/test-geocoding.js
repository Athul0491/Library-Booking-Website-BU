// Test script for geocoding functionality
import { geocodeAddress, geocodeAndUpdateBuilding, validateCoordinates } from '../src/services/geocodingService.js';

async function testGeocodingAccuracy() {
    console.log('🧪 Testing Geocoding Accuracy\n');

    // Test addresses around BU campus
    const testAddresses = [
        {
            name: 'Mugar Memorial Library',
            address: '771 Commonwealth Ave, Boston, MA 02215'
        },
        {
            name: 'Pardee Library',
            address: '771 Commonwealth Ave, Boston, MA 02215'
        },
        {
            name: 'Howard Gotlieb Archival Research Center',
            address: '771 Commonwealth Ave, Boston, MA 02215'
        },
        {
            name: 'BU Central Library',
            address: 'Boston University, Boston, MA'
        },
        {
            name: 'Science & Engineering Library',
            address: '38 Cummington Mall, Boston, MA 02215'
        }
    ];

    console.log('Testing individual address geocoding:\n');

    for (const testCase of testAddresses) {
        try {
            console.log(`📍 Testing: ${testCase.name}`);
            console.log(`   Address: ${testCase.address}`);

            const result = await geocodeAddress(testCase.address);

            if (result) {
                const isValid = validateCoordinates(result.lat, result.lng);
                console.log(`   ✅ Coordinates: ${result.lat}, ${result.lng}`);
                console.log(`   📊 Confidence: ${result.confidence}`);
                console.log(`   🎯 Valid Boston area: ${isValid ? 'Yes' : 'No'}`);
                console.log(`   📝 Display Name: ${result.display_name}`);
            } else {
                console.log(`   ❌ Geocoding failed`);
            }

            console.log(''); // Empty line for readability

            // Add delay to respect API rate limits
            await new Promise(resolve => setTimeout(resolve, 1500));

        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
        }
    }

    console.log('\n🧪 Testing geocodeAndUpdateBuilding function:\n');

    // Test the updated function
    try {
        const result = await geocodeAndUpdateBuilding(1, '771 Commonwealth Ave, Boston, MA 02215');
        console.log('🎯 geocodeAndUpdateBuilding result:', JSON.stringify(result, null, 2));
    } catch (error) {
        console.error('❌ geocodeAndUpdateBuilding error:', error.message);
    }
}

// Export test function
export { testGeocodingAccuracy };

// Run test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testGeocodingAccuracy().catch(console.error);
}
