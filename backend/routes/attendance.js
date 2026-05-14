// routes/attendance.js - Attendance Management Routes
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isFaculty } = require('../middleware/auth');

// GET /api/attendance - Get attendance records
router.get('/', verifyToken, async (req, res) => {
  try {
    const { course_id, student_id, date } = req.query;
    let query = `
      SELECT a.*, u.name as student_name, c.name as course_name
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      JOIN courses c ON a.course_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (course_id) { query += ' AND a.course_id = ?'; params.push(course_id); }
    if (student_id) { query += ' AND a.user_id = ?'; params.push(student_id); }
    if (date) { query += ' AND DATE(a.date) = ?'; params.push(date); }

    query += ' ORDER BY a.date DESC';

    const [records] = await db.execute(query, params);
    res.json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/attendance/my - Get my attendance (student)
router.get('/my', verifyToken, async (req, res) => {
  try {
    const [records] = await db.execute(
      `SELECT a.*, c.name as course_name FROM attendance a
       JOIN courses c ON a.course_id = c.id
       WHERE a.user_id = ?
       ORDER BY a.date DESC`,
      [req.user.id]
    );

    // Calculate per-course attendance percentage
    const courseMap = {};
    records.forEach(r => {
      if (!courseMap[r.course_id]) {
        courseMap[r.course_id] = { course_name: r.course_name, total: 0, present: 0 };
      }
      courseMap[r.course_id].total++;
      if (r.status === 'present') courseMap[r.course_id].present++;
    });

    const summary = Object.entries(courseMap).map(([course_id, data]) => ({
      course_id,
      course_name: data.course_name,
      total_classes: data.total,
      present: data.present,
      percentage: Math.round((data.present / data.total) * 100),
      warning: Math.round((data.present / data.total) * 100) < 75
    }));

    res.json({ success: true, records, summary });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/attendance/mark - Mark attendance for a class (Faculty)
router.post('/mark', verifyToken, isFaculty, async (req, res) => {
  try {
    const { course_id, date, attendance_list } = req.body;
    // attendance_list: [{ user_id, status }]

    if (!course_id || !date || !attendance_list?.length) {
      return res.status(400).json({ success: false, message: 'Course, date, and attendance list required' });
    }

    // Delete existing records for this date/course and re-insert (upsert pattern)
    await db.execute(
      'DELETE FROM attendance WHERE course_id = ? AND DATE(date) = ?',
      [course_id, date]
    );

    for (const item of attendance_list) {
      const percentage = await calculateAttendancePercentage(item.user_id, course_id);
      await db.execute(
        'INSERT INTO attendance (user_id, course_id, date, status, percentage) VALUES (?, ?, ?, ?, ?)',
        [item.user_id, course_id, date, item.status, percentage]
      );

      // Send low attendance warning notification
      if (percentage < 75 && item.status === 'absent') {
        await db.execute(
          `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE created_at = NOW()`,
          [item.user_id, '⚠️ Low Attendance Warning',
           `Your attendance has dropped below 75%. Current: ${percentage}%. Please attend classes regularly.`,
           'warning']
        );
      }
    }

    res.json({ success: true, message: 'Attendance marked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Helper: Calculate attendance percentage
async function calculateAttendancePercentage(user_id, course_id) {
  const [rows] = await db.execute(
    'SELECT COUNT(*) as total, SUM(status="present") as present FROM attendance WHERE user_id=? AND course_id=?',
    [user_id, course_id]
  );
  const { total, present } = rows[0];
  return total > 0 ? Math.round((present / total) * 100) : 100;
}

// GET /api/attendance/stats/:courseId - Get attendance stats for a course
router.get('/stats/:courseId', verifyToken, isFaculty, async (req, res) => {
  try {
    const [stats] = await db.execute(
      `SELECT u.id, u.name, 
              COUNT(a.id) as total_classes,
              SUM(a.status = 'present') as present_count,
              ROUND(SUM(a.status = 'present') / COUNT(a.id) * 100, 1) as percentage
       FROM users u
       JOIN enrollments e ON u.id = e.student_id
       JOIN students s ON u.id = s.user_id AND s.id = e.student_id
       LEFT JOIN attendance a ON u.id = a.user_id AND a.course_id = ?
       WHERE e.course_id = ?
       GROUP BY u.id
       ORDER BY percentage ASC`,
      [req.params.courseId, req.params.courseId]
    );
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
