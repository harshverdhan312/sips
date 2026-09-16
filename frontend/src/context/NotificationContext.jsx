import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { notificationService } from "../services/notificationService";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
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
  }, [getReadIds]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

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
    const id = "toast_" + Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
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
        removeToast
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
