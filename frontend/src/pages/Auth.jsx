import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authApi } from '../api';
import { Spinner } from '../components/UI';

// ── Shared Auth Shell ──────────────────────────────────────────────────────
function AuthShell({ left, right }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', paddingTop: 68 }}>
      {/* Left panel */}
      <div style={{ flex: 1, background: 'var(--clay)', padding: '5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {left}
      </div>
      {/* Right form */}
      <div style={{ width: 460, flexShrink: 0, background: 'var(--parchment)', padding: '4rem 3rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', overflowY: 'auto' }}>
        {right}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════════════════════════════════════
export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Invalid email';
    if (!password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast('Welcome back! 👋', 'success');
      navigate('/matches');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      if (err.response?.status === 403 && err.response?.data?.requiresVerification) {
        toast('Please verify your email first', 'warning');
        navigate('/verify-email-pending', { state: { email } });
      } else {
        toast(msg, 'error');
        setErrors({ form: msg });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      left={
        <>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--parchment)', marginBottom: '1rem' }}>Welcome<br />back.</h2>
          <p style={{ color: 'var(--clay-4)', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: 380 }}>Your perfect roommate is waiting. Log in to continue your search.</p>
          <div style={{ marginTop: '3rem', borderLeft: '3px solid var(--terra)', paddingLeft: '1.5rem' }}>
            <blockquote style={{ fontStyle: 'italic', color: 'var(--parchment-3)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>"Found my roommate in 3 days. The compatibility score was spot-on!"</blockquote>
            <cite style={{ fontSize: '0.78rem', color: 'var(--clay-3)' }}>— Arjun K., Bangalore</cite>
          </div>
        </>
      }
      right={
        <form onSubmit={handleSubmit} noValidate>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.25rem' }}>Log in</h3>
          <p style={{ color: 'var(--clay-3)', fontSize: '0.875rem', marginBottom: '2rem' }}>Enter your credentials to continue</p>

          {errors.form && <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 'var(--r)', padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--danger)', marginBottom: '1.25rem' }}>{errors.form}</div>}

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label">Email address</label>
            <input className={`form-input ${errors.email ? 'error' : ''}`} type="email" value={email} onChange={e => { setEmail(e.target.value); setErrors({}); }} placeholder="you@example.com" />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label className="form-label">Password</label>
            <input className={`form-input ${errors.password ? 'error' : ''}`} type="password" value={password} onChange={e => { setPassword(e.target.value); setErrors({}); }} placeholder="••••••••" />
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          <div style={{ textAlign: 'right', marginBottom: '1.25rem' }}>
            <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--terra)', fontWeight: 600 }}>Forgot password?</Link>
          </div>

          <button className="btn btn-terra" style={{ width: '100%', justifyContent: 'center' }} type="submit" disabled={loading}>
            {loading ? <Spinner /> : 'Log in'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--clay-3)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--terra)', fontWeight: 700 }}>Sign up</Link>
          </p>
        </form>
      }
    />
  );
}

// ══════════════════════════════════════════════════════════════════════════
// REGISTER
// ══════════════════════════════════════════════════════════════════════════
const CITIES = ['Mumbai','Pune','Bangalore','Delhi','Hyderabad','Chennai','Kolkata','Ahmedabad'];

export function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', city: '', intent: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password || form.password.length < 6) e.password = 'Minimum 6 characters';
    if (!form.city) e.city = 'Select a city';
    if (!form.intent) e.intent = 'Select your intent';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await authApi.register(form);
      setDone(true);
      toast('Account created! Check your email.', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast(msg, 'error');
      setErrors({ form: msg });
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: 68, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📧</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '1rem' }}>Check your inbox</h2>
          <p style={{ color: 'var(--clay-3)', lineHeight: 1.7, marginBottom: '2rem' }}>
            We sent a verification link to <strong>{form.email}</strong>. Click it to activate your account, then log in.
          </p>
          <button className="btn btn-terra" onClick={() => navigate('/login')}>Go to login →</button>
        </div>
      </div>
    );
  }

  return (
    <AuthShell
      left={
        <>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '3rem', color: 'var(--parchment)', marginBottom: '1rem' }}>Join the<br />community.</h2>
          <p style={{ color: 'var(--clay-4)', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: 380, marginBottom: '2rem' }}>Over 12,000 people found their ideal roommate through Roomzy.</p>
          {['Smart compatibility scoring','Layered trust verification','Real-time chat with matches','AI roommate personality summary'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--parchment-2)', fontSize: '0.9rem', marginBottom: '0.625rem' }}>
              <span style={{ color: 'var(--terra-2)', fontWeight: 700 }}>✓</span>{t}
            </div>
          ))}
        </>
      }
      right={
        <form onSubmit={handleSubmit} noValidate>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.25rem' }}>Create account</h3>
          <p style={{ color: 'var(--clay-3)', fontSize: '0.875rem', marginBottom: '2rem' }}>Join Roomzy in under 2 minutes</p>

          {errors.form && <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 'var(--r)', padding: '0.75rem 1rem', fontSize: '0.85rem', color: 'var(--danger)', marginBottom: '1rem' }}>{errors.form}</div>}

          {[
            { label: 'Full name', key: 'name', type: 'text', placeholder: 'Priya Sharma' },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'priya@example.com' },
            { label: 'Password', key: 'password', type: 'password', placeholder: 'Min. 6 characters' },
          ].map(({ label, key, type, placeholder }) => (
            <div className="form-group" style={{ marginBottom: '1.1rem' }} key={key}>
              <label className="form-label">{label}</label>
              <input className={`form-input ${errors[key] ? 'error' : ''}`} type={type} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} />
              {errors[key] && <p className="form-error">{errors[key]}</p>}
            </div>
          ))}

          <div className="form-group" style={{ marginBottom: '1.1rem' }}>
            <label className="form-label">City</label>
            <select className={`form-input ${errors.city ? 'error' : ''}`} value={form.city} onChange={e => set('city', e.target.value)}>
              <option value="">Select your city</option>
              {CITIES.map(c => <option key={c}>{c}</option>)}
            </select>
            {errors.city && <p className="form-error">{errors.city}</p>}
          </div>

          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">I am looking to…</label>
            <div className="intent-grid" style={{ marginTop: '0.4rem' }}>
              {[
                { v: 'have_room_need_roommate', icon: '🏠', label: 'Have a room, need a roommate' },
                { v: 'looking_for_roommate', icon: '🔍', label: 'Find a room + roommate' },
              ].map(({ v, icon, label }) => (
                <div key={v} className={`intent-card ${form.intent === v ? 'selected' : ''}`} onClick={() => set('intent', v)}>
                  <div className="intent-icon">{icon}</div>
                  <div className="intent-label">{label}</div>
                </div>
              ))}
            </div>
            {errors.intent && <p className="form-error" style={{ marginTop: '0.4rem' }}>{errors.intent}</p>}
          </div>

          <button className="btn btn-terra" style={{ width: '100%', justifyContent: 'center' }} type="submit" disabled={loading}>
            {loading ? <Spinner /> : 'Create account'}
          </button>

          <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--clay-3)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--terra)', fontWeight: 700 }}>Log in</Link>
          </p>
        </form>
      }
    />
  );
}

