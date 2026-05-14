// src/pages/faculty/FacultyDashboard.js
import React, { useEffect, useState } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { marksAPI, attendanceAPI, assignmentsAPI, coursesAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const FacultyDashboard = () => {
  const { user }    = useAuth();
  const [data, setData] = useState({ analytics:null, courses:[], assignments:[], loading:true });

  useEffect(() => {
    const load = async () => {
      try {
        const [a, c, asgn] = await Promise.all([marksAPI.getAnalytics(), coursesAPI.getAll(), assignmentsAPI.getAll()]);
        setData({ analytics:a.data, courses:c.data.courses||[], assignments:asgn.data.assignments||[], loading:false });
      } catch(_){ setData(d=>({...d,loading:false})); }
    };
    load();
  }, []);

  const { analytics, courses, assignments, loading } = data;
  if (loading) return <div className="spinner"><div className="spin"/></div>;

  const myCourses    = courses.filter(c => c.faculty_name === user?.name);
  const myAssign     = assignments.filter(a => a.faculty_name === user?.name);
  const pendingGrade = myAssign.reduce((s,a) => s + (a.submission_count - (a.graded_count||0)), 0);

  const statCards = [
    { icon:'📚', label:'My Courses',      value:myCourses.length,   color:'#4f46e5', bg:'#ede9fe' },
    { icon:'📝', label:'Active Assignments', value:myAssign.filter(a=>new Date(a.due_date)>=new Date()).length, color:'#f59e0b', bg:'#fef3c7' },
    { icon:'⏳', label:'Pending Grading',  value:pendingGrade,       color:'#ef4444', bg:'#fee2e2' },
    { icon:'👥', label:'Total Students',   value:myCourses.reduce((s,c)=>s+(c.enrolled_students||0),0), color:'#10b981', bg:'#d1fae5' },
  ];

  const courseBarData = {
    labels: (analytics?.courseMarks||[]).map(c=>c.course_name.split(' ').slice(0,2).join(' ')),
    datasets:[{ label:'Avg Score %', data:(analytics?.courseMarks||[]).map(c=>Math.round(c.avg_percentage)), backgroundColor:'#4f46e5', borderRadius:6 }]
  };

  const gradeData = {
    labels:['A','B','C','D','F'],
    datasets:[{ data: Object.values(analytics?.distribution||{A:0,B:0,C:0,D:0,F:0}),
      backgroundColor:['#10b981','#4f46e5','#f59e0b','#06b6d4','#ef4444'], borderWidth:0 }]
  };

  return (
    <div>
      <div className="page-header">
        <h2>👨‍🏫 Faculty Dashboard</h2>
        <p>Welcome back, {user?.name}! Here's your class overview.</p>
      </div>
      <div className="stats-grid">
        {statCards.map(c=>(
          <div key={c.label} className="stat-card">
            <div className="stat-icon" style={{background:c.bg,color:c.color}}>{c.icon}</div>
            <div className="stat-info"><h3 style={{color:c.color}}>{c.value}</h3><p>{c.label}</p></div>
          </div>
        ))}
      </div>
      <div className="charts-grid">
        <div className="card">
          <div className="card-header"><h5>📊 Course Avg Scores</h5></div>
          <div className="card-body"><Bar data={courseBarData} options={{responsive:true,plugins:{legend:{display:false}}}}/></div>
        </div>
        <div className="card">
          <div className="card-header"><h5>🏅 Grade Distribution</h5></div>
          <div className="card-body" style={{height:240,display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Doughnut data={gradeData} options={{responsive:true,plugins:{legend:{position:'bottom'}}}}/>
          </div>
        </div>
      </div>
      <div className="charts-grid">
        <div className="card">
          <div className="card-header"><h5>📚 My Courses</h5></div>
          <div className="card-body">
            {myCourses.length===0 ? <div className="empty-state"><div className="icon">📚</div><p>No courses assigned yet</p></div> :
              myCourses.map(c=>(
                <div key={c.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
                  <div>
                    <div style={{fontWeight:600}}>{c.name}</div>
                    <small style={{color:'var(--text-muted)'}}>{c.code} · {c.department}</small>
                  </div>
                  <span className="badge badge-primary">{c.enrolled_students||0} students</span>
                </div>
              ))
            }
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h5>📝 Recent Assignments</h5></div>
          <div className="card-body">
            {myAssign.slice(0,5).map(a=>(
              <div key={a.id} style={{padding:'10px 0',borderBottom:'1px solid var(--border)'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                  <span style={{fontWeight:600,fontSize:'.9rem'}}>{a.title}</span>
                  <span className={`badge ${new Date(a.due_date)>=new Date()?'badge-warning':'badge-danger'}`}>
                    {new Date(a.due_date)>=new Date()?'Active':'Expired'}
                  </span>
                </div>
                <small style={{color:'var(--text-muted)'}}>Due: {new Date(a.due_date).toLocaleDateString()} · {a.submission_count||0} submissions</small>
              </div>
            ))}
            {myAssign.length===0 && <div className="empty-state"><div className="icon">📝</div><p>No assignments created yet</p></div>}
          </div>
        </div>
      </div>
    </div>
  );
};
export default FacultyDashboard;
