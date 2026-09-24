import { api } from "./api";

export const adminService = {
  /**
   * Fetch institutional system KPIs from backend
   */
  async getSystemStats() {
    try {
      const [overviewRes, studentsRes] = await Promise.all([
        api.get('/api/admin/overview').catch(() => null),
        api.get('/api/admin/students?limit=200').catch(() => null)
      ]);
      const d = overviewRes?.data || {};
      const studentList = studentsRes?.students || [];
      const totalStudents = d.totalStudents || studentList.length || 0;
      const resumesUploaded = studentList.filter(s => Boolean(s.resumeUrl)).length;

      return {
        totalUsers: totalStudents + 1,
        activeToday: totalStudents > 0 ? totalStudents : 0,
        studentsEnrolled: totalStudents,
        placementOfficers: 1,
        administrators: 1,
        resumesParsedTotal: resumesUploaded,
        mockInterviewsCompleted: 0,
        systemHealth: "Operational",
        apiLatency: "Active",
        storageUsage: resumesUploaded > 0 ? `${(resumesUploaded * 0.4).toFixed(1)} MB` : "0 MB"
      };
    } catch (e) {
      console.warn("Could not fetch overview stats from backend:", e.message);
    }
    return {
      totalUsers: 0,
      activeToday: 0,
      studentsEnrolled: 0,
      placementOfficers: 1,
      administrators: 1,
      resumesParsedTotal: 0,
      mockInterviewsCompleted: 0,
      systemHealth: "Active",
      apiLatency: "Active",
      storageUsage: "0 MB"
    };
  },

  /**
   * Fetch all registered student users
   */
  async getUsers() {
    try {
      const res = await api.get('/api/admin/students');
      if (res && res.students) {
        return res.students.map((s) => ({
          id: s._id,
          _id: s._id,
          name: s.name,
          email: s.email,
          role: "student",
          department: s.branch,
          rollNo: s.rollNo,
          usn: s.usn,
          avatar: s.profileImageUrl || null,
          profileImageUrl: s.profileImageUrl || null,
          status: s.placementStatus || "Active",
          lastActive: "Recently active",
          title: "Student Candidate"
        }));
      }
    } catch (e) {
      console.warn("Could not fetch users from backend:", e.message);
    }
    return [];
  },

  /**
   * Provision a new student in the institution
   */
  async createStudent(userData) {
    const res = await api.post('/api/admin/students', {
      name: userData.name,
      email: userData.email,
      rollNo: userData.rollNo || userData.usn,
      usn: userData.usn || userData.rollNo,
      course: userData.course || '',
      branch: userData.branch || userData.department || 'Computer Science & Engineering',
      section: userData.section || '',
      batch: userData.batch ? String(userData.batch).trim() : '',
      cgpa: (userData.cgpa !== undefined && userData.cgpa !== '' && userData.cgpa !== null && !isNaN(Number(userData.cgpa)))
        ? parseFloat(userData.cgpa)
        : 0,
      password: userData.password || userData.rollNo
    });
    return res;
  },

  async createUser(userData) {
    return this.createStudent(userData);
  },

  /**
   * Update student status in backend
   */
  async updateUserStatus(userId, newStatus) {
    try {
      const res = await api.put(`/api/admin/students/${userId}`, {
        placementStatus: newStatus
      });
      return res;
    } catch (e) {
      console.error("Error updating user status:", e);
      throw e;
    }
  },

  /**
   * Fetch audit logs from overview activity
   */
  async getAuditLogs() {
    try {
      const res = await api.get('/api/admin/overview');
      if (res?.data?.recentActivity && res.data.recentActivity.length > 0) {
        return res.data.recentActivity.map((log) => ({
          id: log.id || log._id,
          action: log.action,
          actor: log.actor,
          target: log.target,
          timestamp: new Date(log.timestamp).toLocaleTimeString()
        }));
      }
    } catch (e) {
      console.warn("Could not fetch audit logs:", e.message);
    }
    return [
      { id: "log_init", action: "Tenant Environment Active", actor: "System", target: "SIPS Database", timestamp: "Today" }
    ];
  },

  /**
   * Bulk import students via CSV text or file
   */
  async uploadStudentsCSV(csvData) {
    let payload;
    if (typeof csvData === 'string') {
      payload = { csvData, csvText: csvData };
    } else if (csvData instanceof FormData) {
      payload = csvData;
    } else if (csvData && typeof csvData === 'object') {
      const text = csvData.csvData || csvData.csvText || '';
      payload = { csvData: text, csvText: text };
    } else {
      payload = { csvData: String(csvData), csvText: String(csvData) };
    }

    const res = await api.post('/api/admin/students/upload', payload);
    return res;
  },

  /**
   * Export students as CSV blob
   */
  async exportStudentsCSV(filters = {}) {
    const params = new URLSearchParams();
    if (filters.branch && filters.branch !== 'All') params.append('branch', filters.branch);
    if (filters.batch && filters.batch !== 'All') params.append('batch', filters.batch);
    if (filters.status && filters.status !== 'All') params.append('status', filters.status);
    const queryString = params.toString() ? `?${params.toString()}` : '';
    return await api.getBlob(`/api/admin/students/export${queryString}`);
  },

  /**
   * Fetch current college profile
   */
  async getCollegeProfile() {
    try {
      const res = await api.get('/api/admin/college/profile');
      return res?.college || res;
    } catch (e) {
      console.warn("Could not fetch college profile:", e.message);
      return null;
    }
  },

  /**
   * Update current college profile fields
   */
  async updateCollegeProfile(profileData) {
    try {
      const res = await api.put('/api/admin/college/profile', profileData);
      return res?.college || res;
    } catch (e) {
      console.error("Failed to update college profile:", e);
      throw e;
    }
  },

  /**
   * Upload college logo
   */
  async uploadCollegeLogo(file) {
    const formData = new FormData();
    formData.append('image', file);
    return await api.postMultipart('/api/admin/college/profile/image', formData);
  },

  /**
   * Delete college logo
   */
  async deleteCollegeLogo() {
    return await api.delete('/api/admin/college/profile/image');
  }
};
