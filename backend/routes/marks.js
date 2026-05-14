// routes/marks.js - Marks/Grades Management Routes
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isFaculty } = require('../middleware/auth');

// GET /api/marks - Get marks
router.get('/', verifyToken, async (req, res) => {
  try {
    const { student_id, course_id } = req.query;
    let query = `
      SELECT m.*, u.name as student_name, c.name as course_name
      FROM marks m
      JOIN users u ON m.student_id = u.id
      JOIN courses c ON m.course_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (student_id) { query += ' AND m.student_id = ?'; params.push(student_id); }
    if (course_id) { query += ' AND m.course_id = ?'; params.push(course_id); }
    query += ' ORDER BY m.exam_date DESC';

    const [marks] = await db.execute(query, params);
    res.json({ success: true, marks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/marks/my - Get my marks (student)
router.get('/my', verifyToken, async (req, res) => {
  try {
    const [marks] = await db.execute(
      `SELECT m.*, c.name as course_name FROM marks m
       JOIN courses c ON m.course_id = c.id
       WHERE m.student_id = ?
       ORDER BY m.exam_date DESC`,
      [req.user.id]
    );

    // Calculate GPA and overall stats
    const totalMarks = marks.reduce((sum, m) => sum + (m.marks_obtained / m.max_marks) * 100, 0);
    const avgPercentage = marks.length > 0 ? Math.round(totalMarks / marks.length) : 0;
    
    // Smart suggestions based on performance
    const suggestions = generateSuggestions(marks);

    res.json({ success: true, marks, avgPercentage, suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/marks - Add/update marks (Faculty)
router.post('/', verifyToken, isFaculty, async (req, res) => {
  try {
    const { student_id, course_id, exam_type, marks_obtained, max_marks, exam_date, remarks } = req.body;

    if (!student_id || !course_id || marks_obtained === undefined) {
      return res.status(400).json({ success: false, message: 'Student, course, and marks are required' });
    }

    // Check for existing record (upsert)
    const [existing] = await db.execute(
      'SELECT id FROM marks WHERE student_id=? AND course_id=? AND exam_type=?',
      [student_id, course_id, exam_type]
    );

    if (existing.length > 0) {
      await db.execute(
        'UPDATE marks SET marks_obtained=?, max_marks=?, exam_date=?, remarks=? WHERE id=?',
        [marks_obtained, max_marks || 100, exam_date, remarks, existing[0].id]
      );
    } else {
      await db.execute(
        'INSERT INTO marks (student_id, course_id, exam_type, marks_obtained, max_marks, exam_date, remarks) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [student_id, course_id, exam_type || 'midterm', marks_obtained, max_marks || 100, exam_date, remarks]
      );
    }

    // Send notification if marks are low
    const percentage = (marks_obtained / (max_marks || 100)) * 100;
    if (percentage < 40) {
      const [course] = await db.execute('SELECT name FROM courses WHERE id = ?', [course_id]);
      await db.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [student_id, '📉 Low Marks Alert',
         `You scored ${marks_obtained}/${max_marks || 100} in ${course[0]?.name} (${exam_type}). Please review the material.`,
         'alert']
      );
    }

    res.json({ success: true, message: 'Marks saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/marks/analytics - Analytics data for charts
router.get('/analytics/overview', verifyToken, async (req, res) => {
  try {
    // Pass/Fail ratio
    const [passFailData] = await db.execute(`
      SELECT 
        SUM(CASE WHEN (marks_obtained/max_marks)*100 >= 40 THEN 1 ELSE 0 END) as passed,
        SUM(CASE WHEN (marks_obtained/max_marks)*100 < 40 THEN 1 ELSE 0 END) as failed,
        COUNT(*) as total
      FROM marks
    `);

    // Top 5 students
    const [topStudents] = await db.execute(`
      SELECT u.name, AVG(m.marks_obtained/m.max_marks*100) as avg_percentage
      FROM marks m JOIN users u ON m.student_id = u.id
      GROUP BY m.student_id ORDER BY avg_percentage DESC LIMIT 5
    `);

    // Marks by course
    const [courseMarks] = await db.execute(`
      SELECT c.name as course_name, AVG(m.marks_obtained/m.max_marks*100) as avg_percentage
      FROM marks m JOIN courses c ON m.course_id = c.id
      GROUP BY m.course_id ORDER BY avg_percentage DESC
    `);

    // Score distribution
    const [distribution] = await db.execute(`
      SELECT 
        SUM(CASE WHEN (marks_obtained/max_marks)*100 >= 90 THEN 1 ELSE 0 END) as A,
        SUM(CASE WHEN (marks_obtained/max_marks)*100 >= 75 AND (marks_obtained/max_marks)*100 < 90 THEN 1 ELSE 0 END) as B,
        SUM(CASE WHEN (marks_obtained/max_marks)*100 >= 60 AND (marks_obtained/max_marks)*100 < 75 THEN 1 ELSE 0 END) as C,
        SUM(CASE WHEN (marks_obtained/max_marks)*100 >= 40 AND (marks_obtained/max_marks)*100 < 60 THEN 1 ELSE 0 END) as D,
        SUM(CASE WHEN (marks_obtained/max_marks)*100 < 40 THEN 1 ELSE 0 END) as F
      FROM marks
    `);

    res.json({ success: true, passFailData: passFailData[0], topStudents, courseMarks, distribution: distribution[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Smart suggestions generator
function generateSuggestions(marks) {
  const suggestions = [];
  if (marks.length === 0) return ['Start your academic journey! Check your courses.'];
  
  const avgPct = marks.reduce((s, m) => s + (m.marks_obtained / m.max_marks) * 100, 0) / marks.length;
  
  if (avgPct < 40) suggestions.push('🚨 Critical: Seek immediate academic help from your faculty.');
  if (avgPct < 60) suggestions.push('📚 Focus on weak subjects - consider study groups.');
  if (avgPct >= 75) suggestions.push('🌟 Great performance! Keep up the excellent work.');
  if (avgPct >= 90) suggestions.push('🏆 Outstanding! Consider applying for merit scholarships.');
  
  const weakSubjects = marks.filter(m => (m.marks_obtained / m.max_marks) * 100 < 60);
  if (weakSubjects.length > 0) {
    suggestions.push(`⚠️ Needs improvement: ${weakSubjects.map(m => m.course_name).join(', ')}`);
  }
  
  return suggestions;
}

module.exports = router;
