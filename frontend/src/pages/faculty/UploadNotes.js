// src/pages/faculty/UploadNotes.js
// Faculty: upload notes + view student reviews/feedback per note
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { notesAPI } from '../../utils/api';

const Stars = ({ value, size = 14 }) => (
  <span style={{ display: 'inline-flex', gap: 2 }}>
    {[1, 2, 3, 4, 5].map(i => (
      <span key={i} style={{ fontSize: size, color: i <= Math.round(value) ? '#f59e0b' : '#d1d5db', lineHeight: 1 }}>★</span>
    ))}
  </span>
);

const UploadNotes = () => {
  const [notes, setNotes]         = useState([]);
  const [form, setForm]           = useState({ title: '', subject: '', course: '', description: '' });
  const [file, setFile]           = useState(null);
  const [editing, setEditing]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [msg, setMsg]             = useState({ text: '', type: '' });
  const [search, setSearch]       = useState('');
  const [reviewPanel, setReviewPanel] = useState(null); // { note, reviews, avg, total }
  const [reviewLoading, setRevLoading] = useState(false);
  const fileRef = useRef();

  const load = useCallback(async () => {
    setLoading(true);
    try { const { data } = await notesAPI.getAll(); setNotes(data.notes || []); } catch (_) {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (e) => {
    e.preventDefault();
    if (!form.title || !form.subject || !form.course) {
      setMsg({ text: 'Title, subject, and course are required', type: 'danger' }); return;
    }
    if (!editing && !file) {
      setMsg({ text: 'Please select a file to upload', type: 'danger' }); return;
    }
    setSaving(true);
    try {
      if (editing) {
        await notesAPI.update(editing, form);
        setMsg({ text: 'Note updated successfully!', type: 'success' });
      } else {
        const fd = new FormData();
        Object.entries(form).forEach(([k, v]) => fd.append(k, v));
        fd.append('file', file);
        await notesAPI.upload(fd);
        setMsg({ text: 'Lecture note uploaded successfully!', type: 'success' });
      }
      setForm({ title: '', subject: '', course: '', description: '' });
      setFile(null); setEditing(null);
      if (fileRef.current) fileRef.current.value = '';
      load();
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Upload failed', type: 'danger' });
    }
    setSaving(false);
  };

  const del = async (id) => {
    if (!window.confirm('Delete this note permanently?')) return;
    try { await notesAPI.remove(id); setMsg({ text: 'Note deleted', type: 'success' }); load(); } catch (_) {}
    if (reviewPanel?.note?.id === id) setReviewPanel(null);
  };

  const edit = (n) => {
    setForm({ title: n.title, subject: n.subject, course: n.course, description: n.description || '' });
    setEditing(n.id); setReviewPanel(null); window.scrollTo(0, 0);
  };

  const openReviews = async (n) => {
    if (reviewPanel?.note?.id === n.id) { setReviewPanel(null); return; }
    setRevLoading(true);
    setReviewPanel({ note: n, reviews: [], avg: 0, total: 0 });
    try {
      const { data } = await notesAPI.getReviews(n.id);
      setReviewPanel({ note: n, reviews: data.reviews || [], avg: parseFloat(data.avg_rating) || 0, total: data.total || 0 });
    } catch (_) {}
    setRevLoading(false);
  };

  const fmtSize = (b) => !b ? '—' : b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;

  const timeAgo = (d) => {
    const s = Math.floor((new Date() - new Date(d)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return new Date(d).toLocaleDateString();
  };

  const filtered = notes.filter(n =>
    !search ||
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.course.toLowerCase().includes(search.toLowerCase()) ||
    n.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h2>📄 Lecture Notes</h2>
        <p>Upload course materials and view student feedback</p>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type}`}>
          {msg.text}
          <button onClick={() => setMsg({ text: '', type: '' })} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: reviewPanel ? '320px 1fr 340px' : '340px 1fr', gap: 20 }}>

        {/* ── Upload / Edit Form ── */}
        <div className="card" style={{ alignSelf: 'start' }}>
          <div className="card-header">
            <h5>{editing ? '✏️ Edit Note' : '📤 Upload Note'}</h5>
          </div>
          <div className="card-body">
            <form onSubmit={save}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-control" placeholder="e.g. React Hooks Deep Dive" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Subject</label>
                <input className="form-control" placeholder="e.g. Frontend Development" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Course</label>
                <input className="form-control" placeholder="e.g. CS601 - WAD" value={form.course} onChange={e => setForm(f => ({ ...f, course: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={3} placeholder="Topics covered in this note..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              {!editing && (
                <div className="form-group">
                  <label className="form-label">PDF / Document</label>
                  <input type="file" ref={fileRef} className="form-control" accept=".pdf,.doc,.docx,.txt" onChange={e => setFile(e.target.files[0])} />
                  {file && (
                    <div style={{ fontSize: '.76rem', color: 'var(--text-muted)', marginTop: 5 }}>
                      📎 {file.name} ({fmtSize(file.size)})
                    </div>
                  )}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? (editing ? 'Updating...' : 'Uploading...') : (editing ? '💾 Update' : '📤 Upload')}
                </button>
                {editing && (
                  <button type="button" className="btn btn-outline" onClick={() => { setEditing(null); setForm({ title: '', subject: '', course: '', description: '' }); }}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* ── Notes List ── */}
        <div className="card">
          <div className="card-header">
            <h5>My Uploaded Notes ({filtered.length})</h5>
            <input className="form-control" style={{ maxWidth: 220 }} placeholder="🔍 Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ padding: 0 }}>
            {loading ? (
              <div className="spinner"><div className="spin" /></div>
            ) : filtered.length === 0 ? (
              <div className="empty-state" style={{ padding: 60 }}>
                <div className="icon">📄</div>
                <p>No notes uploaded yet</p>
              </div>
            ) : (
              filtered.map(n => (
                <div
                  key={n.id}
                  style={{
                    padding: '14px 20px', borderBottom: '1px solid var(--border)',
                    display: 'flex', alignItems: 'flex-start', gap: 14,
                    background: reviewPanel?.note?.id === n.id ? 'var(--bg)' : 'transparent',
                    transition: 'background .15s',
                  }}
                >
                  {/* Icon */}
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>📄</div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: 3 }}>{n.title}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span className="badge badge-primary" style={{ fontSize: '.68rem' }}>{n.course}</span>
                      <span className="badge badge-info" style={{ fontSize: '.68rem' }}>{n.subject}</span>
                    </div>
                    {n.description && (
                      <p style={{ fontSize: '.78rem', color: 'var(--text-muted)', margin: '0 0 4px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.description}</p>
                    )}
                    <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>
                      📦 {fmtSize(n.file_size)} · 📅 {new Date(n.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <a href={`http://localhost:5000${n.file_url}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-success" title="Preview PDF">👁️</a>
                      <button className="btn btn-sm btn-outline" onClick={() => edit(n)} title="Edit">✏️</button>
                      <button className="btn btn-sm btn-danger" onClick={() => del(n.id)} title="Delete">🗑️</button>
                    </div>
                    <button
                      className={`btn btn-sm ${reviewPanel?.note?.id === n.id ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => openReviews(n)}
                      style={{ fontSize: '.72rem', whiteSpace: 'nowrap' }}
                    >
                      💬 Reviews
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Reviews Panel (conditional) ── */}
        {reviewPanel && (
          <div className="card" style={{ alignSelf: 'start', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ flexShrink: 0 }}>
              <div>
                <h5 style={{ marginBottom: 4 }}>💬 Student Reviews</h5>
                <div style={{ fontSize: '.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>{reviewPanel.note.title}</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => setReviewPanel(null)}>✕</button>
            </div>

            {/* Rating summary */}
            <div style={{ padding: '14px 18px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                    {reviewPanel.avg > 0 ? reviewPanel.avg.toFixed(1) : '—'}
                  </div>
                  <Stars value={reviewPanel.avg} size={14} />
                  <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {reviewPanel.total} review{reviewPanel.total !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = reviewPanel.reviews.filter(r => r.rating === star).length;
                    const pct   = reviewPanel.total > 0 ? (count / reviewPanel.total) * 100 : 0;
                    return (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: '.72rem', minWidth: 14, color: 'var(--text-muted)' }}>{star}</span>
                        <span style={{ color: '#f59e0b', fontSize: 11 }}>★</span>
                        <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: 3, transition: 'width .5s' }} />
                        </div>
                        <span style={{ fontSize: '.7rem', color: 'var(--text-muted)', minWidth: 16 }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Individual reviews */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 18px' }}>
              {reviewLoading ? (
                <div className="spinner" style={{ padding: 30 }}><div className="spin" /></div>
              ) : reviewPanel.reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>💬</div>
                  <div style={{ fontSize: '.85rem' }}>No student reviews yet</div>
                  <div style={{ fontSize: '.78rem', marginTop: 4 }}>Reviews will appear here once students view and rate this note</div>
                </div>
              ) : (
                reviewPanel.reviews.map(r => (
                  <div key={r.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#e2e8f0', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.72rem', fontWeight: 700 }}>
                          {r.student_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '.82rem' }}>{r.student_name}</div>
                          <div style={{ fontSize: '.69rem', color: 'var(--text-muted)' }}>{timeAgo(r.created_at)}</div>
                        </div>
                      </div>
                      <Stars value={r.rating} size={13} />
                    </div>
                    {r.comment ? (
                      <div style={{ fontSize: '.81rem', color: 'var(--text-muted)', lineHeight: 1.5, paddingLeft: 36, fontStyle: 'italic' }}>
                        "{r.comment}"
                      </div>
                    ) : (
                      <div style={{ fontSize: '.75rem', color: 'var(--border)', paddingLeft: 36 }}>No comment</div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Faculty tip */}
            {reviewPanel.reviews.length > 0 && (
              <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', background: 'var(--bg)', flexShrink: 0 }}>
                <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  💡 <strong>Tip:</strong> Use this feedback to improve your lecture notes. Students with low ratings may need clearer explanations.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadNotes;
