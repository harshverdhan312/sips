import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { notificationService } from "../services/notificationService";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  let authContext = null;
  try {
    authContext = useAuth();
  } catch (e) {
    // Graceful fallback if used outside AuthProvider in isolated tests
  }
  const isAuthenticated = authContext?.isAuthenticated ?? false;

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Load read notification IDs from localStorage
  const getReadIds = useCallback(() => {
    try {
      const saved = localStorage.getItem("sips_read_notification_ids");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }, []);

  const saveReadIds = useCallback((ids) => {
    try {
      localStorage.setItem("sips_read_notification_ids", JSON.stringify(ids));
    } catch (e) {
      console.error("Could not save read notification IDs:", e);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const notifs = await notificationService.getNotifications();
      const readIds = getReadIds();
      const mapped = notifs.map((n) => ({
        ...n,
        read: readIds.includes(n.id)
      }));
      setNotifications(mapped);
    } catch (e) {
      console.error("Failed to load notifications:", e);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, getReadIds]);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    } else {
      setNotifications([]);
      setLoading(false);
    }
  }, [isAuthenticated, loadNotifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id) => {
    const readIds = getReadIds();
    if (!readIds.includes(id)) {
      const updated = [...readIds, id];
      saveReadIds(updated);
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    saveReadIds(allIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const addToast = (message, type = "success", duration = 4000) => {
    const id = "toast_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    setToasts((prev) => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const showSuccess = (message, duration = 4000) => addToast(message, "success", duration);
  const showError = (message, duration = 5000) => addToast(message, "error", duration);
  const showWarning = (message, duration = 4500) => addToast(message, "warning", duration);
  const showInfo = (message, duration = 4000) => addToast(message, "info", duration);
  const showNotification = (msgOrObj, type = "info", duration = 4000) => {
    if (typeof msgOrObj === "object" && msgOrObj !== null) {
      return addToast(msgOrObj.message || String(msgOrObj), msgOrObj.type || type, msgOrObj.duration || duration);
    }
    return addToast(String(msgOrObj), type, duration);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshNotifications: loadNotifications,
        markAsRead,
        markAllAsRead,
        toasts,
        addToast,
        removeToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }
  return ctx;
}
