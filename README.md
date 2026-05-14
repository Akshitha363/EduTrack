# 🎓 EduTrack: Smart Student & Faculty Management Analytics System

> Full-Stack Web Application | Node.js + React.js + MySQL + JWT | WAD Syllabus Complete

---

## 📁 COMPLETE FILE STRUCTURE

```
edutrack/
│
├── 📄 README.md                         ← This file
├── 📄 database.sql                      ← Full MySQL schema + sample data
│
├── 📂 xml/                              ← WAD XML Module
│   ├── bookstore.xml                    ← XML document
│   ├── bookstore.dtd                    ← DTD validation
│   └── bookstore.xsd                    ← XML Schema (XSD)
│
├── 📂 backend/                          ← Node.js + Express Server
│   ├── 📄 server.js                     ← Main Express server (Controller layer)
│   ├── 📄 node-demo.js                  ← Node.js core modules demo
│   ├── 📄 package.json                  ← Backend dependencies
│   ├── 📄 .env                          ← Environment variables (edit this!)
│   │
│   ├── 📂 config/
│   │   └── db.js                        ← MySQL connection pool
│   │
│   ├── 📂 middleware/
│   │   ├── auth.js                      ← JWT verify + role-based access
│   │   └── upload.js                    ← Multer file upload config
│   │
│   ├── 📂 routes/                       ← REST API endpoints
│   │   ├── auth.js                      ← POST /api/auth/login|register|logout
│   │   ├── users.js                     ← GET/PUT/DELETE /api/users
│   │   ├── courses.js                   ← CRUD /api/courses
│   │   ├── assignments.js               ← CRUD + submit /api/assignments
│   │   ├── attendance.js                ← Mark/view /api/attendance
│   │   ├── marks.js                     ← CRUD + analytics /api/marks
│   │   ├── notes.js                     ← Upload/view/delete /api/notes
│   │   └── notifications.js             ← /api/notifications
│   │
│   └── 📂 uploads/                      ← File storage (auto-created)
│       ├── notes/                       ← Lecture note PDFs
│       └── assignments/                 ← Student submissions
│
└── 📂 frontend/                         ← React.js Application
    ├── 📄 package.json                  ← Frontend dependencies
    │
    ├── 📂 public/
    │   └── index.html                   ← HTML shell
    │
    └── 📂 src/
        ├── index.js                     ← React entry point
        ├── App.js                       ← Router + protected routes
        ├── index.css                    ← Global styles (CSS3/Flexbox/Grid)
        │
        ├── 📂 context/
        │   └── AuthContext.js           ← Global auth state (JWT)
        │
        ├── 📂 utils/
        │   └── api.js                   ← Axios API calls (all endpoints)
        │
        ├── 📂 components/
        │   ├── Sidebar.js               ← Role-aware navigation
        │   └── Topbar.js                ← Header with notifications
        │
        └── 📂 pages/
            ├── Login.js                 ← Login with JS validation
            ├── Register.js              ← Register with JS validation
            │
            ├── 📂 admin/
            │   ├── AdminDashboard.js    ← Charts + system analytics
            │   └── ManageUsers.js       ← User CRUD + role management
            │
            ├── 📂 faculty/
            │   ├── FacultyDashboard.js  ← Faculty overview + charts
            │   ├── ManageCourses.js     ← Course CRUD
            │   ├── ManageAssignments.js ← Create/grade assignments
            │   ├── ManageMarks.js       ← Enter student marks
            │   ├── ManageAttendance.js  ← Mark daily attendance
            │   └── UploadNotes.js       ← Upload lecture PDFs
            │
            └── 📂 student/
                ├── StudentDashboard.js  ← Performance + radar chart
                ├── MyMarks.js           ← View marks + trend chart
                ├── MyAttendance.js      ← Attendance % + donut chart
                ├── MyAssignments.js     ← View + submit assignments
                ├── LectureNotes.js      ← Browse + download PDFs
                └── Notifications.js     ← All notifications
```

---

## ⚙️ PREREQUISITES

Before starting, make sure you have these installed:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18+ | https://nodejs.org |
| MySQL  | v8.0+  | https://dev.mysql.com/downloads/ |
| npm    | v9+    | (comes with Node.js) |
| Git    | any    | https://git-scm.com |

**Check versions:**
```bash
node -v       # Should show v18.x.x or higher
npm -v        # Should show 9.x.x or higher
mysql --version
```

---

## 🚀 STEP-BY-STEP SETUP

### STEP 1 — Database Setup

**1a. Open MySQL and create the database:**
```bash
# Login to MySQL
mysql -u root -p

# Inside MySQL shell, run:
CREATE DATABASE edutrack_db;
EXIT;
```

