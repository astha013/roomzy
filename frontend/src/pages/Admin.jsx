import { useState, useEffect } from 'react';
import { adminApi } from '../api';
import { useToast } from '../context/ToastContext';
import { Avatar, Spinner } from '../components/UI';

export default function Admin() {
  const toast = useToast();
  const [tab, setTab] = useState('stats');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      } catch (err) {
        toast(err.response?.data?.message || 'Load failed', 'error');
      } finally { setLoading(false); }
    };
    load();
  }, [tab]);

  const resolveReport = async (id, status, actionTaken) => {
    try {
      await adminApi.updateReport(id, { status, actionTaken, resolution: `Action: ${actionTaken}` });
      toast('Report updated', 'success');
      setReports(r => r.map(rep => rep._id === id ? { ...rep, status } : rep));
    } catch { toast('Update failed', 'error'); }
  };

  return (
    <div className="page-pad" style={{ padding: '2rem 3rem', minHeight: '100vh' }}>
      <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, marginBottom: '1.75rem' }}>Admin Dashboard</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--parchment-3)', paddingBottom: '1rem' }}>
        {['stats','users','reports'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            border: 'none', background: tab === t ? 'var(--clay)' : 'transparent',
            color: tab === t ? 'white' : 'var(--clay-3)',
            padding: '0.5rem 1.25rem', borderRadius: 100, cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.875rem', textTransform: 'capitalize',
            transition: 'all 0.2s',
          }}>{t}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem' }}><Spinner dark size={28} /></div>
      ) : tab === 'stats' && stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.25rem' }}>
          {[
            { label: 'Total Users',     value: stats.totalUsers,    color: 'var(--slate)' },
            { label: 'Trusted Users',   value: stats.trustedUsers,  color: 'var(--forest)' },
            { label: 'Blocked Users',   value: stats.blockedUsers,  color: 'var(--danger)' },
            { label: 'Pending Reports', value: stats.pendingReports,color: 'var(--warning)' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card" style={{ padding: '1.5rem', borderTop: `3px solid ${color}` }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--clay-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>{label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 900, color }}>{value}</div>
            </div>
          ))}
        </div>
      ) : tab === 'users' ? (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ background: 'var(--parchment-2)' }}>
                {['User','Email','City','Trust','Intent','Status'].map(h => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--clay-3)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u._id} style={{ borderTop: '1px solid var(--parchment-3)', background: i % 2 === 0 ? 'white' : 'var(--parchment)' }}>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Avatar name={u.name} size="sm" />
                      <span style={{ fontWeight: 600 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.875rem 1rem', color: 'var(--clay-3)' }}>{u.email}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>{u.city || '—'}</td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: u.trustScore >= 30 ? 'var(--forest)' : 'var(--terra)' }}>{u.trustScore}</span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    <span className={`badge ${u.intent === 'have_room_need_roommate' ? 'badge-slate' : 'badge-forest'}`} style={{ fontSize: '0.65rem' }}>
                      {u.intent === 'have_room_need_roommate' ? 'Has Room' : 'Seeking'}
                    </span>
                  </td>
                  <td style={{ padding: '0.875rem 1rem' }}>
                    {u.isBlocked
                      ? <span className="badge badge-terra">Blocked</span>
                      : u.isEmailVerified
                      ? <span className="badge badge-forest">Active</span>
                      : <span className="badge badge-clay">Unverified</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : tab === 'reports' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {reports.length === 0 && <p style={{ color: 'var(--clay-3)', textAlign: 'center', padding: '3rem' }}>No reports</p>}
          {reports.map(r => (
            <div key={r._id} className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginBottom: '0.875rem' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                    {r.reporter?.name || '?'} → {r.reportedUser?.name || '?'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--clay-3)', marginBottom: '0.5rem' }}>
                    Reason: <strong>{r.reason}</strong> · {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                  {r.description && <p style={{ fontSize: '0.82rem', color: 'var(--clay-2)' }}>{r.description}</p>}
                </div>
                <span className={`badge ${r.status === 'pending' ? 'badge-terra' : r.status === 'resolved' ? 'badge-forest' : 'badge-clay'}`}>
                  {r.status}
                </span>
              </div>
              {r.status === 'pending' && (
                <div style={{ display: 'flex', gap: '0.625rem' }}>
                  <button className="btn btn-sm btn-ghost" onClick={() => resolveReport(r._id,'dismissed','none')}>Dismiss</button>
                  <button className="btn btn-sm" style={{ background:'var(--warning)',color:'white',border:'none',borderRadius:100,cursor:'pointer' }} onClick={() => resolveReport(r._id,'resolved','warned')}>Warn user</button>
                  <button className="btn btn-sm btn-danger" onClick={() => resolveReport(r._id,'resolved','block')}>Block user</button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
