'use client';

import { useState, useEffect } from 'react';

interface Notification {
  id: number;
  message: string;
  lue: boolean;
  createdAt: string;
}

export default function NotificationBell({ userId }: { userId?: number }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (userId) fetchNotifications();
  }, [userId]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?userId=${userId}`);
      const data = await res.json();
      if (Array.isArray(data)) setNotifications(data);
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, lue: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const nonLues = notifications.filter((n) => !n.lue).length;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && nonLues > 0) markAllAsRead();
        }}
        style={{
          background: 'none',
          border: 'none',
          fontSize: '1.25rem',
          cursor: 'pointer',
          position: 'relative',
          padding: '0.5rem',
        }}
      >
        🔔
        {nonLues > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '0px',
              right: '0px',
              backgroundColor: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              fontSize: '0.75rem',
              width: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
            }}
          >
            {nonLues}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            marginTop: '0.5rem',
            width: '320px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 50,
            maxHeight: '350px',
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 'bold', fontSize: '0.9rem' }}>
            Notifications
          </div>
          {notifications.length === 0 ? (
            <p style={{ padding: '1rem', color: '#64748b', fontSize: '0.875rem', margin: 0, textAlign: 'center' }}>
              Aucune notification.
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: '0.75rem 1rem',
                  borderBottom: '1px solid #f1f5f9',
                  backgroundColor: n.lue ? '#ffffff' : '#eff6ff',
                  fontSize: '0.85rem',
                }}
              >
                <p style={{ margin: 0, color: '#1e293b' }}>{n.message}</p>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  {new Date(n.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}