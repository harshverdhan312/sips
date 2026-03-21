import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sips_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sips_token');
      localStorage.removeItem('sips_role');
      localStorage.removeItem('sips_college_slug');
      localStorage.removeItem('sips_college_name');
      localStorage.removeItem('sips_user_id');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// === Auth ===
export const loginUser = (email, password) =>
  api.post('/auth/login', { email, password });

export const registerCollege = (data) =>
  api.post('/auth/register-college', data);

// === College (Admin) ===
export const getCollegeBySlug = (slug) =>
  api.get(`/college/info/${slug}`);

export const uploadStudents = (csvText) =>
  api.post('/college/upload-students', { csvText });

export const getStudents = () =>
  api.get('/college/students');

// === Job Descriptions ===
export const createJD = (data) =>
  api.post('/jd', data);

export const getJDs = () =>
  api.get('/jd');

export const getJD = (id) =>
  api.get(`/jd/${id}`);

export const getJDMatches = (id) =>
  api.get(`/jd/${id}/matches`);

export const recomputeMatches = () =>
  api.post('/jd/recompute');

// === Student ===
export const getProfile = () =>
  api.get('/student/profile');

export const updateProfile = (data) =>
  api.put('/student/profile', data);

export const uploadResume = (file) => {
  const formData = new FormData();
  formData.append('resume', file);
  return api.post('/student/resume', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const getStudentJobs = () =>
  api.get('/student/jobs');

export const getPreferredJobs = () =>
  api.get('/student/preferred-jobs');

// === Notifications ===
export const createNotification = (message, target = 'ALL') =>
  api.post('/notification', { message, target });

export const getNotifications = () =>
  api.get('/notification');

export default api;
