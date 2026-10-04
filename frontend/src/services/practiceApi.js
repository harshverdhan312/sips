/**
 * Practice Platform API Client
 * Communicates with the separate Practice Platform backend (Node/Express/PostgreSQL service).
 * Reuses the existing SIPS JWT token without creating duplicate authentication state or secrets.
 * Strictly adheres to server-authoritative identity: NO x-student-id or x-college-id headers.
 */

const PRACTICE_API_BASE_URL = import.meta.env.VITE_PRACTICE_API_URL || 'http://localhost:5050';

const getAuthToken = () => {
  try {
    return localStorage.getItem('sips_token');
  } catch (e) {
    return null;
  }
};

async function practiceRequest(endpoint, options = {}) {
  const url = `${PRACTICE_API_BASE_URL.replace(/\/+$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = getAuthToken();

  const headers = {
    ...options.headers
  };

  // Attach standard SIPS Bearer token
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Set JSON Content-Type if body is an object and not FormData
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData && options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch (networkError) {
    const err = new Error('Unable to connect to the Practice Platform service. Please check your connection or verify the practice backend is running.');
    err.status = 0;
    err.isNetworkError = true;
    err.originalError = networkError;
    throw err;
  }

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch (e) {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMsg =
      (typeof data === 'object' && data !== null && (data.message || data.error)) ||
      response.statusText ||
      'Practice Platform request failed.';
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const practiceApi = {
  get: (endpoint, options = {}) => practiceRequest(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => practiceRequest(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => practiceRequest(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options = {}) => practiceRequest(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options = {}) => practiceRequest(endpoint, { ...options, method: 'DELETE' }),
  baseUrl: PRACTICE_API_BASE_URL
};
