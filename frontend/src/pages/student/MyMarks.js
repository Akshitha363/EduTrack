// src/pages/student/MyMarks.js
import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { marksAPI } from '../../utils/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const MyMarks = () => {
  const [data, setData]       = useState({ marks:[], avgPercentage:0, suggestions:[] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('');

  useEffect(() => {
    marksAPI.getMy().then(r => { setData(r.data); setLoading(false); }).catch(()=>setLoading(false));
  }, []);

  const pct = (m) => Math.round((m.marks_obtained / m.max_marks) * 100);
  const getGrade = (p) => p>=90?'A':p>=75?'B':p>=60?'C':p>=40?'D':'F';
  const gradeColor = (p) => p>=75?'badge-success':p>=40?'badge-warning':'badge-danger';

  const filtered = filter ? data.marks.filter(m => m.exam_type === filter) : data.marks;

  const lineData = {
    labels: data.marks.map(m => `${m.course_name?.split(' ')[0]} (${m.exam_type})`),
    datasets:[{
      label:'Score %', data: data.marks.map(pct),
      borderColor:'#4f46e5', backgroundColor:'rgba(79,70,229,.1)',
      tension:.4, fill:true, pointBackgroundColor:'#4f46e5', pointRadius:5,
    }]
  };

  const avg = data.avgPercentage || 0;

  if (loading) return <div className="spinner"><div className="spin"/></div>;

  return (
    <div>
      <div className="page-header"><h2>🎯 My Marks</h2><p>View your academic performance across all subjects</p></div>

      {/* Summary cards */}
      <div className="stats-grid" style={{gridTemplateColumns:'repeat(4,1fr)'}}>
        {[
          { icon:'📊', label:'Overall Average', value:`${avg}%`, color:'#4f46e5', bg:'#ede9fe' },
          { icon:'🏆', label:'Overall Grade',   value:getGrade(avg), color:'#10b981', bg:'#d1fae5' },
          { icon:'✅', label:'Subjects Passed', value:data.marks.filter(m=>pct(m)>=40).length, color:'#10b981', bg:'#d1fae5' },
          { icon:'❌', label:'Subjects Failed', value:data.marks.filter(m=>pct(m)<40).length,  color:'#ef4444', bg:'#fee2e2' },
        ].map(c=>(
          <div key={c.label} className="stat-card">
            <div className="stat-icon" style={{background:c.bg,color:c.color}}>{c.icon}</div>
            <div className="stat-info"><h3 style={{color:c.color}}>{c.value}</h3><p>{c.label}</p></div>
          </div>
        ))}
      </div>

      {/* Performance trend chart */}
      {data.marks.length > 0 && (
        <div className="card" style={{marginBottom:20}}>
          <div className="card-header"><h5>📈 Performance Trend</h5></div>
          <div className="card-body">
            <Line data={lineData} options={{responsive:true,plugins:{legend:{display:false}},scales:{y:{min:0,max:100}}}}/>
          </div>
        </div>
      )}

      {/* Smart suggestions */}
      {(data.suggestions||[]).length > 0 && (
        <div className="card" style={{marginBottom:20}}>
          <div className="card-header"><h5>🧠 Smart Suggestions</h5></div>
          <div className="card-body" style={{display:'flex',flexDirection:'column',gap:10}}>
            {data.suggestions.map((s,i)=>(
              <div key={i} style={{padding:'10px 14px',background:'var(--bg)',borderRadius:8,fontSize:'.88rem'}}>{s}</div>
            ))}
          </div>
        </div>
      )}

      {/* Marks table */}
      <div className="card">
        <div className="card-header">
          <h5>All Marks ({filtered.length})</h5>
          <select className="form-control" style={{width:160}} value={filter} onChange={e=>setFilter(e.target.value)}>
            <option value="">All Exams</option>
            {['midterm','final','quiz','internal','practical'].map(t=><option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
          </select>
        </div>
        <div className="table-responsive">
          <table>
            <thead><tr><th>Subject</th><th>Exam Type</th><th>Marks</th><th>Percentage</th><th>Grade</th><th>Date</th><th>Remarks</th></tr></thead>
            <tbody>
              {filtered.map((m,i)=>(
                <tr key={i}>
                  <td style={{fontWeight:600}}>{m.course_name}</td>
                  <td style={{textTransform:'capitalize'}}>{m.exam_type}</td>
                  <td>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{fontWeight:700}}>{m.marks_obtained}</span>
                      <span style={{color:'var(--text-muted)'}}>/ {m.max_marks}</span>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div style={{marginBottom:4,fontWeight:600}}>{pct(m)}%</div>
                      <div className="progress" style={{width:120}}>
                        <div className="progress-bar" style={{width:`${pct(m)}%`,background:pct(m)>=75?'#10b981':pct(m)>=40?'#f59e0b':'#ef4444'}}/>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${gradeColor(pct(m))}`}>{getGrade(pct(m))}</span></td>
                  <td style={{color:'var(--text-muted)',fontSize:'.82rem'}}>{m.exam_date||'—'}</td>
                  <td style={{color:'var(--text-muted)',fontSize:'.82rem'}}>{m.remarks||'—'}</td>
                </tr>
              ))}
              {filtered.length===0 && (
                <tr><td colSpan={7}><div className="empty-state" style={{padding:40}}><div className="icon">🎯</div><p>No marks records found</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default MyMarks;