**1b. Import the schema and sample data:**
```bash
# From the project root folder (where database.sql is located)
mysql -u root -p edutrack_db < database.sql
```

**1c. Verify it worked:**
```bash
mysql -u root -p
USE edutrack_db;
SHOW TABLES;
SELECT name, email, role FROM users;
EXIT;
```

You should see tables: `users`, `students`, `faculty`, `courses`, `assignments`, `submissions`, `attendance`, `marks`, `lecture_notes`, `notifications`, `enrollments`

---

### STEP 2 — Backend Setup

**2a. Navigate to backend folder:**
```bash
cd backend
```

**2b. Install dependencies:**
```bash
npm install
```
This installs: express, mysql2, jsonwebtoken, bcryptjs, multer, cors, cookie-parser, dotenv

**2c. Configure environment variables:**

Open `.env` file and update your MySQL password:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE    ← CHANGE THIS
DB_NAME=edutrack_db

JWT_SECRET=edutrack_super_secret_jwt_key_2024
JWT_EXPIRES_IN=7d

UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

**2d. Create uploads folder (if not auto-created):**
```bash
mkdir -p uploads/notes uploads/assignments
```

**2e. Start the backend server:**
```bash
# Development mode (auto-restart on changes)
npm run dev

# OR production mode
npm start
```

✅ You should see:
```
✅ MySQL Database connected successfully
╔══════════════════════════════════════════╗
║     EduTrack API Server Started          ║
║     Port: 5000                           ╚═...
```

**2f. Test the API is working:**
```bash
# In a new terminal:
curl http://localhost:5000/api/health
# Should return: {"success":true,"message":"EduTrack API is running",...}
```

---

### STEP 3 — Frontend Setup

**3a. Open a NEW terminal and navigate to frontend:**
```bash
cd frontend
```

**3b. Install dependencies:**
```bash
npm install
```
This installs: react, react-router-dom, chart.js, react-chartjs-2, axios, bootstrap

**3c. Start the frontend:**
```bash
npm start
```

✅ Browser will open automatically at `http://localhost:3000`

---

### STEP 4 — Login and Test

**Demo Accounts (password for all: `password123`):**

| Role    | Email                  | Password    | Access |
|---------|------------------------|-------------|--------|
| Admin   | admin@edutrack.com     | password123 | Full system |
| Faculty | priya@edutrack.com     | password123 | Faculty portal |
| Student | rahul@edutrack.com     | password123 | Student portal |
| Student | priyap@edutrack.com    | password123 | Student portal |

---

## 🔗 ALL API ENDPOINTS

### Authentication
```
POST   /api/auth/register         Register new user
POST   /api/auth/login            Login (returns JWT token)
POST   /api/auth/logout           Logout (clears cookie)
GET    /api/auth/me               Get current user info
```

### Users (Admin only)
```
GET    /api/users                 Get all users (search, filter, paginate)
GET    /api/users/stats           System-wide statistics
PUT    /api/users/:id             Update user details
DELETE /api/users/:id             Deactivate user
GET    /api/users/students/performance  All students with marks/attendance
```

### Courses
```
GET    /api/courses               Get all courses
GET    /api/courses/:id           Get course + enrolled students
POST   /api/courses               Create course (Faculty/Admin)
PUT    /api/courses/:id           Update course
DELETE /api/courses/:id           Delete course (Admin)
POST   /api/courses/:id/enroll    Enroll student in course
GET    /api/courses/my/enrolled   Student's enrolled courses
```

### Assignments
```
GET    /api/assignments           List assignments (filter by course/status)
GET    /api/assignments/:id       Get assignment + submissions
POST   /api/assignments           Create assignment (Faculty)
PUT    /api/assignments/:id       Update assignment
DELETE /api/assignments/:id       Delete assignment
POST   /api/assignments/:id/submit    Submit assignment (Student, multipart)
PUT    /api/assignments/submissions/:id/grade  Grade submission (Faculty)
```

### Attendance
```
GET    /api/attendance            Get records (filter by course/student/date)
GET    /api/attendance/my         My attendance + per-course summary
POST   /api/attendance/mark       Mark attendance for class (Faculty)
GET    /api/attendance/stats/:courseId  Attendance stats for course
```

### Marks
```
GET    /api/marks                 All marks (admin/faculty)
GET    /api/marks/my              My marks + smart suggestions (student)
POST   /api/marks                 Add/update marks (Faculty)
GET    /api/marks/analytics/overview  Analytics: pass/fail, top students, distribution
```

