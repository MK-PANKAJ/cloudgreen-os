
import { getServerSession } from "next-auth";
import { CarbonDashboard } from '../components/CarbonDashboard';

export default async function Page() {
  const session = await getServerSession();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <header style={{ backgroundColor: '#111827', color: 'white', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem' }}>🌱 CloudGreen OS</h1>
        
        {/* Auth UI */}
        <div>
          {session ? (
            <span style={{ color: '#86efac' }}>Logged in as {session.user?.name || 'Enterprise Admin'}</span>
          ) : (
            <a href="/api/auth/signin/keycloak" style={{ backgroundColor: '#22c55e', padding: '0.5rem 1rem', borderRadius: '6px', color: 'white', textDecoration: 'none' }}>
              Enterprise Login
            </a>
          )}
        </div>
      </header>
      
      <main>
        {session ? (
          <CarbonDashboard />
        ) : (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <h2>Enterprise Access Restricted</h2>
            <p>Please log in with your Keycloak credentials to view telemetry.</p>
          </div>
        )}
      </main>
    </div>
  );
}