import { api } from "./api";

export const notificationService = {
  /**
   * Fetch live college notifications from backend
   */
  async getNotifications() {
    try {
      const data = await api.get('/api/notification');
      if (Array.isArray(data)) {
        return data.map((n) => {
          const id = n._id || n.id;
          const createdAt = n.createdAt ? new Date(n.createdAt) : new Date();
          const target = n.target || 'ALL';
          const title = target === 'ALL'
            ? 'Placement Announcement'
            : `${target} Batch Alert`;

          return {
            id,
            _id: id,
            title,
            message: n.message || '',
            target,
            timestamp: createdAt.toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }),
            time: createdAt.toLocaleDateString(),
            createdAt: n.createdAt,
            read: false
          };
        });
      }
    } catch (e) {
      console.warn("Could not fetch notifications from backend:", e.message);
    }
    return [];
  }
};
