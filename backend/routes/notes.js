// routes/notes.js - Lecture Notes Module (Faculty Upload / Student View)
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isFaculty } = require('../middleware/auth');
const { uploadNote } = require('../middleware/upload');
const fs = require('fs');
const path = require('path');

// GET /api/notes - Get all lecture notes (filterable)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { course, subject } = req.query;
    let query = `
      SELECT n.*, u.name as uploaded_by_name, u.department
      FROM lecture_notes n
      JOIN users u ON n.uploaded_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (course) { query += ' AND n.course LIKE ?'; params.push(`%${course}%`); }
    if (subject) { query += ' AND n.subject LIKE ?'; params.push(`%${subject}%`); }

    query += ' ORDER BY n.created_at DESC';

    const [notes] = await db.execute(query, params);
    res.json({ success: true, notes });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/notes/:id - Get single note
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [notes] = await db.execute(
      'SELECT n.*, u.name as uploaded_by_name FROM lecture_notes n JOIN users u ON n.uploaded_by = u.id WHERE n.id = ?',
      [req.params.id]
    );
    if (notes.length === 0) return res.status(404).json({ success: false, message: 'Note not found' });
    res.json({ success: true, note: notes[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/notes/upload - Upload lecture note (Faculty only)
router.post('/upload', verifyToken, isFaculty, uploadNote.single('file'), async (req, res) => {
  try {
    const { title, subject, course, description } = req.body;

    if (!title || !subject || !course) {
      // Remove uploaded file if validation fails
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Title, subject, and course are required' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const file_url = `/uploads/notes/${req.file.filename}`;
    const file_size = req.file.size;
    const file_type = req.file.mimetype;

    const [result] = await db.execute(
      'INSERT INTO lecture_notes (title, subject, course, description, file_url, file_size, file_type, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, subject, course, description, file_url, file_size, file_type, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Lecture note uploaded successfully',
      noteId: result.insertId,
      file_url
    });
  } catch (error) {
    if (req.file) {
      try { fs.unlinkSync(req.file.path); } catch (e) {}
    }
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/notes/:id - Update note metadata (Faculty)
router.put('/:id', verifyToken, isFaculty, async (req, res) => {
  try {
    const { title, subject, course, description } = req.body;
    
    // Verify ownership
    const [notes] = await db.execute(
      'SELECT id FROM lecture_notes WHERE id = ? AND uploaded_by = ?',
      [req.params.id, req.user.id]
    );
    if (notes.length === 0) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this note' });
    }

    await db.execute(
      'UPDATE lecture_notes SET title=?, subject=?, course=?, description=? WHERE id=?',
      [title, subject, course, description, req.params.id]
    );

    res.json({ success: true, message: 'Note updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/notes/:id - Delete note (Faculty who uploaded or Admin)
router.delete('/:id', verifyToken, isFaculty, async (req, res) => {
  try {
    const [notes] = await db.execute('SELECT * FROM lecture_notes WHERE id = ?', [req.params.id]);
    if (notes.length === 0) return res.status(404).json({ success: false, message: 'Note not found' });

    const note = notes[0];
    
    // Check ownership (unless admin)
    if (req.user.role !== 'admin' && note.uploaded_by !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this note' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', note.file_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await db.execute('DELETE FROM lecture_notes WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/notes/:id/reviews - Get all reviews for a note
router.get('/:id/reviews', verifyToken, async (req, res) => {
  try {
    const [reviews] = await db.execute(
      `SELECT r.*, u.name as student_name
       FROM note_reviews r
       JOIN users u ON r.student_id = u.id
       WHERE r.note_id = ?
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    const [[avg]] = await db.execute(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM note_reviews WHERE note_id = ?',
      [req.params.id]
    );
    res.json({ success: true, reviews, avg_rating: parseFloat(avg.avg_rating||0).toFixed(1), total: avg.total });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/notes/:id/reviews - Submit or update a review (student)
router.post('/:id/reviews', verifyToken, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    await db.execute(
      `INSERT INTO note_reviews (note_id, student_id, rating, comment)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), comment = VALUES(comment)`,
      [req.params.id, req.user.id, rating, comment || '']
    );
    res.json({ success: true, message: 'Review submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
