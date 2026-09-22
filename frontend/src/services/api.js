/**
 * Centralized API client for SIPS frontend
 * Handles JWT token injection, response parsing, and error normalization
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

/**
 * Resolves a backend-hosted asset path (e.g. /uploads/profile-123.jpg)
 * against the backend API base URL (VITE_API_URL).
 * - Leaves null/undefined/empty safely unchanged
 * - Leaves absolute URLs (http://, https://, data:, blob:) unchanged
 * - Resolves relative /uploads/... or similar root-relative asset paths against API_BASE_URL
 * - Avoids duplicate slashes
 */
export function resolveAssetUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  // Preserve absolute URLs and data/blob URIs
  if (/^(?:https?:|\/\/|data:|blob:)/i.test(trimmed)) {
    return trimmed;
  }

  // If no API_BASE_URL is configured (e.g. local Vite dev with proxy), return relative path as-is
  if (!API_BASE_URL) {
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }

  // Strip trailing slash from API_BASE_URL and leading slash from relative path
  const base = API_BASE_URL.replace(/\/+$/, '');
  const path = trimmed.replace(/^\/+/, '');
  return `${base}/${path}`;
}

const getAuthToken = () => {
  try {
    return localStorage.getItem('sips_token');
  } catch (e) {
    return null;
  }
};

const sanitizeErrorMessage = (msg, status) => {
  if (!msg || typeof msg !== 'string') {
    return null;
  }
  const lower = msg.toLowerCase();
  const sensitivePatterns = [
    'mongo',
    'cast to',
    'syntaxerror',
    'referenceerror',
    'typeerror',
    'econnrefused',
    'enotfound',
    'stack',
    'node_modules',
    'at async',
    'server error during'
  ];
  if (sensitivePatterns.some(pattern => lower.includes(pattern))) {
    if (status >= 500) {
      return 'Something went wrong on the server. Please try again later.';
    }
    return 'Invalid request. Please check your information.';
  }
  return msg;
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

  let response;
  try {
    response = await fetch(url, {
      ...options,
      headers
    });
  } catch (networkError) {
    const err = new Error('Unable to connect to the server. Please check your connection and try again.');
    err.status = 0;
    err.isNetworkError = true;
    err.originalError = networkError;
    throw err;
  }

  // Handle 401 Unauthorized
  if (response.status === 401 && !endpoint.includes('/auth/login')) {
    try {
      localStorage.removeItem('sips_token');
      localStorage.removeItem('sips_auth_user');
    } catch (e) {
      // ignore
    }

    if (typeof window !== 'undefined') {
      const currentPath = window.location.pathname;
      const isPublicRoute = currentPath === '/' || currentPath === '' || currentPath === '/login';

      // Only redirect if accessing a protected route with an expired/invalid session
      // Never redirect from the public Landing Page or Login page
      if (!isPublicRoute && token) {
        window.location.href = '/login';
      }
    }
  }

  // Parse JSON response
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
    let rawMsg = (typeof data === 'object' && data !== null && (data.message || data.error)) || response.statusText;
    let safeMsg = sanitizeErrorMessage(rawMsg, response.status);

    if (response.status === 401) {
      if (endpoint.includes('/auth/login')) {
        safeMsg = safeMsg || 'Invalid credentials. Please check your login details.';
      } else {
        safeMsg = 'Your session has expired. Please log in again.';
      }
    } else if (response.status === 403) {
      safeMsg = safeMsg || 'You do not have permission to perform this action.';
    } else if (response.status === 404) {
      safeMsg = safeMsg || 'The requested resource could not be found.';
    } else if (response.status === 409) {
      safeMsg = safeMsg || 'This information already exists.';
    } else if (response.status === 422) {
      safeMsg = safeMsg || 'Please check the entered information.';
    } else if (response.status === 429) {
      safeMsg = 'Too many requests. Please try again later.';
    } else if (response.status >= 502 && response.status <= 504) {
      safeMsg = 'Server is currently unavailable. Please try again later.';
    } else if (response.status >= 500) {
      safeMsg = 'Something went wrong on the server. Please try again later.';
    } else if (!safeMsg) {
      safeMsg = 'Request failed. Please try again.';
    }

    const err = new Error(safeMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  get: (endpoint, options = {}) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'POST', body }),
  postMultipart: (endpoint, formData, options = {}) => request(endpoint, { ...options, method: 'POST', body: formData }),
  put: (endpoint, body, options = {}) => request(endpoint, { ...options, method: 'PUT', body }),
  delete: (endpoint, options = {}) => request(endpoint, { ...options, method: 'DELETE' }),
  getBlob: async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAuthToken();

    const headers = {
      ...options.headers
    };

    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response;
    try {
      response = await fetch(url, {
        ...options,
        method: 'GET',
        headers
      });
    } catch (networkError) {
      const err = new Error('Unable to connect to the server. Please check your connection and try again.');
      err.status = 0;
      err.isNetworkError = true;
      throw err;
    }

    if (!response.ok) {
      let safeMsg = 'Failed to download file.';
      try {
        const errorData = await response.json();
        safeMsg = errorData.message || safeMsg;
      } catch (e) {
        // ignore json parse error on non-json error responses
      }
      const err = new Error(safeMsg);
      err.status = response.status;
      throw err;
    }

    const blob = await response.blob();
    const disposition = response.headers.get('content-disposition');
    let filename = 'sips-students-export.csv';
    if (disposition && disposition.includes('filename=')) {
      const match = disposition.match(/filename=["']?([^"';]+)["']?/i);
      if (match && match[1]) {
        filename = match[1].trim();
      }
    }

    return { blob, filename };
  }
};
