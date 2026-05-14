// src/pages/student/Notifications.js
import React, { useEffect, useState } from 'react';
import { notificationsAPI } from '../../utils/api';

const TYPE_ICONS = { assignment:'📝', grade:'🎯', attendance:'📅', warning:'⚠️', alert:'🚨', info:'ℹ️' };
const TYPE_COLORS = { assignment:'badge-primary', grade:'badge-success', attendance:'badge-info', warning:'badge-warning', alert:'badge-danger', info:'badge-info' };

const Notifications = () => {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [msg, setMsg]         = useState('');

  const load = async () => {
    setLoading(true);
    try { const { data } = await notificationsAPI.getAll(); setNotifs(data.notifications || []); } catch (_) {}
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await notificationsAPI.markRead(id);
    setNotifs(ns => ns.map(n => n.id===id ? {...n, is_read:1} : n));
  };

  const markAll = async () => {
    await notificationsAPI.markAllRead();
    setNotifs(ns => ns.map(n => ({...n, is_read:1})));
    setMsg('All notifications marked as read');
  };

  const del = async (id) => {
    await notificationsAPI.remove(id);
    setNotifs(ns => ns.filter(n => n.id !== id));
  };

  const filtered = filter === 'unread'
    ? notifs.filter(n => !n.is_read)
    : filter !== 'all' ? notifs.filter(n => n.type === filter)
    : notifs;

  const unreadCount = notifs.filter(n => !n.is_read).length;

  const timeAgo = (d) => {
    const s = Math.floor((new Date()-new Date(d))/1000);
    if (s<60) return 'just now';
    if (s<3600) return `${Math.floor(s/60)}m ago`;
    if (s<86400) return `${Math.floor(s/3600)}h ago`;
    return `${Math.floor(s/86400)}d ago`;
  };

  return (
    <div>
      <div className="page-header">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <h2>🔔 Notifications</h2>
          {unreadCount>0 && <span className="badge badge-danger">{unreadCount} new</span>}
        </div>
        <p>Stay updated with assignments, grades, and important alerts</p>
      </div>

      {msg && <div className="alert alert-success">{msg}<button onClick={()=>setMsg('')} style={{float:'right',background:'none',border:'none',cursor:'pointer'}}>✕</button></div>}

      {/* Controls */}
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20,flexWrap:'wrap',gap:12}}>
        <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
          {['all','unread','assignment','grade','warning','alert'].map(f=>(
            <button key={f} className={`btn btn-sm ${filter===f?'btn-primary':'btn-outline'}`} style={{textTransform:'capitalize'}} onClick={()=>setFilter(f)}>
              {f==='all'?'All':`${TYPE_ICONS[f]||'🔔'} ${f.charAt(0).toUpperCase()+f.slice(1)}`}
            </button>
          ))}
        </div>
        {unreadCount>0 && <button className="btn btn-outline btn-sm" onClick={markAll}>✅ Mark All Read</button>}
      </div>

      {loading ? <div className="spinner"><div className="spin"/></div> : (
        filtered.length === 0
          ? <div className="empty-state card" style={{padding:60}}><div className="icon">🔔</div><p>No notifications yet</p></div>
          : (
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {filtered.map(n=>(
                <div key={n.id} className="card" style={{opacity:n.is_read?.1:1,borderLeft:`3px solid ${n.is_read?'var(--border)':'var(--primary)'}`}}>
                  <div className="card-body" style={{display:'flex',alignItems:'flex-start',gap:14,padding:16}}>
                    <div style={{width:42,height:42,borderRadius:12,background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem',flexShrink:0}}>
                      {TYPE_ICONS[n.type]||'🔔'}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:8,marginBottom:4}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <span style={{fontWeight:700,fontSize:'.92rem'}}>{n.title}</span>
                          {!n.is_read && <span style={{width:8,height:8,borderRadius:'50%',background:'var(--primary)',display:'inline-block'}}/>}
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <span className={`badge ${TYPE_COLORS[n.type]||'badge-info'}`} style={{fontSize:'.7rem'}}>{n.type}</span>
                          <span style={{fontSize:'.75rem',color:'var(--text-muted)'}}>{timeAgo(n.created_at)}</span>
                        </div>
                      </div>
                      <p style={{color:'var(--text-muted)',fontSize:'.87rem',margin:0,lineHeight:1.5}}>{n.message}</p>
                    </div>
                    <div style={{display:'flex',gap:6,flexShrink:0}}>
                      {!n.is_read && <button className="btn btn-sm btn-outline" onClick={()=>markRead(n.id)} title="Mark as read">✓</button>}
                      <button className="btn btn-sm btn-danger" onClick={()=>del(n.id)} title="Delete">🗑️</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
      )}
    </div>
  );
};
export default Notifications;
