/**
 * Centralized API client for SIPS frontend
 * Handles JWT token injection, response parsing, and error normalization
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const getAuthToken = () => {
  try {
    return localStorage.getItem('sips_token');
  } catch (e) {
    return null;
  }
};

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers = {
    ...options.headers
  };

  // Attach bearer token if authenticated
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Auto set Content-Type to JSON if body is a non-FormData object
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData && options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  // Handle 401 Unauthorized
  if (response.status === 401 && !endpoint.includes('/auth/login')) {
    localStorage.removeItem('sips_token');
    localStorage.removeItem('sips_auth_user');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  // Parse JSON response
  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = (typeof data === 'object' && data?.message) || response.statusText || 'Request failed';
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' })
};
