import React from 'react';
import { StatusCard } from '../components/StatusCard';
import { useHealthCheck } from '../hooks/useHealthCheck';

export function LandingPage() {
  const { loading, connected, data, error, lastChecked, refresh } = useHealthCheck();

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>SIPS Practice Platform</h1>
        <p style={styles.subtitle}>
          Independent Practice, Assessment &amp; Contest Service Foundation
        </p>
      </header>

      <main style={styles.main}>
        <StatusCard
          loading={loading}
          connected={connected}
          data={data}
          error={error}
          lastChecked={lastChecked}
          onRefresh={refresh}
        />
      </main>

      <footer style={styles.footer}>
        Phase 1: Foundation Scaffold Active
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: '#f1f5f9',
    padding: '40px 20px',
    boxSizing: 'border-box',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 8px 0'
  },
  subtitle: {
    fontSize: '14px',
    color: '#64748b',
    margin: 0
  },
  main: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  footer: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#94a3b8',
    marginTop: '32px'
  }
};
