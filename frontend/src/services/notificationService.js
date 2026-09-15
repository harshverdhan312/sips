import { initialNotifications } from "../data/mockNotifications";

export const notificationService = {
  async getNotifications() {
    await new Promise((res) => setTimeout(res, 150));
    const saved = localStorage.getItem("sips_notifications");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialNotifications;
  },

  async markAsRead(id) {
    const notifs = await this.getNotifications();
    const updated = notifs.map((n) => (n.id === id ? { ...n, read: true } : n));
    localStorage.setItem("sips_notifications", JSON.stringify(updated));
    return updated;
  },

  async markAllAsRead() {
    const notifs = await this.getNotifications();
    const updated = notifs.map((n) => ({ ...n, read: true }));
    localStorage.setItem("sips_notifications", JSON.stringify(updated));
    return updated;
  }
};
