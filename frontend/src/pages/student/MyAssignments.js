// src/pages/student/MyAssignments.js
import React, { useEffect, useState, useRef } from 'react';
import { assignmentsAPI } from '../../utils/api';

const MyAssignments = () => {
  const [assignments, setAssign] = useState([]);
  const [loading, setLoading]    = useState(true);
  const [filter, setFilter]      = useState('all');
  const [submitting, setSubm]    = useState(null);
  const [subForm, setSubForm]    = useState({ notes:'' });
  const [file, setFile]          = useState(null);
  const [msg, setMsg]            = useState({ text:'', type:'' });
  const fileRef                  = useRef();

  const load = async () => {
    setLoading(true);
    try { const { data } = await assignmentsAPI.getAll(); setAssign(data.assignments || []); } catch (_) {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const submit = async (assignId) => {
    const fd = new FormData();
    fd.append('notes', subForm.notes);
    if (file) fd.append('file', file);
    try {
      await assignmentsAPI.submit(assignId, fd);
      setMsg({ text:'Assignment submitted successfully! 🎉', type:'success' });
      setSubm(null); setSubForm({ notes:'' }); setFile(null);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) { setMsg({ text: err.response?.data?.message || 'Submission failed', type:'danger' }); }
  };

  const isActive   = (d) => new Date(d) >= new Date();
  const daysLeft   = (d) => Math.ceil((new Date(d)-new Date())/86400000);

  const filtered = filter === 'active'
    ? assignments.filter(a => isActive(a.due_date))
    : filter === 'expired'
    ? assignments.filter(a => !isActive(a.due_date))
    : assignments;

  return (
    <div>
      <div className="page-header"><h2>📝 My Assignments</h2><p>View, track, and submit your assignments</p></div>
      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}<button onClick={()=>setMsg({text:'',type:''})} style={{float:'right',background:'none',border:'none',cursor:'pointer'}}>✕</button></div>}

      {/* Summary stats */}
      <div className="stats-grid" style={{gridTemplateColumns:'repeat(3,1fr)',marginBottom:20}}>
        {[
          { icon:'📝', label:'Total',   value:assignments.length,                         color:'#4f46e5', bg:'#ede9fe' },
          { icon:'⏳', label:'Active',  value:assignments.filter(a=>isActive(a.due_date)).length, color:'#f59e0b', bg:'#fef3c7' },
          { icon:'✅', label:'Expired', value:assignments.filter(a=>!isActive(a.due_date)).length,color:'#10b981',bg:'#d1fae5' },
        ].map(c=>(
          <div key={c.label} className="stat-card">
            <div className="stat-icon" style={{background:c.bg,color:c.color}}>{c.icon}</div>
            <div className="stat-info"><h3 style={{color:c.color}}>{c.value}</h3><p>{c.label} Assignments</p></div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        {['all','active','expired'].map(f=>(
          <button key={f} className={`btn ${filter===f?'btn-primary':'btn-outline'}`} style={{textTransform:'capitalize'}} onClick={()=>setFilter(f)}>
            {f==='all'?'📋 All':f==='active'?'⏳ Active':'✅ Expired'} ({f==='all'?assignments.length:f==='active'?assignments.filter(a=>isActive(a.due_date)).length:assignments.filter(a=>!isActive(a.due_date)).length})
          </button>
        ))}
      </div>

      {loading ? <div className="spinner"><div className="spin"/></div> : (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          {filtered.map(a=>(
            <div key={a.id} className="card">
              <div className="card-body">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6}}>
                      <h5 style={{margin:0}}>{a.title}</h5>
                      <span className={`badge ${isActive(a.due_date)?'badge-success':'badge-danger'}`}>{isActive(a.due_date)?'Active':'Expired'}</span>
                    </div>
                    <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:8}}>
                      <span className="badge badge-info">📚 {a.course_name}</span>
                      <span className="badge badge-primary">👨‍🏫 {a.faculty_name}</span>
                      <span className="badge badge-warning">🎯 {a.max_marks} marks</span>
                    </div>
                    {a.description && <p style={{color:'var(--text-muted)',fontSize:'.88rem',margin:'0 0 8px'}}>{a.description}</p>}
                    <div style={{fontSize:'.82rem',color:'var(--text-muted)'}}>
                      📅 Due: <strong>{new Date(a.due_date).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</strong>
                      {isActive(a.due_date) && <span style={{color:daysLeft(a.due_date)<=3?'#ef4444':'#10b981',fontWeight:600,marginLeft:8}}>({daysLeft(a.due_date)} days left)</span>}
                    </div>
                  </div>
                  <div style={{display:'flex',gap:8,alignItems:'flex-start'}}>
                    <span className="badge badge-info">👥 {a.submission_count||0} submitted</span>
                    {isActive(a.due_date) && (
                      <button className="btn btn-primary btn-sm" onClick={()=>setSubm(submitting===a.id?null:a.id)}>
                        {submitting===a.id?'✕ Cancel':'📤 Submit'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Submit form */}
                {submitting === a.id && (
                  <div style={{marginTop:16,padding:16,background:'var(--bg)',borderRadius:8,border:'1px solid var(--border)'}}>
                    <h6 style={{marginBottom:12}}>📤 Submit Assignment</h6>
                    <div className="form-group">
                      <label className="form-label">Notes / Comments</label>
                      <textarea className="form-control" rows={2} placeholder="Any notes about your submission..." value={subForm.notes} onChange={e=>setSubForm({notes:e.target.value})}/>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Upload File (PDF/DOC)</label>
                      <input type="file" ref={fileRef} className="form-control" accept=".pdf,.doc,.docx,.txt" onChange={e=>setFile(e.target.files[0])}/>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <button className="btn btn-success" onClick={()=>submit(a.id)}>✅ Submit Assignment</button>
                      <button className="btn btn-outline" onClick={()=>{setSubm(null);setFile(null);}}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filtered.length===0 && <div className="empty-state card" style={{padding:60}}><div className="icon">📝</div><p>No assignments found</p></div>}
        </div>
      )}
    </div>
  );
};
export default MyAssignments;
