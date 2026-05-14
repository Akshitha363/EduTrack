const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

console.log("🔥 SERVER.JS LOADED CORRECTLY");

// ──────────────────────────────────────────
// ROOT ROUTE (MUST BE AFTER app creation)
// ──────────────────────────────────────────

app.get("/", (req, res) => {
  console.log("ROOT ROUTE HIT");
  res.send("EduTrack Backend Running");
});

// ──────────────────────────────────────────
// MIDDLEWARE
// ──────────────────────────────────────────

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ──────────────────────────────────────────
// HEALTH CHECK
// ──────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'EduTrack API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ──────────────────────────────────────────
// API ROUTES
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
// 404 HANDLER (LAST)
// ──────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// ──────────────────────────────────────────
// ERROR HANDLER
// ──────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);

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
║     Port: ${PORT}                        ║
║     Mode: ${process.env.NODE_ENV || 'development'}     ║
╚══════════════════════════════════════════╝
  `);
});

module.exports = app;