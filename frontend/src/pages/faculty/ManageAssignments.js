// src/pages/faculty/ManageAssignments.js
import React, { useEffect, useState } from 'react';
import { assignmentsAPI, coursesAPI } from '../../utils/api';

const blank = { title:'', description:'', course_id:'', due_date:'', max_marks:100 };

const ManageAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [courses, setCourses]         = useState([]);
  const [form, setForm]               = useState(blank);
  const [editing, setEditing]         = useState(null);
  const [viewSubs, setViewSubs]       = useState(null);
  const [gradeData, setGradeData]     = useState({});
  const [loading, setLoading]         = useState(true);
  const [saving, setSaving]           = useState(false);
  const [msg, setMsg]                 = useState({ text:'', type:'' });

  const load = async () => {
    setLoading(true);
    try {
      const [a, c] = await Promise.all([assignmentsAPI.getAll(), coursesAPI.getAll()]);
      setAssignments(a.data.assignments || []);
      setCourses(c.data.courses || []);
    } catch (_) {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!form.title || !form.course_id || !form.due_date) {
      setMsg({ text:'Title, course, and due date are required', type:'danger' }); return;
    }
    setSaving(true);
    try {
      if (editing) { await assignmentsAPI.update(editing, form); setMsg({ text:'Assignment updated!', type:'success' }); }
      else         { await assignmentsAPI.create(form);          setMsg({ text:'Assignment created!', type:'success' }); }
      setForm(blank); setEditing(null); load();
    } catch (err) { setMsg({ text: err.response?.data?.message || 'Error', type:'danger' }); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!window.confirm('Delete this assignment?')) return;
    try { await assignmentsAPI.remove(id); setMsg({ text:'Deleted', type:'success' }); load(); } catch (_) {}
  };

  const loadSubs = async (id) => {
    const { data } = await assignmentsAPI.getOne(id);
    setViewSubs(data);
  };

  const submitGrade = async (subId) => {
    const g = gradeData[subId];
    if (!g?.grade) return;
    try {
      await assignmentsAPI.grade(subId, { grade: g.grade, feedback: g.feedback || '' });
      setMsg({ text:'Grade submitted!', type:'success' });
      loadSubs(viewSubs.assignment.id);
    } catch (_) {}
  };

  const edit = (a) => {
    setForm({ title:a.title, description:a.description||'', course_id:a.course_id, due_date:a.due_date?.split('T')[0]||'', max_marks:a.max_marks });
    setEditing(a.id); setViewSubs(null); window.scrollTo(0,0);
  };

  const isActive = (d) => new Date(d) >= new Date();

  return (
    <div>
      <div className="page-header"><h2>📝 Manage Assignments</h2><p>Create, manage, and grade student submissions</p></div>
      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}<button onClick={()=>setMsg({text:'',type:''})} style={{float:'right',background:'none',border:'none',cursor:'pointer'}}>✕</button></div>}

      <div style={{ display:'grid', gridTemplateColumns:'360px 1fr', gap:24, alignItems:'start' }}>
        {/* Form */}
        <div className="card">
          <div className="card-header"><h5>{editing ? '✏️ Edit' : '➕ New'} Assignment</h5></div>
          <div className="card-body">
            <form onSubmit={save}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-control" placeholder="Assignment title" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={3} placeholder="Instructions..." value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/>
              </div>
              <div className="form-group">
                <label className="form-label">Course</label>
                <select className="form-control" value={form.course_id} onChange={e=>setForm(f=>({...f,course_id:e.target.value}))}>
                  <option value="">— Select Course —</option>
                  {courses.map(c=><option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input type="datetime-local" className="form-control" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))}/>
                </div>
                <div className="form-group">
                  <label className="form-label">Max Marks</label>
                  <input type="number" className="form-control" value={form.max_marks} onChange={e=>setForm(f=>({...f,max_marks:+e.target.value}))}/>
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button type="submit" className="btn btn-primary" style={{flex:1}} disabled={saving}>{saving?'Saving...':editing?'Update':'Create'}</button>
                {editing && <button type="button" className="btn btn-outline" onClick={()=>{setEditing(null);setForm(blank);}}>Cancel</button>}
              </div>
            </form>
          </div>
        </div>

        {/* Assignment list or submissions */}
        {viewSubs ? (
          <div className="card">
            <div className="card-header">
              <h5>📋 Submissions — {viewSubs.assignment?.title}</h5>
              <button className="btn btn-outline btn-sm" onClick={()=>setViewSubs(null)}>← Back</button>
            </div>
            <div className="table-responsive">
              <table>
                <thead><tr><th>Student</th><th>Submitted</th><th>File</th><th>Grade /{viewSubs.assignment?.max_marks}</th><th>Feedback</th><th>Action</th></tr></thead>
                <tbody>
                  {viewSubs.submissions?.length===0 && <tr><td colSpan={6}><div className="empty-state"><div className="icon">📭</div><p>No submissions yet</p></div></td></tr>}
                  {viewSubs.submissions?.map(s=>(
                    <tr key={s.id}>
                      <td style={{fontWeight:600}}>{s.student_name}</td>
                      <td style={{fontSize:'.8rem',color:'var(--text-muted)'}}>{new Date(s.submitted_at).toLocaleString()}</td>
                      <td>{s.file_url ? <a href={`http://localhost:5000${s.file_url}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline">📎 View</a> : <span style={{color:'var(--text-muted)'}}>No file</span>}</td>
                      <td>
                        {s.grade != null ? <span className="badge badge-success">{s.grade}</span> :
                          <input type="number" className="form-control" style={{width:80}} placeholder="0" value={gradeData[s.id]?.grade||''} onChange={e=>setGradeData(g=>({...g,[s.id]:{...g[s.id],grade:e.target.value}}))}/>}
                      </td>
                      <td>
                        {s.grade != null ? <span style={{fontSize:'.8rem',color:'var(--text-muted)'}}>{s.feedback||'—'}</span> :
                          <input className="form-control" style={{width:160}} placeholder="Feedback..." value={gradeData[s.id]?.feedback||''} onChange={e=>setGradeData(g=>({...g,[s.id]:{...g[s.id],feedback:e.target.value}}))}/>}
                      </td>
                      <td>{s.grade==null && <button className="btn btn-sm btn-success" onClick={()=>submitGrade(s.id)}>✅ Grade</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header"><h5>All Assignments ({assignments.length})</h5></div>
            <div className="table-responsive">
              {loading ? <div className="spinner"><div className="spin"/></div> : (
                <table>
                  <thead><tr><th>Title</th><th>Course</th><th>Due Date</th><th>Max Marks</th><th>Submissions</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {assignments.map(a=>(
                      <tr key={a.id}>
                        <td style={{fontWeight:600}}>{a.title}</td>
                        <td><span className="badge badge-info">{a.course_name}</span></td>
                        <td style={{fontSize:'.85rem'}}>{new Date(a.due_date).toLocaleDateString()}</td>
                        <td>{a.max_marks}</td>
                        <td><span className="badge badge-primary">{a.submission_count||0}</span></td>
                        <td><span className={`badge ${isActive(a.due_date)?'badge-success':'badge-danger'}`}>{isActive(a.due_date)?'Active':'Expired'}</span></td>
                        <td style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          <button className="btn btn-sm btn-outline" onClick={()=>loadSubs(a.id)}>👁️ Subs</button>
                          <button className="btn btn-sm btn-outline" onClick={()=>edit(a)}>✏️</button>
                          <button className="btn btn-sm btn-danger" onClick={()=>del(a.id)}>🗑️</button>
                        </td>
                      </tr>
                    ))}
                    {assignments.length===0&&<tr><td colSpan={7}><div className="empty-state"><div className="icon">📝</div><p>No assignments yet</p></div></td></tr>}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default ManageAssignments;
