import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import CollegeRegistration from './pages/CollegeRegistration';
import AdminDashboard from './pages/AdminDashboard';
import StudentDashboard from './pages/StudentDashboard';

const ProtectedAdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated || !isAdmin) return <Navigate to="/" replace />;
  return children;
};

const ProtectedStudentRoute = ({ children }) => {
  const { isAuthenticated, isStudent } = useAuth();
  if (!isAuthenticated || !isStudent) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/register-college" element={<CollegeRegistration />} />
      <Route path="/login" element={<Login />} />
      <Route path="/:collegeSlug/login" element={<Login />} />
      <Route path="/:collegeSlug/admin-dashboard" element={
        <ProtectedAdminRoute>
          <AdminDashboard />
        </ProtectedAdminRoute>
      } />
      <Route path="/:collegeSlug/student-dashboard" element={
        <ProtectedStudentRoute>
          <StudentDashboard />
        </ProtectedStudentRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-[#0a0a0a] text-white font-['Inter',sans-serif]">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
};

export default App;
