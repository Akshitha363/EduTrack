-- ═══════════════════════════════════════════════════════════════════
-- EduTrack: Smart Student and Faculty Management Analytics System
-- MySQL Database Schema + Sample Data
-- ═══════════════════════════════════════════════════════════════════

-- Create database
CREATE DATABASE IF NOT EXISTS edutrack_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE edutrack_db;

-- ──────────────────────────────────────────
-- TABLE: users (with role-based access)
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'faculty', 'student') NOT NULL DEFAULT 'student',
  department VARCHAR(100),
  phone VARCHAR(20),
  is_active TINYINT(1) DEFAULT 1,
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ──────────────────────────────────────────
-- TABLE: students
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  roll_number VARCHAR(20) UNIQUE,
  department VARCHAR(100),
  semester INT DEFAULT 1,
  year INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────
-- TABLE: faculty
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS faculty (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  department VARCHAR(100),
  designation VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────
-- TABLE: courses
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS courses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  credits INT DEFAULT 3,
  semester INT DEFAULT 1,
  department VARCHAR(100),
  faculty_id INT,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (faculty_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ──────────────────────────────────────────
-- TABLE: enrollments (Student-Course mapping)
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  student_id INT NOT NULL,
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_enrollment (course_id, student_id),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────
-- TABLE: assignments
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  course_id INT NOT NULL,
  due_date DATETIME NOT NULL,
  max_marks INT DEFAULT 100,
  created_by INT NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────
-- TABLE: submissions
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL,
  student_id INT NOT NULL,
  file_url VARCHAR(255),
  notes TEXT,
  grade DECIMAL(5,2),
  feedback TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  graded_at DATETIME,
  UNIQUE KEY unique_submission (assignment_id, student_id),
  FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────
-- TABLE: attendance
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  course_id INT NOT NULL,
  date DATE NOT NULL,
  status ENUM('present', 'absent', 'late') DEFAULT 'present',
  percentage DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────
-- TABLE: marks
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS marks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  exam_type ENUM('midterm', 'final', 'quiz', 'internal', 'practical') DEFAULT 'midterm',
  marks_obtained DECIMAL(6,2) NOT NULL,
  max_marks DECIMAL(6,2) DEFAULT 100,
  exam_date DATE,
  remarks TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────
-- TABLE: lecture_notes
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lecture_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  course VARCHAR(100) NOT NULL,
  description TEXT,
  file_url VARCHAR(255) NOT NULL,
  file_size INT,
  file_type VARCHAR(50),
  uploaded_by INT NOT NULL,
  download_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- ──────────────────────────────────────────
-- TABLE: notifications
-- ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('assignment', 'grade', 'attendance', 'warning', 'alert', 'info') DEFAULT 'info',
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ═══════════════════════════════════════════════════════════════════
-- SAMPLE DATA
-- Password for all users: "password123" (bcrypt hashed)
-- Hash: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewXJoOGkpKBQEaJW
-- ═══════════════════════════════════════════════════════════════════

-- Admin user
INSERT INTO users (name, email, password, role, department, phone) VALUES
('Admin User', 'admin@edutrack.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewXJoOGkpKBQEaJW', 'admin', 'Administration', '9999000001');

-- Faculty users
INSERT INTO users (name, email, password, role, department, phone) VALUES
('Dr. Priya Sharma', 'priya@edutrack.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewXJoOGkpKBQEaJW', 'faculty', 'Computer Science', '9999000002'),
('Prof. Rajesh Kumar', 'rajesh@edutrack.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewXJoOGkpKBQEaJW', 'faculty', 'Mathematics', '9999000003'),
('Dr. Ananya Patel', 'ananya@edutrack.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewXJoOGkpKBQEaJW', 'faculty', 'Electronics', '9999000004');

-- Student users
INSERT INTO users (name, email, password, role, department, phone) VALUES
('Rahul Sharma', 'rahul@edutrack.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewXJoOGkpKBQEaJW', 'student', 'Computer Science', '9999000005'),
('Priya Patel', 'priyap@edutrack.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewXJoOGkpKBQEaJW', 'student', 'Computer Science', '9999000006'),
('Amit Kumar', 'amit@edutrack.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewXJoOGkpKBQEaJW', 'student', 'Electronics', '9999000007'),
('Sneha Reddy', 'sneha@edutrack.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewXJoOGkpKBQEaJW', 'student', 'Mathematics', '9999000008'),
('Kiran Singh', 'kiran@edutrack.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewXJoOGkpKBQEaJW', 'student', 'Computer Science', '9999000009');

-- Faculty records
INSERT INTO faculty (user_id, name, email, department, designation) VALUES
(2, 'Dr. Priya Sharma', 'priya@edutrack.com', 'Computer Science', 'Associate Professor'),
(3, 'Prof. Rajesh Kumar', 'rajesh@edutrack.com', 'Mathematics', 'Professor'),
(4, 'Dr. Ananya Patel', 'ananya@edutrack.com', 'Electronics', 'Assistant Professor');

-- Student records
INSERT INTO students (user_id, name, email, roll_number, department, semester, year) VALUES
(5, 'Rahul Sharma', 'rahul@edutrack.com', 'CS2021001', 'Computer Science', 6, 3),
(6, 'Priya Patel', 'priyap@edutrack.com', 'CS2021002', 'Computer Science', 6, 3),
(7, 'Amit Kumar', 'amit@edutrack.com', 'EC2021001', 'Electronics', 6, 3),
(8, 'Sneha Reddy', 'sneha@edutrack.com', 'MA2021001', 'Mathematics', 6, 3),
(9, 'Kiran Singh', 'kiran@edutrack.com', 'CS2021003', 'Computer Science', 6, 3);

-- Courses
INSERT INTO courses (name, code, description, credits, semester, department, faculty_id) VALUES
('Web Application Development', 'CS601', 'Full stack web development with Node.js and React', 4, 6, 'Computer Science', 2),
('Data Structures & Algorithms', 'CS501', 'Advanced data structures and algorithm design', 4, 5, 'Computer Science', 2),
('Database Management Systems', 'CS502', 'Relational databases, SQL, and NoSQL', 3, 5, 'Computer Science', 2),
('Engineering Mathematics', 'MA501', 'Calculus, linear algebra, and probability', 4, 5, 'Mathematics', 3),
('Digital Electronics', 'EC501', 'Digital logic design and circuit analysis', 3, 5, 'Electronics', 4);

-- Enrollments (students in courses)
INSERT INTO enrollments (course_id, student_id) VALUES
(1, 1), (1, 2), (1, 5), -- WAD course: Rahul, Priya, Kiran
(2, 1), (2, 2), (2, 5), -- DSA: Rahul, Priya, Kiran
(3, 1), (3, 2),          -- DBMS: Rahul, Priya
(4, 4),                   -- Math: Sneha
(5, 3);                   -- Electronics: Amit

-- Assignments
INSERT INTO assignments (title, description, course_id, due_date, max_marks, created_by) VALUES
('Lab Assignment 1 - HTML & CSS', 'Create a responsive webpage using HTML5 and CSS3 with Flexbox', 1, DATE_ADD(NOW(), INTERVAL 7 DAY), 20, 2),
('Lab Assignment 2 - React Components', 'Build reusable React components with state management', 1, DATE_ADD(NOW(), INTERVAL 14 DAY), 25, 2),
('Lab Assignment 3 - REST API', 'Create a REST API using Node.js and Express', 1, DATE_ADD(NOW(), INTERVAL 21 DAY), 30, 2),
('Binary Trees Implementation', 'Implement binary search tree with insert, delete, search', 2, DATE_ADD(NOW(), INTERVAL 10 DAY), 20, 2),
('SQL Query Practice', 'Write complex SQL queries for given scenarios', 3, DATE_ADD(NOW(), INTERVAL 5 DAY), 15, 2);

-- Marks data
INSERT INTO marks (student_id, course_id, exam_type, marks_obtained, max_marks, exam_date) VALUES
(5, 1, 'midterm', 78, 100, CURDATE() - INTERVAL 30 DAY),
(5, 1, 'internal', 18, 20, CURDATE() - INTERVAL 15 DAY),
(5, 2, 'midterm', 85, 100, CURDATE() - INTERVAL 30 DAY),
(5, 3, 'midterm', 72, 100, CURDATE() - INTERVAL 30 DAY),
(6, 1, 'midterm', 92, 100, CURDATE() - INTERVAL 30 DAY),
(6, 1, 'internal', 19, 20, CURDATE() - INTERVAL 15 DAY),
(6, 2, 'midterm', 88, 100, CURDATE() - INTERVAL 30 DAY),
(7, 5, 'midterm', 65, 100, CURDATE() - INTERVAL 30 DAY),
(8, 4, 'midterm', 55, 100, CURDATE() - INTERVAL 30 DAY),
(9, 1, 'midterm', 45, 100, CURDATE() - INTERVAL 30 DAY),
(9, 2, 'midterm', 38, 100, CURDATE() - INTERVAL 30 DAY);

-- Attendance data
INSERT INTO attendance (user_id, course_id, date, status, percentage) VALUES
(5, 1, CURDATE() - INTERVAL 7 DAY, 'present', 90),
(5, 1, CURDATE() - INTERVAL 6 DAY, 'present', 90),
(5, 1, CURDATE() - INTERVAL 5 DAY, 'absent', 85),
(5, 1, CURDATE() - INTERVAL 4 DAY, 'present', 87),
(5, 1, CURDATE() - INTERVAL 3 DAY, 'present', 88),
(6, 1, CURDATE() - INTERVAL 7 DAY, 'present', 95),
(6, 1, CURDATE() - INTERVAL 6 DAY, 'present', 95),
(6, 1, CURDATE() - INTERVAL 5 DAY, 'present', 95),
(7, 5, CURDATE() - INTERVAL 7 DAY, 'absent', 60),
(7, 5, CURDATE() - INTERVAL 6 DAY, 'absent', 55),
(7, 5, CURDATE() - INTERVAL 5 DAY, 'present', 58),
(8, 4, CURDATE() - INTERVAL 7 DAY, 'present', 80),
(9, 1, CURDATE() - INTERVAL 7 DAY, 'absent', 70),
(9, 1, CURDATE() - INTERVAL 6 DAY, 'absent', 65),
(9, 1, CURDATE() - INTERVAL 5 DAY, 'present', 67);

-- Notifications
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
(5, 'New Assignment Posted', 'Lab Assignment 1 - HTML & CSS is due in 7 days', 'assignment', 0),
(6, 'New Assignment Posted', 'Lab Assignment 1 - HTML & CSS is due in 7 days', 'assignment', 0),
(7, '⚠️ Low Attendance Warning', 'Your attendance in Digital Electronics is below 75%. Current: 58%', 'warning', 0),
(9, '📉 Low Marks Alert', 'You scored 38/100 in DSA Midterm. Please seek help from faculty.', 'alert', 0),
(5, 'Welcome to EduTrack!', 'Your account has been successfully created. Explore your dashboard.', 'info', 1);

-- Lecture notes (sample entries without actual files)
INSERT INTO lecture_notes (title, subject, course, description, file_url, file_size, file_type, uploaded_by) VALUES
('Introduction to HTML5 & CSS3', 'Web Technologies', 'Web Application Development', 'Complete notes on HTML5 semantic elements and CSS3 features', '/uploads/notes/sample-note-1.pdf', 1024000, 'application/pdf', 2),
('React.js Fundamentals', 'Frontend Development', 'Web Application Development', 'Hooks, components, state management in React', '/uploads/notes/sample-note-2.pdf', 2048000, 'application/pdf', 2),
('Node.js & Express Guide', 'Backend Development', 'Web Application Development', 'REST API development with Node.js and Express.js', '/uploads/notes/sample-note-3.pdf', 1536000, 'application/pdf', 2),
('Binary Trees & Graphs', 'Data Structures', 'Data Structures & Algorithms', 'Tree traversals, graph algorithms, BFS, DFS', '/uploads/notes/sample-note-4.pdf', 512000, 'application/pdf', 2),
('SQL Advanced Queries', 'Database', 'Database Management Systems', 'Joins, subqueries, stored procedures, triggers', '/uploads/notes/sample-note-5.pdf', 768000, 'application/pdf', 2);

-- ═══════════════════════════════════════════════════════════════════
-- INDEXES for performance optimization
-- ═══════════════════════════════════════════════════════════════════
CREATE INDEX idx_marks_student ON marks(student_id);
CREATE INDEX idx_marks_course ON marks(course_id);
CREATE INDEX idx_attendance_user ON attendance(user_id);
CREATE INDEX idx_attendance_course ON attendance(course_id);
CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX idx_submissions_student ON submissions(student_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_lecture_notes_course ON lecture_notes(course);

SELECT 'EduTrack database setup complete!' as Status;

-- ── TABLE: note_reviews (student reviews for lecture notes) ──
CREATE TABLE IF NOT EXISTS note_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  note_id INT NOT NULL,
  student_id INT NOT NULL,
  rating INT CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_review (note_id, student_id),
  FOREIGN KEY (note_id) REFERENCES lecture_notes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);
