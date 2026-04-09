"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, Wind, Thermometer, Zap, Server, Factory, Coins } from 'lucide-react';

interface CarbonData {
  intensity: number;
  mode: string;
  wind_speed_10m: number | string;
  temperature_2m: number | string;
  source?: string;
}

interface WorkloadStats {
  active: number;
  waiting: number;
  completed: number;
}

export function CarbonDashboard() {
  const [data, setData] = useState<CarbonData | null>(null);
  const [workloadStats, setWorkloadStats] = useState<WorkloadStats>({ active: 0, waiting: 0, completed: 0 });
  
  // NEW: State for Phase 3 & 4 Data
  const [scope3Exposure, setScope3Exposure] = useState<number | null>(null);
  const [tokenBalance, setTokenBalance] = useState<string>("0.0");
  
  const [loading, setLoading] = useState(true);

  // The Hardhat Wallet Address we used earlier
  const WALLET_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  const fetchData = async () => {
    try {
      // 1. Fetch REST Data (Queue Stats & Fallback Telemetry)
      const [carbonRes, statsRes] = await Promise.all([
        axios.get('http://127.0.0.1:8787/api/carbon/live'),
        axios.get('http://127.0.0.1:8787/api/workloads/stats')
      ]);
      
      setData(carbonRes.data.data);
      setWorkloadStats(statsRes.data.stats);

      // 2. Fetch GraphQL Data (Enterprise Graph & Web3 Blockchain)
      const graphqlQuery = {
        query: `
          query {
            enterpriseExposure { totalScope3 }
            tokenBalance(wallet: "${WALLET_ADDRESS}")
          }
        `
      };
      
      const gqlRes = await axios.post('http://127.0.0.1:8787/graphql', graphqlQuery);
      
      if (gqlRes.data && gqlRes.data.data) {
        setScope3Exposure(gqlRes.data.data.enterpriseExposure.totalScope3);
        setTokenBalance(gqlRes.data.data.tokenBalance);
      }

    } catch (error) {
      console.error("Failed to fetch telemetry", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Syncing with CloudGreen OS Master Node...</div>;
  if (!data) return <div style={{ padding: '2rem', color: 'red' }}>Failed to load platform data.</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Live Platform Telemetry</h2>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Data Source: {data.source || 'Fallback'}</span>
        </div>
        <span style={{ 
          padding: '0.5rem 1rem', 
          borderRadius: '9999px', 
          fontWeight: 'bold',
          border: '1px solid',
          ...getModeStyles(data.mode)
        }}>
          Mode: {data.mode}
        </span>
      </div>

      {/* L2: TELEMETRY & GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard icon={<Activity />} label="Carbon Intensity" value={`${data.intensity} gCO₂/kWh`} />
        {data.wind_speed_10m !== 'N/A' && <StatCard icon={<Wind />} label="Wind Speed" value={`${data.wind_speed_10m} km/h`} />}
        {data.temperature_2m !== 'N/A' && <StatCard icon={<Thermometer />} label="Grid Temp" value={`${data.temperature_2m} °C`} />}
      </div>

      {/* L3 & L4: ENTERPRISE GRAPH & WEB3 ECOSYSTEM */}
      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
        Enterprise & Ecosystem Layers
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
        <StatCard 
          icon={<Factory color="#6366f1" />} 
          label="Total Scope 3 Exposure (Neo4j)" 
          value={scope3Exposure !== null ? `${scope3Exposure} kgCO₂e` : 'Loading...'} 
        />
        <StatCard 
          icon={<Coins color="#10b981" />} 
          label="GreenCredit Balance (Web3)" 
          value={`${tokenBalance} GCRD`} 
        />
      </div>

      {/* L1: ORCHESTRATION & QUEUE */}
      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
        Carbon-Aware Queue Stats
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <StatCard icon={<Zap color="#eab308" />} label="Active Jobs" value={workloadStats.active} />
        <StatCard icon={<Server color="#3b82f6" />} label="Deferred / Waiting" value={workloadStats.waiting} />
        <StatCard icon={<Activity color="#22c55e" />} label="Completed Safely" value={workloadStats.completed} />
      </div>

    </div>
  );
}

function getModeStyles(mode: string) {
  if (mode === 'Green') return { backgroundColor: '#dcfce7', color: '#166534', borderColor: '#86efac' };
  if (mode === 'Critical') return { backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' };
  if (mode === 'Defer') return { backgroundColor: '#fef08a', color: '#854d0e', borderColor: '#fde047' };
  return { backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#93c5fd' }; 
}

function StatCard({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) {
  return (
    <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', marginBottom: '0.5rem' }}>
        {icon}
        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>{value}</div>
    </div>
  );
}