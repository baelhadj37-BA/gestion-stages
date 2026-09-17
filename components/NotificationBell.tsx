'use client';

import { useState, useEffect } from 'react';

interface NotificationItem {
  id: string;
  message: string;
  lu: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch('/api/notifications')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch((err) => console.error(err));
  }, []);

  const nonLuesCount = notifications.filter((n) => !n.lu).length;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          fontSize: '1.25rem',
        }}
      >
        🔔
        {nonLuesCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              padding: '0.1rem 0.4rem',
              fontWeight: 'bold',
            }}
          >
            {nonLuesCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            marginTop: '0.5rem',
            width: '300px',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.5rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            zIndex: 50,
            padding: '0.75rem',
          }}
        >
          <h4 style={{ fontWeight: 'bold', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
            Notifications
          </h4>
          {notifications.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Aucune notification.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {notifications.map((n) => (
                <li
                  key={n.id}
                  style={{
                    padding: '0.5rem 0',
                    borderBottom: '1px solid #f3f4f6',
                    fontSize: '0.8125rem',
                    color: '#374151',
                  }}
                >
                  {n.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}