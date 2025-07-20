import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import '../assets/styles/home.css';
import type { Building, Room } from '../types/building';
import Map from '../components/Map'

export default function Home() {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggle = (id: number) => {
    setExpandedId((curr) => (curr === id ? null : id));
  };

  useEffect(() => {
    const fetchBuildings = async () => {
      const { data, error } = await supabase
        .from('Buildings')
        .select('*, Rooms(*)');

      if (error) {
        console.error('Error fetching buildings:', error.message);
        return;
      }

      if (data) {
        const typed: Building[] = data.map((b) => ({
          ...b,
          available: true,
          Rooms: b.Rooms?.map((r : Room) => ({
            ...r,
            available: true,
          })) ?? [],
        }));

        setBuildings(typed);
      }
    };

    fetchBuildings();
  }, []);

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
              <div className="building-header" onClick={() => toggle(b.id)}>
                <span className="building-title">{b.Name}</span>

                <div className="header-right">
                  <span className={`status-tag ${b.available ? 'open' : 'closed'}`}>
                    {b.available ? 'available' : 'unavailable'}
                  </span>

                  {b.Rooms && (
                    <button className="toggle-btn">
                      {expandedId === b.id ? '▲' : '▼'}
                    </button>
                  )}
                </div>
              </div>

              {expandedId === b.id && b.Rooms && (
                <ul className="room-list">
                  {b.Rooms.map((r) => (
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
