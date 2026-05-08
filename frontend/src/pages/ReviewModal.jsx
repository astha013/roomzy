import { useState } from 'react';
import { reviewApi } from '../api';
import { useToast } from '../context/ToastContext';

const RATING_DIMENSIONS = [
  { key: 'cleanliness',   label: 'Cleanliness',   icon: '🧹', desc: 'How clean was the shared space?' },
  { key: 'behavior',      label: 'Behavior',       icon: '🤝', desc: 'Was their behavior respectful?' },
  { key: 'cooperation',   label: 'Cooperation',    icon: '🫂', desc: 'Did they cooperate on shared tasks?' },
  { key: 'punctuality',   label: 'Punctuality',    icon: '⏰', desc: 'Did they pay rent & follow schedules?' },
  { key: 'communication', label: 'Communication',  icon: '💬', desc: 'Were they easy to communicate with?' },
  { key: 'overall',       label: 'Overall',        icon: '⭐', desc: 'Overall experience as a roommate' },
];

function StarRating({ value, onChange, size = 28 }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <button key={star} type="button"
          onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(star)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: size, padding: 0, lineHeight: 1, transition: 'transform 0.1s', transform: hover === star ? 'scale(1.2)' : 'scale(1)' }}>
          {star <= (hover || value) ? '⭐' : '☆'}
        </button>
      ))}
    </div>
  );
}

export default function ReviewModal({ targetUser, onClose, onSubmitted }) {
  const toast = useToast();
  const [ratings, setRatings] = useState({});
  const [comment, setComment] = useState('');
  const [stayDuration, setStayDuration] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(null);
  const [saving, setSaving] = useState(false);

  const setRating = (key, val) => setRatings(r => ({ ...r, [key]: val }));

  const submit = async () => {
    if (!ratings.overall) return toast('Please give an overall rating', 'error');

    const missing = RATING_DIMENSIONS.filter(d => d.key !== 'overall' && !ratings[d.key]);
    if (missing.length > 0) return toast(`Please rate: ${missing.map(d => d.label).join(', ')}`, 'error');

    setSaving(true);
    try {
      const { data } = await reviewApi.create({
        reviewedUserId: targetUser._id,
        ratings,
        comment,
        stayDuration,
        wouldRecommend
      });
      toast(`Review submitted! New trust score: ${data.trustScore}`, 'success');
      onSubmitted?.();
      onClose();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to submit review', 'error');
    } finally { setSaving(false); }
  };

  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '2rem', maxWidth: 520, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {targetUser.profilePhoto ? (
              <img src={`${BASE}${targetUser.profilePhoto}`} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--terra-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' }}>👤</div>
            )}
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 900, marginBottom: 2 }}>Rate {targetUser.name}</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--clay-3)' }}>Share your roommate experience</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        {/* Rating Dimensions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
          {RATING_DIMENSIONS.map(dim => (
            <div key={dim.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--parchment-1)', borderRadius: 12, border: `1.5px solid ${ratings[dim.key] ? 'var(--terra)' : 'var(--parchment-3)'}` }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span>{dim.icon}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{dim.label}</span>
                  {dim.key !== 'overall' && <span style={{ fontSize: '0.65rem', color: 'var(--terra)', fontWeight: 800 }}>REQUIRED</span>}
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--clay-3)' }}>{dim.desc}</p>
              </div>
              <StarRating value={ratings[dim.key] || 0} onChange={val => setRating(dim.key, val)} />
            </div>
          ))}
        </div>

        {/* Comment */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--clay-3)', display: 'block', marginBottom: 4 }}>Comment (optional)</label>
          <textarea
            value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Describe your experience living with this person..."
            style={{ width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid var(--parchment-3)', borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: '0.875rem', background: 'var(--parchment-1)', outline: 'none', minHeight: 80, resize: 'vertical', boxSizing: 'border-box' }}
          />
        </div>

        {/* Stay Duration */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--clay-3)', display: 'block', marginBottom: 4 }}>How long did you live together?</label>
          <select value={stayDuration} onChange={e => setStayDuration(e.target.value)}
            style={{ width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid var(--parchment-3)', borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: '0.875rem', background: 'var(--parchment-1)', outline: 'none' }}>
            <option value="">Select duration</option>
            {['Less than 1 month', '1-3 months', '3-6 months', '6-12 months', '1+ year'].map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        {/* Recommend */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--clay-3)', display: 'block', marginBottom: 8 }}>Would you recommend them as a roommate?</label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {[{ val: true, label: '👍 Yes', color: '#22c55e' }, { val: false, label: '👎 No', color: '#ef4444' }].map(opt => (
              <button key={String(opt.val)} onClick={() => setWouldRecommend(opt.val)}
                style={{ flex: 1, padding: '0.6rem', borderRadius: 10, border: `2px solid ${wouldRecommend === opt.val ? opt.color : 'var(--parchment-3)'}`, background: wouldRecommend === opt.val ? opt.color + '15' : 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem' }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-terra btn-sm" style={{ flex: 1 }} onClick={submit} disabled={saving}>
            {saving ? 'Submitting...' : 'Submit Review ⭐'}
          </button>
        </div>
      </div>
    </div>
  );
}
