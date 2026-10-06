import { api } from './api';

/**
 * Super Administrator API Service
 */
export const superAdminService = {
  /**
   * Get overview system statistics
   */
  async getStats() {
    return api.get('/api/super-admin/stats');
  },

  /**
   * Get pending college approval requests
   */
  async getPendingColleges() {
    return api.get('/api/super-admin/colleges/pending');
  },

  /**
   * Get all registered colleges with filtering & search
   */
  async getAllColleges(filters = {}) {
    const params = new URLSearchParams();
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/api/super-admin/colleges${qs}`);
  },

  /**
   * Approve a college application and dispatch login credentials via email
   */
  async approveCollege(id, { tempPassword, loginUrl } = {}) {
    return api.post(`/api/super-admin/colleges/${id}/approve`, {
      tempPassword,
      loginUrl: loginUrl || `${window.location.origin}/auth/login`
    });
  },

  /**
   * Reject a college application with remarks
   */
  async rejectCollege(id, reason) {
    return api.post(`/api/super-admin/colleges/${id}/reject`, { reason });
  },

  /**
   * Toggle active/inactive status of an approved college
   */
  async toggleCollegeStatus(id) {
    return api.post(`/api/super-admin/colleges/${id}/toggle-status`);
  },

  /**
   * Question Bank & Global Questions
   */
  async getGlobalQuestions(filters = {}) {
    const params = new URLSearchParams();
    params.append('scope', 'global');
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.search) params.append('search', filters.search);
    if (filters.type && filters.type !== 'ALL') params.append('type', filters.type);
    if (filters.difficulty && filters.difficulty !== 'ALL') params.append('difficulty', filters.difficulty);
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    
    // Check if practice platform API is reachable or proxy through super admin
    const qs = params.toString() ? `?${params.toString()}` : '';
    return api.get(`/api/super-admin/questions${qs}`);
  },

  /**
   * Add a new global question
   */
  async createGlobalQuestion(questionData) {
    return api.post('/api/super-admin/questions', {
      ...questionData,
      isGlobal: true,
      collegeId: null
    });
  },

  /**
   * Hard Delete a global question
   */
  async deleteGlobalQuestion(questionId) {
    return api.delete(`/api/super-admin/questions/${questionId}`);
  },

  /**
   * Bulk Hard Delete global questions
   */
  async bulkDeleteGlobalQuestions(ids) {
    return api.post('/api/super-admin/questions/bulk-delete', { ids });
  },

  /**
   * Bulk Activate / Publish global questions to practice hub
   */
  async bulkActivateGlobalQuestions(ids) {
    return api.post('/api/super-admin/questions/bulk-activate', { ids });
  },

  /**
   * Bulk Archive global questions
   */
  async bulkArchiveGlobalQuestions(ids) {
    return api.post('/api/super-admin/questions/bulk-archive', { ids });
  },

  /**
   * Archive / Inactive a global question
   */
  async archiveGlobalQuestion(questionId) {
    return api.post(`/api/super-admin/questions/${questionId}/archive`);
  },

  /**
   * Activate a draft or archived question
   */
  async activateGlobalQuestion(questionId) {
    return api.post(`/api/super-admin/questions/${questionId}/activate`);
  }
};
