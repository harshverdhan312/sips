import { api } from './api';

/**
 * University / Institution Administration API Service
 */
export const institutionService = {
  /**
   * Onboard a new University / Institute with its root administration account
   */
  async onboard(institutionData) {
    return await api.post('/api/institution/onboard', institutionData);
  },

  /**
   * Get University profile
   */
  async getProfile() {
    return await api.get('/api/institution/profile');
  },

  /**
   * Update University profile
   */
  async updateProfile(profileData) {
    return await api.put('/api/institution/profile', profileData);
  },

  /**
   * Upload institution logo
   */
  async uploadLogo(file) {
    const formData = new FormData();
    formData.append('image', file);
    return await api.postMultipart('/api/institution/profile/image', formData);
  },

  /**
   * Delete institution logo
   */
  async deleteLogo() {
    return await api.delete('/api/institution/profile/image');
  },

  /**
   * Get all departments for the authenticated university
   */
  async getDepartments() {
    return await api.get('/api/institution/departments');
  },

  /**
   * Create a new department with designated login credentials
   */
  async createDepartment(departmentData) {
    return await api.post('/api/institution/departments', departmentData);
  },

  /**
   * Update department details
   */
  async updateDepartment(departmentId, departmentData) {
    return await api.put(`/api/institution/departments/${departmentId}`, departmentData);
  },

  /**
   * Toggle department active / inactive status
   */
  async toggleDepartmentStatus(departmentId) {
    return await api.patch(`/api/institution/departments/${departmentId}/status`, {});
  },

  /**
   * Delete a department (must have 0 active students/jobs or force)
   */
  async deleteDepartment(departmentId) {
    return await api.delete(`/api/institution/departments/${departmentId}`);
  },

  /**
   * Get the logged-in department's own profile
   */
  async getDepartmentOwnProfile() {
    return await api.get('/api/institution/department/profile');
  },

  /**
   * Update the logged-in department's own profile
   */
  async updateDepartmentOwnProfile(departmentData) {
    return await api.put('/api/institution/department/profile', departmentData);
  }
};
