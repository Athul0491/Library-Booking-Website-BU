import { useRef, useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../assets/styles/map.css';
import { useGlobalApi } from '../contexts/GlobalApiContext';

// Fix Leaflet default markers in React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import markerRetina from 'leaflet/dist/images/marker-icon-2x.png';

// Configure default markers
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconRetinaUrl: markerRetina,
});

interface LocationData {
    id: string;
    name: string;
    lat: number;
    lng: number;
    description: string;
    address: string;
    phone?: string;
    hours?: string;
    amenities?: string[];
    type: 'library' | 'academic' | 'dining' | 'residence';
}

interface GeocodedLocation {
    id: string;
    name: string;
    lat: number;
    lng: number;
    address: string;
    description?: string;
    phone?: string;
    hours?: string;
}

// Geocoding service - using the free OpenStreetMap Nominatim API
const geocodeAddress = async (address: string, retryCount = 0): Promise<{lat: number, lng: number} | null> => {
    try {
        // Add a delay to avoid API rate limits
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
            `viewbox=-71.15,-71.05,42.30,42.40`, // 限制在波士顿地区
            {
                headers: {
                    'User-Agent': 'BU-Library-Booking-App/1.0'
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
                lng: parseFloat(result.lon)
            };
        }
        
        return null;
    } catch (error) {
        console.error(`Geocoding failed for "${address}":`, error);
        
        // 重试逻辑
        if (retryCount < 2) {
            console.log(`Retrying geocoding for "${address}" (attempt ${retryCount + 2})`);
            return geocodeAddress(address, retryCount + 1);
        }
        
        return null;
    }
};

// Batch geocoding to avoid API rate limits
const geocodeLocations = async (buildings: any[]): Promise<GeocodedLocation[]> => {
    const geocodedLocations: GeocodedLocation[] = [];
    
    for (let i = 0; i < buildings.length; i++) {
        const building = buildings[i];
        
        // 跳过没有地址的建筑物
        if (!building.address || building.address.trim() === '') {
            console.warn(`❌ Skipping building without address: ${building.name}`);
            continue;
        }
        
        console.log(`Geocoding ${i + 1}/${buildings.length}: ${building.name} - ${building.address}`);
        
        const coordinates = await geocodeAddress(building.address);
        
        if (coordinates) {
            geocodedLocations.push({
                id: building.id,
                name: building.name,
                lat: coordinates.lat,
                lng: coordinates.lng,
                address: building.address,
                description: building.description || `${building.name} library`,
                phone: building.phone || '',
                hours: building.hours || 'Hours not available'
            });
            console.log(`✅ Successfully geocoded: ${building.name} -> ${coordinates.lat}, ${coordinates.lng}`);
        } else {
            console.warn(`❌ Failed to geocode: ${building.name} - ${building.address}`);
            
            // Fallback: if geocoding fails, use a default location near the BU campus
            geocodedLocations.push({
                id: building.id,
                name: building.name,
                lat: 42.35018 + (Math.random() - 0.5) * 0.01, // Randomly distributed near BU
                lng: -71.10498 + (Math.random() - 0.5) * 0.01,
                address: building.address,
                description: building.description || `${building.name} library (approximate location)`,
                phone: building.phone || '',
                hours: building.hours || 'Hours not available'
            });
        }
        
        // 添加延迟以避免API限制 (1 request per second)
        if (i < buildings.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1100));
        }
    }
    
    return geocodedLocations;
};

interface NavigationOption {
    name: string;
    url: string;
    icon: string;
}

