import React, { useState, useEffect } from 'react';
import { getNotifications, createNotification } from '../../api';

const NotificationManager = ({ isAdmin = false }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNotifications(); }, []);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    try {
      await createNotification(message.trim());
      setMessage('');
      loadNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-5 h-full flex flex-col">
      <h3 className="text-sm font-bold font-['Manrope',sans-serif] mb-4 text-white/80">Notifications</h3>

      {/* Create (admin only) */}
      {isAdmin && (
        <div className="mb-4">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            placeholder="Type a notification..."
            className="w-full px-3 py-2.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-white placeholder-white/25 focus:outline-none focus:border-indigo-500/50 transition-all text-xs resize-none"
          />
          <button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="mt-2 w-full py-2 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs font-medium hover:bg-indigo-500/30 transition-all disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Notification'}
          </button>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <p className="text-center text-white/20 text-xs py-8">No notifications</p>
        ) : (
          notifications.map((n) => (
            <div key={n._id} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <p className="text-xs text-white/70 leading-relaxed">{n.message}</p>
              <p className="text-[10px] text-white/20 mt-1.5">
                {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationManager;
