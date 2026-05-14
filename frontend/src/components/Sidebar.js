// src/components/Sidebar.js - Role-aware navigation sidebar
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ADMIN_LINKS = [
  { to: '/admin',       icon: '📊', label: 'Dashboard' },
  { to: '/admin/users', icon: '👥', label: 'Manage Users' },
  { to: '/faculty/courses', icon: '📚', label: 'Courses' },
  { to: '/faculty/notes', icon: '📄', label: 'Lecture Notes' },
];

const FACULTY_LINKS = [
  { to: '/faculty',             icon: '📊', label: 'Dashboard' },
  { to: '/faculty/courses',     icon: '📚', label: 'My Courses' },
  { to: '/faculty/assignments', icon: '📝', label: 'Assignments' },
  { to: '/faculty/marks',       icon: '🎯', label: 'Marks Entry' },
  { to: '/faculty/attendance',  icon: '📅', label: 'Attendance' },
  { to: '/faculty/notes',       icon: '📄', label: 'Lecture Notes' },
  { to: '/student/notifications', icon: '🔔', label: 'Notifications' },
];

const STUDENT_LINKS = [
  { to: '/student',               icon: '🏠', label: 'Dashboard' },
  { to: '/student/marks',         icon: '🎯', label: 'My Marks' },
  { to: '/student/attendance',    icon: '📅', label: 'Attendance' },
  { to: '/student/assignments',   icon: '📝', label: 'Assignments' },
  { to: '/student/notes',         icon: '📄', label: 'Lecture Notes' },
  { to: '/student/notifications', icon: '🔔', label: 'Notifications' },
];

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = user?.role === 'admin' ? ADMIN_LINKS
              : user?.role === 'faculty' ? FACULTY_LINKS
              : STUDENT_LINKS;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const roleColors = { admin: '#f59e0b', faculty: '#10b981', student: '#818cf8' };

  return (
    <nav className="sidebar">
      <div className="sidebar-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
            🎓
          </div>
          <div>
            <h4 style={{ margin: 0 }}>EduTrack</h4>
            <small>Smart Analytics</small>
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="avatar" style={{ background: roleColors[user?.role], color: '#fff', fontSize: '.85rem' }}>
            {initials}
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: '.9rem', color: '#fff' }}>{user?.name}</div>
            <div style={{ fontSize: '.72rem', color: 'rgba(255,255,255,.5)', textTransform: 'capitalize' }}>
              {user?.role} · {user?.department || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      <ul className="sidebar-nav" style={{ listStyle: 'none', padding: 0 }}>
        <li className="nav-section-title">Navigation</li>
        {links.map(link => (
          <li key={link.to} className="nav-item">
            <NavLink
              to={link.to}
              end={link.to === '/admin' || link.to === '/faculty' || link.to === '/student'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="icon">{link.icon}</span>
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,.1)', marginTop: 'auto' }}>
        <button
          onClick={handleLogout}
          style={{ width: '100%', background: 'rgba(239,68,68,.15)', color: '#fca5a5', border: 'none', borderRadius: 8, padding: '10px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '.88rem', fontWeight: 600 }}
        >
          🚪 Logout
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
