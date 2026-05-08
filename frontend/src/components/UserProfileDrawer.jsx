/**
 * UserProfileDrawer.jsx
 * Slide-in drawer that shows a matched user's full profile
 * directly from the Chat page — without navigating away.
 */
import { useState, useEffect } from 'react';
import { reviewApi, profileApi } from '../api';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DIMS = [
  { key: 'cleanliness',   label: 'Cleanliness',   icon: '🧹' },
  { key: 'behavior',      label: 'Behavior',       icon: '🤝' },
  { key: 'cooperation',   label: 'Cooperation',    icon: '🫂' },
  { key: 'punctuality',   label: 'Punctuality',    icon: '⏰' },
  { key: 'communication', label: 'Communication',  icon: '💬' },
  { key: 'overall',       label: 'Overall',        icon: '⭐' },
];

function StarBar({ value, max = 5 }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--parchment-3)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--terra)', minWidth: 26 }}>{value}</span>
    </div>
  );
}

function Chip({ label }) {
  return (
    <span style={{
      fontSize: '0.72rem', background: 'var(--parchment-2)', color: 'var(--clay-2)',
      padding: '3px 10px', borderRadius: 20, fontWeight: 600, border: '1px solid var(--parchment-3)'
    }}>{label}</span>
  );
}

export default function UserProfileDrawer({ user, onClose }) {
  const [reviews, setReviews] = useState([]);
  const [averages, setAverages] = useState({});
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [tab, setTab] = useState('about'); // 'about' | 'reviews'

  useEffect(() => {
    if (!user?._id) return;
    setLoadingReviews(true);
    reviewApi.getForUser(user._id)
      .then(({ data }) => { setReviews(data.reviews || []); setAverages(data.averages || {}); })
      .catch(() => {})
      .finally(() => setLoadingReviews(false));
  }, [user?._id]);

  if (!user) return null;

  const prefs = user.preferences || {};

  const prefChips = [
    prefs.budgetMin && `₹${(prefs.budgetMin / 1000).toFixed(0)}k–${(prefs.budgetMax / 1000).toFixed(0)}k/mo`,
    prefs.sleepTime && `💤 ${prefs.sleepTime}`,
    prefs.foodHabit === 'veg' ? '🥦 Vegetarian' : prefs.foodHabit === 'non-veg' ? '🍗 Non-veg' : prefs.foodHabit === 'eggetarian' ? '🥚 Eggetarian' : null,
    prefs.personality && prefs.personality,
    prefs.workFromHome && '🏠 Work from home',
    prefs.pets && '🐾 Pets friendly',
    prefs.smoking && '🚬 Smoker',
    prefs.drinking && '🍷 Social drinker',
  ].filter(Boolean);

  const hasReviews = reviews.length > 0;
  const overallAvg = averages.overall;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 10000 }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(420px, 100vw)',
        background: 'var(--parchment)',
        zIndex: 10001,
        overflowY: 'auto',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
        animation: 'slideInRight 0.22s ease',
      }}>
        <style>{`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to   { transform: translateX(0);    opacity: 1; }
          }
        `}</style>

        {/* Header */}
        <div style={{ position: 'sticky', top: 0, background: 'var(--parchment)', zIndex: 2, borderBottom: '1px solid var(--parchment-3)', padding: '0.875rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: '1rem' }}>Profile</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: 'var(--clay-3)', lineHeight: 1 }}>×</button>
        </div>

        {/* Hero */}
        <div style={{ background: 'linear-gradient(135deg, var(--terra) 0%, var(--mauve) 100%)', padding: '2rem 1.5rem 1.5rem', textAlign: 'center', position: 'relative' }}>
          {user.profilePhoto ? (
            <img
              src={`${BASE}${user.profilePhoto}`}
              alt={user.name}
              style={{ width: 88, height: 88, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.6)', marginBottom: '0.75rem' }}
              onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
            />
          ) : null}
          <div style={{
            display: user.profilePhoto ? 'none' : 'flex',
            width: 88, height: 88, borderRadius: '50%',
            background: 'rgba(255,255,255,0.2)', margin: '0 auto 0.75rem',
            alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '2rem', color: 'white',
            border: '3px solid rgba(255,255,255,0.4)'
          }}>
            {(user.name || '?')[0].toUpperCase()}
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 900, color: 'white', marginBottom: '0.25rem' }}>{user.name}</h2>
          <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)', marginBottom: '0.75rem' }}>
            📍 {user.city}{user.area ? `, ${user.area}` : ''}
            {user.age ? ` · ${user.age} yrs` : ''}
            {user.gender ? ` · ${user.gender}` : ''}
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            {/* Trust score badge */}
            <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 12, padding: '6px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'white' }}>{user.trustScore ?? 0}</div>
              <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>TRUST</div>
            </div>
            {/* Review score badge */}
            {overallAvg && (
              <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 12, padding: '6px 14px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'white' }}>⭐ {overallAvg}</div>
                <div style={{ fontSize: '0.62rem', color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>{reviews.length} REVIEW{reviews.length !== 1 ? 'S' : ''}</div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--parchment-3)', background: 'white' }}>
          {['about', 'reviews'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '0.75rem', border: 'none', cursor: 'pointer',
                background: 'none', fontWeight: 700, fontSize: '0.82rem',
                color: tab === t ? 'var(--terra)' : 'var(--clay-3)',
                borderBottom: tab === t ? '2px solid var(--terra)' : '2px solid transparent',
                textTransform: 'capitalize', transition: 'color 0.15s'
              }}>
              {t === 'about' ? '👤 About' : `⭐ Reviews (${reviews.length})`}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: '1.25rem' }}>

          {tab === 'about' && (
            <>
              {/* AI summary */}
              {user.aiSummary && (
                <div style={{ background: 'white', borderRadius: 14, padding: '1rem 1.1rem', marginBottom: '1rem', border: '1px solid var(--parchment-3)', fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--clay-2)', lineHeight: 1.7 }}>
                  "{user.aiSummary}"
                </div>
              )}

              {/* Preferences */}
              {prefChips.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <p style={sectionLabel}>Lifestyle & Preferences</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {prefChips.map(c => <Chip key={c} label={c} />)}
                  </div>
                </div>
              )}

              {/* Occupation / move-in info */}
              {(user.occupation || user.moveInDate || user.intent) && (
                <div style={{ background: 'white', borderRadius: 14, padding: '1rem 1.1rem', marginBottom: '1rem', border: '1px solid var(--parchment-3)' }}>
                  {user.occupation && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--clay-2)', marginBottom: 6 }}>
                      💼 <strong>Occupation:</strong> {user.occupation}
                    </p>
                  )}
                  {user.intent && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--clay-2)', marginBottom: 6 }}>
                      🔍 <strong>Looking for:</strong> {user.intent === 'find_room' ? 'Room to rent' : user.intent === 'list_room' ? 'Roommate for my room' : user.intent}
                    </p>
                  )}
                  {user.moveInDate && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--clay-2)' }}>
                      📅 <strong>Move-in:</strong> {new Date(user.moveInDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  )}
                </div>
              )}

              {/* Bio */}
              {user.bio && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <p style={sectionLabel}>Bio</p>
                  <p style={{ fontSize: '0.875rem', color: 'var(--clay-2)', lineHeight: 1.7 }}>{user.bio}</p>
                </div>
              )}

              {/* Social links */}
              {(user.socialLinks?.linkedin || user.socialLinks?.instagram) && (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={sectionLabel}>Social</p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {user.socialLinks?.linkedin && (
                      <a href={user.socialLinks.linkedin} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '0.8rem', padding: '5px 12px', borderRadius: 20, background: '#EBF3FB', color: '#0077B5', fontWeight: 700, textDecoration: 'none' }}>
                        in LinkedIn
                      </a>
                    )}
                    {user.socialLinks?.instagram && (
                      <a href={user.socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '0.8rem', padding: '5px 12px', borderRadius: 20, background: '#FDF0F8', color: '#E1306C', fontWeight: 700, textDecoration: 'none' }}>
                        📸 Instagram
                      </a>
                    )}
                  </div>
                </div>
              )}

              {!user.aiSummary && !user.bio && prefChips.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--clay-3)' }}>
                  <p style={{ fontSize: '0.85rem' }}>No additional profile info yet</p>
                </div>
              )}
            </>
          )}

          {tab === 'reviews' && (
            <>
              {loadingReviews ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--clay-3)' }}>Loading reviews…</div>
              ) : !hasReviews ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--clay-3)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
                  <p style={{ fontWeight: 600 }}>No reviews yet</p>
                  <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Be the first to leave a review after living together</p>
                </div>
              ) : (
                <>
                  {/* Averages */}
                  <div style={{ background: 'white', borderRadius: 14, padding: '1rem 1.1rem', marginBottom: '1rem', border: '1px solid var(--parchment-3)' }}>
                    <p style={sectionLabel}>Average Ratings</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {DIMS.filter(d => averages[d.key] !== null && averages[d.key] !== undefined).map(d => (
                        <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--clay-2)', minWidth: 110 }}>{d.icon} {d.label}</span>
                          <StarBar value={averages[d.key]} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Review cards */}
                  {reviews.map(r => (
                    <div key={r._id} style={{ background: 'white', borderRadius: 14, padding: '1rem 1.1rem', marginBottom: '0.75rem', border: '1px solid var(--parchment-3)' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
                        {r.reviewer?.profilePhoto ? (
                          <img src={`${BASE}${r.reviewer.profilePhoto}`} alt=""
                            style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--terra-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', color: 'var(--terra)' }}>
                            {(r.reviewer?.name || '?')[0].toUpperCase()}
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '0.85rem' }}>{r.reviewer?.name || 'Anonymous'}</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--clay-3)' }}>
                            {r.stayDuration || ''} · {new Date(r.createdAt).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 1 }}>
                          {[1,2,3,4,5].map(s => (
                            <span key={s} style={{ fontSize: '0.8rem', color: s <= (r.ratings?.overall || 0) ? '#f59e0b' : '#d1d5db' }}>★</span>
                          ))}
                        </div>
                      </div>

                      {r.wouldRecommend !== null && r.wouldRecommend !== undefined && (
                        <span style={{ display: 'inline-block', fontSize: '0.7rem', fontWeight: 700, color: r.wouldRecommend ? '#22c55e' : '#ef4444', marginBottom: r.comment ? '0.5rem' : 0 }}>
                          {r.wouldRecommend ? '👍 Would recommend' : '👎 Would not recommend'}
                        </span>
                      )}

                      {r.comment && (
                        <p style={{ fontSize: '0.8rem', color: 'var(--clay-2)', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>
                          "{r.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

const sectionLabel = {
  fontSize: '0.68rem', fontWeight: 800, color: 'var(--clay-3)',
  textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem'
};
