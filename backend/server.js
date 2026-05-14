// server.js - Main Express Server (Controller Layer - Servlet Equivalent in WAD)
// In traditional Java WAD: Servlets act as controllers between client requests and business logic
// In Node.js Express: Route handlers + middleware serve the same controller role

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
console.log("🔥 SERVER.JS LOADED CORRECTLY");
// ──────────────────────────────────────────
// MIDDLEWARE (Request Pipeline)
// ──────────────────────────────────────────

// CORS - Allow frontend to communicate with backend
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true, // Allow cookies (session tracking)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies (ES6: arrow functions, async/await used throughout)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parser for session tracking (JWT via cookies)
app.use(cookieParser());

// Serve static uploads folder (lecture notes, assignment files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request Logger Middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
});

// ──────────────────────────────────────────
// API ROUTES (REST API Endpoints)
// ──────────────────────────────────────────

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/marks', require('./routes/marks'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/notifications', require('./routes/notifications'));

// ──────────────────────────────────────────
// HEALTH CHECK
// ──────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'EduTrack API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// ──────────────────────────────────────────
// ERROR HANDLING MIDDLEWARE
// ──────────────────────────────────────────

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.url} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'File too large. Max 10MB allowed.' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// ──────────────────────────────────────────
// START SERVER
// ──────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║     EduTrack API Server Started          ║
  ║     Port: ${PORT}                            ║
  ║     Mode: ${process.env.NODE_ENV || 'development'}               ║
  ║     Docs: http://localhost:${PORT}/api      ║
  ╚══════════════════════════════════════════╝
  `);
});

module.exports = app;
