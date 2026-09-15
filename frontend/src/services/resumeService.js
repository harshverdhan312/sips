import { api } from "./api";

export const resumeService = {
  /**
   * Upload resume PDF to backend
   * Calls POST /api/student/resume with multipart FormData (field: 'resume')
   */
  async uploadResume(file) {
    const formData = new FormData();
    formData.append('resume', file);

    const res = await api.post('/api/student/resume', formData);
    return res;
  }
};
