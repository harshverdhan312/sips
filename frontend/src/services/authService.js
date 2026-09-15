import { api } from './api';

/**
 * Authentication & Registration API service
 */
export const authService = {
  /**
   * Log in with institutional email or Roll No / USN and password
   */
  async login(identifier, password) {
    const data = await api.post('/api/auth/login', {
      email: identifier,
      identifier: identifier,
      password
    });
    return data;
  },

  /**
   * Register a new college institution tenant
   */
  async registerCollege(collegeData) {
    const data = await api.post('/api/auth/register-college', collegeData);
    return data;
  }
};
