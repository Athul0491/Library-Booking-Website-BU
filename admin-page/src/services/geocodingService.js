// Geocoding Service - Admin Panel Specific
// Automatically triggers geocoding when administrators add, edit, or delete buildings

/**
 * Geocoding service using free OpenStreetMap Nominatim API
 * @param {string} address - Address to geocode
 * @param {number} retryCount - Number of retries
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export const geocodeAddress = async (address, retryCount = 0) => {
    try {
        // Add delay to avoid API rate limits
        if (retryCount > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }

        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
            `format=json&` +
            `q=${encodeURIComponent(address + ', Boston, MA, USA')}&` +
            `limit=1&` +
            `countrycodes=us&` +
            `bounded=1&` +
            `viewbox=-71.15,-71.05,42.30,42.40`, // Limit to Boston area
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
            return {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                display_name: result.display_name,
                place_id: result.place_id,
                confidence: result.importance || 0.5
            };
        }

        return null;
    } catch (error) {
        console.error(`Geocoding failed for "${address}":`, error);

        // Retry logic
        if (retryCount < 2) {
            console.log(`Retrying geocoding for "${address}" (attempt ${retryCount + 2})`);
            return geocodeAddress(address, retryCount + 1);
        }

        return null;
    }
};

/**
 * Batch geocode multiple addresses
 * @param {Array} buildings - Array of buildings
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<Array>}
 */
export const geocodeBuildings = async (buildings, onProgress = null) => {
    const results = [];

    for (let i = 0; i < buildings.length; i++) {
        const building = buildings[i];

        // Skip buildings without address
        if (!building.address || building.address.trim() === '') {
            console.warn(`❌ Skipping building without address: ${building.name}`);
            if (onProgress) onProgress(i + 1, buildings.length, `Skipped: ${building.name} (no address)`);
            continue;
        }

        if (onProgress) onProgress(i + 1, buildings.length, `Geocoding: ${building.name}`);

        const geocodeResult = await geocodeAddress(building.address);

        if (geocodeResult) {
            results.push({
                buildingId: building.id,
                building: building,
                success: true,
                coordinates: {
                    latitude: geocodeResult.lat,
                    longitude: geocodeResult.lng
                },
                geocodingData: {
                    provider: 'nominatim',
                    confidence: geocodeResult.confidence,
                    display_name: geocodeResult.display_name,
                    place_id: geocodeResult.place_id,
                    geocoded_at: new Date().toISOString()
                }
            });
            console.log(`✅ Successfully geocoded: ${building.name} -> ${geocodeResult.lat}, ${geocodeResult.lng}`);
        } else {
            results.push({
                buildingId: building.id,
                building: building,
                success: false,
                error: 'Geocoding failed',
                fallbackCoordinates: {
                    latitude: 42.35018 + (Math.random() - 0.5) * 0.01, // Near BU campus
                    longitude: -71.10498 + (Math.random() - 0.5) * 0.01
                }
            });
            console.warn(`❌ Failed to geocode: ${building.name} - ${building.address}`);
        }

        // Add delay to avoid API rate limits (1 request per second)
        if (i < buildings.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1100));
        }
    }

    return results;
};

/**
 * Geocode a single building and update database
 * @param {Object} building - Building object
 * @param {Function} updateFunction - Function to update database
 * @returns {Promise<Object>}
 */
export const geocodeAndUpdateBuilding = async (building, updateFunction) => {
    try {
        console.log(`🗺️ Starting geocoding for: ${building.name}`);

        if (!building.address || building.address.trim() === '') {
            throw new Error('Building address is required for geocoding');
        }

        const geocodeResult = await geocodeAddress(building.address);

        if (geocodeResult) {
            // Prepare update data
            const updateData = {
                ...building,
                latitude: geocodeResult.lat,
                longitude: geocodeResult.lng,
                geocoded_at: new Date().toISOString(),
                geocoding_status: 'success',
                geocoding_source: 'nominatim',
                geocoding_confidence: geocodeResult.confidence
            };

            // Call update function
            const updateResult = await updateFunction(updateData);

            console.log(`✅ Successfully geocoded and updated: ${building.name}`);
            return {
                success: true,
                building: updateResult,
                coordinates: {
                    latitude: geocodeResult.lat,
                    longitude: geocodeResult.lng
                },
                geocodingInfo: {
                    provider: 'nominatim',
                    confidence: geocodeResult.confidence,
                    display_name: geocodeResult.display_name
                }
            };
        } else {
            // Geocoding failed, use fallback coordinates
            const fallbackData = {
                ...building,
                latitude: 42.35018,
                longitude: -71.10498,
                geocoded_at: new Date().toISOString(),
                geocoding_status: 'failed',
                geocoding_source: 'fallback'
            };

            const updateResult = await updateFunction(fallbackData);

            console.warn(`⚠️ Geocoding failed, using fallback coordinates for: ${building.name}`);
            return {
                success: false,
                building: updateResult,
                error: 'Geocoding failed, used fallback coordinates',
                coordinates: {
                    latitude: 42.35018,
                    longitude: -71.10498
                }
            };
        }
    } catch (error) {
        console.error(`❌ Error in geocodeAndUpdateBuilding for ${building.name}:`, error);
        throw error;
    }
};

/**
 * Validate if geocoding results are reasonable (within Boston area)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean}
 */
export const validateCoordinates = (lat, lng) => {
    // Approximate bounds of Boston area
    const bostonBounds = {
        north: 42.40,
        south: 42.30,
        east: -71.05,
        west: -71.15
    };

    return lat >= bostonBounds.south &&
        lat <= bostonBounds.north &&
        lng >= bostonBounds.west &&
        lng <= bostonBounds.east;
};

/**
 * Calculate distance between two coordinate points (in kilometers)
 * @param {number} lat1 - Latitude of first point
 * @param {number} lng1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lng2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// BU campus center coordinates (as reference point)
export const BU_CAMPUS_CENTER = {
    lat: 42.35018,
    lng: -71.10498
};
