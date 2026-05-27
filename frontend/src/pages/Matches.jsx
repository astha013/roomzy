import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar, ScoreRing, CompatBreakdown, SkeletonCard, IntentBadge, MatchModal, Spinner } from '../components/UI';
import Footer from '../components/Footer';
import ReviewModal from './ReviewModal';

const TABS = [
  { id: 'suggestions', label: 'Suggestions' },
  { id: 'matched',     label: 'Matched ❤️' },
];

export default function Matches() {
  const { user, canChat, trustScore } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState('suggestions');
  const [suggestions, setSuggestions] = useState([]);
  const [matched, setMatched]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [actioning, setActioning]     = useState({});
  const [matchModal, setMatchModal]   = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null); // user to review

  const [filters, setFilters] = useState({
    foodHabit: '', sleepTime: '', personality: '', minBudget: '', maxBudget: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({});
  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'suggestions') {
        const { data } = await matchApi.getSuggestions(appliedFilters);
        setSuggestions(data);
      } else {
        const { data } = await matchApi.getMatched();
        setMatched(data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (err.response?.status === 400) {
        // Profile incomplete — show warning but don't crash
        toast(msg || 'Complete your profile to see matches', 'warning');
      } else {
        toast('Could not load suggestions. Is the backend running?', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [tab, toast, appliedFilters]);

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
  }, [load]);

  const applyFilters = () => { setAppliedFilters({ ...filters }); setShowFilters(false); };
  const clearFilters = () => {
    const empty = { foodHabit: '', sleepTime: '', personality: '', minBudget: '', maxBudget: '' };
    setFilters(empty); setAppliedFilters(empty); setShowFilters(false);
  };

  const handleLike = async (userId, displayName) => {
    if (!canChat) { toast(`You need 30+ trust points to interact. You have ${trustScore}.`, 'warning'); return; }
    setActioning(a => ({ ...a, [userId]: 'like' }));
    try {
      const { data } = await matchApi.like(userId);
      if (data.isNowMatched) {
        setMatchModal(data.match);
        setSuggestions(prev => prev.filter(s => s.user._id !== userId));
        toast(`It's a match with ${displayName}! 🎉`, 'success');
      } else {
        toast(`Liked ${displayName}!`, 'success');
        setSuggestions(prev => prev.filter(s => s.user._id !== userId));
      }
    } catch (err) {
      toast(err.response?.data?.message || 'Error', 'error');
    } finally {
      setActioning(a => { const n = { ...a }; delete n[userId]; return n; });
    }
  };

  const handlePass = async (userId) => {
    setActioning(a => ({ ...a, [userId]: 'pass' }));
    try {
      await matchApi.pass(userId);
      setSuggestions(prev => prev.filter(s => s.user._id !== userId));
    } catch { /* silent */ }
    finally {
      setActioning(a => { const n = { ...a }; delete n[userId]; return n; });
    }
  };

  const profileIncomplete = !user?.preferences?.moveInDate || !user?.city || !user?.intent;

  return (
    /* FIX: flex column so footer is always pushed to page bottom */
    <div
      className="page-pad"
      style={{
        paddingTop: 'calc(68px + clamp(1rem, 3vw, 2rem))',
        paddingLeft: 0,
        paddingRight: 0,
        paddingBottom: 0,
        minHeight: '100vh',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Page content grows to fill space, pushing footer down ── */}
      <div style={{ flex: 1, paddingLeft: 'clamp(1rem, 4vw, 2.5rem)', paddingRight: 'clamp(1rem, 4vw, 2.5rem)' }}>

        {/* Trust gate */}
        {!canChat && (
          <div className="trust-gate" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.5rem' }}>🔒</span>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.2rem' }}>Unlock matching — {trustScore}/30 trust points</h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--clay-3)' }}>Verify your phone or add social links to reach 30 points and start interacting.</p>
            </div>
            <button className="btn btn-sm btn-primary" onClick={() => navigate('/trust')}>Build Trust →</button>
          </div>
        )}

        {/* Profile incomplete */}
        {profileIncomplete && (
          <div style={{ background: 'var(--slate-light)', border: '1.5px solid var(--slate)', borderRadius: 'var(--r-md)', padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '1.25rem' }}>📋</span>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <strong style={{ fontSize: '0.875rem' }}>Complete your profile to see matches</strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--clay-3)' }}>Set your intent, city, and move-in date.</p>
            </div>
            <button className="btn btn-sm btn-slate" style={{ background: 'var(--slate)', color: 'white', border: 'none', borderRadius: 100, padding: '0.4rem 1rem', cursor: 'pointer' }} onClick={() => navigate('/profile')}>Edit profile</button>
          </div>
        )}

        {/* Header + Tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, marginBottom: '0.25rem' }}>
              Roommate Matches
            </h2>
            <p style={{ color: 'var(--clay-3)', fontSize: '0.875rem' }}>
              {user?.city ? `Top matches in ${user.city}` : 'Set your city to see local matches'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.625rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {tab === 'suggestions' && (
              <button
                onClick={() => setShowFilters(f => !f)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  border: `1.5px solid ${activeFilterCount > 0 ? 'var(--terra)' : 'var(--parchment-3)'}`,
                  background: activeFilterCount > 0 ? 'var(--terra-light)' : 'white',
                  color: activeFilterCount > 0 ? 'var(--terra)' : 'var(--clay-2)',
                  borderRadius: 100, padding: '0.4rem 1rem',
                  fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
                  transition: 'all 0.18s',
                }}
              >
                🔧 Filters {activeFilterCount > 0 && <span style={{ background: 'var(--terra)', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900 }}>{activeFilterCount}</span>}
              </button>
            )}
            <div style={{ display: 'flex', background: 'var(--parchment-2)', borderRadius: 100, padding: 4, gap: 2 }}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  style={{
                    border: 'none', borderRadius: 100, padding: '0.4rem 1.25rem',
                    fontFamily: 'var(--font-body)', fontSize: '0.82rem', fontWeight: 700,
                    cursor: 'pointer', transition: 'all 0.2s',
                    background: tab === t.id ? 'white' : 'transparent',
                    color: tab === t.id ? 'var(--clay)' : 'var(--clay-3)',
                    boxShadow: tab === t.id ? 'var(--shadow-xs)' : 'none',
                  }}
                >{t.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && tab === 'suggestions' && (
          <div className="card" style={{ padding: '1.25rem', marginBottom: '1.25rem', border: '1.5px solid var(--terra)', borderRadius: 'var(--r-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h4 style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: '0.9rem' }}>🔧 Filter Suggestions</h4>
              <button onClick={() => setShowFilters(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--clay-3)', fontSize: '1.1rem' }}>×</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.875rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--clay-3)', display: 'block', marginBottom: '0.35rem' }}>Food Habit</label>
                <select className="form-input" value={filters.foodHabit} onChange={e => setFilters(f => ({ ...f, foodHabit: e.target.value }))} style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}>
                  <option value="">Any</option>
                  <option value="veg">🥦 Vegetarian</option>
                  <option value="eggetarian">🥚 Eggetarian</option>
                  <option value="non-veg">🍗 Non-veg</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--clay-3)', display: 'block', marginBottom: '0.35rem' }}>Sleep Time</label>
                <select className="form-input" value={filters.sleepTime} onChange={e => setFilters(f => ({ ...f, sleepTime: e.target.value }))} style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}>
                  <option value="">Any</option>
                  <option value="early">🌙 Early (before 10pm)</option>
                  <option value="late">🦉 Night owl (after 12)</option>
                  <option value="flexible">🔄 Flexible</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--clay-3)', display: 'block', marginBottom: '0.35rem' }}>Personality</label>
                <select className="form-input" value={filters.personality} onChange={e => setFilters(f => ({ ...f, personality: e.target.value }))} style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}>
                  <option value="">Any</option>
                  <option value="introvert">🤫 Introvert</option>
                  <option value="ambivert">🙂 Ambivert</option>
                  <option value="extrovert">🎉 Extrovert</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--clay-3)', display: 'block', marginBottom: '0.35rem' }}>Min Budget (₹)</label>
                <input className="form-input" type="number" placeholder="e.g. 5000" value={filters.minBudget} onChange={e => setFilters(f => ({ ...f, minBudget: e.target.value }))} style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--clay-3)', display: 'block', marginBottom: '0.35rem' }}>Max Budget (₹)</label>
                <input className="form-input" type="number" placeholder="e.g. 20000" value={filters.maxBudget} onChange={e => setFilters(f => ({ ...f, maxBudget: e.target.value }))} style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.625rem' }}>
              <button className="btn btn-terra btn-sm" onClick={applyFilters}>Apply filters</button>
              <button className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear all</button>
            </div>
            {activeFilterCount > 0 && (
              <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {Object.entries(appliedFilters).filter(([, v]) => v).map(([k, v]) => (
                  <span key={k} style={{ background: 'var(--terra-light)', color: 'var(--terra)', fontSize: '0.72rem', fontWeight: 700, padding: '3px 10px', borderRadius: 100 }}>
                    {k}: {v}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cards — FIX: added marginBottom so cards don't touch footer */}
        <div style={{ marginBottom: '3rem' }}>
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.25rem' }}>
              {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : tab === 'suggestions' ? (
            suggestions.length === 0 ? (
              <EmptyState icon="🔍" title="No suggestions yet" desc={profileIncomplete ? 'Complete your profile to start matching' : 'Check back later as more users join your city'} />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
                {suggestions.map(({ user: u, compatibilityScore, breakdown }, i) => (
                  <MatchCard
                    key={u._id} user={u} score={compatibilityScore} breakdown={breakdown}
                    expanded={expandedCard === u._id}
                    onExpand={() => setExpandedCard(expandedCard === u._id ? null : u._id)}
                    onLike={() => handleLike(u._id, u.name)}
                    onPass={() => handlePass(u._id)}
                    liking={actioning[u._id] === 'like'}
                    passing={actioning[u._id] === 'pass'}
                    style={{ animationDelay: `${i * 0.05}s` }}
                  />
                ))}
              </div>
            )
          ) : (
            matched.length === 0 ? (
              <EmptyState icon="❤️" title="No likes yet" desc="Go to Suggestions and like a profile to see them here" />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
                {matched.map(match => {
                  const other = match.userA?._id?.toString() === user?._id?.toString() ? match.userB : match.userA;
                  return other ? (
                    <MatchedCard key={match._id} match={match} other={other}
                      onChat={() => navigate('/chat', { state: { userId: other._id } })}
                      onReview={() => setReviewTarget(other)}
                    />
                  ) : null;
                })}
              </div>
            )
          )}
        </div>

      </div>{/* end flex:1 content wrapper */}

      {/* Match Modal */}
      {matchModal && (
        <MatchModal
          match={matchModal} currentUser={user}
          onClose={() => setMatchModal(null)}
          onChat={() => { setMatchModal(null); navigate('/chat'); }}
        />
      )}

      {/* Review Modal */}
      {reviewTarget && (
        <ReviewModal
          targetUser={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmitted={() => { setReviewTarget(null); toast('Review submitted! 🌟', 'success'); }}
        />
      )}

      {/* FIX: Footer sits at bottom, separated from cards by the margin above */}
      <Footer />
    </div>
  );
}

