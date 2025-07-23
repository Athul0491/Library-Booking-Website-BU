import { useEffect, useState } from 'react';
import '../assets/styles/home.css';
import type { Building } from '../types/building';
import Map from '../components/Map'
import { fetchBuildingsWithAvailability } from '../lib/fetchBuildingsWithAvailability';

export default function Home() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggle = (id: number) => {
    setExpandedId((curr) => (curr === id ? null : id));
  };

  useEffect(() => {
    const load = async () => {
      const buildingsWithAvailability = await fetchBuildingsWithAvailability();
      setBuildings(buildingsWithAvailability);
    };

    load();
  }, []);


  return (
    <div className="home-container">
      <header className="home-header">
        <h1>BU Book</h1>
        <div className="info-icon" title="Info">i</div>
      </header>

      <div className="list-map-wrapper">
        <aside className="building-list">
          {buildings.map((building) => (
            <div key={building.id} className="building">
              <div className="building-header" onClick={() => toggle(building.id)}>
                <span className="building-title">{building.Name}</span>

                <div className="header-right">
                  <span className={`status-tag ${building.available ? 'open' : 'closed'}`}>
                    {building.available ? 'available' : 'unavailable'}
                  </span>

                  {building.Rooms && (
                    <button className="toggle-btn">
                      {expandedId === building.id ? '▲' : '▼'}
                    </button>
                  )}
                </div>
              </div>

              {expandedId === building.id && building.Rooms && (
                <ul className="room-list">
                  {building.Rooms.map((r) => (
                    <li key={r.id} className="room-item">
                      <span className="room-name">{r.title}</span>
                      <span className={`dot ${r.available ? 'green' : 'red'}`}>●</span>
                      <span className="time-range">Capacity: {r.capacity}</span>
                    </li>
                  ))}
                </ul>
              )}

            </div>
          ))}
        </aside>

        <section className="map-area">
          <div className="map-placeholder">Map will go here</div>
          {/* <Map />*/}
        </section>
      </div>
    </div>
  );
}
