// src/context/AuthContext.js - Global Authentication State (React Context API)
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

// Axios config (keep it minimal & stable)
axios.defaults.withCredentials = true;

// Request interceptor - attach JWT to every request
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('edutrack_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - handle 401 globally
axios.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('edutrack_token');
      localStorage.removeItem('edutrack_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session
  useEffect(() => {
    const saved = localStorage.getItem('edutrack_user');
    const token = localStorage.getItem('edutrack_token');

    if (saved && token) {
      setUser(JSON.parse(saved));
    }

    setLoading(false);
  }, []);

  // ✅ FIXED LOGIN (ONLY CHANGE REQUIRED)
  const login = async (email, password) => {
    const { data } = await axios.post(
      'http://localhost:5000/api/auth/login',
      { email, password }
    );

    if (data.success) {
      localStorage.setItem('edutrack_token', data.token);
      localStorage.setItem('edutrack_user', JSON.stringify(data.user));
      setUser(data.user);
    }

    return data;
  };

  // ✅ FIXED REGISTER (ONLY CHANGE REQUIRED)
  const register = async (formData) => {
    const { data } = await axios.post(
      'http://localhost:5000/api/auth/register',
      formData
    );

    if (data.success) {
      localStorage.setItem('edutrack_token', data.token);
      localStorage.setItem('edutrack_user', JSON.stringify(data.user));
      setUser(data.user);
    }

    return data;
  };

  // Logout (no change needed)
  const logout = async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/logout');
    } catch (_) { }

    localStorage.removeItem('edutrack_token');
    localStorage.removeItem('edutrack_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;