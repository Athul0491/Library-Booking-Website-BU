import React, { useState } from 'react';
import '../assets/styles/home.css';

interface Room {
  id: string;
  name: string;
  available: boolean;
  timeRange?: string;
}

interface Building {
  id: string;
  name: string;
  available: boolean;
  rooms?: Room[];
}

const buildings: Building[] = [
  {
    id: 'CPH',
    name: 'Carl A. Pollock Hall',
    available: true,
    rooms: [
      { id: 'CPH1346', name: 'CPH 1346', available: true, timeRange: '2:20 PM – 10:00 PM' },
    ],
  },
  {
    id: 'DWE',
    name: 'Douglas Wright Engineering Building',
    available: true,
    // if you want a dropdown here, add a `rooms: [...]` array
  },
  { id: 'E2', name: 'Engineering 2', available: true },
  { id: 'RCH', name: 'J.R. Coutts Engineering Lecture Hall', available: true },
  { id: 'HH', name: 'J.G. Hagey Hall of the Humanities', available: true },
  { id: 'PHY', name: 'Physics', available: true },
  { id: 'AL', name: 'Arts Lecture Hall', available: true },
];

export default function Home() {
  // default expand CPH so you can see it open immediately
  const [expandedId, setExpandedId] = useState<string | null>('CPH');

  const toggle = (id: string) => {
    setExpandedId((curr) => (curr === id ? null : id));
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>BU Book</h1>
        <div className="info-icon" title="Info">i</div>
      </header>

      <div className="list-map-wrapper">
        <aside className="building-list">
          {buildings.map((b) => (
            <div key={b.id} className="building">
              <div
                className="building-header"
                onClick={() => toggle(b.id)}
              >
                <span className="building-title">
                  {b.id} – {b.name}
                </span>

                <div className="header-right">
                  <span
                    className={`status-tag ${b.available ? 'open' : 'closed'}`}
                  >
                    {b.available ? 'available' : 'unavailable'}
                  </span>

                  {/* only show arrow if there *are* rooms */}
                  {b.rooms && (
                    <button className="toggle-btn">
                      {expandedId === b.id ? '▲' : '▼'}
                    </button>
                  )}
                </div>
              </div>

              {expandedId === b.id && b.rooms && (
                <ul className="room-list">
                  {b.rooms.map((r) => (
                    <li key={r.id} className="room-item">
                      <span className="room-name">{r.name}</span>
                      <span
                        className={`dot ${r.available ? 'green' : 'red'}`}
                      >●</span>
                      {r.timeRange && (
                        <span className="time-range">{r.timeRange}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </aside>

        <section className="map-area">
          <div className="map-placeholder">Map will go here</div>
        </section>
      </div>
    </div>
  );
}
