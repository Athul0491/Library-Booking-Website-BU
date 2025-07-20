import { useRef, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import '../assets/styles/mapbox-gl.css'; // ensure this is working

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN!;

export default function Map() {
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const mapContainerRef = useRef<HTMLDivElement | null>(null);



    useEffect(() => {
        if (!mapContainerRef.current) return;
        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: 'https://api.mapbox.com/styles/v1/notakki/cm1o3v5kr00bl01pd2k7tho6i?sdk=js-3.7.0&access_token=pk.eyJ1Ijoibm90YWtraSIsImEiOiJjbTJsZ2wwMWwwYmx2MnFwdnhmb295amJvIn0.qWO7Ace5zXHDvd6nh-QQqg', // Use same style as in SPOTS
            center: [-71.1056, 42.3505], // Boston University
            zoom: 16,
            pitch: 60,
            bearing: -30,
            antialias: true
        });

        map.on('load', () => {
            map.addLayer({
                id: '3d-buildings',
                source: 'composite',
                'source-layer': 'building',
                filter: ['==', 'extrude', 'true'],
                type: 'fill-extrusion',
                minzoom: 15,
                paint: {
                    'fill-extrusion-color': '#aaa',
                    'fill-extrusion-height': ['get', 'height'],
                    'fill-extrusion-base': ['get', 'min_height'],
                    'fill-extrusion-opacity': 0.6
                }
            });
        });


        return () => {
            mapRef.current?.remove();
        };
    }, []);

    return (
        <div
            id="map-container"
            ref={mapContainerRef}
            style={{ width: '100%', height: '100%' }} // REQUIRED to be visible
        />
    );
}
