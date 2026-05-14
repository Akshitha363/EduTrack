// src/pages/Login.js - Login page with JS form validation (WAD Requirement)
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  // JavaScript form validation (WAD Requirement)
  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email format';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError('');
    try {
      const data = await login(form.email, form.password);
      if (data.success) {
        const routes = { admin: '/admin', faculty: '/faculty', student: '/student' };
        navigate(routes[data.user.role] || '/');
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = (role) => {
    const creds = {
      admin: { email: 'admin@edutrack.com', password: 'password123' },
      faculty: { email: 'priya@edutrack.com', password: 'password123' },
      student: { email: 'rahul@edutrack.com', password: 'password123' },
    };
    setForm(creds[role]);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4f46e5 100%)' }}>
      {/* Left branding panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, color: '#fff' }}>
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>🎓</div>
        <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>EduTrack</h1>
        <p style={{ opacity: .7, fontSize: '1.1rem', marginTop: 8, textAlign: 'center' }}>
          Smart Student & Faculty<br />Management Analytics System
        </p>
        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 280 }}>
          {['admin', 'faculty', 'student'].map(role => (
            <button key={role} onClick={() => demoLogin(role)}
              style={{ background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)', color: '#fff', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontSize: '.88rem', textTransform: 'capitalize', transition: 'all .2s' }}
              onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,.2)'}
              onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,.1)'}
            >
              Demo as {role}
            </button>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ width: 460, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h2 style={{ marginBottom: 6, fontFamily: 'Poppins' }}>Welcome back</h2>
          <p style={{ color: '#64748b', marginBottom: 28, fontSize: '.9rem' }}>Sign in to your EduTrack account</p>

          {apiError && <div className="alert alert-danger">{apiError}</div>}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={errors.email ? { borderColor: '#ef4444' } : {}}
              />
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                style={errors.password ? { borderColor: '#ef4444' } : {}}
              />
              {errors.password && <div className="form-error">{errors.password}</div>}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: 8, fontSize: '1rem' }} disabled={loading}>
              {loading ? '⏳ Signing in...' : '🔐 Sign In'}
            </button>
          </form>

          <p style={{ marginTop: 20, textAlign: 'center', fontSize: '.88rem', color: '#64748b' }}>
            Don't have an account? <Link to="/register" style={{ color: '#4f46e5', fontWeight: 600 }}>Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
