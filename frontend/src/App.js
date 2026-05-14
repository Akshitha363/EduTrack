// src/App.js - Root App with React Router (WAD Requirement)
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.css';

// Auth Pages
import Login    from './pages/Login';
import Register from './pages/Register';

// Layouts
import Sidebar from './components/Sidebar';
import Topbar  from './components/Topbar';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers    from './pages/admin/ManageUsers';

// Faculty Pages
import FacultyDashboard  from './pages/faculty/FacultyDashboard';
import ManageAssignments from './pages/faculty/ManageAssignments';
import ManageMarks       from './pages/faculty/ManageMarks';
import ManageAttendance  from './pages/faculty/ManageAttendance';
import UploadNotes       from './pages/faculty/UploadNotes';
import ManageCourses     from './pages/faculty/ManageCourses';

// Student Pages
import StudentDashboard  from './pages/student/StudentDashboard';
import MyMarks           from './pages/student/MyMarks';
import MyAttendance      from './pages/student/MyAttendance';
import MyAssignments     from './pages/student/MyAssignments';
import LectureNotes      from './pages/student/LectureNotes';
import Notifications     from './pages/student/Notifications';

// ── Protected Route wrapper ──────────────────────────
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="spinner"><div className="spin"/></div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/unauthorized" replace />;
  return children;
};

// ── Dashboard layout wrapper ─────────────────────────
const DashboardLayout = ({ children }) => {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="app-layout">
      <Sidebar />
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Topbar dark={dark} toggleDark={() => setDark(d => !d)} />
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
};

// ── Role-based redirect ───────────────────────────────
const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'admin')   return <Navigate to="/admin" />;
  if (user.role === 'faculty') return <Navigate to="/faculty" />;
  return <Navigate to="/student" />;
};

// ── Main App ──────────────────────────────────────────
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"        element={<Login />} />
          <Route path="/register"     element={<Register />} />
          <Route path="/"             element={<RoleRedirect />} />
          <Route path="/unauthorized" element={<div className="d-flex align-items-center justify-content-center min-vh-100"><div className="text-center"><h1>403</h1><p>Access Denied</p></div></div>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><DashboardLayout><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><DashboardLayout><ManageUsers /></DashboardLayout></ProtectedRoute>} />

          {/* Faculty */}
          <Route path="/faculty"            element={<ProtectedRoute roles={['admin','faculty']}><DashboardLayout><FacultyDashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/faculty/assignments" element={<ProtectedRoute roles={['admin','faculty']}><DashboardLayout><ManageAssignments /></DashboardLayout></ProtectedRoute>} />
          <Route path="/faculty/marks"       element={<ProtectedRoute roles={['admin','faculty']}><DashboardLayout><ManageMarks /></DashboardLayout></ProtectedRoute>} />
          <Route path="/faculty/attendance"  element={<ProtectedRoute roles={['admin','faculty']}><DashboardLayout><ManageAttendance /></DashboardLayout></ProtectedRoute>} />
          <Route path="/faculty/notes"       element={<ProtectedRoute roles={['admin','faculty']}><DashboardLayout><UploadNotes /></DashboardLayout></ProtectedRoute>} />
          <Route path="/faculty/courses"     element={<ProtectedRoute roles={['admin','faculty']}><DashboardLayout><ManageCourses /></DashboardLayout></ProtectedRoute>} />

          {/* Student */}
          <Route path="/student"              element={<ProtectedRoute roles={['student']}><DashboardLayout><StudentDashboard /></DashboardLayout></ProtectedRoute>} />
          <Route path="/student/marks"        element={<ProtectedRoute roles={['student']}><DashboardLayout><MyMarks /></DashboardLayout></ProtectedRoute>} />
          <Route path="/student/attendance"   element={<ProtectedRoute roles={['student']}><DashboardLayout><MyAttendance /></DashboardLayout></ProtectedRoute>} />
          <Route path="/student/assignments"  element={<ProtectedRoute roles={['student']}><DashboardLayout><MyAssignments /></DashboardLayout></ProtectedRoute>} />
          <Route path="/student/notes"        element={<ProtectedRoute roles={['student']}><DashboardLayout><LectureNotes /></DashboardLayout></ProtectedRoute>} />
          <Route path="/student/notifications" element={<ProtectedRoute roles={['student','faculty','admin']}><DashboardLayout><Notifications /></DashboardLayout></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
