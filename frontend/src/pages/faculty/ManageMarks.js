// src/pages/faculty/ManageMarks.js
import React, { useEffect, useState } from 'react';
import { marksAPI, coursesAPI, usersAPI } from '../../utils/api';

const EXAM_TYPES = ['midterm','final','quiz','internal','practical'];

const ManageMarks = () => {
  const [courses, setCourses]   = useState([]);
  const [students, setStudents] = useState([]);
  const [marks, setMarks]       = useState([]);
  const [form, setForm]         = useState({ student_id:'', course_id:'', exam_type:'midterm', marks_obtained:'', max_marks:100, exam_date:'', remarks:'' });
  const [filterCourse, setFC]   = useState('');
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState({ text:'', type:'' });

  const load = async () => {
    setLoading(true);
    try {
      const [c, s, m] = await Promise.all([coursesAPI.getAll(), usersAPI.getPerformance(), marksAPI.getAll({ course_id: filterCourse||undefined })]);
      setCourses(c.data.courses || []);
      setStudents(s.data.students || []);
      setMarks(m.data.marks || []);
    } catch (_) {}
    setLoading(false);
  };
  useEffect(() => { load(); }, [filterCourse]);

  const save = async (e) => {
    e.preventDefault();
    if (!form.student_id || !form.course_id || form.marks_obtained === '') {
      setMsg({ text:'Student, course, and marks are required', type:'danger' }); return;
    }
    setSaving(true);
    try {
      await marksAPI.save(form);
      setMsg({ text:'Marks saved successfully!', type:'success' });
      setForm(f => ({ ...f, student_id:'', marks_obtained:'', remarks:'' }));
      load();
    } catch (err) { setMsg({ text: err.response?.data?.message || 'Error', type:'danger' }); }
    setSaving(false);
  };

  const pct = (obt, max) => Math.round((obt / max) * 100);
  const grade = (p) => p>=90?'A':p>=75?'B':p>=60?'C':p>=40?'D':'F';
  const gradeBadge = (p) => {
    const g = grade(p);
    const map = { A:'badge-success', B:'badge-primary', C:'badge-warning', D:'badge-info', F:'badge-danger' };
    return <span className={`badge ${map[g]}`}>{g} ({p}%)</span>;
  };

  return (
    <div>
      <div className="page-header"><h2>🎯 Marks Entry</h2><p>Add and manage student marks</p></div>
      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}<button onClick={()=>setMsg({text:'',type:''})} style={{float:'right',background:'none',border:'none',cursor:'pointer'}}>✕</button></div>}

      <div style={{ display:'grid', gridTemplateColumns:'360px 1fr', gap:24, alignItems:'start' }}>
        {/* Entry form */}
        <div className="card">
          <div className="card-header"><h5>➕ Enter Marks</h5></div>
          <div className="card-body">
            <form onSubmit={save}>
              <div className="form-group">
                <label className="form-label">Student</label>
                <select className="form-control" value={form.student_id} onChange={e=>setForm(f=>({...f,student_id:e.target.value}))}>
                  <option value="">— Select Student —</option>
                  {students.map(s=><option key={s.user_id} value={s.user_id}>{s.name} ({s.email})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Course</label>
                <select className="form-control" value={form.course_id} onChange={e=>setForm(f=>({...f,course_id:e.target.value}))}>
                  <option value="">— Select Course —</option>
                  {courses.map(c=><option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Exam Type</label>
                <select className="form-control" value={form.exam_type} onChange={e=>setForm(f=>({...f,exam_type:e.target.value}))}>
                  {EXAM_TYPES.map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="form-group">
                  <label className="form-label">Marks Obtained</label>
                  <input type="number" className="form-control" placeholder="75" min={0} max={form.max_marks} value={form.marks_obtained} onChange={e=>setForm(f=>({...f,marks_obtained:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Max Marks</label>
                  <input type="number" className="form-control" value={form.max_marks} onChange={e=>setForm(f=>({...f,max_marks:+e.target.value}))}/>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Exam Date</label>
                <input type="date" className="form-control" value={form.exam_date} onChange={e=>setForm(f=>({...f,exam_date:e.target.value}))}/>
              </div>
              <div className="form-group">
                <label className="form-label">Remarks (optional)</label>
                <input className="form-control" placeholder="Any remarks..." value={form.remarks} onChange={e=>setForm(f=>({...f,remarks:e.target.value}))}/>
              </div>
              <button type="submit" className="btn btn-primary" style={{width:'100%'}} disabled={saving}>{saving?'Saving...':'💾 Save Marks'}</button>
            </form>
          </div>
        </div>

        {/* Marks table */}
        <div className="card">
          <div className="card-header">
            <h5>Marks Records ({marks.length})</h5>
            <select className="form-control" style={{width:200}} value={filterCourse} onChange={e=>setFC(e.target.value)}>
              <option value="">All Courses</option>
              {courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="table-responsive">
            {loading ? <div className="spinner"><div className="spin"/></div> : (
              <table>
                <thead><tr><th>Student</th><th>Course</th><th>Exam</th><th>Marks</th><th>Grade</th><th>Date</th></tr></thead>
                <tbody>
                  {marks.map(m=>(
                    <tr key={m.id}>
                      <td style={{fontWeight:600}}>{m.student_name}</td>
                      <td><span className="badge badge-info" style={{fontSize:'.75rem'}}>{m.course_name}</span></td>
                      <td style={{textTransform:'capitalize'}}>{m.exam_type}</td>
                      <td>{m.marks_obtained}/{m.max_marks}</td>
                      <td>{gradeBadge(pct(m.marks_obtained,m.max_marks))}</td>
                      <td style={{color:'var(--text-muted)',fontSize:'.82rem'}}>{m.exam_date||'—'}</td>
                    </tr>
                  ))}
                  {marks.length===0&&<tr><td colSpan={6}><div className="empty-state"><div className="icon">🎯</div><p>No marks records yet</p></div></td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ManageMarks;
