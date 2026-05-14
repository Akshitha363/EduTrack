// src/components/Topbar.js - Top navigation bar with notifications & dark mode
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../utils/api';

const Topbar = ({ dark, toggleDark }) => {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const { data } = await notificationsAPI.getAll();
        if (data.success) setUnread(data.unreadCount);
      } catch (_) {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  const titles = { admin: 'Admin Panel', faculty: 'Faculty Portal', student: 'Student Portal' };

  return (
    <div className="topbar">
      <div>
        <h6 style={{ margin: 0, fontWeight: 700 }}>{titles[user?.role] || 'EduTrack'}</h6>
        <small style={{ color: 'var(--text-muted)' }}>
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </small>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Dark mode toggle */}
        <button className="theme-toggle btn-outline btn" onClick={toggleDark} title="Toggle Dark Mode">
          {dark ? '☀️' : '🌙'}
        </button>

        {/* Notification bell */}
        <div className="notif-badge">
          <button className="btn btn-outline btn-icon" style={{ position: 'relative' }}>
            🔔
            {unread > 0 && <span className="notif-count">{unread > 9 ? '9+' : unread}</span>}
          </button>
        </div>

        {/* User chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div className="avatar" style={{ background: 'var(--primary)', color: '#fff', width: 28, height: 28, fontSize: '.75rem' }}>
            {user?.name?.charAt(0)}
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontSize: '.83rem', fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
