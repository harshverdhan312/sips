const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5050';

export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    const data = await response.json();
    return {
      connected: true,
      data,
      error: null
    };
  } catch (err) {
    return {
      connected: false,
      data: null,
      error: err.message || 'Unable to connect to backend'
    };
  }
}
