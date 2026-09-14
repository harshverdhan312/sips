import React, { createContext, useContext, useState, useEffect } from "react";
import { mockUsers } from "../data/mockUsers";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("sips_auth_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    // Default to student demo user
    return mockUsers[0];
  });

  const [role, setRole] = useState(() => user?.role || "student");

  useEffect(() => {
    if (user) {
      localStorage.setItem("sips_auth_user", JSON.stringify(user));
      setRole(user.role);
    } else {
      localStorage.removeItem("sips_auth_user");
    }
  }, [user]);

  const login = (email, password, chosenRole) => {
    // Look up mock user or match by role
    let found = mockUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      found = mockUsers.find((u) => u.role === chosenRole) || mockUsers[0];
    }
    setUser(found);
    setRole(found.role);
    return found;
  };

  const demoLogin = (targetRole) => {
    const found = mockUsers.find((u) => u.role === targetRole) || mockUsers[0];
    setUser(found);
    setRole(found.role);
    return found;
  };

  const switchRole = (newRole) => {
    const found = mockUsers.find((u) => u.role === newRole);
    if (found) {
      setUser(found);
      setRole(found.role);
    }
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem("sips_auth_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        login,
        demoLogin,
        switchRole,
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
