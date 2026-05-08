import { useState, useEffect } from 'react';
import { fakeProfileApi, adminApi } from '../api';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/UI';

const VERDICT_COLORS = {
  genuine:     { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  suspicious:  { bg: '#fefce8', text: '#ca8a04', border: '#fde68a' },
  likely_fake: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
};

const VERDICT_ICONS = { genuine: '✅', suspicious: '⚠️', likely_fake: '🚨' };

function ScoreBar({ score }) {
  const color = score >= 60 ? '#ef4444' : score >= 30 ? '#f59e0b' : '#22c55e';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: '#f1f5f9', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${score}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s' }} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: 800, color }}>{score}%</span>
    </div>
  );
}

export default function FakeProfileDashboard() {
  const toast = useToast();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [blocking, setBlocking] = useState(null);

  useEffect(() => {
    fakeProfileApi.scan()
      .then(({ data }) => setProfiles(data))
      .catch(() => toast('Failed to load suspicious profiles', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const handleBlock = async (userId) => {
    setBlocking(userId);
    try {
      await adminApi.blockUser(userId);
      setProfiles(prev => prev.filter(p => p._id !== userId));
      toast('User blocked successfully', 'success');
    } catch { toast('Failed to block user', 'error'); }
    finally { setBlocking(null); }
  };

  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const filtered = filter === 'all' ? profiles : profiles.filter(p => p.fakeAnalysis?.verdict === filter);

  const counts = {
    likely_fake: profiles.filter(p => p.fakeAnalysis?.verdict === 'likely_fake').length,
    suspicious:  profiles.filter(p => p.fakeAnalysis?.verdict === 'suspicious').length,
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, marginBottom: 4 }}>🤖 AI Fake Profile Detection</h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--clay-3)' }}>ML-based analysis of suspicious user accounts</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {counts.likely_fake > 0 && (
            <span style={{ background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca', padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 800 }}>
              🚨 {counts.likely_fake} Likely Fake
            </span>
          )}
          {counts.suspicious > 0 && (
            <span style={{ background: '#fefce8', color: '#ca8a04', border: '1.5px solid #fde68a', padding: '4px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 800 }}>
              ⚠️ {counts.suspicious} Suspicious
            </span>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['all', 'likely_fake', 'suspicious'].map(v => (
          <button key={v} onClick={() => setFilter(v)}
            style={{ padding: '6px 16px', borderRadius: 20, border: `1.5px solid ${filter === v ? 'var(--terra)' : 'var(--parchment-3)'}`, background: filter === v ? 'var(--terra-light)' : 'white', color: filter === v ? 'var(--terra-text)' : 'var(--clay-3)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
            {v === 'all' ? 'All Flagged' : v.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}><Spinner dark /></div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--clay-3)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
          <p>No suspicious profiles found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {filtered.map(user => {
            const { verdict, fakeScore, signals } = user.fakeAnalysis || {};
            const colors = VERDICT_COLORS[verdict] || VERDICT_COLORS.suspicious;

            return (
              <div key={user._id} style={{ background: 'white', borderRadius: 14, padding: '1.25rem', border: `1.5px solid ${colors.border}`, display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                {/* Avatar */}
                <div style={{ flexShrink: 0 }}>
                  {user.profilePhoto ? (
                    <img src={`${BASE}${user.profilePhoto}`} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: colors.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>👤</div>
                  )}
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>{user.name}</span>
                      <span style={{ marginLeft: 8, fontSize: '0.75rem', color: 'var(--clay-3)' }}>{user.email}</span>
                    </div>
                    <span style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`, padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 800 }}>
                      {VERDICT_ICONS[verdict]} {verdict?.replace('_', ' ')}
                    </span>
                  </div>

                  <ScoreBar score={fakeScore || 0} />

                  {/* Signals */}
                  {signals?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: '0.5rem' }}>
                      {signals.map(s => (
                        <span key={s} style={{ background: colors.bg, color: colors.text, padding: '2px 8px', borderRadius: 6, fontSize: '0.67rem', fontWeight: 700 }}>
                          {s.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ flexShrink: 0 }}>
                  <button
                    onClick={() => handleBlock(user._id)}
                    disabled={blocking === user._id}
                    style={{ padding: '6px 14px', borderRadius: 8, border: '1.5px solid #ef4444', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', fontWeight: 800, fontSize: '0.78rem' }}>
                    {blocking === user._id ? '...' : '🚫 Block'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
