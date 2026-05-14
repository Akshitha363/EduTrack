// src/pages/student/StudentDashboard.js
import React, { useEffect, useState } from 'react';
import { Radar, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, RadialLinearScale, PointElement, LineElement, Filler, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { marksAPI, attendanceAPI, assignmentsAPI, notificationsAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const StudentDashboard = () => {
  const { user }  = useAuth();
  const [marks, setMarks]       = useState({ marks:[], avgPercentage:0, suggestions:[] });
  const [attendance, setAtt]    = useState({ summary:[] });
  const [assignments, setAssign]= useState([]);
  const [notifications, setNotif] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [m, a, asgn, n] = await Promise.all([
          marksAPI.getMy(), attendanceAPI.getMy(),
          assignmentsAPI.getAll(), notificationsAPI.getAll()
        ]);
        setMarks(m.data);
        setAtt(a.data);
        setAssign(asgn.data.assignments || []);
        setNotif(n.data.notifications || []);
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="spinner"><div className="spin"/></div>;

  const upcoming = assignments.filter(a => new Date(a.due_date) >= new Date()).slice(0,3);
  const lowAtt   = attendance.summary?.filter(s => s.warning) || [];
  const unread   = notifications.filter(n => !n.is_read).length;
  const avgAtt   = attendance.summary?.length ? Math.round(attendance.summary.reduce((s,a)=>s+a.percentage,0)/attendance.summary.length) : 0;

  const statCards = [
    { icon:'🎯', label:'Avg Score',         value:`${marks.avgPercentage||0}%`, color:'#4f46e5', bg:'#ede9fe' },
    { icon:'📅', label:'Avg Attendance',    value:`${avgAtt}%`,                 color:avgAtt>=75?'#10b981':'#ef4444', bg:avgAtt>=75?'#d1fae5':'#fee2e2' },
    { icon:'📝', label:'Pending Tasks',     value:upcoming.length,              color:'#f59e0b', bg:'#fef3c7' },
    { icon:'🔔', label:'New Notifications', value:unread,                       color:'#ef4444', bg:'#fee2e2' },
  ];

  const radarData = {
    labels: marks.marks.map(m => m.course_name?.split(' ')[0] || '').slice(0,6),
    datasets:[{ label:'Score %', data: marks.marks.map(m => Math.round((m.marks_obtained/m.max_marks)*100)).slice(0,6),
      backgroundColor:'rgba(79,70,229,.2)', borderColor:'#4f46e5', pointBackgroundColor:'#4f46e5', fill:true }]
  };

  const barData = {
    labels: attendance.summary?.map(s=>s.course_name?.split(' ')[0])||[],
    datasets:[{ label:'Attendance %', data: attendance.summary?.map(s=>s.percentage)||[],
      backgroundColor: attendance.summary?.map(s=>s.percentage>=75?'#10b981':'#ef4444'), borderRadius:6 }]
  };

  const getGrade = (p) => p>=90?'A':p>=75?'B':p>=60?'C':p>=40?'D':'F';

  return (
    <div>
      <div className="page-header">
        <h2>👋 Welcome, {user?.name?.split(' ')[0]}!</h2>
        <p>Here's your academic snapshot for today</p>
      </div>

      <div className="stats-grid">
        {statCards.map(c=>(
          <div key={c.label} className="stat-card">
            <div className="stat-icon" style={{background:c.bg,color:c.color}}>{c.icon}</div>
            <div className="stat-info"><h3 style={{color:c.color}}>{c.value}</h3><p>{c.label}</p></div>
          </div>
        ))}
      </div>

      {/* Warnings */}
      {lowAtt.length > 0 && (
        <div className="alert alert-warning" style={{marginBottom:20}}>
          ⚠️ <strong>Low Attendance Warning!</strong> Your attendance in {lowAtt.map(a=>a.course_name).join(', ')} is below 75%. Please attend classes regularly.
        </div>
      )}

      <div className="charts-grid">
        <div className="card">
          <div className="card-header"><h5>📊 Subject Performance</h5></div>
          <div className="card-body" style={{height:260,display:'flex',alignItems:'center',justifyContent:'center'}}>
            {marks.marks.length > 0 ? <Radar data={radarData} options={{responsive:true,scales:{r:{min:0,max:100}},plugins:{legend:{display:false}}}}/> : <div className="empty-state"><div className="icon">📊</div><p>No marks data available</p></div>}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h5>📅 Attendance by Course</h5></div>
          <div className="card-body">
            {attendance.summary?.length > 0 ? <Bar data={barData} options={{responsive:true,plugins:{legend:{display:false}},scales:{y:{min:0,max:100}}}}/> : <div className="empty-state"><div className="icon">📅</div><p>No attendance data</p></div>}
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Marks breakdown */}
        <div className="card">
          <div className="card-header"><h5>🎯 My Marks</h5></div>
          <div className="card-body" style={{padding:0}}>
            {marks.marks.length===0 ? <div className="empty-state" style={{padding:40}}><div className="icon">🎯</div><p>No marks recorded yet</p></div>
              : marks.marks.map((m,i)=>(
                <div key={i} style={{padding:'12px 16px',borderBottom:'1px solid var(--border)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <div>
                      <div style={{fontWeight:600,fontSize:'.88rem'}}>{m.course_name}</div>
                      <div style={{fontSize:'.75rem',color:'var(--text-muted)',textTransform:'capitalize'}}>{m.exam_type}</div>
                    </div>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontSize:'.85rem'}}>{m.marks_obtained}/{m.max_marks}</span>
                      <span className={`badge ${Math.round((m.marks_obtained/m.max_marks)*100)>=40?'badge-success':'badge-danger'}`}>
                        {getGrade(Math.round((m.marks_obtained/m.max_marks)*100))}
                      </span>
                    </div>
                  </div>
                  <div className="progress">
                    <div className="progress-bar" style={{width:`${(m.marks_obtained/m.max_marks)*100}%`,background:Math.round((m.marks_obtained/m.max_marks)*100)>=40?'#10b981':'#ef4444'}}/>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Smart suggestions */}
        <div className="card">
          <div className="card-header"><h5>🧠 Smart Suggestions</h5></div>
          <div className="card-body">
            {(marks.suggestions||[]).map((s,i)=>(
              <div key={i} style={{padding:'10px 14px',background:'var(--bg)',borderRadius:8,marginBottom:10,fontSize:'.88rem',lineHeight:1.5}}>{s}</div>
            ))}
            {upcoming.length > 0 && (
              <div style={{marginTop:16}}>
                <div style={{fontWeight:700,marginBottom:10,fontSize:'.9rem'}}>📝 Upcoming Deadlines</div>
                {upcoming.map(a=>(
                  <div key={a.id} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--border)'}}>
                    <span style={{fontSize:'.85rem'}}>{a.title}</span>
                    <span className="badge badge-warning">{new Date(a.due_date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default StudentDashboard;
