import { api } from './api';

/**
 * Authentication & Registration API service
 */
export const authService = {
  /**
   * General login with institutional email or Roll No / USN and password
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
   * Student-only login
   */
  async studentLogin(identifier, password) {
    const data = await api.post('/api/auth/student-login', {
      identifier: identifier.trim(),
      email: identifier.trim(),
      password
    });
    return data;
  },

  /**
   * University Admin and Department Admin login
   */
  async institutionLogin(identifier, password) {
    const data = await api.post('/api/auth/institution-login', {
      identifier: identifier.trim(),
      username: identifier.trim(),
      email: identifier.trim(),
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
