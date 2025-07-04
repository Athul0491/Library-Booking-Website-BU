//import { useRef, useEffect } from 'react';
//import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

function Home() {
/*

  const mapContainerRef = useRef(null);

  useEffect(() => {
    mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12', // basic Mapbox style
      center: [-71.0589, 42.3601], // Boston coordinates as an example
      zoom: 10,
    });

    // Cleanup on unmount
    return () => {
      map.remove();
    };
  }, []);
  
       <div
          ref={mapContainerRef}
          style={{ width: '100%', height: '400px' }} // ensure map is visible
        />
  */
  return (
    <>
      <div className='container'>
        <div className='header-title'>
          <h1>Bu Book</h1>
        </div>

        <div className='side'>
                    <div className="library-list">
            <div id="MUG" className="list-item">
              <h3 className="clickable">Mugar Memorial Library</h3>
              <p>Address: 771 Commonwealth Ave, Boston, MA 02215</p>
            </div>
          </div>
        </div>
        <div className='map-area'>
          This is where the map will go.
        </div>
      </div>
    </>
  );
}

export default Home;