### Lecture Notes
```
GET    /api/notes                 List all notes (filter by course/subject)
GET    /api/notes/:id             Get single note
POST   /api/notes/upload          Upload note PDF (Faculty, multipart)
PUT    /api/notes/:id             Update note metadata
DELETE /api/notes/:id             Delete note + file
```

### Notifications
```
GET    /api/notifications         Get my notifications
PUT    /api/notifications/:id/read     Mark single as read
PUT    /api/notifications/read-all     Mark all as read
DELETE /api/notifications/:id     Delete notification
```

---

## 🧪 RUNNING NODE.JS CORE MODULES DEMO

```bash
cd backend
node node-demo.js
```

This demonstrates: `http`, `os`, `path`, `fs`, `events`, `crypto`, `process` modules.

---


## 🌟 FEATURES SUMMARY

### 🔐 Authentication
- JWT-based login/register
- Role-based access: Admin / Faculty / Student
- Cookie-based session tracking
- Protected routes in React

### 👨‍💼 Admin
- System-wide analytics dashboard
- Pass/Fail ratio chart, Grade distribution
- Manage all users (activate/deactivate)
- View top/weak students

### 👨‍🏫 Faculty
- Dashboard with course analytics
- Create/manage courses
- Create assignments with deadlines
- Grade student submissions
- Mark daily attendance (present/absent/late)
- Low attendance auto-warning
- Upload lecture notes (PDF)
- Enter marks, auto-notify on low scores

### 👨‍🎓 Student
- Performance dashboard with Radar chart
- View marks by subject + trend line chart
- Attendance % with per-course breakdown
- Submit assignments with file upload
- Browse & download lecture notes (PDF)
- Smart performance suggestions
- Real-time notifications

### 🔔 Notifications (Auto-generated)
- New assignment posted
- Assignment graded
- Low attendance warning (<75%)
- Low marks alert (<40%)

---

## 🛠️ TROUBLESHOOTING

### ❌ "Database connection failed"
- Check MySQL is running: `sudo service mysql start` (Linux) or start MySQL from Services (Windows)
- Verify password in `.env` file
- Make sure `edutrack_db` database exists

### ❌ "Module not found" errors
```bash
cd backend && npm install
cd ../frontend && npm install
```

### ❌ CORS error in browser
- Make sure backend runs on port 5000
- Frontend proxy is set in `frontend/package.json`: `"proxy": "http://localhost:5000"`

### ❌ File upload not working
```bash
mkdir -p backend/uploads/notes backend/uploads/assignments
```

### ❌ Port already in use
```bash
# Kill process on port 5000
npx kill-port 5000
# Or change PORT in .env
```

### ❌ JWT token errors
- Clear browser localStorage and cookies
- Re-login

---

## 📦 TECH STACK SUMMARY

| Layer | Technology |
|-------|-----------|
| Frontend | React.js 18, React Router v6, Chart.js 4 |
| Styling | Bootstrap 5, Custom CSS3, Flexbox, Grid |
| HTTP Client | Axios |
| Backend | Node.js, Express.js 4 |
| Database | MySQL 8, mysql2 driver |
| Auth | JWT (jsonwebtoken), bcryptjs |
| File Upload | Multer |
| Session | JWT + HTTP-only Cookies |
| XML | bookstore.xml + .dtd + .xsd |

---

## 🔄 RUNNING BOTH SERVERS

Open **two terminals**:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# ✅ Running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm start
# ✅ Running on http://localhost:3000
```

Then open `http://localhost:3000` in your browser.

---

## 📝 VIVA PREPARATION TIPS

1. **JWT Flow**: Client sends credentials → Server validates → Returns JWT → Client stores in localStorage → Sends as `Authorization: Bearer <token>` header in all requests.

2. **Role-based Access**: Middleware `requireRole('admin', 'faculty')` checks `req.user.role` after JWT verification.

3. **Express as Servlet equivalent**: In Java WAD, Servlets handle HTTP requests. In Express, route handlers + middleware serve the same purpose — they intercept requests, process business logic, and send responses.

4. **MySQL CRUD**: Create (INSERT), Read (SELECT), Update (UPDATE), Delete (DELETE) — demonstrated in all route files.

5. **XML**: `bookstore.xml` is validated against `bookstore.dtd` (structural) and `bookstore.xsd` (type-safe with data type constraints).

6. **React Router**: `<BrowserRouter>` + `<Routes>` + `<Route>` provides client-side navigation. `<Navigate>` handles redirects. `ProtectedRoute` wraps routes requiring auth.

---

*EduTrack v1.0 — Built for WAD Course Project*
