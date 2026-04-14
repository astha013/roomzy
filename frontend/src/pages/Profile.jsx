import { useState, useEffect, useRef } from 'react';
import { profileApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar, TrustRing, Spinner } from '../components/UI';
import Footer from '../components/Footer';

const CITIES = ['Mumbai','Pune','Bangalore','Delhi','Hyderabad','Chennai','Kolkata','Ahmedabad','Jaipur','Surat'];

const WEIGHT_FIELDS = [
  { key: 'budget',          label: 'Budget' },
  { key: 'sleepTime',       label: 'Sleep Schedule' },
  { key: 'cleanliness',     label: 'Cleanliness' },
  { key: 'foodHabit',       label: 'Food Habit' },
  { key: 'genderPreference',label: 'Gender Preference' },
  { key: 'noiseTolerance',  label: 'Noise Tolerance' },
  { key: 'personality',     label: 'Personality' },
  { key: 'location',        label: 'Location' },
];

function Opt({ label, value, active, onClick }) {
  return (
    <div className={`opt ${active ? 'active' : ''}`} onClick={onClick}>{label}</div>
  );
}

function SliderRow({ label, min, max, value, onChange, format }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--clay-2)' }}>{label}</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--terra)' }}>
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range" min={min} max={max} value={value} step="1"
        style={{ '--pct': `${pct}%` }}
        onChange={e => onChange(Number(e.target.value))}
      />
    </div>
  );
}

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);

  const [saving, setSaving] = useState({ profile: false, prefs: false, weights: false, photo: false });
  const [photoUploading, setPhotoUploading] = useState(false);

  // Basic profile state
  const [profile, setProfile] = useState({
    name: '', bio: '', city: '', area: '', gender: 'prefer_not_to_say',
    dateOfBirth: '', intent: '',
  });

  // Preferences state — mirrors User model exactly
  const [prefs, setPrefs] = useState({
    budgetMin: 5000, budgetMax: 20000,
    sleepTime: 'flexible', smoking: 'no', drinking: 'no',
    foodHabit: 'veg', cleanliness: 3, guestsAllowed: true,
    workFromHome: false, genderPreference: 'any', language: 'English',
    personality: 'ambivert', noiseTolerance: 3, acPreference: 'any',
    pets: 'no', religion: '', moveInDate: '',
  });

  // Weight sliders (0–5)
  const [weights, setWeights] = useState({
    budget: 3, sleepTime: 3, cleanliness: 3, foodHabit: 3,
    genderPreference: 2, noiseTolerance: 2, personality: 3, location: 3,
  });

  // Hydrate from user object
  useEffect(() => {
    if (!user) return;
    setProfile({
      name:        user.name || '',
      bio:         user.bio || '',
      city:        user.city || '',
      area:        user.area || '',
      gender:      user.gender || 'prefer_not_to_say',
      dateOfBirth: user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : '',
      intent:      user.intent || '',
    });
    if (user.preferences) {
      setPrefs(p => ({
        ...p,
        ...user.preferences,
        moveInDate: user.preferences.moveInDate ? user.preferences.moveInDate.slice(0, 10) : '',
      }));
    }
    if (user.preferenceWeights) {
      setWeights(w => ({ ...w, ...user.preferenceWeights }));
    }
  }, [user]);

  // ── Save basic profile ───────────────────────────────────────────────────
  const saveProfile = async () => {
    setSaving(s => ({ ...s, profile: true }));
    try {
      await profileApi.updateProfile({
        name: profile.name, phone: profile.phone,
        city: profile.city, area: profile.area,
        bio: profile.bio, dateOfBirth: profile.dateOfBirth,
        gender: profile.gender, intent: profile.intent,
      });
      await refreshUser();
      toast('Profile saved ✓', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Save failed', 'error');
    } finally {
      setSaving(s => ({ ...s, profile: false }));
    }
  };

  // ── Save preferences ─────────────────────────────────────────────────────
  const savePreferences = async () => {
    setSaving(s => ({ ...s, prefs: true }));
    try {
      const { moveInDate, ...rest } = prefs;
      await profileApi.updatePreferences({
        preferences: rest,
        moveInDate: moveInDate || undefined,
        city: profile.city,
        area: profile.area,
        intent: profile.intent,
      });
      await refreshUser();
      toast('Preferences saved ✓', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Save failed', 'error');
    } finally {
      setSaving(s => ({ ...s, prefs: false }));
    }
  };

  // ── Save weights ─────────────────────────────────────────────────────────
  const saveWeights = async () => {
    setSaving(s => ({ ...s, weights: true }));
    try {
      await profileApi.updateWeights(weights);
      await refreshUser();
      toast('Preference weights saved ✓', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Save failed', 'error');
    } finally {
      setSaving(s => ({ ...s, weights: false }));
    }
  };

  // ── Upload photo ─────────────────────────────────────────────────────────
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast('Max 5 MB allowed', 'error'); return; }
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append('profilePhoto', file);
      await profileApi.uploadPhoto(fd);
      await refreshUser();
      toast('Photo updated ✓', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setPhotoUploading(false);
    }
  };

  const setP = (k, v) => setPrefs(p => ({ ...p, [k]: v }));

  return (
    <div className="page-pad" style={{ padding: '2rem 0', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 2rem', display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>

        {/* ── LEFT: forms ── */}
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, marginBottom: '0.25rem' }}>Your Profile</h2>
          <p style={{ color: 'var(--clay-3)', marginBottom: '2rem', fontSize: '0.875rem' }}>Complete your profile to improve match quality and unlock features</p>

          {/* ── Photo + Basic ── */}
          <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
            <SectionTitle>Basic Info</SectionTitle>

            {/* Photo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ position: 'relative' }}>
                <Avatar name={user?.name || ''} src={user?.profilePhoto} size="xl" />
                {photoUploading && (
                  <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(45,31,20,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Spinner size={18} />
                  </div>
                )}
              </div>
              <div>
                <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()} disabled={photoUploading}>
                  {photoUploading ? 'Uploading…' : 'Change photo'}
                </button>
                <p className="form-hint" style={{ marginTop: '0.4rem' }}>JPEG, PNG or WebP · Max 5 MB</p>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handlePhotoChange} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full name</label>
                <input className="form-input" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Your name" />
              </div>
              <div className="form-group">
                <label className="form-label">City</label>
                <select className="form-input" value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))}>
                  <option value="">Select city</option>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Area / Locality</label>
                <input className="form-input" value={profile.area} onChange={e => setProfile(p => ({ ...p, area: e.target.value }))} placeholder="e.g. Koramangala" />
              </div>
              <div className="form-group">
                <label className="form-label">Gender</label>
                <select className="form-input" value={profile.gender} onChange={e => setProfile(p => ({ ...p, gender: e.target.value }))}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date of birth</label>
                <input className="form-input" type="date" value={profile.dateOfBirth} onChange={e => setProfile(p => ({ ...p, dateOfBirth: e.target.value }))} />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Bio</label>
              <textarea className="form-input" rows={3} value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} placeholder="Tell potential roommates about yourself… (max 500 chars)" maxLength={500} />
              <p className="form-hint">{profile.bio.length}/500</p>
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">I am looking to…</label>
              <div className="intent-grid" style={{ marginTop: '0.4rem' }}>
                {[
                  { v: 'have_room_need_roommate', icon: '🏠', label: 'Have a room, need a roommate' },
                  { v: 'looking_for_roommate',    icon: '🔍', label: 'Find a room + roommate' },
                ].map(({ v, icon, label }) => (
                  <div key={v} className={`intent-card ${profile.intent === v ? 'selected' : ''}`} onClick={() => setProfile(p => ({ ...p, intent: v }))}>
                    <div className="intent-icon">{icon}</div>
                    <div className="intent-label">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <button className="btn btn-primary" onClick={saveProfile} disabled={saving.profile}>
              {saving.profile ? <Spinner size={16} /> : 'Save basic info'}
            </button>
          </div>

          {/* ── Preferences ── */}
          <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
            <SectionTitle>Living Preferences</SectionTitle>

            {/* Budget */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Monthly Budget (₹)</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--clay-3)', marginBottom: '0.3rem' }}>Minimum</p>
                  <input className="form-input" type="number" min={0} step={500} value={prefs.budgetMin} onChange={e => setP('budgetMin', Number(e.target.value))} />
                </div>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--clay-3)', marginBottom: '0.3rem' }}>Maximum</p>
                  <input className="form-input" type="number" min={0} step={500} value={prefs.budgetMax} onChange={e => setP('budgetMax', Number(e.target.value))} />
                </div>
              </div>
            </div>

            {/* Move-in date */}
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Move-in Date</label>
              <input className="form-input" type="date" value={prefs.moveInDate} onChange={e => setP('moveInDate', e.target.value)} />
              <p className="form-hint">Required for matching · matches within ±15 days</p>
            </div>

            {/* Enum opts */}
            {[
              { key: 'sleepTime',        label: 'Sleep Schedule',     opts: [{ v:'early',label:'🌅 Early bird'},{ v:'late',label:'🦉 Night owl'},{ v:'flexible',label:'🔄 Flexible'}] },
              { key: 'foodHabit',        label: 'Food Habit',         opts: [{ v:'veg',label:'🥦 Veg'},{ v:'non-veg',label:'🍗 Non-veg'},{ v:'eggetarian',label:'🥚 Eggetarian'}] },
              { key: 'smoking',          label: 'Smoking',            opts: [{ v:'no',label:'🚭 No'},{ v:'yes',label:'🚬 Yes'},{ v:'occasional',label:'Occasional'}] },
              { key: 'drinking',         label: 'Drinking',           opts: [{ v:'no',label:'🚱 No'},{ v:'yes',label:'🍺 Yes'},{ v:'occasional',label:'Occasional'}] },
              { key: 'personality',      label: 'Personality',        opts: [{ v:'introvert',label:'🧘 Introvert'},{ v:'ambivert',label:'⚖️ Ambivert'},{ v:'extrovert',label:'🎉 Extrovert'}] },
              { key: 'genderPreference', label: 'Preferred Gender',   opts: [{ v:'any',label:'Any'},{ v:'male',label:'Male'},{ v:'female',label:'Female'}] },
              { key: 'acPreference',     label: 'AC Preference',      opts: [{ v:'any',label:'Any'},{ v:'ac',label:'❄️ AC'},{ v:'non-ac',label:'🌬️ Non-AC'}] },
              { key: 'pets',             label: 'Pets',               opts: [{ v:'no',label:'🚫 No pets'},{ v:'yes',label:'🐾 Love pets'},{ v:'allergic',label:'⚠️ Allergic'}] },
            ].map(({ key, label, opts }) => (
              <div className="form-group" style={{ marginBottom: '1rem' }} key={key}>
                <label className="form-label">{label}</label>
                <div className="opt-group" style={{ marginTop: '0.35rem' }}>
                  {opts.map(o => <Opt key={o.v} label={o.label} value={o.v} active={prefs[key] === o.v} onClick={() => setP(key, o.v)} />)}
                </div>
              </div>
            ))}

            {/* Boolean opts */}
            {[
              { key: 'guestsAllowed', label: 'Guests Allowed',  trueLabel: '✓ Allowed', falseLabel: '✕ No guests' },
              { key: 'workFromHome',  label: 'Work From Home',  trueLabel: '🏠 Yes WFH', falseLabel: '🏢 No WFH' },
            ].map(({ key, label, trueLabel, falseLabel }) => (
              <div className="form-group" style={{ marginBottom: '1rem' }} key={key}>
                <label className="form-label">{label}</label>
                <div className="opt-group" style={{ marginTop: '0.35rem' }}>
                  <Opt label={trueLabel}  active={prefs[key] === true}  onClick={() => setP(key, true)} />
                  <Opt label={falseLabel} active={prefs[key] === false} onClick={() => setP(key, false)} />
                </div>
              </div>
            ))}

            {/* Numeric sliders */}
            <SliderRow label="Cleanliness" min={1} max={5} value={prefs.cleanliness} onChange={v => setP('cleanliness', v)} format={v => `${v}/5`} />
            <SliderRow label="Noise Tolerance" min={1} max={5} value={prefs.noiseTolerance} onChange={v => setP('noiseTolerance', v)} format={v => `${v}/5`} />

            {/* Language / Religion */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">Language</label>
                <input className="form-input" value={prefs.language} onChange={e => setP('language', e.target.value)} placeholder="English" />
              </div>
              <div className="form-group">
                <label className="form-label">Religion (optional)</label>
                <input className="form-input" value={prefs.religion} onChange={e => setP('religion', e.target.value)} placeholder="Leave blank to skip" />
              </div>
            </div>

            <button className="btn btn-primary" onClick={savePreferences} disabled={saving.prefs}>
              {saving.prefs ? <Spinner size={16} /> : 'Save preferences'}
            </button>
          </div>

          {/* ── Preference Weights ── */}
          <div className="card" style={{ padding: '1.75rem', marginBottom: '1.5rem' }}>
            <SectionTitle>What Matters Most to You?</SectionTitle>
            <p style={{ fontSize: '0.82rem', color: 'var(--clay-3)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Drag these sliders to weight the matching algorithm. Higher = more important.
            </p>
            {WEIGHT_FIELDS.map(({ key, label }) => (
              <SliderRow key={key} label={label} min={0} max={5} value={weights[key]} onChange={v => setWeights(w => ({ ...w, [key]: v }))} format={v => `${v}/5`} />
            ))}
            <button className="btn btn-primary" onClick={saveWeights} disabled={saving.weights}>
              {saving.weights ? <Spinner size={16} /> : 'Save weights'}
            </button>
          </div>
        </div>

        {/* ── RIGHT: trust snapshot ── */}
        <div style={{ position: 'sticky', top: 84 }}>
          <div className="card" style={{ padding: '1.75rem', marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: '1rem', marginBottom: '1.25rem' }}>Your Trust Score</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <TrustRing score={user?.trustScore ?? 0} size={88} strokeWidth={7} />
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--clay)', marginBottom: '0.2rem' }}>
                  {(user?.trustScore ?? 0) >= 30 ? '✅ Trusted' : '⚠️ Build more trust'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--clay-3)' }}>
                  {(user?.trustScore ?? 0) >= 30 ? 'Chat & matching unlocked' : `${30 - (user?.trustScore ?? 0)} more pts to unlock chat`}
                </div>
              </div>
            </div>

            {/* Trust layers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {[
                { label: 'Email verified',       done: user?.isEmailVerified,       pts: 10 },
                { label: 'Phone OTP',             done: user?.phoneVerified,         pts: 20 },
                { label: 'Selfie liveness',       done: user?.selfieVerified,        pts: 20 },
                { label: 'Social links',          done: Object.values(user?.socialLinks || {}).some(Boolean), pts: 10 },
                { label: 'Roommate reviews',      done: (user?.reviewTrustPoints ?? 0) > 0, pts: 30 },
                { label: 'Govt. ID (optional)',   done: user?.governmentIdVerified,  pts: 10 },
              ].map(({ label, done, pts }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: done ? 'var(--forest)' : 'var(--parchment-3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {done && <svg viewBox="0 0 12 12" width="10" height="10"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>}
                  </div>
                  <span style={{ flex: 1, fontSize: '0.82rem', color: done ? 'var(--clay)' : 'var(--clay-3)' }}>{label}</span>
                  <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: done ? 'var(--forest)' : 'var(--clay-4)' }}>+{pts}</span>
                </div>
              ))}
            </div>

            <a href="/trust" className="btn btn-terra btn-sm" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', display: 'flex' }}>
              Build trust score →
            </a>
          </div>

          {/* AI Summary */}
          {user?.aiSummary && (
            <div className="card" style={{ padding: '1.25rem' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--clay-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>✨ AI Personality Summary</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--clay-2)', lineHeight: 1.65, fontStyle: 'italic' }}>"{user.aiSummary}"</p>
              <p style={{ fontSize: '0.7rem', color: 'var(--clay-3)', marginTop: '0.625rem' }}>Auto-generated from your preferences</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 style={{ fontFamily: 'var(--font-body)', fontSize: '0.95rem', fontWeight: 800, marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--parchment-3)', color: 'var(--clay)' }}>
      {children}
    </h3>
  );
}
