import { useRef, useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../assets/styles/map.css';

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

    // Boston University library locations
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

            // Add library markers with custom popups
            libraryLocations.forEach(location => {
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
                            ${location.amenities && location.amenities.length > 0 ? 
                                `<p><strong>✨ Amenities:</strong> ${location.amenities.join(', ')}</p>` : ''}
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
                const location = libraryLocations.find(loc => loc.id === locationId);
                if (location) {
                    setSelectedLocation(location);
                    setShowNavigationModal(true);
                }
            };

            console.log('OpenStreetMap with Leaflet loaded successfully - No API key required!');
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
    }, []);

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
