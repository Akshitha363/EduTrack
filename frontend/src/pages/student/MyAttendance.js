// src/pages/student/MyAttendance.js
import React, { useEffect, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { attendanceAPI } from '../../utils/api';

ChartJS.register(ArcElement, Tooltip, Legend);

const MyAttendance = () => {
  const [data, setData]       = useState({ records:[], summary:[] });
  const [loading, setLoading] = useState(true);
  const [selCourse, setSelCourse] = useState('');

  useEffect(() => {
    attendanceAPI.getMy().then(r => { setData(r.data); setLoading(false); }).catch(()=>setLoading(false));
  }, []);

  if (loading) return <div className="spinner"><div className="spin"/></div>;

  const overall = data.summary.length
    ? Math.round(data.summary.reduce((s,a)=>s+a.percentage,0)/data.summary.length) : 0;

  const donutData = {
    labels:['Present','Absent'],
    datasets:[{
      data:[
        data.records.filter(r=>r.status==='present').length,
        data.records.filter(r=>r.status==='absent').length,
      ],
      backgroundColor:['#10b981','#ef4444'], borderWidth:0
    }]
  };

  const filtered = selCourse
    ? data.records.filter(r=>r.course_id==selCourse)
    : data.records;

  const courses = [...new Map(data.records.map(r=>[r.course_id,{id:r.course_id,name:r.course_name}])).values()];

  return (
    <div>
      <div className="page-header"><h2>📅 My Attendance</h2><p>Track your class attendance percentage</p></div>

      {data.summary.some(s=>s.warning) && (
        <div className="alert alert-warning">
          ⚠️ <strong>Warning!</strong> Your attendance in some subjects is below 75%. You may be debarred from exams.
        </div>
      )}

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:16,marginBottom:24}}>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'#ede9fe',color:'#4f46e5'}}>📅</div>
          <div className="stat-info"><h3 style={{color:overall>=75?'#10b981':'#ef4444'}}>{overall}%</h3><p>Overall Attendance</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'#d1fae5',color:'#10b981'}}>✅</div>
          <div className="stat-info"><h3 style={{color:'#10b981'}}>{data.records.filter(r=>r.status==='present').length}</h3><p>Total Present</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'#fee2e2',color:'#ef4444'}}>❌</div>
          <div className="stat-info"><h3 style={{color:'#ef4444'}}>{data.records.filter(r=>r.status==='absent').length}</h3><p>Total Absent</p></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background:'#fef3c7',color:'#f59e0b'}}>⚠️</div>
          <div className="stat-info"><h3 style={{color:'#f59e0b'}}>{data.summary.filter(s=>s.warning).length}</h3><p>Low Attendance Subjects</p></div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Donut chart */}
        <div className="card">
          <div className="card-header"><h5>📊 Present vs Absent</h5></div>
          <div className="card-body" style={{height:260,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Doughnut data={donutData} options={{responsive:true,plugins:{legend:{position:'bottom'}}}}/>
          </div>
        </div>

        {/* Per course summary */}
        <div className="card">
          <div className="card-header"><h5>📚 Course-wise Attendance</h5></div>
          <div className="card-body" style={{padding:0}}>
            {data.summary.map((s,i)=>(
              <div key={i} style={{padding:'14px 16px',borderBottom:'1px solid var(--border)'}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                  <span style={{fontWeight:600,fontSize:'.9rem'}}>{s.course_name}</span>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    {s.warning && <span className="badge badge-danger">⚠️ Low</span>}
                    <span className={`badge ${s.percentage>=75?'badge-success':s.percentage>=60?'badge-warning':'badge-danger'}`}>{s.percentage}%</span>
                  </div>
                </div>
                <div className="progress">
                  <div className="progress-bar" style={{width:`${s.percentage}%`,background:s.percentage>=75?'#10b981':s.percentage>=60?'#f59e0b':'#ef4444'}}/>
                </div>
                <div style={{fontSize:'.73rem',color:'var(--text-muted)',marginTop:4}}>
                  {s.present}/{s.total_classes} classes attended
                  {s.warning && ' · Minimum 75% required'}
                </div>
              </div>
            ))}
            {data.summary.length===0 && <div className="empty-state" style={{padding:40}}><div className="icon">📅</div><p>No attendance records yet</p></div>}
          </div>
        </div>
      </div>

      {/* Detailed records */}
      <div className="card">
        <div className="card-header">
          <h5>Attendance Records ({filtered.length})</h5>
          <select className="form-control" style={{width:200}} value={selCourse} onChange={e=>setSelCourse(e.target.value)}>
            <option value="">All Courses</option>
            {courses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="table-responsive">
          <table>
            <thead><tr><th>Date</th><th>Course</th><th>Status</th></tr></thead>
            <tbody>
              {filtered.map((r,i)=>(
                <tr key={i}>
                  <td>{new Date(r.date).toLocaleDateString('en-IN',{weekday:'short',year:'numeric',month:'short',day:'numeric'})}</td>
                  <td><span className="badge badge-info">{r.course_name}</span></td>
                  <td>
                    <span className={`badge ${r.status==='present'?'badge-success':r.status==='late'?'badge-warning':'badge-danger'}`}>
                      {r.status==='present'?'✅ Present':r.status==='late'?'⏰ Late':'❌ Absent'}
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan={3}><div className="empty-state" style={{padding:30}}><p>No records found</p></div></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default MyAttendance;
