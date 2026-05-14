// middleware/upload.js - File Upload Configuration using Multer
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const uploadDirs = ['uploads/notes', 'uploads/assignments', 'uploads/avatars'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Storage engine for lecture notes (PDFs)
const notesStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/notes/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'note-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Storage engine for assignment submissions
const assignmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/assignments/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'assignment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter - allow only PDFs and common doc types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|doc|docx|txt|png|jpg|jpeg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype) || 
                   file.mimetype === 'application/pdf' ||
                   file.mimetype === 'application/msword' ||
                   file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  
  if (extname || mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only PDF, DOC, DOCX, TXT, PNG, JPG files are allowed'));
};

// Upload middleware instances
const uploadNote = multer({
  storage: notesStorage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
  fileFilter
});

const uploadAssignment = multer({
  storage: assignmentStorage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
  fileFilter
});

module.exports = { uploadNote, uploadAssignment };
