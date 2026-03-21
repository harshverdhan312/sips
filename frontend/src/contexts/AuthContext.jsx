import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('sips_token');
    const role = localStorage.getItem('sips_role');
    const collegeSlug = localStorage.getItem('sips_college_slug');
    const collegeName = localStorage.getItem('sips_college_name');
    const userId = localStorage.getItem('sips_user_id');
    return { token, role, collegeSlug, collegeName, userId };
  });

  const login = useCallback((data) => {
    localStorage.setItem('sips_token', data.token);
    localStorage.setItem('sips_role', data.role);
    localStorage.setItem('sips_college_slug', data.collegeSlug);
    localStorage.setItem('sips_college_name', data.collegeName);
    localStorage.setItem('sips_user_id', data.userId);
    setAuth({
      token: data.token,
      role: data.role,
      collegeSlug: data.collegeSlug,
      collegeName: data.collegeName,
      userId: data.userId
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sips_token');
    localStorage.removeItem('sips_role');
    localStorage.removeItem('sips_college_slug');
    localStorage.removeItem('sips_college_name');
    localStorage.removeItem('sips_user_id');
    setAuth({ token: null, role: null, collegeSlug: null, collegeName: null, userId: null });
  }, []);

  const isAuthenticated = !!auth.token;
  const isAdmin = auth.role === 'COLLEGE_ADMIN';
  const isStudent = auth.role === 'STUDENT';

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, isAuthenticated, isAdmin, isStudent }}>
      {children}
    </AuthContext.Provider>
  );
};
