/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface Room {
    title: string;
    url: string;
    eid: number;
    grouping: string;
    capacity: number;
    gtype: number;
    gBookingSelectableTime: boolean;
    hasInfo: boolean;
    thumbnail: string;
    filterIds: number[];
}

interface Building {
    id: number;
    ShortName: string;
    Name: string;
}

export default function RoomSqlGenerator() {
    const [jsonInput, setJsonInput] = useState('');
    const [buildingId, setBuildingId] = useState<number | null>(null);
    const [sqlOutput, setSqlOutput] = useState('');
    const [buildings, setBuildings] = useState<Building[]>([]);

    // Fetch building list from Supabase
    useEffect(() => {
        const fetchBuildings = async () => {
            const { data, error } = await supabase
                .from('Buildings')
                .select('id, ShortName, Name');

            if (error) {
                console.error('Failed to fetch buildings:', error);
            } else {
                setBuildings(data);
            }
        };

        fetchBuildings();
    }, []);

    const insertRooms = async () => {
        if (!buildingId) {
            setSqlOutput('❌ Select a building first.');
            return;
        }

        try {
            const parsed: Room[] = JSON.parse(jsonInput);

            // attach building_id to each room
            const recordsToInsert = parsed.map((r) => ({
                building_id: buildingId,
                eid: r.eid,
                title: r.title,
                url: r.url,
                grouping: r.grouping,
                capacity: r.capacity,
                gtype: r.gtype,
                gBookingSelectableTime: r.gBookingSelectableTime,
                hasInfo: r.hasInfo,
                thumbnail: r.thumbnail,
                filterIds: r.filterIds || [], // map lowercase JSON key to camelCase DB key
            }));


            const { error } = await supabase.from('Rooms').insert(recordsToInsert);

            if (error) {
                setSqlOutput(`❌ Error inserting data:\n${error.message}`);
            } else {
                setSqlOutput(`✅ Inserted ${recordsToInsert.length} rooms for building ID ${buildingId}.`);

            }
        } catch (error: unknown) {
            setSqlOutput('❌ Invalid JSON format.');
        }
    };


    return (
        <div className="sql-generator">
            <h2>Room SQL Generator</h2>

            <label>
                Select Building:
                <select
                    value={buildingId ?? ''}
                    onChange={(e) => setBuildingId(Number(e.target.value))}
                    style={{ marginLeft: '0.5rem' }}
                >
                    <option value="">-- Choose a Building --</option>
                    {buildings.map((b) => (
                        <option key={b.id} value={b.id}>
                            {b.ShortName} — {b.Name}
                        </option>
                    ))}
                </select>
            </label>

            <textarea
                rows={12}
                cols={80}
                placeholder="Paste room JSON here..."
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                style={{ marginTop: '1rem', width: '100%' }}
            />

            <button onClick={insertRooms} style={{ marginTop: '1rem' }}>
                Insert into Supabase
            </button>


            {sqlOutput && (
                <>
                    <h3>SQL Output</h3>
                    <textarea
                        readOnly
                        rows={10}
                        cols={80}
                        value={sqlOutput}
                        style={{ width: '100%' }}
                    />
                </>
            )}
        </div>
    );
}
