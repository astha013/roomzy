import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar, ScoreRing, CompatBreakdown, SkeletonCard, IntentBadge, MatchModal, Spinner } from '../components/UI';
import Footer from '../components/Footer';

// Helper for responsive clamp
const clamp = (min, preferred, max) => `clamp(${min}, ${preferred}, ${max})`;

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
  const [actioning, setActioning]     = useState({}); // userId -> 'like'|'pass'
  const [matchModal, setMatchModal]   = useState(null); // match object
  const [expandedCard, setExpandedCard] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'suggestions') {
        const { data } = await matchApi.getSuggestions();
        setSuggestions(data);
      } else {
        const { data } = await matchApi.getMatched();
        setMatched(data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.includes('move-in date') || msg.includes('intent')) {
        toast('Complete your profile to see matches', 'warning');
      }
    } finally {
      setLoading(false);
    }
  }, [tab, toast]);

  useEffect(() => { 
    load();
    window.scrollTo(0, 0);
  }, [load]);

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
    <div className="page-pad" style={{ padding: 'calc(68px + clamp(1rem, 3vw, 2rem)) clamp(0.0001rem, 3vw, 0.0001rem) clamp(0.0001rem, 3vw, 0.0001rem)', minHeight: '100vh' }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.5rem, 4vw, 2rem)', fontWeight: 700, marginBottom: '0.25rem' }}>
            Roommate Matches
          </h2>
          <p style={{ color: 'var(--clay-3)', fontSize: '0.875rem' }}>
            {user?.city ? `Top matches in ${user.city}` : 'Set your city to see local matches'}
          </p>
        </div>
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

      {/* Cards */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.25rem' }}>
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : tab === 'suggestions' ? (
        suggestions.length === 0 ? (
          <EmptyState icon="🔍" title="No suggestions yet" desc={profileIncomplete ? 'Complete your profile to start matching' : 'Check back later as more users join your city'} />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
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
          <EmptyState icon="❤️" title="No matches yet" desc="Like a profile and wait for them to like you back" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '1.25rem', position: 'relative', zIndex: 1 }}>
            {matched.map(match => {
              const other = match.userA?._id === user?._id ? match.userB : match.userA;
              return other ? (
                <MatchedCard key={match._id} match={match} other={other} onChat={() => navigate('/chat', { state: { userId: other._id } })} />
              ) : null;
            })}
          </div>
        )
      )}

      {/* Match Modal */}
      {matchModal && (
        <MatchModal
          match={matchModal} currentUser={user}
          onClose={() => setMatchModal(null)}
          onChat={() => { setMatchModal(null); navigate('/chat'); }}
        />
      )}

      <Footer />
    </div>
  );
}

// ── MatchCard ──────────────────────────────────────────────────────────────
function MatchCard({ user: u, score, breakdown, expanded, onExpand, onLike, onPass, liking, passing, style }) {
  const bgColor = score >= 85 ? 'var(--forest)' : score >= 70 ? 'var(--terra)' : 'var(--slate)';

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
        <button
          className="btn btn-ghost btn-sm"
          style={{ flex: 1 }}
          onClick={onPass}
          disabled={passing}
        >
          {passing ? <Spinner dark size={14} /> : '✕ Pass'}
        </button>
        <button
          className="btn btn-terra btn-sm"
          style={{ flex: 2 }}
          onClick={onLike}
          disabled={liking}
        >
          {liking ? <Spinner size={14} /> : '♥ Like'}
        </button>
      </div>
    </div>
  );
}

// ── MatchedCard ────────────────────────────────────────────────────────────
function MatchedCard({ match, other, onChat }) {
  return (
    <div className="card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--terra), var(--mauve))' }} />
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
      <button className="btn btn-terra btn-sm" style={{ width: '100%', justifyContent: 'center' }} onClick={onChat}>
        💬 Start chatting
      </button>
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
