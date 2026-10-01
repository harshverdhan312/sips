import { useState, useEffect, useCallback } from 'react';
import { checkBackendHealth } from '../services/api';

export function useHealthCheck() {
  const [status, setStatus] = useState({
    loading: true,
    connected: false,
    data: null,
    error: null,
    lastChecked: null
  });

  const checkStatus = useCallback(async () => {
    setStatus((prev) => ({ ...prev, loading: true }));
    const result = await checkBackendHealth();
    setStatus({
      loading: false,
      connected: result.connected,
      data: result.data,
      error: result.error,
      lastChecked: new Date()
    });
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return { ...status, refresh: checkStatus };
}