// ── MatchCard ──────────────────────────────────────────────────────────────
function MatchCard({ user: u, score, breakdown, expanded, onExpand, onLike, onPass, liking, passing, style }) {
  return (
    <div className="card" style={{ overflow: 'hidden', transition: 'all 0.3s var(--ease)', cursor: 'pointer', ...style }}
      onClick={onExpand}>
      {/* Header */}
      <div style={{ padding: 'clamp(1rem, 3vw, 1.25rem) clamp(1rem, 3vw, 1.25rem) 0', display: 'flex', gap: 'clamp(0.5rem, 2vw, 0.875rem)', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <Avatar name={u.name} src={u.profilePhoto} size="lg" />
        <div style={{ flex: 1, minWidth: '150px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
            <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 'clamp(0.9rem, 2vw, 1rem)' }}>{u.name}</h3>
            <IntentBadge intent={u.intent} />
          </div>
          <p style={{ fontSize: 'clamp(0.7rem, 1.5vw, 0.78rem)', color: 'var(--clay-3)', marginBottom: '0.3rem' }}>📍 {u.city}{u.area ? `, ${u.area}` : ''}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'clamp(0.65rem, 1.2vw, 0.7rem)', fontWeight: 700, color: u.trustScore >= 30 ? 'var(--forest)' : 'var(--terra)', background: u.trustScore >= 30 ? 'var(--forest-light)' : 'var(--terra-light)', padding: '2px 8px', borderRadius: 100 }}>
              Trust {u.trustScore}
            </span>
          </div>
        </div>
        <ScoreRing score={score} size={48} />
      </div>

      {/* AI Summary */}
      {u.aiSummary && (
        <div style={{ padding: '0.875rem 1.25rem 0', fontSize: '0.82rem', color: 'var(--clay-3)', lineHeight: 1.65, fontStyle: 'italic', borderTop: '1px solid var(--parchment-3)', marginTop: '0.875rem' }}>
          "{u.aiSummary}"
        </div>
      )}

      {/* Preference chips */}
      <div style={{ padding: '0.75rem 1.25rem 0', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {[
          u.preferences?.budgetMin && `₹${(u.preferences.budgetMin/1000).toFixed(0)}k–${(u.preferences.budgetMax/1000).toFixed(0)}k`,
          u.preferences?.sleepTime && `💤 ${u.preferences.sleepTime}`,
          u.preferences?.foodHabit && (u.preferences.foodHabit === 'veg' ? '🥦 Veg' : u.preferences.foodHabit === 'non-veg' ? '🍗 Non-veg' : '🥚 Eggetarian'),
          u.preferences?.personality && u.preferences.personality,
          u.preferences?.workFromHome && '🏠 WFH',
        ].filter(Boolean).map(c => <span key={c} className="chip">{c}</span>)}
      </div>

      {/* Expanded breakdown */}
      {expanded && breakdown && (
        <div style={{ padding: '0.875rem 1.25rem 0', borderTop: '1px solid var(--parchment-3)', marginTop: '0.875rem' }}
          onClick={e => e.stopPropagation()}>
          <p style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--clay-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.625rem' }}>Compatibility breakdown</p>
          <CompatBreakdown breakdown={breakdown} />
        </div>
      )}

      {/* Actions */}
      <div style={{ padding: '1rem 1.25rem 1.25rem', display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}
        onClick={e => e.stopPropagation()}>
        <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={onPass} disabled={passing}>
          {passing ? <Spinner dark size={14} /> : '✕ Pass'}
        </button>
        <button className="btn btn-terra btn-sm" style={{ flex: 2 }} onClick={onLike} disabled={liking}>
          {liking ? <Spinner size={14} /> : '♥ Like'}
        </button>
      </div>
    </div>
  );
}

// ── MatchedCard ────────────────────────────────────────────────────────────
function MatchedCard({ match, other, onChat, onReview }) {
  const isMutual = match.status === 'matched';
  return (
    <div className="card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      {/* Top colour bar: green for mutual, amber for pending */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: isMutual
          ? 'linear-gradient(90deg, var(--terra), var(--mauve))'
          : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
      }} />

      {/* Status badge */}
      <div style={{ position: 'absolute', top: 10, right: 10 }}>
        {isMutual ? (
          <span style={{ fontSize: '0.68rem', fontWeight: 800, background: 'var(--forest-light)', color: 'var(--forest)', padding: '2px 8px', borderRadius: 100 }}>
            ❤️ Mutual match
          </span>
        ) : (
          <span style={{ fontSize: '0.68rem', fontWeight: 800, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 100 }}>
            ⏳ Liked
          </span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
        <Avatar name={other.name} src={other.profilePhoto} size="lg" />
        <div>
          <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: '1rem', marginBottom: '0.2rem' }}>{other.name}</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--clay-3)' }}>📍 {other.city}</p>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--forest)', background: 'var(--forest-light)', padding: '2px 8px', borderRadius: 100 }}>
            {match.compatibilityScore}% compatible
          </span>
        </div>
      </div>

      {isMutual ? (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-terra btn-sm" style={{ flex: 2, justifyContent: 'center' }} onClick={onChat}>
            💬 Chat
          </button>
          <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={onReview}>
            ⭐ Review
          </button>
        </div>
      ) : (
        <div style={{ background: '#fef3c7', borderRadius: 10, padding: '0.625rem 0.875rem', fontSize: '0.82rem', color: '#78350f', fontWeight: 600, textAlign: 'center', lineHeight: 1.5 }}>
          ⏳ You liked <strong>{other.name}</strong>. Chat unlocks when they like you back.
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, title, desc }) {
  return (
    <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--clay-3)' }}>
      <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>{icon}</div>
      <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--clay-2)', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ fontSize: '0.875rem', maxWidth: 300, margin: '0 auto' }}>{desc}</p>
    </div>
  );
}