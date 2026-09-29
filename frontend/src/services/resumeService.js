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
  },

  /**
   * Confirm reviewed skills detected from resume
   * Calls POST /api/student/resume/confirm-skills
   */
  async confirmResumeSkills(confirmedSkills) {
    const res = await api.post('/api/student/resume/confirm-skills', { confirmedSkills });
    return res;
  },

  /**
   * Delete active resume from backend
   * Calls DELETE /api/student/resume
   */
  async deleteResume() {
    const res = await api.delete('/api/student/resume');
    return res;
  }
};
