import { useState } from 'react';
import '../assets/styles/home.css';
import Map from '../components/Map'
import ConnectionStatus from '../components/ConnectionStatus';
import { useGlobalApi } from '../contexts/GlobalApiContext';

export default function Home() {
  const { buildings, isLoading, error } = useGlobalApi();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpandedId((curr) => (curr === id ? null : id));
  };


  return (
    <div className="home-container">
      <header className="home-header">
        <h1>BU Book</h1>
        <div className="header-controls">
          <ConnectionStatus />
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <span>⚠️ Error loading data: {error}</span>
        </div>
      )}

      {isLoading && buildings.length === 0 && (
        <div className="loading-banner">
          <span>Loading buildings...</span>
        </div>
      )}

      <div className="list-map-wrapper">
        <aside className="building-list">
          {buildings.map((building) => (
            <div key={building.id} className="building">
              <div className="building-header" onClick={() => toggle(building.id)}>
                <span className="building-title">{building.name}</span>

                <div className="header-right">
                  <span className={`status-tag ${building.available ? 'open' : 'closed'}`}>
                    {building.available ? 'available' : 'unavailable'}
                  </span>

                  {building.rooms && (
                    <button className="toggle-btn">
                      {expandedId === building.id ? '▲' : '▼'}
                    </button>
                  )}
                </div>
              </div>

              {expandedId === building.id && building.rooms && (
                <ul className="room-list">
                  {building.rooms.map((r) => (
                    <li key={r.id} className="room-item">
                      <span className={`dot ${r.available ? 'green' : 'red'}`}>●</span>
                      <span className="room-name">{r.name}</span>
                      <span className="time-range">Capacity: {r.capacity}</span>
                    </li>
                  ))}
                </ul>
              )}

            </div>
          ))}
        </aside>

        <section className="map-area">
          <Map />
        </section>
      </div>
    </div>
  );
}
