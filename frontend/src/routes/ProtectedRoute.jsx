import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function ProtectedRoute({ allowedRoles = [] }) {
  const { user, role, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    // Redirect to the user's primary dashboard if attempting to access another role's routes
    if (role === "super_admin") {
      return <Navigate to="/super-admin/dashboard" replace />;
    }
    if (role === "university_admin") {
      return <Navigate to="/institution/dashboard" replace />;
    }
    if (role === "placement") {
      return <Navigate to="/placement/dashboard" replace />;
    }
    if (role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/student/dashboard" replace />;
  }

  return <Outlet />;
}
