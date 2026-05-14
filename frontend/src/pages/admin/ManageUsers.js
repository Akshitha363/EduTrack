// src/pages/admin/ManageUsers.js
import React, { useEffect, useState } from 'react';
import { usersAPI } from '../../utils/api';

const ManageUsers = () => {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [roleFilter, setRole] = useState('');
  const [msg, setMsg]         = useState('');
  const [editing, setEditing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await usersAPI.getAll({ search, role: roleFilter });
      if (data.success) setUsers(data.users);
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [search, roleFilter]);

  const toggleActive = async (u) => {
    try {
      await usersAPI.update(u.id, { ...u, is_active: u.is_active ? 0 : 1 });
      setMsg(`${u.name} ${u.is_active ? 'deactivated' : 'activated'}`);
      load();
    } catch (_) { setMsg('Update failed'); }
  };

  const roleBadge = (r) => {
    const map = { admin:'badge-danger', faculty:'badge-success', student:'badge-primary' };
    return <span className={`badge ${map[r]||'badge-info'}`}>{r}</span>;
  };

  return (
    <div>
      <div className="page-header">
        <h2>👥 Manage Users</h2>
        <p>View and manage all registered users</p>
      </div>
      {msg && <div className="alert alert-success">{msg} <button onClick={()=>setMsg('')} style={{float:'right',background:'none',border:'none',cursor:'pointer'}}>✕</button></div>}

      <div className="card">
        <div className="card-header">
          <div style={{ display:'flex', gap:12, flex:1, flexWrap:'wrap' }}>
            <input className="form-control" style={{ maxWidth:260 }} placeholder="🔍 Search name or email..." value={search} onChange={e=>setSearch(e.target.value)}/>
            <select className="form-control" style={{ maxWidth:160 }} value={roleFilter} onChange={e=>setRole(e.target.value)}>
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="faculty">Faculty</option>
              <option value="student">Student</option>
            </select>
          </div>
          <span style={{ color:'var(--text-muted)', fontSize:'.85rem' }}>{users.length} users</span>
        </div>
        <div className="table-responsive">
          {loading ? <div className="spinner"><div className="spin"/></div> : (
            <table>
              <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Last Login</th><th>Actions</th></tr></thead>
              <tbody>
                {users.map((u,i) => (
                  <tr key={u.id}>
                    <td style={{ color:'var(--text-muted)' }}>{i+1}</td>
                    <td><div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div className="avatar" style={{ background:'var(--primary)', color:'#fff', width:32, height:32, fontSize:'.75rem' }}>{u.name?.charAt(0)}</div>
                      <span style={{ fontWeight:600 }}>{u.name}</span>
                    </div></td>
                    <td style={{ color:'var(--text-muted)' }}>{u.email}</td>
                    <td>{roleBadge(u.role)}</td>
                    <td>{u.department||'-'}</td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ color:'var(--text-muted)', fontSize:'.8rem' }}>
                      {u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}
                    </td>
                    <td>
                      <button className={`btn btn-sm ${u.is_active ? 'btn-outline' : 'btn-success'}`} onClick={() => toggleActive(u)}>
                        {u.is_active ? '🔒 Deactivate' : '✅ Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={8}><div className="empty-state"><div className="icon">👥</div><p>No users found</p></div></td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
export default ManageUsers;
