import React from 'react';

export function StatusCard({ loading, connected, data, error, lastChecked, onRefresh }) {
  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h2 style={styles.title}>Service Status</h2>
        <button
          onClick={onRefresh}
          disabled={loading}
          style={styles.refreshBtn}
        >
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      <div style={styles.statusRow}>
        <span style={styles.label}>Backend Connection:</span>
        <span
          style={{
            ...styles.badge,
            backgroundColor: connected ? '#10b981' : '#ef4444'
          }}
        >
          {connected ? 'Connected' : 'Not Connected'}
        </span>
      </div>

      {data && (
        <div style={styles.details}>
          <div style={styles.detailRow}>
            <strong>Service:</strong> {data.service}
          </div>
          <div style={styles.detailRow}>
            <strong>Status:</strong> {data.status}
          </div>
        </div>
      )}

      {error && (
        <div style={styles.errorBox}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {lastChecked && (
        <div style={styles.footer}>
          Last checked: {lastChecked.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

const styles = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    maxWidth: '480px',
    width: '100%',
    margin: '0 auto',
    border: '1px solid #e2e8f0',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 600,
    color: '#0f172a'
  },
  refreshBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    color: '#334155',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px'
  },
  label: {
    color: '#64748b',
    fontSize: '14px'
  },
  badge: {
    color: '#ffffff',
    padding: '4px 10px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: 600,
    letterSpacing: '0.025em'
  },
  details: {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
    fontSize: '13px',
    color: '#334155'
  },
  detailRow: {
    margin: '4px 0'
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    color: '#b91c1c',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
    fontSize: '13px'
  },
  footer: {
    fontSize: '12px',
    color: '#94a3b8',
    textAlign: 'right'
  }
};
