// routes/users.js - User Management Routes (Admin)
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isAdmin, isFaculty } = require('../middleware/auth');

// GET /api/users - Get all users (Admin only)
router.get('/', verifyToken, isAdmin, async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT id, name, email, role, department, phone, is_active, last_login, created_at FROM users WHERE 1=1';
    const params = [];

    if (role) { query += ' AND role = ?'; params.push(role); }
    if (search) { query += ' AND (name LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [users] = await db.execute(query, params);
    const [[{ total }]] = await db.execute('SELECT COUNT(*) as total FROM users', []);

    res.json({ success: true, users, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/users/stats - System stats (Admin)
router.get('/stats', verifyToken, isAdmin, async (req, res) => {
  try {
    const [[{ totalStudents }]] = await db.execute("SELECT COUNT(*) as totalStudents FROM users WHERE role='student' AND is_active=1");
    const [[{ totalFaculty }]] = await db.execute("SELECT COUNT(*) as totalFaculty FROM users WHERE role='faculty' AND is_active=1");
    const [[{ totalCourses }]] = await db.execute('SELECT COUNT(*) as totalCourses FROM courses');
    const [[{ totalAssignments }]] = await db.execute('SELECT COUNT(*) as totalAssignments FROM assignments');
    const [[{ pendingSubmissions }]] = await db.execute("SELECT COUNT(*) as pendingSubmissions FROM submissions WHERE grade IS NULL");
    const [[{ avgAttendance }]] = await db.execute('SELECT AVG(percentage) as avgAttendance FROM attendance');

    res.json({
      success: true,
      stats: {
        totalStudents, totalFaculty, totalCourses,
        totalAssignments, pendingSubmissions,
        avgAttendance: Math.round(avgAttendance || 0)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/users/:id - Update user (Admin)
router.put('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    const { name, email, role, department, phone, is_active } = req.body;
    await db.execute(
      'UPDATE users SET name=?, email=?, role=?, department=?, phone=?, is_active=? WHERE id=?',
      [name, email, role, department, phone, is_active, req.params.id]
    );
    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/users/:id - Deactivate user (Admin)
router.delete('/:id', verifyToken, isAdmin, async (req, res) => {
  try {
    await db.execute('UPDATE users SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/users/students - Get all students with performance
router.get('/students/performance', verifyToken, isFaculty, async (req, res) => {
  try {
    const [students] = await db.execute(`
      SELECT s.*, u.email, u.department,
             AVG(m.marks_obtained) as avg_marks,
             AVG(a.percentage) as avg_attendance,
             COUNT(DISTINCT sub.id) as submissions_count
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN marks m ON s.id = m.student_id
      LEFT JOIN attendance a ON s.user_id = a.user_id
      LEFT JOIN submissions sub ON s.user_id = sub.student_id
      GROUP BY s.id
      ORDER BY avg_marks DESC
    `);
    res.json({ success: true, students });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
