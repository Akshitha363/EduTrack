// routes/courses.js - Course Management Routes
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isAdmin, isFaculty } = require('../middleware/auth');

// GET /api/courses - Get all courses
router.get('/', verifyToken, async (req, res) => {
  try {
    const [courses] = await db.execute(`
      SELECT c.*, u.name as faculty_name, u.department,
             COUNT(DISTINCT e.student_id) as enrolled_students
      FROM courses c
      LEFT JOIN users u ON c.faculty_id = u.id
      LEFT JOIN enrollments e ON c.id = e.course_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    res.json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/courses/:id - Get single course
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [courses] = await db.execute(
      `SELECT c.*, u.name as faculty_name FROM courses c 
       LEFT JOIN users u ON c.faculty_id = u.id WHERE c.id = ?`,
      [req.params.id]
    );
    if (courses.length === 0) return res.status(404).json({ success: false, message: 'Course not found' });
    
    const [students] = await db.execute(
      `SELECT s.*, u.email FROM students s 
       JOIN users u ON s.user_id = u.id
       JOIN enrollments e ON s.id = e.student_id 
       WHERE e.course_id = ?`,
      [req.params.id]
    );
    
    res.json({ success: true, course: courses[0], students });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/courses - Create course (Admin/Faculty)
router.post('/', verifyToken, isFaculty, async (req, res) => {
  try {
    const { name, code, description, credits, semester, department } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, message: 'Name and code are required' });

    const faculty_id = req.user.id;
    const [result] = await db.execute(
      'INSERT INTO courses (name, code, description, credits, semester, department, faculty_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, code, description, credits || 3, semester || 1, department, faculty_id]
    );
    res.status(201).json({ success: true, message: 'Course created successfully', courseId: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ success: false, message: 'Course code already exists' });
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/courses/:id - Update course
router.put('/:id', verifyToken, isFaculty, async (req, res) => {
  try {
    const { name, code, description, credits, semester, department } = req.body;
    await db.execute(
      'UPDATE courses SET name=?, code=?, description=?, credits=?, semester=?, department=? WHERE id=?',
      [name, code, description, credits, semester, department, req.params.id]
    );
    res.json({ success: true, message: 'Course updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/courses/:id - Delete course (Admin)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    await db.execute('DELETE FROM courses WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Course deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/courses/:id/enroll - Enroll student in course
router.post('/:id/enroll', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.body;
    await db.execute(
      'INSERT IGNORE INTO enrollments (course_id, student_id) VALUES (?, ?)',
      [req.params.id, studentId]
    );
    res.json({ success: true, message: 'Student enrolled successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/courses/my/enrolled - Get courses for logged in student
router.get('/my/enrolled', verifyToken, async (req, res) => {
  try {
    const [student] = await db.execute('SELECT id FROM students WHERE user_id = ?', [req.user.id]);
    if (student.length === 0) return res.status(404).json({ success: false, message: 'Student not found' });

    const [courses] = await db.execute(
      `SELECT c.*, u.name as faculty_name FROM courses c
       JOIN enrollments e ON c.id = e.course_id
       JOIN users u ON c.faculty_id = u.id
       WHERE e.student_id = ?`,
      [student[0].id]
    );
    res.json({ success: true, courses });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
