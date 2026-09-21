import React, { createContext, useContext, useState, useEffect } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem("sips_token");
    const savedUser = localStorage.getItem("sips_auth_user");
    if (token && savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        console.error("Failed to parse saved auth user:", e);
      }
    }
    return null;
  });

  const [role, setRole] = useState(() => user?.role || null);

  useEffect(() => {
    if (user && localStorage.getItem("sips_token")) {
      localStorage.setItem("sips_auth_user", JSON.stringify(user));
      setRole(user.role);
    } else {
      localStorage.removeItem("sips_auth_user");
      setRole(null);
    }
  }, [user]);

  /**
   * Real authenticated login via backend API
   */
  const login = async (identifier, password) => {
    const data = await authService.login(identifier, password);

    if (!data || !data.token) {
      throw new Error(data?.message || "Authentication failed");
    }

    localStorage.setItem("sips_token", data.token);

    let mappedRole = "student";
    let userData = {};

    if (data.role === "COLLEGE_ADMIN") {
      mappedRole = "placement";
      userData = {
        id: data.userId,
        name: data.collegeName ? `${data.collegeName} Placement Cell` : "Placement Administration",
        email: identifier.includes("@") ? identifier : `${data.collegeSlug || "admin"}@college.edu`,
        role: "placement",
        backendRole: data.role,
        collegeSlug: data.collegeSlug,
        collegeName: data.collegeName,
        avatar: data.logoUrl || null,
        logoUrl: data.logoUrl || null,
        status: "Active"
      };
    } else {
      mappedRole = "student";
      userData = {
        id: data.userId,
        name: data.studentName || "Student Candidate",
        email: identifier.includes("@") ? identifier : "",
        rollNo: !identifier.includes("@") ? identifier : "",
        role: "student",
        backendRole: data.role,
        collegeSlug: data.collegeSlug,
        collegeName: data.collegeName,
        avatar: data.profileImageUrl || null,
        profileImageUrl: data.profileImageUrl || null,
        status: "Active"
      };
    }

    localStorage.setItem("sips_auth_user", JSON.stringify(userData));
    setUser(userData);
    setRole(mappedRole);

    return { user: userData, role: mappedRole };
  };

  /**
   * Register a new institution / college placement cell
   */
  const registerCollege = async (collegeData) => {
    const data = await authService.registerCollege(collegeData);

    if (!data || !data.token) {
      throw new Error(data?.message || "College registration failed");
    }

    localStorage.setItem("sips_token", data.token);

    const newAdmin = {
      id: data.college?._id || data.userId || "col_" + Date.now(),
      name: `${collegeData.name} Placement Cell`,
      email: collegeData.adminEmail,
      role: "placement",
      backendRole: "COLLEGE_ADMIN",
      collegeSlug: collegeData.slug,
      collegeName: collegeData.name,
      department: "Placement & Training Division",
      avatar: data.college?.logoUrl || null,
      logoUrl: data.college?.logoUrl || null,
      status: "Active"
    };

    localStorage.setItem("sips_auth_user", JSON.stringify(newAdmin));
    setUser(newAdmin);
    setRole("placement");

    return newAdmin;
  };

  /**
   * Update user details in memory and storage (e.g. after avatar upload/delete)
   */
  const updateUser = (fields) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...fields };
      localStorage.setItem("sips_auth_user", JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    localStorage.removeItem("sips_token");
    localStorage.removeItem("sips_auth_user");
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user && !!localStorage.getItem("sips_token"),
        login,
        registerCollege,
        updateUser,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
