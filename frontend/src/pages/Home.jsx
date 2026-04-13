import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const CITIES = ['Mumbai', 'Pune', 'Bangalore', 'Delhi', 'Hyderabad', 'Chennai'];

const TRUST_LAYERS = [
  { icon: '📧', pts: '+10', title: 'Email Verified', desc: 'Auto-granted on registration.' },
  { icon: '📱', pts: '+20', title: 'Phone OTP', desc: 'Verify Indian mobile number.' },
  { icon: '🤳', pts: '+20', title: 'Selfie Liveness', desc: 'Prove you\'re a real person.' },
  { icon: '🔗', pts: '+10', title: 'Social Links', desc: 'LinkedIn, Instagram, college or company email.' },
  { icon: '⭐', pts: '+30', title: 'Roommate Reviews', desc: 'Up to 3 past roommate reviews.' },
  { icon: '🪪', pts: '+10', title: 'Govt. ID (optional)', desc: 'Aadhar, PAN, Passport.' },
];

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  // Responsive styles
  const heroStyle = {
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    paddingTop: 68,
    overflow: 'hidden',
  };

  const leftColStyle = {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: 'clamp(2rem, 5vw, 5rem) clamp(1.5rem, 4vw, 4rem)',
  };

  const rightColStyle = {
    background: 'var(--parchment-2)',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    minHeight: 750,
  };

  const statsStyle = {
    display: 'flex',
    gap: 'clamp(1rem, 3vw, 2.5rem)',
    flexWrap: 'wrap',
  };

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={heroStyle}>
        {/* Left */}
        <div style={leftColStyle}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'var(--terra-light)', color: 'var(--terra-text)',
            fontSize: 'clamp(0.65rem, 1.5vw, 0.72rem)', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '0.35rem 0.875rem', borderRadius: 100, marginBottom: '1.5rem', width: 'fit-content',
          }}>
            <span style={{ width: 6, height: 6, background: 'var(--terra)', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
            {CITIES.join(' · ')}
          </div>

          <h1 style={{ fontSize: 'clamp(2rem, 6vw, 4.2rem)', fontWeight: 900, letterSpacing: '-1.5px', marginBottom: '1.25rem', lineHeight: 1.06 }}>
            Find your <em style={{ fontStyle: 'italic', color: 'var(--terra)' }}>perfect</em><br />
            roommate match
          </h1>

          <p style={{ fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', color: 'var(--clay-3)', maxWidth: 440, lineHeight: 1.7, marginBottom: '2.5rem' }}>
            Smart compatibility scoring + layered trust verification. Connect with roommates who genuinely fit your lifestyle.
          </p>

          <div style={{ display: 'flex', gap: '0.875rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
            <button className="btn btn-terra btn-lg" onClick={() => navigate(isAuthenticated ? '/matches' : '/register')}>
              Find Roommates →
            </button>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate('/matches')}>
              Browse Profiles
            </button>
          </div>

          <div style={statsStyle}>
            {[['12K+','Active users'],['94%','Match accuracy'],['4.8★','Avg. rating']].map(([n,l]) => (
              <div key={l}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.3rem, 3vw, 1.7rem)', fontWeight: 900, color: 'var(--clay)' }}>{n}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--clay-3)', fontWeight: 600 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — floating cards */}
        <div style={rightColStyle}>
          {/* Decorative circles */}
          <div style={{ position:'absolute',width:'clamp(280px, 50vw, 400px)',height:'clamp(280px, 50vw, 400px)',borderRadius:'50%',border:'1px solid var(--parchment-3)',top:'50%',left:'50%',transform:'translate(-50%,-50%)' }} />
          <div style={{ position:'absolute',width:'clamp(180px, 35vw, 280px)',height:'clamp(180px, 35vw, 280px)',borderRadius:'50%',background:'var(--terra-light)',opacity:0.4,top:'20%',right:'10%' }} />

          <div className="float-cards-container" style={{ position: 'relative', width: 360, height: 700, padding: '40px 0' }}>
            {/* Card 1 - Priya (top left) */}
            <FloatCard style={{ top: 40, left: 0, animationDelay: '0s' }}>
              <MiniMatchCard name="Priya Sharma" city="Koramangala, Bangalore" score={92} trust={78} intent="have_room_need_roommate" />
            </FloatCard>
            {/* Card 2 - Arjun (middle right) */}
            <FloatCard style={{ top: 220, right: 0, animationDelay: '1.4s' }}>
              <MiniMatchCard name="Arjun Kapoor" city="Bandra, Mumbai" score={85} trust={62} intent="looking_for_roommate" />
            </FloatCard>
            {/* Card 3 - Neha (bottom left) */}
            <FloatCard style={{ top: 400, left: 0, animationDelay: '2.8s' }}>
              <MiniMatchCard name="Neha Kulkarni" city="Hinjewadi, Pune" score={78} trust={55} intent="have_room_need_roommate" />
            </FloatCard>
            {/* Card 4 - Rahul (extra card bottom right) */}
            <FloatCard style={{ top: 580, right: 0, animationDelay: '3.5s' }}>
              <MiniMatchCard name="Rahul Verma" city="Andheri, Mumbai" score={81} trust={70} intent="have_room_need_roommate" />
            </FloatCard>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(3rem, 8vw, 6rem) clamp(1rem, 4vw, 5rem)', background: 'white' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 'clamp(2rem, 5vw, 3.5rem)' }}>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.4rem)', fontWeight: 700, marginBottom: '0.75rem' }}>How Roomzy works</h2>
            <p style={{ color: 'var(--clay-3)', fontSize: 'clamp(0.9rem, 2vw, 1.05rem)' }}>Three steps to your perfect match</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
            {[
              { n: '01', icon: '📋', title: 'Create your profile', desc: 'Share your intent, preferences, budget, and move-in date. Our AI writes your personality summary.' },
              { n: '02', icon: '🛡️', title: 'Build trust score', desc: 'Verify phone, selfie, social links. Reach 30+ points to unlock chat and full matching.' },
              { n: '03', icon: '🤝', title: 'Match & connect', desc: 'Browse top 20 compatibility-ranked matches. Mutual likes unlock real-time chat.' },
            ].map(({ n, icon, title, desc }) => (
              <div key={n} style={{ textAlign: 'center' }}>
                <div style={{ width: 'clamp(50px, 10vw, 64px)', height: 'clamp(50px, 10vw, 64px)', borderRadius: '50%', background: 'var(--parchment-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', fontSize: 'clamp(1.25rem, 3vw, 1.75rem)' }}>{icon}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--terra)', fontWeight: 700, marginBottom: '0.5rem' }}>{n}</div>
                <h3 style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(0.9rem, 2vw, 1rem)', fontWeight: 800, marginBottom: '0.5rem' }}>{title}</h3>
                <p style={{ color: 'var(--clay-3)', fontSize: 'clamp(0.8rem, 1.5vw, 0.875rem)', lineHeight: 1.65 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST SYSTEM ─────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(3rem, 8vw, 6rem) clamp(1rem, 4vw, 5rem)', background: 'var(--clay)', color: 'var(--parchment)' }}>
        <div className="container">
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 700, marginBottom: '0.75rem' }}>A trust system<br />that actually works</h2>
            <p style={{ color: 'var(--clay-4)', fontSize: 'clamp(0.9rem, 2vw, 1.05rem)', marginBottom: 'clamp(2rem, 5vw, 3.5rem)', maxWidth: 480, margin: '0 auto' }}>No government ID required to start. Build trust through multiple verified layers.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'clamp(1rem, 3vw, 1.25rem)' }}>
            {TRUST_LAYERS.map(({ icon, pts, title, desc }) => (
              <div key={title} style={{
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--r-lg)',
                padding: 'clamp(1rem, 3vw, 1.75rem)', transition: 'all 0.25s', cursor: 'default',
                background: 'rgba(255,255,255,0.04)',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.25)'; e.currentTarget.style.transform='translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.transform='none'; }}
              >
                <div style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', marginBottom: '0.75rem' }}>{icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 900, color: 'var(--terra-2)', marginBottom: '0.4rem' }}>{pts}</div>
                <h3 style={{ fontFamily: 'var(--font-body)', fontSize: 'clamp(0.85rem, 1.5vw, 0.95rem)', fontWeight: 700, marginBottom: '0.4rem' }}>{title}</h3>
                <p style={{ fontSize: 'clamp(0.75rem, 1.2vw, 0.825rem)', color: '#9a9589', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section style={{ padding: 'clamp(3rem, 8vw, 6rem) 2rem', textAlign: 'center', background: 'var(--terra-light)' }}>
        <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, marginBottom: '1rem', color: 'var(--clay)' }}>Ready to find your roommate?</h2>
        <p style={{ color: 'var(--clay-3)', fontSize: 'clamp(0.95rem, 2vw, 1.1rem)', marginBottom: 'clamp(1.5rem, 4vw, 2rem)' }}>Join 12,000+ people who found their perfect match</p>
        <button className="btn btn-terra btn-lg" onClick={() => navigate('/register')}>Get started — it's free</button>
      </section>
    </div>
  );
}

function FloatCard({ children, style }) {
  return (
    <div style={{
      position: 'absolute', background: 'white', borderRadius: 'var(--r-lg)',
      boxShadow: 'var(--shadow-lg)', padding: 'clamp(1rem, 3vw, 1.25rem)', width: 'clamp(200px, 55vw, 230px)',
      animation: 'float 4s ease-in-out infinite', zIndex: 1, ...style,
    }}>
      {children}
    </div>
  );
}

function MiniMatchCard({ name, city, score, trust, intent }) {
  const initials = name.split(' ').map(w => w[0]).join('');
  const colors = [['#F5E8E1','#7A3520'],['#DCF0E6','#1A4A35'],['#DDE8F5','#1E3F62']];
  const [bg, col] = colors[name.charCodeAt(0) % 3];
  const barColor = score >= 85 ? 'var(--forest)' : score >= 70 ? 'var(--terra)' : 'var(--slate)';
  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.75rem' }}>
        <div style={{ width: 'clamp(32px, 8vw, 38px)', height: 'clamp(32px, 8vw, 38px)', borderRadius: '50%', background: bg, color: col, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 'clamp(0.7rem, 1.5vw, 0.82rem)', flexShrink: 0 }}>{initials}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 'clamp(0.8rem, 1.8vw, 0.85rem)', color: 'var(--clay)' }}>{name}</div>
          <div style={{ fontSize: 'clamp(0.65rem, 1.2vw, 0.7rem)', color: 'var(--clay-3)' }}>📍 {city}</div>
        </div>
      </div>
      <div style={{ height: 4, background: 'var(--parchment-3)', borderRadius: 100, overflow: 'hidden', marginBottom: '0.25rem' }}>
        <div style={{ width: `${score}%`, height: '100%', background: barColor, borderRadius: 100 }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'clamp(0.6rem, 1.2vw, 0.68rem)', color: 'var(--clay-3)', marginBottom: '0.5rem' }}>
        <span>Compatibility</span>
        <strong style={{ color: barColor }}>{score}%</strong>
      </div>
      <div style={{ textAlign: 'center' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--forest-light)', color: 'var(--forest-text)', fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', borderRadius: 100 }}>
          ✓ Trust {trust}
        </span>
      </div>
    </div>
  );
}
