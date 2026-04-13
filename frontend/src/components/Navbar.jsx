import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Avatar, TrustRing } from './UI';

const NAV_ITEMS = [
  { label: 'Browse', path: '/matches' },
  { label: 'Messages', path: '/chat' },
  { label: 'Trust', path: '/trust' },
  { label: 'Profile', path: '/profile' },
];

export default function Navbar() {
  const { isAuthenticated, user, trustScore, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="nav">
      <button className="nav-logo" onClick={() => navigate('/')} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
        room<span>zy</span>
      </button>

      {isAuthenticated ? (
        <>
          <div className="nav-links">
            {NAV_ITEMS.map(({ label, path }) => (
              <button
                key={path}
                className={`nav-link ${pathname.startsWith(path) ? 'active' : ''}`}
                onClick={() => navigate(path)}
              >
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="nav-trust-pill">
              <TrustRing score={trustScore} size={26} strokeWidth={3} />
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--clay-2)' }}>{trustScore}</span>
            </div>
            <Avatar name={user?.name} src={user?.profilePhoto} size="sm" style={{ cursor: 'pointer' }} />
            <button className="btn btn-ghost btn-sm" onClick={logout}>Log out</button>
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/login')}>Log in</button>
          <button className="btn btn-terra btn-sm" onClick={() => navigate('/register')}>Get started</button>
        </div>
      )}
    </nav>
  );
}
