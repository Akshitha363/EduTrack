// src/pages/student/LectureNotes.js
// Features: inline PDF viewer, star ratings, faculty review/feedback
import React, { useEffect, useState, useCallback } from 'react';
import { notesAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

// ── Star Rating component ──────────────────────
const Stars = ({ value, max = 5, size = 18 }) => (
  <span style={{ display: 'inline-flex', gap: 2 }}>
    {Array.from({ length: max }).map((_, i) => (
      <span key={i} style={{ fontSize: size, color: i < Math.round(value) ? '#f59e0b' : '#d1d5db', lineHeight: 1 }}>★</span>
    ))}
  </span>
);

// ── PDF Viewer Modal ───────────────────────────
const PDFViewer = ({ note, onClose, onReviewSaved }) => {
  const { user }     = useAuth();
  const [reviews, setReviews]       = useState([]);
  const [avgRating, setAvgRating]   = useState(0);
  const [totalRev, setTotalRev]     = useState(0);
  const [myRating, setMyRating]     = useState(0);
  const [myComment, setMyComment]   = useState('');
  const [hoverStar, setHoverStar]   = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [revMsg, setRevMsg]         = useState('');
  const [pdfError, setPdfError]     = useState(false);
  const pdfUrl = `http://localhost:5000${note.file_url}`;

  const loadReviews = useCallback(async () => {
    try {
      const { data } = await notesAPI.getReviews(note.id);
      setReviews(data.reviews || []);
      setAvgRating(parseFloat(data.avg_rating) || 0);
      setTotalRev(data.total || 0);
      const mine = (data.reviews || []).find(r => r.student_id === user?.id);
      if (mine) { setMyRating(mine.rating); setMyComment(mine.comment || ''); }
    } catch (_) {}
  }, [note.id, user?.id]);

  useEffect(() => {
    loadReviews();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [loadReviews]);

  const submitReview = async () => {
    if (!myRating) { setRevMsg('Please select a star rating first'); return; }
    setSubmitting(true);
    try {
      await notesAPI.submitReview(note.id, { rating: myRating, comment: myComment });
      setRevMsg('success');
      await loadReviews();
      if (onReviewSaved) onReviewSaved();
    } catch (_) { setRevMsg('error'); }
    setSubmitting(false);
  };

  const timeAgo = (d) => {
    const s = Math.floor((new Date() - new Date(d)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return new Date(d).toLocaleDateString();
  };

  const handleOverlay = (e) => { if (e.target === e.currentTarget) onClose(); };

  const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div
      onClick={handleOverlay}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'stretch',
      }}
    >
      {/* ── Left: PDF Viewer ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#1e1b4b', overflow: 'hidden' }}>

        {/* PDF Toolbar */}
        <div style={{
          padding: '12px 20px', background: '#0f0c2e',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.4rem' }}>📄</span>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '.95rem' }}>{note.title}</div>
              <div style={{ color: 'rgba(255,255,255,.45)', fontSize: '.73rem' }}>
                {note.subject} · {note.course} · 👨‍🏫 {note.uploaded_by_name}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <a href={pdfUrl} download style={{ background: 'rgba(255,255,255,.1)', color: '#fff', border: '1px solid rgba(255,255,255,.15)', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontSize: '.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>⬇️ Download</a>
            <a href={pdfUrl} target="_blank" rel="noreferrer" style={{ background: 'rgba(255,255,255,.1)', color: '#fff', border: '1px solid rgba(255,255,255,.15)', borderRadius: 7, padding: '6px 14px', cursor: 'pointer', fontSize: '.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>↗️ New Tab</a>
            <button onClick={onClose} style={{ background: 'rgba(239,68,68,.2)', color: '#fca5a5', border: '1px solid rgba(239,68,68,.3)', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>✕</button>
          </div>
        </div>

        {/* PDF embed */}
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          {pdfError ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff', gap: 16, padding: 40 }}>
              <div style={{ fontSize: '3rem' }}>📄</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>Cannot preview inline</div>
              <div style={{ color: 'rgba(255,255,255,.5)', fontSize: '.88rem', textAlign: 'center' }}>Your browser blocked the inline preview.<br/>Use the buttons below to view or download.</div>
              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <a href={pdfUrl} target="_blank" rel="noreferrer" style={{ background: '#4f46e5', color: '#fff', padding: '10px 22px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>↗️ Open in New Tab</a>
                <a href={pdfUrl} download style={{ background: 'rgba(255,255,255,.12)', color: '#fff', padding: '10px 22px', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>⬇️ Download</a>
              </div>
            </div>
          ) : (
            <iframe
              src={`${pdfUrl}#toolbar=1&navpanes=1&view=FitH`}
              title={note.title}
              width="100%"
              height="100%"
              style={{ border: 'none', display: 'block' }}
              onError={() => setPdfError(true)}
            />
          )}
        </div>
      </div>

      {/* ── Right: Reviews Panel ── */}
      <div style={{ width: 360, background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border)', overflow: 'hidden' }}>

        {/* Panel header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>📋 Note Info & Reviews</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Stars value={avgRating} size={16} />
            <span style={{ fontWeight: 700, fontSize: '.95rem' }}>{avgRating > 0 ? avgRating : '—'}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '.78rem' }}>({totalRev} review{totalRev !== 1 ? 's' : ''})</span>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="badge badge-primary" style={{ fontSize: '.7rem' }}>{note.course}</span>
            <span className="badge badge-info" style={{ fontSize: '.7rem' }}>{note.subject}</span>
          </div>
          {note.description && (
            <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', margin: '8px 0 0', lineHeight: 1.5 }}>{note.description}</p>
          )}
        </div>

        {/* Reviews list — scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          <div style={{ fontWeight: 700, fontSize: '.88rem', marginBottom: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
            Student Feedback
          </div>

          {reviews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>💬</div>
              <div style={{ fontSize: '.85rem' }}>No reviews yet. Be the first to review!</div>
            </div>
          ) : (
            reviews.map(r => (
              <div key={r.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: r.student_id === user?.id ? 'var(--primary)' : '#e2e8f0', color: r.student_id === user?.id ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.75rem', fontWeight: 700, flexShrink: 0 }}>
                      {r.student_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '.82rem', lineHeight: 1.2 }}>
                        {r.student_id === user?.id ? `${r.student_name} (You)` : r.student_name}
                      </div>
                      <div style={{ fontSize: '.69rem', color: 'var(--text-muted)' }}>{timeAgo(r.created_at)}</div>
                    </div>
                  </div>
                  <Stars value={r.rating} size={13} />
                </div>
                {r.comment && (
                  <p style={{ fontSize: '.81rem', color: 'var(--text-muted)', margin: '5px 0 0', lineHeight: 1.5, paddingLeft: 38, fontStyle: 'italic' }}>
                    "{r.comment}"
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Write a review */}
        <div style={{ padding: '16px 20px', borderTop: '2px solid var(--border)', background: 'var(--bg)', flexShrink: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '.9rem', marginBottom: 10 }}>
            {reviews.find(r => r.student_id === user?.id) ? '✏️ Update Your Review' : '✍️ Leave a Review'}
          </div>

          {/* Interactive star picker */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginBottom: 5, fontWeight: 600 }}>YOUR RATING *</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <span
                  key={i}
                  onMouseEnter={() => setHoverStar(i)}
                  onMouseLeave={() => setHoverStar(0)}
                  onClick={() => setMyRating(i)}
                  style={{ fontSize: 30, cursor: 'pointer', color: i <= (hoverStar || myRating) ? '#f59e0b' : '#d1d5db', transition: 'color .1s, transform .1s', lineHeight: 1, transform: i <= (hoverStar || myRating) ? 'scale(1.15)' : 'scale(1)' }}
                >★</span>
              ))}
              {(hoverStar || myRating) > 0 && (
                <span style={{ fontSize: '.78rem', color: '#f59e0b', marginLeft: 6, fontWeight: 600 }}>
                  {LABELS[hoverStar || myRating]}
                </span>
              )}
            </div>
          </div>

          <textarea
            rows={3}
            className="form-control"
            placeholder="Was this note helpful? Any suggestions for the faculty? (optional)"
            value={myComment}
            onChange={e => setMyComment(e.target.value)}
            style={{ fontSize: '.82rem', resize: 'vertical', marginBottom: 10 }}
          />

          {revMsg === 'success' && (
            <div style={{ padding: '8px 12px', borderRadius: 6, marginBottom: 10, fontSize: '.8rem', background: '#d1fae5', color: '#065f46' }}>
              ✅ Review submitted! Faculty will see your feedback.
            </div>
          )}
          {revMsg === 'error' && (
            <div style={{ padding: '8px 12px', borderRadius: 6, marginBottom: 10, fontSize: '.8rem', background: '#fee2e2', color: '#991b1b' }}>
              ❌ Failed to submit. Please try again.
            </div>
          )}
          {revMsg && revMsg !== 'success' && revMsg !== 'error' && (
            <div style={{ padding: '8px 12px', borderRadius: 6, marginBottom: 10, fontSize: '.8rem', background: '#fef3c7', color: '#92400e' }}>
              ⚠️ {revMsg}
            </div>
          )}

          <button
            onClick={submitReview}
            disabled={submitting || !myRating}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', opacity: !myRating ? .5 : 1, cursor: !myRating ? 'not-allowed' : 'pointer' }}
          >
            {submitting ? '⏳ Submitting...' : '📨 Submit Review to Faculty'}
          </button>
          <div style={{ fontSize: '.71rem', color: 'var(--text-muted)', marginTop: 6, textAlign: 'center' }}>
            Faculty can see all reviews to improve their materials
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Main LectureNotes Page ──────────────────────
const LectureNotes = () => {
  const [notes, setNotes]      = useState([]);
  const [loading, setLoading]  = useState(true);
  const [search, setSearch]    = useState('');
  const [filterCourse, setFC]  = useState('');
  const [filterSubject, setFS] = useState('');
  const [viewing, setViewing]  = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    notesAPI.getAll({ course: filterCourse, subject: filterSubject })
      .then(r => { setNotes(r.data.notes || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filterCourse, filterSubject]);

  useEffect(() => { load(); }, [load]);

  const fmtSize = (b) => !b ? '—' : b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.round(b / 1024)} KB`;

  const courses  = [...new Set(notes.map(n => n.course))];
  const subjects = [...new Set(notes.map(n => n.subject))];
  const filtered = notes.filter(n =>
    !search ||
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.subject.toLowerCase().includes(search.toLowerCase()) ||
    n.course.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <h2>📄 Lecture Notes</h2>
        <p>View PDFs inline and leave feedback for faculty</p>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="form-label">🔍 Search</label>
            <input className="form-control" placeholder="Title, subject, course..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ minWidth: 180 }}>
            <label className="form-label">📚 Course</label>
            <select className="form-control" value={filterCourse} onChange={e => setFC(e.target.value)}>
              <option value="">All Courses</option>
              {courses.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 180 }}>
            <label className="form-label">📖 Subject</label>
            <select className="form-control" value={filterSubject} onChange={e => setFS(e.target.value)}>
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <button className="btn btn-outline" onClick={() => { setSearch(''); setFC(''); setFS(''); }}>🔄 Reset</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[['📄', `${filtered.length} notes`], ['📚', `${courses.length} courses`], ['📖', `${subjects.length} subjects`]].map(([icon, label]) => (
          <div key={label} style={{ padding: '7px 14px', background: 'var(--bg-card)', borderRadius: 8, border: '1px solid var(--border)', fontSize: '.83rem' }}>
            {icon} <strong>{label}</strong>
          </div>
        ))}
      </div>

      {/* Notes Grid */}
      {loading ? (
        <div className="spinner"><div className="spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state card" style={{ padding: 60 }}>
          <div className="icon">📄</div>
          <p>No lecture notes found</p>
          <p style={{ fontSize: '.85rem', color: 'var(--text-muted)' }}>Notes uploaded by faculty will appear here</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 16 }}>
          {filtered.map(n => (
            <div key={n.id} className="card"
              style={{ transition: 'transform .2s,box-shadow .2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,.12)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
            >
              <div style={{ height: 4, background: 'linear-gradient(90deg,#4f46e5,#06b6d4)', borderRadius: '12px 12px 0 0' }} />
              <div className="card-body">
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 12, background: '#fee2e2', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.6rem', flexShrink: 0 }}>📄</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '.95rem', marginBottom: 5, lineHeight: 1.3 }}>{n.title}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                      <span className="badge badge-primary" style={{ fontSize: '.7rem' }}>{n.course}</span>
                      <span className="badge badge-info" style={{ fontSize: '.7rem' }}>{n.subject}</span>
                    </div>
                    {n.description && (
                      <p style={{ fontSize: '.8rem', color: 'var(--text-muted)', margin: '0 0 6px', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {n.description}
                      </p>
                    )}
                    <div style={{ fontSize: '.72rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                      👨‍🏫 {n.uploaded_by_name} · 📦 {fmtSize(n.file_size)} · {new Date(n.created_at).toLocaleDateString()}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, justifyContent: 'center' }}
                        onClick={() => setViewing(n)}
                      >
                        👁️ View PDF
                      </button>
                      <a
                        href={`http://localhost:5000${n.file_url}`}
                        download
                        className="btn btn-outline btn-sm"
                        style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}
                      >
                        ⬇️ Download
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF Viewer Modal */}
      {viewing && (
        <PDFViewer
          note={viewing}
          onClose={() => setViewing(null)}
          onReviewSaved={load}
        />
      )}
    </div>
  );
};

export default LectureNotes;