export default function Map() {
    const mapRef = useRef<L.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showNavigationModal, setShowNavigationModal] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [geocodedLocations, setGeocodedLocations] = useState<GeocodedLocation[]>([]);
    
    const { buildings } = useGlobalApi();

    // 地理编码建筑物地址
    useEffect(() => {
        if (buildings.length > 0) {
            setIsGeocoding(true);
            console.log(`Starting geocoding for ${buildings.length} buildings...`);
            
            geocodeLocations(buildings).then(locations => {
                setGeocodedLocations(locations);
                setIsGeocoding(false);
                console.log(`Geocoding completed. ${locations.length} locations ready.`);
            }).catch(error => {
                console.error('Geocoding failed:', error);
                setIsGeocoding(false);
                setHasError(true);
                setErrorMessage('Failed to get location coordinates');
            });
        }
    }, [buildings]);

    // Boston University library locations - for fallback only
    const libraryLocations: LocationData[] = [
        {
            id: 'mugar',
            name: 'Mugar Memorial Library',
            lat: 42.3505,
            lng: -71.1054,
            description: 'Main library with extensive collections and study spaces',
            address: '771 Commonwealth Avenue, Boston, MA 02215',
            phone: '(617) 353-3732',
            hours: 'Mon-Thu: 8:00 AM - 2:00 AM, Fri: 8:00 AM - 10:00 PM',
            amenities: ['24/7 Access', 'WiFi', 'Printing', 'Group Study Rooms', 'Cafe'],
            type: 'library'
        },
        {
            id: 'pardee',
            name: 'Pardee Library',
            lat: 42.3489,
            lng: -71.0967,
            description: 'Management and social sciences collection',
            address: '154 Bay State Road, Boston, MA 02215',
            phone: '(617) 353-3738',
            hours: 'Mon-Fri: 8:00 AM - 12:00 AM, Sat-Sun: 10:00 AM - 12:00 AM',
            amenities: ['WiFi', 'Quiet Study', 'Computer Lab', 'Printing'],
            type: 'library'
        },
        {
            id: 'pickering',
            name: 'Pickering Educational Resources Library',
            lat: 42.3501,
            lng: -71.1048,
            description: 'Educational resources and teacher preparation materials',
            address: '2 Silber Way, Boston, MA 02215',
            phone: '(617) 353-3734',
            hours: 'Mon-Fri: 8:00 AM - 9:00 PM, Sat-Sun: 12:00 PM - 6:00 PM',
            amenities: ['Education Resources', 'WiFi', 'Multimedia Equipment'],
            type: 'library'
        },
        {
            id: 'science',
            name: 'Science & Engineering Library',
            lat: 42.3496,
            lng: -71.1043,
            description: 'STEM resources and collaboration spaces',
            address: '38 Cummington Mall, Boston, MA 02215',
            phone: '(617) 353-3733',
            hours: 'Mon-Thu: 8:00 AM - 12:00 AM, Fri: 8:00 AM - 8:00 PM',
            amenities: ['STEM Resources', 'Computer Lab', 'WiFi', '3D Printing'],
            type: 'library'
        }
    ];

    // Detect device type for navigation
    const detectDevice = () => {
        const userAgent = navigator.userAgent;
        const isIOS = /iPad|iPhone|iPod/.test(userAgent);
        const isAndroid = /Android/.test(userAgent);
        const isMobile = isIOS || isAndroid;
        
        return { isIOS, isAndroid, isMobile };
    };

    // Generate navigation options for a location
    const getNavigationOptions = (location: LocationData): NavigationOption[] => {
        const { isIOS, isAndroid } = detectDevice();
        const options: NavigationOption[] = [];

        // Google Maps (universal)
        options.push({
            name: 'Google Maps',
            url: `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`,
            icon: '🗺️'
        });

        // Apple Maps (iOS devices)
        if (isIOS) {
            options.push({
                name: 'Apple Maps',
                url: `http://maps.apple.com/?daddr=${location.lat},${location.lng}`,
                icon: '🍎'
            });
        }

        // Waze (mobile devices)
        if (isIOS || isAndroid) {
            options.push({
                name: 'Waze',
                url: `https://waze.com/ul?ll=${location.lat},${location.lng}&navigate=yes`,
                icon: '🚗'
            });
        }

        // OpenStreetMap (web)
        options.push({
            name: 'OpenStreetMap',
            url: `https://www.openstreetmap.org/directions?to=${location.lat},${location.lng}`,
            icon: '🌍'
        });

        return options;
    };

    // Handle navigation option selection
    const handleNavigation = (option: NavigationOption) => {
        try {
            window.open(option.url, '_blank');
            setShowNavigationModal(false);
        } catch (error) {
            console.error('Failed to open navigation app:', error);
        }
    };

    // Create custom library icon
    const createLibraryIcon = () => {
        return L.divIcon({
            html: `
                <div style="
                    background-color: #2c5aa0;
                    border: 3px solid white;
                    border-radius: 50%;
                    width: 30px;
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                ">📚</div>
            `,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            className: 'custom-library-icon'
        });
    };

    useEffect(() => {
        if (!mapContainerRef.current) return;
        
        try {
            // Create map using OpenStreetMap - completely free!
            // Default view: https://www.openstreetmap.org/#map=15/42.34751/-71.11508
            const map = L.map(mapContainerRef.current).setView(
                [42.34751, -71.11508], // Boston University coordinates from OSM URL
                15 // Zoom level
            );

            mapRef.current = map;

            // Add OpenStreetMap tiles - no API key needed!
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                maxZoom: 19,
            }).addTo(map);

            // Use geocoded locations if available, otherwise fall back to static data
            const locationsToUse = geocodedLocations.length > 0 ? geocodedLocations : libraryLocations;

            // Add library markers with custom popups
            locationsToUse.forEach(location => {
                const marker = L.marker([location.lat, location.lng], { 
                    icon: createLibraryIcon() 
                }).addTo(map);

                // Create detailed popup content
                const popupContent = `
                    <div class="library-popup">
                        <h3 class="popup-title">${location.name}</h3>
                        <p class="popup-description">${location.description}</p>
                        <div class="popup-details">
                            <p><strong>📍 Address:</strong> ${location.address}</p>
                            ${location.phone ? `<p><strong>📞 Phone:</strong> ${location.phone}</p>` : ''}
                            ${location.hours ? `<p><strong>🕒 Hours:</strong> ${location.hours}</p>` : ''}
                            ${(location as any).amenities && (location as any).amenities.length > 0 ? 
                                `<p><strong>✨ Amenities:</strong> ${(location as any).amenities.join(', ')}</p>` : ''}
                        </div>
                        <button class="navigate-btn" onclick="window.openNavigationModal('${location.id}')">
                            🧭 Navigate Here
                        </button>
                    </div>
                `;

                marker.bindPopup(popupContent, {
                    maxWidth: 300,
                    minWidth: 250,
                    className: 'custom-popup'
                });
            });

            // Make navigation function globally available for popup buttons
            (window as any).openNavigationModal = (locationId: string) => {
                // Check both geocoded and static locations
                let location = geocodedLocations.find(loc => loc.id === locationId);
                if (!location) {
                    location = libraryLocations.find(loc => loc.id === locationId);
                }
                if (location) {
                    setSelectedLocation({
                        ...location,
                        description: location.description || '',
                        type: 'library' as const,
                        amenities: (location as any).amenities || []
                    });
                    setShowNavigationModal(true);
                }
            };

            console.log(`OpenStreetMap loaded with ${locationsToUse.length} locations - No API key required!`);
            if (isGeocoding) {
                console.log('Geocoding in progress...');
            }
            setHasError(false);

        } catch (error) {
            console.error('Map initialization error:', error);
            setHasError(true);
            setErrorMessage('Failed to initialize map. Please refresh the page.');
        }

        // Cleanup function
        return () => {
            mapRef.current?.remove();
            // Clean up global function
            delete (window as any).openNavigationModal;
        };
    }, [geocodedLocations, isGeocoding]); // Re-run when geocoded locations change

    return (
        <div className="map-container">
            {hasError && (
                <div className="map-error-overlay">
                    <div>⚠️ {errorMessage}</div>
                    <div className="map-error-detail">
                        Map initialization failed
                    </div>
                </div>
            )}

            {isGeocoding && (
                <div className="geocoding-overlay">
                    <div className="geocoding-indicator">
                        <div className="loading-spinner"></div>
                        <div>🗺️ Getting precise locations from addresses...</div>
                        <div className="geocoding-detail">
                            Converting {buildings.length} building addresses to map coordinates
                        </div>
                    </div>
                </div>
            )}
            
            {/* Navigation Modal */}
            {showNavigationModal && selectedLocation && (
                <div className="navigation-modal-overlay" onClick={() => setShowNavigationModal(false)}>
                    <div className="navigation-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Navigate to {selectedLocation.name}</h3>
                            <button 
                                className="close-btn"
                                onClick={() => setShowNavigationModal(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="modal-content">
                            <p>Choose your preferred navigation app:</p>
                            <div className="navigation-options">
                                {getNavigationOptions(selectedLocation).map((option, index) => (
                                    <button
                                        key={index}
                                        className="nav-option-btn"
                                        onClick={() => handleNavigation(option)}
                                    >
                                        <span className="nav-icon">{option.icon}</span>
                                        <span className="nav-name">{option.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div
                id="map-container"
                className="map-container-inner"
                ref={mapContainerRef}
            />
        </div>
    );
}