// ══════════════════════════════════════════════════════════════════════════
// FORGOT PASSWORD
// ══════════════════════════════════════════════════════════════════════════
export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast(err.response?.data?.message || 'Error sending email', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 68, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card" style={{ maxWidth: 420, width: '100%', padding: '2.5rem' }}>
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📬</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.75rem' }}>Email sent!</h3>
            <p style={{ color: 'var(--clay-3)', fontSize: '0.875rem' }}>Check your inbox for the password reset link. It expires in 1 hour.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>Reset password</h3>
            <p style={{ color: 'var(--clay-3)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Enter your email to receive a reset link</p>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Email</label>
              <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
            </div>
            <button className="btn btn-terra" style={{ width: '100%', justifyContent: 'center' }} type="submit" disabled={loading}>
              {loading ? <Spinner /> : 'Send reset link'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link to="/login" style={{ fontSize: '0.875rem', color: 'var(--terra)', fontWeight: 600 }}>← Back to login</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// RESET PASSWORD
// ══════════════════════════════════════════════════════════════════════════
export function ResetPassword() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const token = window.location.pathname.split('/').pop();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) { toast('Minimum 6 characters', 'error'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      toast('Password reset! You can now log in.', 'success');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast(err.response?.data?.message || 'Reset failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 68, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card" style={{ maxWidth: 420, width: '100%', padding: '2.5rem' }}>
        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h3>Password reset!</h3>
            <p style={{ color: 'var(--clay-3)', marginTop: '0.5rem' }}>Redirecting to login…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>New password</h3>
            <p style={{ color: 'var(--clay-3)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>Enter your new password</p>
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">New password</label>
              <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" />
              <p className="form-hint">Must be at least 6 characters</p>
            </div>
            <button className="btn btn-terra" style={{ width: '100%', justifyContent: 'center' }} type="submit" disabled={loading}>
              {loading ? <Spinner /> : 'Reset password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
