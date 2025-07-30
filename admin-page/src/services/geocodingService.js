// Geocoding Service - Admin Panel Specific
// Automatically triggers geocoding when administrators add, edit, or delete buildings

/**
 * Geocoding service using OpenStreetMap Nominatim API
 * Optimized for Boston University campus addresses
 * @param {string} address - Address to geocode
 * @param {number} retryCount - Number of retries
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export const geocodeAddress = async (address, retryCount = 0) => {
    try {
        // Add delay to avoid API rate limits (max 1 request per second)
        if (retryCount > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }

        // Enhanced address processing for Boston University
        let searchAddress = address;

        // If address doesn't contain Boston or BU context, add it
        if (!address.toLowerCase().includes('boston') && !address.toLowerCase().includes('bu')) {
            searchAddress = `${address}, Boston University, Boston, MA, USA`;
        } else if (!address.toLowerCase().includes('boston')) {
            searchAddress = `${address}, Boston, MA, USA`;
        }

        console.log(`🔍 [GEOCODING] Searching for: "${searchAddress}"`);

        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
            `format=json&` +
            `q=${encodeURIComponent(searchAddress)}&` +
            `limit=3&` + // Get more results for better accuracy
            `countrycodes=us&` +
            `bounded=1&` +
            `viewbox=-71.15,42.30,-71.05,42.40&` + // Boston University area bounds (west,south,east,north)
            `addressdetails=1&` +
            `extratags=1`,
            {
                headers: {
                    'User-Agent': 'BU-Library-Admin-Panel/1.0 (Boston University Library System)'
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Nominatim API error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data && data.length > 0) {
            // Filter results to prefer those within BU campus area
            const buResults = data.filter(result => {
                const lat = parseFloat(result.lat);
                const lon = parseFloat(result.lon);
                // BU campus approximate bounds
                return lat >= 42.34 && lat <= 42.36 && lon >= -71.12 && lon <= -71.10;
            });

            // Use BU campus result if available, otherwise use first result
            const bestResult = buResults.length > 0 ? buResults[0] : data[0];

            console.log(`✅ [GEOCODING] Found coordinates: ${bestResult.lat}, ${bestResult.lon}`);
            console.log(`📍 [GEOCODING] Display name: ${bestResult.display_name}`);

            return {
                lat: parseFloat(bestResult.lat),
                lng: parseFloat(bestResult.lon),
                display_name: bestResult.display_name,
                place_id: bestResult.place_id,
                confidence: bestResult.importance || 0.5,
                address_details: bestResult.address || {},
                is_campus_location: buResults.length > 0
            };
        }

        console.warn(`⚠️ [GEOCODING] No results found for: "${searchAddress}"`);
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

/**
 * Enhanced geocoding function for the admin panel
 * @param {number|string} buildingId - Building ID 
 * @param {string} address - Address to geocode
 * @returns {Promise<Object>} Geocoding result
 */
export const geocodeAndUpdateBuilding = async (buildingId, address) => {
    try {
        console.log('🚀 [GEOCODING START]', {
            buildingId,
            address,
            timestamp: new Date().toISOString()
        });

        if (!address || address.trim() === '') {
            throw new Error('Building address is required for geocoding');
        }

        // Step 1: Geocode the address
        console.log('📍 [STEP 1] Starting address geocoding...');
        const geocodeResult = await geocodeAddress(address);

        console.log('🗺️ [GEOCODE RESULT]', {
            success: !!geocodeResult,
            result: geocodeResult
        });

        if (geocodeResult) {
            console.log('✅ [GEOCODING SUCCESS] Coordinates obtained:', {
                latitude: geocodeResult.lat,
                longitude: geocodeResult.lng,
                display_name: geocodeResult.display_name,
                confidence: geocodeResult.confidence
            });

            // Step 2: Import locationService to avoid circular dependency
            const { updateBuilding } = await import('./locationService');

            // Step 3: Prepare update data
            const updateData = {
                latitude: geocodeResult.lat,
                longitude: geocodeResult.lng,
                geocoded_at: new Date().toISOString(),
                geocoding_status: 'success',
                geocoding_source: 'nominatim',
                geocoding_accuracy: geocodeResult.confidence > 0.8 ? 'high' :
                    geocodeResult.confidence > 0.5 ? 'medium' : 'low'
            };

            console.log('💾 [STEP 2] Preparing database update:', {
                buildingId,
                updateData
            });

            // Step 4: Update the building in database
            console.log('🔄 [STEP 3] Calling updateBuilding...');
            const updateResult = await updateBuilding(buildingId, updateData);

            console.log('📡 [DATABASE UPDATE RESULT]', {
                success: updateResult.success,
                data: updateResult.data,
                error: updateResult.error
            });

            if (updateResult.success) {
                console.log('🎉 [COMPLETE SUCCESS] Building geocoded and updated!');
                return {
                    success: true,
                    buildingId: buildingId,
                    coordinates: {
                        latitude: geocodeResult.lat,
                        longitude: geocodeResult.lng
                    },
                    geocodingInfo: {
                        provider: 'nominatim',
                        confidence: geocodeResult.confidence,
                        accuracy: 'high',
                        display_name: geocodeResult.display_name,
                        place_id: geocodeResult.place_id,
                        geocoded_at: new Date().toISOString()
                    },
                    databaseUpdated: true
                };
            } else {
                console.error('❌ [DATABASE ERROR] Failed to update building:', updateResult.error);
                throw new Error(`Failed to update building in database: ${updateResult.error}`);
            }
        } else {
            console.warn('⚠️ [GEOCODING FAILED] Using fallback coordinates');

            // Geocoding failed, still try to update with fallback coordinates
            const { updateBuilding } = await import('./locationService');

            const fallbackData = {
                latitude: BU_CAMPUS_CENTER.lat,
                longitude: BU_CAMPUS_CENTER.lng,
                geocoded_at: new Date().toISOString(),
                geocoding_status: 'failed',
                geocoding_source: 'fallback',
                geocoding_accuracy: 'low'
            };

            console.log('🔄 [FALLBACK] Updating with fallback coordinates:', fallbackData);
            const updateResult = await updateBuilding(buildingId, fallbackData);

            console.log('📡 [FALLBACK UPDATE RESULT]', updateResult);

            return {
                success: false,
                buildingId: buildingId,
                error: 'Geocoding failed, used fallback coordinates',
                coordinates: {
                    latitude: BU_CAMPUS_CENTER.lat,
                    longitude: BU_CAMPUS_CENTER.lng
                },
                geocodingInfo: {
                    provider: 'fallback',
                    confidence: 0.1,
                    accuracy: 'low',
                    geocoded_at: new Date().toISOString()
                },
                databaseUpdated: updateResult.success
            };
        }
    } catch (error) {
        console.error('💥 [GEOCODING ERROR]', {
            buildingId,
            address,
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
};