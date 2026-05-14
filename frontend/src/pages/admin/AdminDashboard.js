// src/pages/admin/AdminDashboard.js - Admin Analytics Dashboard with Chart.js
import React, { useEffect, useState } from 'react';
import { Bar, Pie, Doughnut, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { usersAPI, marksAPI } from '../../utils/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend);

const AdminDashboard = () => {
  const [stats, setStats]     = useState(null);
  const [analytics, setAna]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [s, a] = await Promise.all([usersAPI.getStats(), marksAPI.getAnalytics()]);
        setStats(s.data.stats);
        setAna(a.data);
      } catch (_) {}
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return <div className="spinner"><div className="spin"/></div>;

  const statCards = [
    { icon:'👨‍🎓', label:'Total Students', value: stats?.totalStudents ?? 0,  color:'#4f46e5', bg:'#ede9fe' },
    { icon:'👨‍🏫', label:'Faculty Members', value: stats?.totalFaculty ?? 0,   color:'#10b981', bg:'#d1fae5' },
    { icon:'📚', label:'Courses',          value: stats?.totalCourses ?? 0,   color:'#f59e0b', bg:'#fef3c7' },
    { icon:'📝', label:'Assignments',      value: stats?.totalAssignments??0, color:'#06b6d4', bg:'#cffafe' },
    { icon:'⏳', label:'Pending Grades',   value: stats?.pendingSubmissions??0,color:'#ef4444',bg:'#fee2e2' },
    { icon:'📅', label:'Avg Attendance',   value:`${stats?.avgAttendance??0}%`,color:'#8b5cf6', bg:'#ede9fe' },
  ];

  const passFail = {
    labels: ['Passed', 'Failed'],
    datasets: [{ data: [analytics?.passFailData?.passed||0, analytics?.passFailData?.failed||0],
      backgroundColor: ['#10b981','#ef4444'], borderWidth: 0 }]
  };

  const gradeDistData = {
    labels: ['A (90+)', 'B (75-89)', 'C (60-74)', 'D (40-59)', 'F (<40)'],
    datasets: [{ data: Object.values(analytics?.distribution||{A:0,B:0,C:0,D:0,F:0}),
      backgroundColor: ['#10b981','#4f46e5','#f59e0b','#06b6d4','#ef4444'], borderWidth:0 }]
  };

  const courseData = {
    labels: analytics?.courseMarks?.map(c => c.course_name.split(' ').slice(0,3).join(' '))||[],
    datasets: [{ label:'Average %', data: analytics?.courseMarks?.map(c => Math.round(c.avg_percentage))||[],
      backgroundColor:'#4f46e5', borderRadius:8 }]
  };

  const topStudentsData = {
    labels: analytics?.topStudents?.map(s => s.name.split(' ')[0])||[],
    datasets: [{ label:'Score %', data: analytics?.topStudents?.map(s => Math.round(s.avg_percentage))||[],
      borderColor:'#4f46e5', backgroundColor:'rgba(79,70,229,.15)', tension:.4, fill:true,
      pointBackgroundColor:'#4f46e5', pointRadius:5 }]
  };

  const chartOpts = { responsive:true, plugins:{ legend:{ position:'bottom' } } };

  return (
    <div>
      <div className="page-header">
        <h2>Admin Dashboard</h2>
        <p>System overview and analytics</p>
      </div>

      {/* Stat cards */}
      <div className="stats-grid">
        {statCards.map(c => (
          <div key={c.label} className="stat-card">
            <div className="stat-icon" style={{ background:c.bg, color:c.color }}>{c.icon}</div>
            <div className="stat-info">
              <h3 style={{ color:c.color }}>{c.value}</h3>
              <p>{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header"><h5>📊 Pass / Fail Ratio</h5></div>
          <div className="card-body" style={{ height:260, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Pie data={passFail} options={chartOpts}/>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h5>🏅 Grade Distribution</h5></div>
          <div className="card-body" style={{ height:260, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Doughnut data={gradeDistData} options={chartOpts}/>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header"><h5>📚 Course Performance</h5></div>
          <div className="card-body"><Bar data={courseData} options={{ ...chartOpts, plugins:{ legend:{ display:false } } }}/></div>
        </div>
        <div className="card">
          <div className="card-header"><h5>🏆 Top 5 Students</h5></div>
          <div className="card-body"><Line data={topStudentsData} options={chartOpts}/></div>
        </div>
      </div>

      {/* Top & Weak students */}
      <div className="charts-grid">
        <div className="card">
          <div className="card-header"><h5>🌟 Top Performers</h5></div>
          <div className="card-body">
            {(analytics?.topStudents||[]).map((s,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:i===0?'#fbbf24':i===1?'#9ca3af':'#b45309', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:'.8rem' }}>{i+1}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:600, fontSize:'.88rem' }}>{s.name}</div>
                  <div className="progress" style={{ marginTop:4 }}>
                    <div className="progress-bar" style={{ width:`${s.avg_percentage}%`, background:'#10b981' }}/>
                  </div>
                </div>
                <span className="badge badge-success">{Math.round(s.avg_percentage)}%</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><h5>⚠️ Students Needing Help</h5></div>
          <div className="card-body">
            {(analytics?.topStudents||[]).filter(s=>s.avg_percentage<60).length === 0
              ? <div className="empty-state"><div className="icon">✅</div><p>All students performing well!</p></div>
              : (analytics?.topStudents||[]).filter(s=>s.avg_percentage<60).map((s,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontWeight:600 }}>{s.name}</span>
                  <span className="badge badge-danger">{Math.round(s.avg_percentage)}%</span>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
