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
          const msg = (n.message || '').toLowerCase();
          let link = '/student/jobs';

          if (msg.includes('interview') || msg.includes('mock') || msg.includes('diagnostic')) {
            link = '/student/interview';
          } else if (msg.includes('skill') || msg.includes('gap') || msg.includes('radar')) {
            link = '/student/skills';
          } else if (msg.includes('resume') || msg.includes('cv') || msg.includes('ats')) {
            link = '/student/resume';
          } else if (msg.includes('star') || msg.includes('behavior')) {
            link = '/student/star';
          } else if (msg.includes('task') || msg.includes('growth')) {
            link = '/student/tasks';
          } else if (msg.includes('peer') || msg.includes('matching')) {
            link = '/student/peers';
          } else if (msg.includes('profile') || msg.includes('account')) {
            link = '/student/profile';
          } else if (msg.includes('readiness') || msg.includes('score')) {
            link = '/student/readiness';
          }

          return {
            id,
            _id: id,
            title,
            message: n.message || '',
            target,
            link,
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
