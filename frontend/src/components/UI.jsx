import { useState, useEffect } from 'react';

// ── Avatar ─────────────────────────────────────────────────────────────────
const COLORS = [
  ['#F5E8E1','#7A3520'], ['#DCF0E6','#1A4A35'], ['#DDE8F5','#1E3F62'],
  ['#EFE9F8','#4E3470'], ['#FDF3DC','#7A4F0A'], ['#FDECEA','#7A1F15'],
];
function colorFor(str = '') {
  const idx = str.charCodeAt(0) % COLORS.length;
  return COLORS[idx];
}
export function Avatar({ name = '', src, size = 'md', className = '' }) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const [bg, text] = colorFor(name);
  const [imgError, setImgError] = useState(false);
  
  return (
    <div
      className={`avatar avatar-${size} ${className}`}
      style={{ background: bg, color: text }}
    >
      {src && !imgError ? (
        <img 
          src={src} 
          alt={name} 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          onError={() => setImgError(true)}
        />
      ) : initials}
    </div>
  );
}

// ── TrustRing ──────────────────────────────────────────────────────────────
export function TrustRing({ score = 0, size = 80, strokeWidth = 7 }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 70 ? 'var(--forest)' : score >= 30 ? 'var(--terra)' : 'var(--danger)';

  return (
    <div className="trust-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--parchment-3)" strokeWidth={strokeWidth} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.34,1.2,0.64,1)' }}
        />
      </svg>
      <div className="trust-ring-label">
        <span style={{ fontFamily: 'var(--font-display)', fontSize: size * 0.22, fontWeight: 900, color: 'var(--clay)', lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: size * 0.10, color: 'var(--clay-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>/100</span>
      </div>
    </div>
  );
}

// ── ScoreRing (compact) ────────────────────────────────────────────────────
export function ScoreRing({ score = 0, size = 48 }) {
  const r = (size - 5) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? 'var(--forest)' : score >= 60 ? 'var(--terra)' : 'var(--slate)';
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--parchment-3)" strokeWidth="4.5" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="4.5"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.65rem',fontWeight:800,color:'var(--clay)' }}>
        {score}%
      </div>
    </div>
  );
}

// ── CompatBar ──────────────────────────────────────────────────────────────
const BAR_LABELS = { budget:'Budget', sleepTime:'Sleep', cleanliness:'Clean', foodHabit:'Food', genderPreference:'Gender', noiseTolerance:'Noise', personality:'Vibe', location:'Location' };
export function CompatBreakdown({ breakdown = {} }) {
  const color = (v) => v >= 80 ? 'var(--forest)' : v >= 60 ? 'var(--terra)' : 'var(--slate)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {Object.entries(breakdown).map(([k, v]) => (
        <div key={k} className="compat-row">
          <span className="compat-label">{BAR_LABELS[k] || k}</span>
          <div className="compat-track">
            <div className="compat-fill" style={{ width: `${v}%`, background: color(v) }} />
          </div>
          <span className="compat-val">{v}</span>
        </div>
      ))}
    </div>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────
export function Spinner({ dark = false, size = 20 }) {
  return <div className={`spinner ${dark ? 'dark' : ''}`} style={{ width: size, height: size }} />;
}

// ── MatchModal ─────────────────────────────────────────────────────────────
export function MatchModal({ match, currentUser, onClose, onChat }) {
  const other = match?.userA?._id === currentUser?._id ? match?.userB : match?.userA;
  useEffect(() => {
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', animation: 'matchPop 0.5s var(--ease)' }}>
        <Confetti />
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎉</div>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--terra)', marginBottom: '0.5rem' }}>It's a Match!</h2>
        <p style={{ color: 'var(--clay-3)', marginBottom: '1.5rem' }}>You and <strong>{other?.name}</strong> liked each other</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
          <Avatar name={currentUser?.name} size="lg" />
          <span style={{ fontSize: '1.5rem' }}>❤️</span>
          <Avatar name={other?.name} src={other?.profilePhoto} size="lg" />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Keep browsing</button>
          <button className="btn btn-terra" style={{ flex: 1 }} onClick={onChat}>Start chatting →</button>
        </div>
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 16 }, (_, i) => ({
    id: i, color: ['#B85C38','#2D6A4F','#3A5F8A','#7B5EA7','#D4860B'][i % 5],
    left: `${Math.random() * 100}%`, delay: `${Math.random() * 0.5}s`,
  }));
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', borderRadius: 'var(--r-xl)' }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', top: '-10px', left: p.left,
          width: 8, height: 8, borderRadius: 2,
          background: p.color, animation: `confetti 1.5s ease-out ${p.delay} forwards`,
        }} />
      ))}
    </div>
  );
}

// ── TrustLayerRow ──────────────────────────────────────────────────────────
export function TrustLayerRow({ label, pts, done }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
        background: done ? 'var(--forest)' : 'var(--parchment-3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {done && <svg viewBox="0 0 12 12" width="10" height="10"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>}
      </div>
      <span style={{ flex: 1, fontSize: '0.82rem', color: done ? 'var(--clay)' : 'var(--clay-3)' }}>{label}</span>
      <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: done ? 'var(--forest)' : 'var(--clay-4)' }}>+{pts}pts</span>
    </div>
  );
}

// ── Skeleton Loader ────────────────────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
        <div className="skeleton" style={{ width: 52, height: 52, borderRadius: '50%' }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 12, width: '40%' }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: 12, marginBottom: 6 }} />
      <div className="skeleton" style={{ height: 12, width: '80%', marginBottom: 6 }} />
      <div className="skeleton" style={{ height: 12, width: '65%', marginBottom: '1rem' }} />
      <div style={{ display: 'flex', gap: 8 }}>
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 24, width: 60, borderRadius: 100 }} />)}
      </div>
    </div>
  );
}

// ── IntentBadge ────────────────────────────────────────────────────────────
export function IntentBadge({ intent }) {
  const isHave = intent === 'have_room_need_roommate';
  return (
    <span className={`badge ${isHave ? 'badge-slate' : 'badge-forest'}`}>
      {isHave ? '🏠 Has Room' : '🔍 Needs Room'}
    </span>
  );
}
