// src/pages/Register.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DEPARTMENTS = ['Computer Science','Electronics','Mathematics','Physics','Civil','Mechanical','MBA'];

const Register = () => {
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'', role:'student', department:'Computer Science', phone:'' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.name.trim())   e.name = 'Name is required';
    if (!form.email)         e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email';
    if (!form.password)      e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Min 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true); setApiError('');
    try {
      const data = await register(form);
      if (data.success) {
        const routes = { admin:'/admin', faculty:'/faculty', student:'/student' };
        navigate(routes[data.user.role] || '/');
      }
    } catch (err) {
      setApiError(err.response?.data?.message || 'Registration failed.');
    } finally { setLoading(false); }
  };

  const set = (k) => (e) => setForm(f => ({...f, [k]: e.target.value}));

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'linear-gradient(135deg,#1e1b4b,#4f46e5)' }}>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', padding:40 }}>
        <div style={{ textAlign:'center' }}>
          <div style={{ fontSize:'4rem' }}>🎓</div>
          <h1 style={{ fontFamily:'Poppins', fontWeight:800, fontSize:'2.5rem' }}>EduTrack</h1>
          <p style={{ opacity:.7, marginTop:8 }}>Join the Smart Education Platform</p>
          <div style={{ marginTop:32, padding:'20px', background:'rgba(255,255,255,.1)', borderRadius:12 }}>
            <p style={{ margin:0, fontSize:'.85rem' }}>✅ Role-Based Access Control</p>
            <p style={{ margin:'8px 0 0', fontSize:'.85rem' }}>✅ Real-time Analytics Dashboard</p>
            <p style={{ margin:'8px 0 0', fontSize:'.85rem' }}>✅ Smart Performance Suggestions</p>
            <p style={{ margin:'8px 0 0', fontSize:'.85rem' }}>✅ Assignment & Attendance Tracking</p>
          </div>
        </div>
      </div>
      <div style={{ width:500, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', padding:40 }}>
        <div style={{ width:'100%', maxWidth:400 }}>
          <h2 style={{ marginBottom:6, fontFamily:'Poppins' }}>Create Account</h2>
          <p style={{ color:'#64748b', marginBottom:24, fontSize:'.9rem' }}>Fill in your details to get started</p>
          {apiError && <div className="alert alert-danger">{apiError}</div>}
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label className="form-label">Full Name</label>
                <input className="form-control" placeholder="Your full name" value={form.name} onChange={set('name')} style={errors.name?{borderColor:'#ef4444'}:{}} />
                {errors.name && <div className="form-error">{errors.name}</div>}
              </div>
              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label className="form-label">Email</label>
                <input type="email" className="form-control" placeholder="you@example.com" value={form.email} onChange={set('email')} style={errors.email?{borderColor:'#ef4444'}:{}} />
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-control" placeholder="••••••••" value={form.password} onChange={set('password')} style={errors.password?{borderColor:'#ef4444'}:{}} />
                {errors.password && <div className="form-error">{errors.password}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input type="password" className="form-control" placeholder="••••••••" value={form.confirm} onChange={set('confirm')} style={errors.confirm?{borderColor:'#ef4444'}:{}} />
                {errors.confirm && <div className="form-error">{errors.confirm}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-control" value={form.role} onChange={set('role')}>
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-control" value={form.department} onChange={set('department')}>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn:'1/-1' }}>
                <label className="form-label">Phone (optional)</label>
                <input className="form-control" placeholder="10-digit phone" value={form.phone} onChange={set('phone')} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width:'100%', padding:12, fontSize:'1rem', marginTop:4 }} disabled={loading}>
              {loading ? '⏳ Registering...' : '🚀 Create Account'}
            </button>
          </form>
          <p style={{ marginTop:20, textAlign:'center', fontSize:'.88rem', color:'#64748b' }}>
            Already have an account? <Link to="/login" style={{ color:'#4f46e5', fontWeight:600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
export default Register;
