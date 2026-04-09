"use client";

import { useEffect, useState, type ReactNode } from 'react';
import axios from 'axios';
import { Activity, Coins, Factory, Server, Thermometer, Wind, Zap } from 'lucide-react';

const API_BASE_URL = 'http://127.0.0.1:8787';
const WALLET_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';

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

interface GraphQLResponse<T> {
  data?: T;
}

interface DashboardGraphQLData {
  enterpriseExposure?: {
    totalScope3?: number;
  };
  tokenBalance?: string;
}

const cardGridStyles = {
  display: 'grid',
  gap: '1rem',
};

function getModeStyles(mode: string) {
  if (mode === 'Green') return { backgroundColor: '#dcfce7', color: '#166534', borderColor: '#86efac' };
  if (mode === 'Critical') return { backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' };
  if (mode === 'Defer') return { backgroundColor: '#fef08a', color: '#854d0e', borderColor: '#fde047' };
  return { backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#93c5fd' };
}

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: string | number }) {
  return (
    <div style={{ padding: '1.5rem', border: '1px solid #e5e7eb', borderRadius: '12px', backgroundColor: 'white' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b7280', marginBottom: '0.5rem' }}>
        {icon}
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{value}</div>
    </div>
  );
}

export function CarbonDashboard() {
  const [data, setData] = useState<CarbonData | null>(null);
  const [workloadStats, setWorkloadStats] = useState<WorkloadStats>({ active: 0, waiting: 0, completed: 0 });
  const [scope3Exposure, setScope3Exposure] = useState<number | null>(null);
  const [tokenBalance, setTokenBalance] = useState('0.0');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoadError(null);

      const [carbonResult, statsResult, graphqlResult] = await Promise.allSettled([
        axios.get<{ data: CarbonData }>(`${API_BASE_URL}/api/carbon/live`),
        axios.get<{ stats: WorkloadStats }>(`${API_BASE_URL}/api/workloads/stats`),
        axios.post<GraphQLResponse<DashboardGraphQLData>>(`${API_BASE_URL}/graphql`, {
          query: `
            query DashboardTelemetry($wallet: String!) {
              enterpriseExposure { totalScope3 }
              tokenBalance(wallet: $wallet)
            }
          `,
          variables: {
            wallet: WALLET_ADDRESS,
          },
        }),
      ]);

      if (carbonResult.status === 'fulfilled') {
        setData(carbonResult.value.data.data);
      }

      if (statsResult.status === 'fulfilled') {
        setWorkloadStats(statsResult.value.data.stats);
      }

      if (graphqlResult.status === 'fulfilled') {
        const graphData = graphqlResult.value.data.data;
        setScope3Exposure(graphData?.enterpriseExposure?.totalScope3 ?? null);
        setTokenBalance(graphData?.tokenBalance ?? '0.0');
      }
    } catch (error) {
      console.error('Failed to fetch telemetry', error);
      setLoadError('Telemetry sync failed. Retrying in the background.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div style={{ padding: '2rem' }}>Syncing with CloudGreen OS Master Node...</div>;
  if (!data) return <div style={{ padding: '2rem', color: 'red' }}>Failed to load platform data.</div>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Live Platform Telemetry</h2>
          <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Data Source: {data.source ?? 'Carbon Intensity API (UK)'}</span>
          {loadError ? <div style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: '#b45309' }}>{loadError}</div> : null}
        </div>
        <span
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '9999px',
            fontWeight: 'bold',
            border: '1px solid',
            ...getModeStyles(data.mode),
          }}
        >
          Mode: {data.mode}
        </span>
      </div>

      <div style={{ ...cardGridStyles, gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: '2rem' }}>
        <StatCard icon={<Activity />} label="Carbon Intensity" value={`${data.intensity} gCO₂/kWh`} />
        {data.wind_speed_10m !== 'N/A' ? <StatCard icon={<Wind />} label="Wind Speed" value={`${data.wind_speed_10m} km/h`} /> : null}
        {data.temperature_2m !== 'N/A' ? <StatCard icon={<Thermometer />} label="Grid Temp" value={`${data.temperature_2m} °C`} /> : null}
      </div>

      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
        Enterprise & Ecosystem Layers
      </h3>
      <div style={{ ...cardGridStyles, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', marginBottom: '2rem' }}>
        <StatCard icon={<Factory color="#6366f1" />} label="Total Scope 3 Exposure (Neo4j)" value={scope3Exposure !== null ? `${scope3Exposure} kgCO₂e` : 'Loading...'} />
        <StatCard icon={<Coins color="#10b981" />} label="GreenCredit Balance (Web3)" value={`${tokenBalance} GCRD`} />
      </div>

      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
        Carbon-Aware Queue Stats
      </h3>
      <div style={{ ...cardGridStyles, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <StatCard icon={<Zap color="#eab308" />} label="Active Jobs" value={workloadStats.active} />
        <StatCard icon={<Server color="#3b82f6" />} label="Deferred / Waiting" value={workloadStats.waiting} />
        <StatCard icon={<Activity color="#22c55e" />} label="Completed Safely" value={workloadStats.completed} />
      </div>
    </div>
  );
}