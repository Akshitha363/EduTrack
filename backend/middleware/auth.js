// middleware/auth.js - JWT Authentication & Role-Based Authorization Middleware
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware: Verify JWT Token (Session Tracking equivalent)
const verifyToken = (req, res, next) => {
  try {
    // Check Authorization header first, then cookies (session tracking)
    let token = null;
    
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.edutrack_token) {
      token = req.cookies.edutrack_token;
    }

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
    }

    // Verify and decode JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    return res.status(403).json({ success: false, message: 'Invalid token.' });
  }
};

// Middleware: Role-based access control
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }
    next();
  };
};

// Specific role middlewares
const isAdmin = requireRole('admin');
const isFaculty = requireRole('admin', 'faculty');
const isStudent = requireRole('admin', 'faculty', 'student');

module.exports = { verifyToken, requireRole, isAdmin, isFaculty, isStudent };
