# Interactive Map Requirements - OpenStreetMap Integration

## Overview
Replace Mapbox implementation with OpenStreetMap + Leaflet to create an interactive campus map with custom pin points and navigation features.

## Core Requirements

### 1. Map Display
- **Base Map**: OpenStreetMap (free, no API key required)
- **Library**: Leaflet.js for map interactions
- **Default View**: Boston University area
  - URL Reference: https://www.openstreetmap.org/#map=16/42.35018/-71.11027
  - Center Coordinates: [42.35018, -71.11027]
  - Zoom Level: 16

### 2. Custom Pin Points (Markers)
- **Library Buildings**: Custom markers for each library location
- **Interactive Popups**: Click to show detailed information
- **Custom Icons**: Distinctive icons for different building types
- **Information Display**: Building name, description, services, contact info

### 3. Navigation Integration
- **Multi-Platform Support**: Apple Maps, Google Maps, Other map apps
- **User Choice**: Allow users to select preferred navigation app
- **Deep Links**: Generate appropriate URLs for each navigation service
- **Device Detection**: Automatically suggest best options based on device type

### 4. User Interaction Flow
1. User clicks on a pin point (library marker)
2. Popup displays:
   - Building name
   - Description
   - Available services/amenities
   - Operating hours
   - Contact information
   - Navigation button
3. User clicks "Navigate" button
4. Modal/dropdown shows navigation options:
   - Apple Maps (iOS devices)
   - Google Maps
   - OpenStreetMap (web)
   - Waze (if available)
5. Selected app opens with navigation to the location

## Technical Implementation

### Libraries Required
- `leaflet`: Map rendering and interactions
- `@types/leaflet`: TypeScript definitions
- `leaflet/dist/leaflet.css`: Default map styles

### Navigation URL Schemes
- **Apple Maps**: `maps://?q=latitude,longitude` or `http://maps.apple.com/?q=latitude,longitude`
- **Google Maps**: `https://www.google.com/maps/dir/?api=1&destination=latitude,longitude`
- **Waze**: `https://waze.com/ul?ll=latitude,longitude&navigate=yes`
- **OpenStreetMap**: `https://www.openstreetmap.org/directions?to=latitude,longitude`

### Features to Implement
- ✅ Replace Mapbox with OpenStreetMap/Leaflet
- ✅ Custom library building markers
- ✅ Interactive popups with building information
- ✅ Navigation button in each popup
- ✅ Navigation app selection modal
- ✅ Deep linking to external navigation apps
- ✅ Device type detection (iOS/Android/Desktop)
- ✅ Responsive design for mobile devices
- ✅ Error handling for failed map loads
- ✅ Custom marker icons for different building types

## Library Locations Data Structure
```typescript
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
```

## Benefits of OpenStreetMap over Mapbox
- **Cost**: Completely free, no API limits
- **Privacy**: No tracking or data collection
- **Reliability**: No API key expiration issues
- **Open Source**: Community-driven, always improving
- **No Ads**: Clean, advertisement-free experience
- **Offline Capability**: Can be cached for offline use

## Future Enhancements
- Real-time room availability on map
- Indoor mapping for larger buildings
- Walking directions overlay
- Accessibility route options
- Public transit integration
- Search functionality for buildings
- Clustering for dense marker areas
- Custom map themes (dark mode, high contrast)

## Browser Compatibility
- Modern browsers with ES6+ support
- Mobile Safari (iOS)
- Chrome Mobile (Android)
- Desktop browsers (Chrome, Firefox, Safari, Edge)

## Performance Considerations
- Lazy loading of marker data
- Efficient popup rendering
- Optimized icon sizes
- Minimal dependencies
- Fast tile loading from OSM servers
