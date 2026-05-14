// src/utils/api.js - Centralized API calls using axios (ES6 async/await)
import axios from 'axios';

// ── Auth ──────────────────────────────────────
export const authAPI = {
  login:    (data) => axios.post('/api/auth/login', data),
  register: (data) => axios.post('/api/auth/register', data),
  logout:   ()     => axios.post('/api/auth/logout'),
  me:       ()     => axios.get('/api/auth/me'),
};

// ── Users / Admin ─────────────────────────────
export const usersAPI = {
  getAll:  (params) => axios.get('/api/users', { params }),
  getStats: ()      => axios.get('/api/users/stats'),
  update:  (id, d)  => axios.put(`/api/users/${id}`, d),
  remove:  (id)     => axios.delete(`/api/users/${id}`),
  getPerformance: () => axios.get('/api/users/students/performance'),
};

// ── Courses ───────────────────────────────────
export const coursesAPI = {
  getAll:   ()       => axios.get('/api/courses'),
  getOne:   (id)     => axios.get(`/api/courses/${id}`),
  create:   (data)   => axios.post('/api/courses', data),
  update:   (id, d)  => axios.put(`/api/courses/${id}`, d),
  remove:   (id)     => axios.delete(`/api/courses/${id}`),
  enroll:   (id, sId)=> axios.post(`/api/courses/${id}/enroll`, { studentId: sId }),
  myEnrolled: ()     => axios.get('/api/courses/my/enrolled'),
};

// ── Assignments ───────────────────────────────
export const assignmentsAPI = {
  getAll:   (params)           => axios.get('/api/assignments', { params }),
  getOne:   (id)               => axios.get(`/api/assignments/${id}`),
  create:   (data)             => axios.post('/api/assignments', data),
  update:   (id, d)            => axios.put(`/api/assignments/${id}`, d),
  remove:   (id)               => axios.delete(`/api/assignments/${id}`),
  submit:   (id, formData)     => axios.post(`/api/assignments/${id}/submit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  grade:    (subId, data)      => axios.put(`/api/assignments/submissions/${subId}/grade`, data),
};

// ── Attendance ────────────────────────────────
export const attendanceAPI = {
  getAll:   (params) => axios.get('/api/attendance', { params }),
  getMy:    ()       => axios.get('/api/attendance/my'),
  mark:     (data)   => axios.post('/api/attendance/mark', data),
  getStats: (cId)    => axios.get(`/api/attendance/stats/${cId}`),
};

// ── Marks ─────────────────────────────────────
export const marksAPI = {
  getAll:     (params) => axios.get('/api/marks', { params }),
  getMy:      ()       => axios.get('/api/marks/my'),
  save:       (data)   => axios.post('/api/marks', data),
  getAnalytics: ()     => axios.get('/api/marks/analytics/overview'),
};

// ── Lecture Notes ─────────────────────────────
export const notesAPI = {
  getAll:      (params)   => axios.get('/api/notes', { params }),
  getOne:      (id)       => axios.get(`/api/notes/${id}`),
  upload:      (formData) => axios.post('/api/notes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  update:      (id, data) => axios.put(`/api/notes/${id}`, data),
  remove:      (id)       => axios.delete(`/api/notes/${id}`),
  getReviews:  (id)       => axios.get(`/api/notes/${id}/reviews`),
  submitReview:(id, data) => axios.post(`/api/notes/${id}/reviews`, data),
};

// ── Notifications ─────────────────────────────
export const notificationsAPI = {
  getAll:      ()   => axios.get('/api/notifications'),
  markRead:    (id) => axios.put(`/api/notifications/${id}/read`),
  markAllRead: ()   => axios.put('/api/notifications/read-all'),
  remove:      (id) => axios.delete(`/api/notifications/${id}`),
};
