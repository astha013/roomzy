import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar, Spinner } from '../components/UI';
import Footer from '../components/Footer';
import FakeProfileDashboard from './FakeProfileDashboard';

const TABS = [
  { id: 'stats',       label: '📊 Overview' },
  { id: 'users',       label: '👥 Users' },
  { id: 'reports',     label: '🚨 Reports' },
  { id: 'fake-detect', label: '🤖 Fake Detection' },
];

export default function Admin() {
  const { isAdmin, user: me, loading: authLoading } = useAuth();
  const toast    = useToast();
  const navigate = useNavigate();

  const [tab,     setTab]     = useState('stats');
  const [stats,   setStats]   = useState(null);
  const [users,   setUsers]   = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  // Double-guard: redirect non-admins even if they somehow hit /admin
  useEffect(() => {
    if (!authLoading && !isAdmin) navigate('/matches', { replace: true });
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (!isAdmin) return;
    const load = async () => {
      setLoading(true);
      try {
        if (tab === 'stats') {
          const { data } = await adminApi.getStats();
          setStats(data);
        } else if (tab === 'users') {
          const { data } = await adminApi.getUsers();
          setUsers(data);
        } else if (tab === 'reports') {
          const { data } = await adminApi.getReports();
          setReports(data);
        }
        // fake-detect tab is rendered by its own component
      } catch (err) {
        toast(err.response?.data?.message || 'Failed to load', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [tab, isAdmin]);

  const toggleBlock = async (u) => {
    const fn = u.isBlocked ? adminApi.unblockUser : adminApi.blockUser;
    try {
      const { data } = await fn(u._id);
      setUsers(prev => prev.map(x => x._id === u._id ? { ...x, isBlocked: data.user.isBlocked } : x));
      toast(`${u.name} ${u.isBlocked ? 'unblocked' : 'blocked'}`, 'success');
    } catch {
      toast('Action failed', 'error');
    }
  };

  const resolveReport = async (id, status, actionTaken) => {
    try {
      await adminApi.updateReport(id, { status, actionTaken, resolution: `Action: ${actionTaken}` });
      toast('Report updated', 'success');
      setReports(r => r.map(rep => rep._id === id ? { ...rep, status } : rep));
    } catch {
      toast('Update failed', 'error');
    }
  };

  if (authLoading || !isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner dark size={32} />
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    [u.name, u.email, u.city].some(f => f?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--parchment)', paddingTop: 68 }}>
      {/* Owner-only header bar */}
      <div style={{ background: 'var(--clay)', color: 'white', padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.4rem' }}>🛡️</span>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>Admin Dashboard</div>
            <div style={{ fontSize: '0.72rem', opacity: 0.65 }}>Owner: {me?.name} · {me?.email}</div>
          </div>
        </div>
        <button
          onClick={() => navigate('/matches')}
          style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', borderRadius: 100, padding: '0.35rem 1rem', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 700 }}
        >
          ← Back to app
        </button>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.75rem' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              border: 'none',
              background: tab === t.id ? 'var(--clay)' : 'white',
              color: tab === t.id ? 'white' : 'var(--clay-3)',
              padding: '0.5rem 1.25rem', borderRadius: 100, cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.85rem',
              boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.18s',
            }}>{t.label}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem' }}><Spinner dark size={32} /></div>
        ) : tab === 'stats' && stats ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              {[
                { label: 'Total Users',     value: stats.totalUsers,     emoji: '👥', color: 'var(--slate)' },
                { label: 'Trusted (30+)',   value: stats.trustedUsers,   emoji: '✅', color: 'var(--forest)' },
                { label: 'Blocked Users',   value: stats.blockedUsers,   emoji: '🚫', color: 'var(--danger)' },
                { label: 'Pending Reports', value: stats.pendingReports, emoji: '⚠️', color: 'var(--warning)' },
              ].map(({ label, value, emoji, color }) => (
                <div key={label} className="card" style={{ padding: '1.5rem', borderTop: `4px solid ${color}` }}>
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{emoji}</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.25rem', fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--clay-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.4rem' }}>{label}</div>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontWeight: 800, marginBottom: '0.75rem', fontSize: '0.9rem' }}>Quick actions</h4>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => setTab('users')}>Manage users →</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setTab('reports')}>
                  Review reports
                  {stats.pendingReports > 0 && (
                    <span style={{ background: 'var(--danger)', color: 'white', borderRadius: 100, fontSize: '0.65rem', fontWeight: 900, padding: '1px 7px', marginLeft: 6 }}>
                      {stats.pendingReports}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : tab === 'users' ? (
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--parchment-3)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <input
                className="form-input"
                placeholder="🔍 Search name, email or city…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ maxWidth: 320, fontSize: '0.85rem' }}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--clay-3)' }}>
                {filteredUsers.length} of {users.length} users
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ background: 'var(--parchment-2)' }}>
                    {['User', 'Email', 'City', 'Trust', 'Intent', 'Food', 'Status', 'Action'].map(h => (
                      <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--clay-3)', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u, i) => (
                    <tr key={u._id} style={{ borderTop: '1px solid var(--parchment-3)', background: u.isBlocked ? '#fff5f5' : i % 2 === 0 ? 'white' : 'var(--parchment)' }}>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <Avatar name={u.name} size="sm" />
                          <div>
                            <div style={{ fontWeight: 700 }}>{u.name}</div>
                            {u.isAdmin && <div style={{ fontSize: '0.6rem', color: 'var(--terra)', fontWeight: 800, letterSpacing: '0.05em' }}>ADMIN</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', color: 'var(--clay-3)', fontSize: '0.78rem' }}>{u.email}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>{u.city || '—'}</td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontWeight: 800, color: u.trustScore >= 30 ? 'var(--forest)' : 'var(--terra)' }}>{u.trustScore}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'var(--parchment-2)', padding: '2px 8px', borderRadius: 100 }}>
                          {u.intent === 'have_room_need_roommate' ? '🏠 Has Room' : '🔍 Seeking'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                        {u.preferences?.foodHabit === 'veg' ? '🥦 Veg' : u.preferences?.foodHabit === 'non-veg' ? '🍗 Non-veg' : '🥚 Egget.'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                          background: u.isBlocked ? '#fde8e8' : u.isEmailVerified ? 'var(--forest-light)' : 'var(--parchment-3)',
                          color: u.isBlocked ? 'var(--danger)' : u.isEmailVerified ? 'var(--forest-text)' : 'var(--clay-3)',
                        }}>
                          {u.isBlocked ? 'Blocked' : u.isEmailVerified ? 'Active' : 'Unverified'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        {u._id !== me?._id && (
                          <button
                            onClick={() => toggleBlock(u)}
                            style={{
                              border: `1.5px solid ${u.isBlocked ? 'var(--forest)' : 'var(--danger)'}`,
                              background: 'transparent',
                              color: u.isBlocked ? 'var(--forest)' : 'var(--danger)',
                              padding: '0.25rem 0.75rem', borderRadius: 100, cursor: 'pointer',
                              fontSize: '0.72rem', fontWeight: 800, fontFamily: 'var(--font-body)',
                              transition: 'all 0.15s',
                            }}
                          >
                            {u.isBlocked ? '✓ Unblock' : '✕ Block'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--clay-3)' }}>No users match your search</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : tab === 'reports' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {reports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--clay-3)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>✅</div>
                <div style={{ fontWeight: 700 }}>No reports — all clear!</div>
              </div>
            ) : reports.map(r => (
              <div key={r._id} className="card" style={{
                padding: '1.25rem',
                borderLeft: `4px solid ${r.status === 'pending' ? 'var(--warning)' : r.status === 'resolved' ? 'var(--forest)' : 'var(--parchment-3)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                      {r.reporter?.name || '?'} <span style={{ color: 'var(--clay-4)' }}>reported</span> <span style={{ color: 'var(--danger)' }}>{r.reportedUser?.name || '?'}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--clay-3)' }}>
                      Reason: <strong>{r.reason}</strong> · {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    {r.description && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--clay-2)', marginTop: '0.5rem', fontStyle: 'italic' }}>"{r.description}"</p>
                    )}
                  </div>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 800, padding: '3px 10px', borderRadius: 100,
                    background: r.status === 'pending' ? '#fff3cd' : r.status === 'resolved' ? 'var(--forest-light)' : 'var(--parchment-2)',
                    color: r.status === 'pending' ? '#856404' : r.status === 'resolved' ? 'var(--forest-text)' : 'var(--clay-3)',
                  }}>
                    {r.status.toUpperCase()}
                  </span>
                </div>
                {r.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => resolveReport(r._id, 'dismissed', 'none')}>Dismiss</button>
                    <button
                      onClick={() => resolveReport(r._id, 'resolved', 'warned')}
                      style={{ background: 'var(--warning)', color: 'white', border: 'none', borderRadius: 100, padding: '0.35rem 1rem', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-body)', fontWeight: 700 }}
                    >⚠️ Warn user</button>
                    <button
                      onClick={() => resolveReport(r._id, 'resolved', 'block')}
                      style={{ background: 'var(--danger)', color: 'white', border: 'none', borderRadius: 100, padding: '0.35rem 1rem', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'var(--font-body)', fontWeight: 700 }}
                    >🚫 Block user</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {tab === 'fake-detect' && <FakeProfileDashboard />}
      <Footer />
    </div>
  );
}
