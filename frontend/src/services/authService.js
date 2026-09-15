/**
 * Authentication & Registration API service
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const authService = {
  /**
   * Log in with institutional email & password
   */
  async login(email, password) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }
      return data;
    } catch (err) {
      // Return simulated success if backend is offline during standalone UI demos
      console.warn('API call failed, falling back to local session simulation:', err.message);
      return null;
    }
  },

  /**
   * Register a new student
   */
  async registerStudent(studentData) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      return data;
    } catch (err) {
      console.warn('API call failed, falling back to local registration simulation:', err.message);
      return null;
    }
  },

  /**
   * Register a new college tenant
   */
  async registerCollege(collegeData) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register-college`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(collegeData)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'College registration failed');
      }
      return data;
    } catch (err) {
      console.warn('API call failed, falling back to local registration simulation:', err.message);
      return null;
    }
  }
};
