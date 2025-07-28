/**
 * Environment Variables Test Component
 * This component displays the current environment variables for debugging
 */
import React from 'react';

const EnvTest = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const backendUrl = import.meta.env.VITE_BACKEND_API_URL;

  return (
    <div style={{ 
      padding: '20px', 
      margin: '20px', 
      border: '2px solid #ccc', 
      backgroundColor: '#f9f9f9',
      fontFamily: 'monospace'
    }}>
      <h3>Environment Variables Debug</h3>
      <div>
        <strong>VITE_SUPABASE_URL:</strong> {supabaseUrl || 'NOT SET'}
      </div>
      <div>
        <strong>VITE_SUPABASE_ANON_KEY:</strong> {supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET'}
      </div>
      <div>
        <strong>VITE_BACKEND_API_URL:</strong> {backendUrl || 'NOT SET'}
      </div>
      <div style={{ marginTop: '10px' }}>
        <strong>All import.meta.env:</strong>
        <pre>{JSON.stringify(import.meta.env, null, 2)}</pre>
      </div>
    </div>
  );
};

export default EnvTest;
