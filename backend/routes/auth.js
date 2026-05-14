// routes/auth.js - Authentication Routes (Register, Login, Logout)
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { verifyToken } = require('../middleware/auth');
require('dotenv').config();

// POST /api/auth/register - Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, department } = req.body;

    // JavaScript form validation (WAD requirement)
    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'All required fields must be filled' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Invalid email format' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // Hash password using bcrypt (security best practice)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user into database (MySQL CRUD - Create)
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password, role, phone, department) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, phone || null, department || null]
    );

    const userId = result.insertId;

    // Create role-specific record
    if (role === 'student') {
      await db.execute(
        'INSERT INTO students (user_id, name, email, department) VALUES (?, ?, ?, ?)',
        [userId, name, email, department || 'General']
      );
    } else if (role === 'faculty') {
      await db.execute(
        'INSERT INTO faculty (user_id, name, email, department) VALUES (?, ?, ?, ?)',
        [userId, name, email, department || 'General']
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: userId, email, role, name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Set cookie for session tracking (WAD requirement)
    res.cookie('edutrack_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: { id: userId, name, email, role }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration' });
  }
});

// POST /api/auth/login - User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    // Fetch user from DB (MySQL CRUD - Read)
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ? AND is_active = 1',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];

    // Compare password with bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Update last login
    await db.execute('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Set session cookie
    res.cookie('edutrack_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// POST /api/auth/logout - Logout
router.post('/logout', verifyToken, (req, res) => {
  res.clearCookie('edutrack_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

// GET /api/auth/me - Get current user info
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, name, email, role, department, phone, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: users[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
