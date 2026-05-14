// src/pages/faculty/ManageAttendance.js
import React, { useEffect, useState } from 'react';
import { attendanceAPI, coursesAPI } from '../../utils/api';

const ManageAttendance = () => {
  const [courses, setCourses]     = useState([]);
  const [selCourse, setSelCourse] = useState('');
  const [courseData, setCourseData] = useState(null);
  const [date, setDate]           = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState({});
  const [stats, setStats]         = useState([]);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState({ text:'', type:'' });

  useEffect(() => {
    coursesAPI.getAll().then(r => setCourses(r.data.courses || []));
  }, []);

  useEffect(() => {
    if (!selCourse) return;
    const load = async () => {
      const [cd, st] = await Promise.all([coursesAPI.getOne(selCourse), attendanceAPI.getStats(selCourse)]);
      setCourseData(cd.data);
      setStats(st.data.stats || []);
      const init = {};
      cd.data.students?.forEach(s => { init[s.user_id] = 'present'; });
      setAttendance(init);
    };
    load();
  }, [selCourse]);

  const toggle = (uid, val) => setAttendance(a => ({ ...a, [uid]: val }));

  const markAll = (status) => {
    const all = {};
    courseData?.students?.forEach(s => { all[s.user_id] = status; });
    setAttendance(all);
  };

  const submit = async () => {
    if (!selCourse || !date) { setMsg({ text:'Select course and date', type:'danger' }); return; }
    setSaving(true);
    try {
      const list = Object.entries(attendance).map(([user_id, status]) => ({ user_id: +user_id, status }));
      await attendanceAPI.mark({ course_id: selCourse, date, attendance_list: list });
      setMsg({ text:`Attendance marked for ${list.length} students!`, type:'success' });
      const st = await attendanceAPI.getStats(selCourse);
      setStats(st.data.stats || []);
    } catch (_) { setMsg({ text:'Failed to save attendance', type:'danger' }); }
    setSaving(false);
  };

  const presentCount = Object.values(attendance).filter(s=>s==='present').length;
  const totalCount   = courseData?.students?.length || 0;

  return (
    <div>
      <div className="page-header"><h2>📅 Attendance Management</h2><p>Mark and track student attendance</p></div>
      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}<button onClick={()=>setMsg({text:'',type:''})} style={{float:'right',background:'none',border:'none',cursor:'pointer'}}>✕</button></div>}

      {/* Controls */}
      <div className="card" style={{marginBottom:20}}>
        <div className="card-body" style={{display:'flex',gap:16,flexWrap:'wrap',alignItems:'flex-end'}}>
          <div className="form-group" style={{margin:0,flex:1,minWidth:200}}>
            <label className="form-label">Select Course</label>
            <select className="form-control" value={selCourse} onChange={e=>setSelCourse(e.target.value)}>
              <option value="">— Choose a course —</option>
              {courses.map(c=><option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </select>
          </div>
          <div className="form-group" style={{margin:0}}>
            <label className="form-label">Date</label>
            <input type="date" className="form-control" value={date} onChange={e=>setDate(e.target.value)}/>
          </div>
          {selCourse && (
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-success btn-sm" onClick={()=>markAll('present')}>✅ All Present</button>
              <button className="btn btn-danger btn-sm" onClick={()=>markAll('absent')}>❌ All Absent</button>
            </div>
          )}
        </div>
      </div>

      {selCourse && courseData && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:24}}>
          {/* Mark attendance */}
          <div className="card">
            <div className="card-header">
              <h5>👥 {courseData.course?.name} — Mark Attendance</h5>
              <span style={{color:'var(--text-muted)',fontSize:'.85rem'}}>{presentCount}/{totalCount} present</span>
            </div>
            <div className="card-body" style={{padding:0}}>
              {courseData.students?.length===0
                ? <div className="empty-state"><div className="icon">👥</div><p>No students enrolled in this course</p></div>
                : courseData.students?.map(s=>(
                  <div key={s.user_id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',borderBottom:'1px solid var(--border)'}}>
                    <div style={{display:'flex',alignItems:'center',gap:12}}>
                      <div className="avatar" style={{background:'var(--primary)',color:'#fff',width:36,height:36}}>{s.name?.charAt(0)}</div>
                      <div>
                        <div style={{fontWeight:600,fontSize:'.9rem'}}>{s.name}</div>
                        <div style={{fontSize:'.75rem',color:'var(--text-muted)'}}>{s.roll_number||s.email}</div>
                      </div>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      {['present','absent','late'].map(st=>(
                        <button key={st} className={`btn btn-sm ${attendance[s.user_id]===st?(st==='present'?'btn-success':st==='absent'?'btn-danger':'btn-primary'):'btn-outline'}`}
                          onClick={()=>toggle(s.user_id,st)}>
                          {st==='present'?'✅':st==='absent'?'❌':'⏰'} {st.charAt(0).toUpperCase()+st.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              }
            </div>
            {totalCount > 0 && (
              <div style={{padding:16,borderTop:'1px solid var(--border)',display:'flex',justifyContent:'flex-end'}}>
                <button className="btn btn-primary" onClick={submit} disabled={saving} style={{minWidth:160}}>
                  {saving ? '⏳ Saving...' : '💾 Save Attendance'}
                </button>
              </div>
            )}
          </div>

          {/* Attendance stats */}
          <div className="card" style={{alignSelf:'start'}}>
            <div className="card-header"><h5>📊 Attendance Summary</h5></div>
            <div className="card-body" style={{padding:0}}>
              {stats.map(s=>(
                <div key={s.id} style={{padding:'12px 16px',borderBottom:'1px solid var(--border)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <span style={{fontWeight:600,fontSize:'.88rem'}}>{s.name}</span>
                    <span className={`badge ${(s.percentage||0)>=75?'badge-success':(s.percentage||0)>=60?'badge-warning':'badge-danger'}`}>
                      {s.percentage||0}%
                    </span>
                  </div>
                  <div className="progress">
                    <div className="progress-bar" style={{width:`${s.percentage||0}%`,background:(s.percentage||0)>=75?'#10b981':(s.percentage||0)>=60?'#f59e0b':'#ef4444'}}/>
                  </div>
                  <div style={{fontSize:'.72rem',color:'var(--text-muted)',marginTop:4}}>{s.present_count||0}/{s.total_classes||0} classes</div>
                  {(s.percentage||0)<75 && <div style={{fontSize:'.72rem',color:'#ef4444',marginTop:2}}>⚠️ Below 75% threshold</div>}
                </div>
              ))}
              {stats.length===0 && <div className="empty-state"><div className="icon">📅</div><p>No attendance data yet</p></div>}
            </div>
          </div>
        </div>
      )}

      {!selCourse && (
        <div className="empty-state card" style={{padding:60}}>
          <div className="icon">📅</div>
          <p>Select a course above to start marking attendance</p>
        </div>
      )}
    </div>
  );
};
export default ManageAttendance;
