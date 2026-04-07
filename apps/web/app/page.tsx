"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Page() {
  const [healthStatus, setHealthStatus] = useState<string>('Connecting to API...');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8787/health');
        setHealthStatus(`${response.data.status} at ${response.data.timestamp}`);
      } catch (error) {
        setHealthStatus('❌ Failed to connect to API');
      }
    };

    checkHealth();
  }, []);

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>🌱 CloudGreen OS Dashboard</h1>
      <div style={{ padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', marginTop: '1rem' }}>
        <strong>Backend Status:</strong> {healthStatus}
      </div>
    </main>
  );
}