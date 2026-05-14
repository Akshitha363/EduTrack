// routes/assignments.js - Assignment Management Routes (TODO Tracker)
const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken, isFaculty } = require('../middleware/auth');
const { uploadAssignment } = require('../middleware/upload');

// GET /api/assignments - Get all assignments
router.get('/', verifyToken, async (req, res) => {
  try {
    const { course_id, status } = req.query;
    let query = `
      SELECT a.*, c.name as course_name, u.name as faculty_name,
             COUNT(s.id) as submission_count
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN users u ON a.created_by = u.id
      LEFT JOIN submissions s ON a.id = s.assignment_id
      WHERE 1=1
    `;
    const params = [];

    if (course_id) { query += ' AND a.course_id = ?'; params.push(course_id); }
    if (status === 'active') { query += ' AND a.due_date >= NOW()'; }
    if (status === 'expired') { query += ' AND a.due_date < NOW()'; }

    query += ' GROUP BY a.id ORDER BY a.due_date ASC';

    const [assignments] = await db.execute(query, params);
    res.json({ success: true, assignments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/assignments/:id - Get single assignment with submissions
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const [assignments] = await db.execute(
      `SELECT a.*, c.name as course_name, u.name as faculty_name 
       FROM assignments a 
       JOIN courses c ON a.course_id = c.id 
       JOIN users u ON a.created_by = u.id 
       WHERE a.id = ?`,
      [req.params.id]
    );
    if (assignments.length === 0) return res.status(404).json({ success: false, message: 'Assignment not found' });

    const [submissions] = await db.execute(
      `SELECT s.*, u.name as student_name FROM submissions s 
       JOIN users u ON s.student_id = u.id 
       WHERE s.assignment_id = ?`,
      [req.params.id]
    );

    res.json({ success: true, assignment: assignments[0], submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/assignments - Create assignment (Faculty)
router.post('/', verifyToken, isFaculty, async (req, res) => {
  try {
    const { title, description, course_id, due_date, max_marks } = req.body;
    if (!title || !course_id || !due_date) {
      return res.status(400).json({ success: false, message: 'Title, course, and due date are required' });
    }

    const [result] = await db.execute(
      'INSERT INTO assignments (title, description, course_id, due_date, max_marks, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, course_id, due_date, max_marks || 100, req.user.id]
    );

    // Create notifications for enrolled students
    const [enrolledStudents] = await db.execute(
      'SELECT student_id FROM enrollments WHERE course_id = ?',
      [course_id]
    );
    
    const [course] = await db.execute('SELECT name FROM courses WHERE id = ?', [course_id]);

    for (const s of enrolledStudents) {
      const [student] = await db.execute('SELECT user_id FROM students WHERE id = ?', [s.student_id]);
      if (student.length > 0) {
        await db.execute(
          'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
          [student[0].user_id, 'New Assignment Posted', 
           `New assignment "${title}" posted for ${course[0]?.name}. Due: ${new Date(due_date).toDateString()}`,
           'assignment']
        );
      }
    }

    res.status(201).json({ success: true, message: 'Assignment created', assignmentId: result.insertId });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/assignments/:id - Update assignment
router.put('/:id', verifyToken, isFaculty, async (req, res) => {
  try {
    const { title, description, due_date, max_marks } = req.body;
    await db.execute(
      'UPDATE assignments SET title=?, description=?, due_date=?, max_marks=? WHERE id=?',
      [title, description, due_date, max_marks, req.params.id]
    );
    res.json({ success: true, message: 'Assignment updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/assignments/:id - Delete assignment
router.delete('/:id', verifyToken, isFaculty, async (req, res) => {
  try {
    await db.execute('DELETE FROM assignments WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Assignment deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/assignments/:id/submit - Submit assignment (Student)
router.post('/:id/submit', verifyToken, uploadAssignment.single('file'), async (req, res) => {
  try {
    const { notes } = req.body;
    const file_url = req.file ? `/uploads/assignments/${req.file.filename}` : null;

    // Check if already submitted
    const [existing] = await db.execute(
      'SELECT id FROM submissions WHERE assignment_id = ? AND student_id = ?',
      [req.params.id, req.user.id]
    );

    if (existing.length > 0) {
      await db.execute(
        'UPDATE submissions SET file_url=?, notes=?, submitted_at=NOW() WHERE assignment_id=? AND student_id=?',
        [file_url, notes, req.params.id, req.user.id]
      );
      return res.json({ success: true, message: 'Submission updated' });
    }

    await db.execute(
      'INSERT INTO submissions (assignment_id, student_id, file_url, notes) VALUES (?, ?, ?, ?)',
      [req.params.id, req.user.id, file_url, notes]
    );

    res.status(201).json({ success: true, message: 'Assignment submitted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/assignments/submissions/:submissionId/grade - Grade submission (Faculty)
router.put('/submissions/:submissionId/grade', verifyToken, isFaculty, async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    await db.execute(
      'UPDATE submissions SET grade=?, feedback=?, graded_at=NOW() WHERE id=?',
      [grade, feedback, req.params.submissionId]
    );

    // Notify student
    const [submission] = await db.execute(
      `SELECT s.student_id, a.title FROM submissions s 
       JOIN assignments a ON s.assignment_id = a.id 
       WHERE s.id = ?`,
      [req.params.submissionId]
    );

    if (submission.length > 0) {
      await db.execute(
        'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
        [submission[0].student_id, 'Assignment Graded',
         `Your submission for "${submission[0].title}" has been graded. Grade: ${grade}`,
         'grade']
      );
    }

    res.json({ success: true, message: 'Submission graded' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
