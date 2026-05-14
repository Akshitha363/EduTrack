// src/pages/faculty/ManageCourses.js
import React, { useEffect, useState } from 'react';
import { coursesAPI } from '../../utils/api';

const blank = { name:'', code:'', description:'', credits:3, semester:1, department:'Computer Science' };
const DEPTS = ['Computer Science','Electronics','Mathematics','Physics','Civil','Mechanical','MBA'];

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [form, setForm]       = useState(blank);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState({ text:'', type:'' });
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try { const { data } = await coursesAPI.getAll(); setCourses(data.courses||[]); } catch(_){}
    setLoading(false);
  };
  useEffect(()=>{ load(); },[]);

  const save = async (e) => {
    e.preventDefault();
    if (!form.name || !form.code) { setMsg({text:'Name and code required',type:'danger'}); return; }
    setSaving(true);
    try {
      if (editing) { await coursesAPI.update(editing, form); setMsg({text:'Course updated!',type:'success'}); }
      else         { await coursesAPI.create(form);          setMsg({text:'Course created!',type:'success'}); }
      setForm(blank); setEditing(null); load();
    } catch(err){ setMsg({text: err.response?.data?.message||'Error saving',type:'danger'}); }
    setSaving(false);
  };

  const del = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    try { await coursesAPI.remove(id); setMsg({text:'Deleted',type:'success'}); load(); } catch(_){}
  };

  const edit = (c) => { setForm({name:c.name,code:c.code,description:c.description||'',credits:c.credits,semester:c.semester,department:c.department||'Computer Science'}); setEditing(c.id); window.scrollTo(0,0); };

  return (
    <div>
      <div className="page-header"><h2>📚 Manage Courses</h2><p>Create and manage academic courses</p></div>
      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text} <button onClick={()=>setMsg({text:'',type:''})} style={{float:'right',background:'none',border:'none',cursor:'pointer'}}>✕</button></div>}

      <div style={{display:'grid',gridTemplateColumns:'380px 1fr',gap:24}}>
        <div className="card" style={{alignSelf:'start'}}>
          <div className="card-header"><h5>{editing?'✏️ Edit':'➕ New'} Course</h5></div>
          <div className="card-body">
            <form onSubmit={save}>
              {[['name','Course Name','Introduction to Programming'],['code','Course Code','CS601'],['description','Description (optional)','']].map(([k,l,p])=>(
                <div key={k} className="form-group">
                  <label className="form-label">{l}</label>
                  {k==='description'
                    ? <textarea className="form-control" rows={2} placeholder={p} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/>
                    : <input className="form-control" placeholder={p} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))}/>
                  }
                </div>
              ))}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                <div className="form-group">
                  <label className="form-label">Credits</label>
                  <select className="form-control" value={form.credits} onChange={e=>setForm(f=>({...f,credits:+e.target.value}))}>
                    {[1,2,3,4,5].map(n=><option key={n}>{n}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Semester</label>
                  <select className="form-control" value={form.semester} onChange={e=>setForm(f=>({...f,semester:+e.target.value}))}>
                    {[1,2,3,4,5,6,7,8].map(n=><option key={n}>{n}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select className="form-control" value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))}>
                  {DEPTS.map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
              <div style={{display:'flex',gap:8}}>
                <button type="submit" className="btn btn-primary" style={{flex:1}} disabled={saving}>{saving?'Saving...':editing?'Update':'Create Course'}</button>
                {editing && <button type="button" className="btn btn-outline" onClick={()=>{setEditing(null);setForm(blank);}}>Cancel</button>}
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h5>All Courses ({courses.length})</h5></div>
          <div className="table-responsive">
            {loading ? <div className="spinner"><div className="spin"/></div> : (
              <table>
                <thead><tr><th>Course</th><th>Code</th><th>Faculty</th><th>Credits</th><th>Sem</th><th>Students</th><th>Actions</th></tr></thead>
                <tbody>
                  {courses.map(c=>(
                    <tr key={c.id}>
                      <td><div style={{fontWeight:600}}>{c.name}</div><small style={{color:'var(--text-muted)'}}>{c.department}</small></td>
                      <td><span className="badge badge-info">{c.code}</span></td>
                      <td>{c.faculty_name||'-'}</td>
                      <td>{c.credits}</td>
                      <td>{c.semester}</td>
                      <td><span className="badge badge-primary">{c.enrolled_students||0}</span></td>
                      <td style={{display:'flex',gap:6}}>
                        <button className="btn btn-sm btn-outline" onClick={()=>edit(c)}>✏️</button>
                        <button className="btn btn-sm btn-danger" onClick={()=>del(c.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                  {courses.length===0&&<tr><td colSpan={7}><div className="empty-state"><div className="icon">📚</div><p>No courses yet</p></div></td></tr>}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ManageCourses;
