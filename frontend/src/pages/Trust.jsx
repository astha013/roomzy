import { useState, useEffect, useRef } from 'react';
import { otpApi, livenessApi, socialApi, verificationApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { TrustRing, TrustLayerRow, Spinner } from '../components/UI';
import Footer from '../components/Footer';

export default function Trust() {
  const { user, refreshUser, trustScore } = useAuth();
  const toast = useToast();

  return (
    <div className="page-pad" style={{ minHeight: '100vh', padding: '0rem 0rem', marginTop: '6rem' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2.5rem' }}>
          <TrustRing score={trustScore} size={96} strokeWidth={8} />
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 900, marginBottom: '0.25rem' }}>Build Your Trust Score</h2>
            <p style={{ color: 'var(--clay-3)', fontSize: '0.9rem', maxWidth: 440 }}>
              Earn points through verification layers. Reach <strong>30+</strong> to unlock chat and matching.
            </p>
            {trustScore < 30 && (
              <div style={{ marginTop: '0.75rem', background: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: 'var(--r)', padding: '0.5rem 0.875rem', fontSize: '0.82rem', color: 'var(--warning)' }}>
                ⚠️ {30 - trustScore} more points needed to unlock chat
              </div>
            )}
            {trustScore >= 30 && (
              <div style={{ marginTop: '0.75rem', background: 'var(--forest-light)', border: '1px solid var(--forest)', borderRadius: 'var(--r)', padding: '0.5rem 0.875rem', fontSize: '0.82rem', color: 'var(--forest)' }}>
                ✓ Chat & matching unlocked!
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--clay-3)', marginBottom: '0.4rem' }}>
            <span>Progress</span><span>{trustScore}/100</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill progress-terra" style={{ width: `${trustScore}%` }} />
          </div>
        </div>

        {/* Layer 1: Email — auto-done */}
        <LayerCard
          icon="📧" title="Email Verified" pts={10}
          done={user?.isEmailVerified}
          doneMsg="Your email is verified. +10 points earned."
          todoMsg="Verify your email to earn 10 trust points."
        >
          {!user?.isEmailVerified && (
            <p style={{ fontSize: '0.85rem', color: 'var(--clay-3)' }}>Check your inbox for the verification link sent on registration.</p>
          )}
        </LayerCard>

        {/* Layer 2: Phone OTP */}
        <OTPLayer user={user} toast={toast} refreshUser={refreshUser} />

        {/* Layer 3: Selfie Liveness */}
        <LivenessLayer user={user} toast={toast} refreshUser={refreshUser} />

        {/* Layer 4: Social Links */}
        <SocialLayer user={user} toast={toast} refreshUser={refreshUser} />

        {/* Layer 5: Govt ID (optional) */}
        <GovtIDLayer user={user} toast={toast} refreshUser={refreshUser} />

        {/* Layer 6: Reviews — info only */}
        <LayerCard
          icon="⭐" title="Roommate Reviews" pts={30}
          done={(user?.reviewTrustPoints ?? 0) > 0}
          doneMsg={`+${user?.reviewTrustPoints ?? 0} pts from roommate reviews.`}
          todoMsg="Get reviewed by past roommates to earn up to 30 points."
          optional
        >
          <p style={{ fontSize: '0.82rem', color: 'var(--clay-3)', lineHeight: 1.6 }}>
            After staying with a roommate, they can leave you a review worth up to 10 points each (max 3 reviews).
            Reviews appear on your public profile.
          </p>
        </LayerCard>
      </div>
      <Footer />
    </div>
  );
}

// ── Reusable card shell ────────────────────────────────────────────────────
function LayerCard({ icon, title, pts, done, doneMsg, todoMsg, optional, children }) {
  const [open, setOpen] = useState(!done);
  return (
    <div className="card" style={{ marginBottom: '1.25rem', overflow: 'hidden' }}>
      <div
        style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', background: done ? 'var(--forest-light)' : 'white' }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800 }}>{title}</h4>
            {optional && <span className="badge badge-clay" style={{ fontSize: '0.6rem' }}>OPTIONAL</span>}
          </div>
          <p style={{ fontSize: '0.8rem', color: done ? 'var(--forest-text)' : 'var(--clay-3)' }}>
            {done ? doneMsg : todoMsg}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', flexShrink: 0 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '1rem', color: done ? 'var(--forest)' : 'var(--terra)' }}>+{pts}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--clay-3)', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
        </div>
      </div>
      {open && !done && (
        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid var(--parchment-3)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ── Phone OTP ──────────────────────────────────────────────────────────────
function OTPLayer({ user, toast, refreshUser }) {
  const [phone, setPhone] = useState(user?.phoneNumber || '');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(user?.phoneVerified ? 'done' : 'phone'); // phone | sent | done
  const [loading, setLoading] = useState(false);

  const sendOTP = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) { toast('Enter a valid 10-digit Indian mobile number', 'error'); return; }
    setLoading(true);
    try {
      await otpApi.send(phone);
      setStep('sent');
      toast('OTP sent! Check the server console (dev mode)', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to send OTP', 'error');
    } finally { setLoading(false); }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) { toast('Enter the 6-digit OTP', 'error'); return; }
    setLoading(true);
    try {
      const { data } = await otpApi.verify(phone, otp);
      await refreshUser();
      setStep('done');
      toast(`Phone verified! Trust score: ${data.trustScore}`, 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Invalid OTP', 'error');
    } finally { setLoading(false); }
  };

  return (
    <LayerCard icon="📱" title="Phone OTP" pts={20} done={user?.phoneVerified}
      doneMsg={`Phone ${user?.phoneNumber || ''} verified. +20 points earned.`}
      todoMsg="Verify your Indian mobile number with a 6-digit OTP.">
      {step === 'phone' && (
        <div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Mobile number</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input className="form-input" style={{ flex: 1 }} value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" maxLength={10} />
              <button className="btn btn-terra btn-sm" onClick={sendOTP} disabled={loading} style={{ flexShrink: 0 }}>
                {loading ? <Spinner size={14} /> : 'Send OTP'}
              </button>
            </div>
            <p className="form-hint">10-digit number starting with 6-9</p>
          </div>
        </div>
      )}
      {step === 'sent' && (
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--clay-3)', marginBottom: '1rem' }}>
            OTP sent to <strong>{phone}</strong>. In dev mode, check the server console.
          </p>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">Enter OTP</label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input className="form-input" style={{ flex: 1, letterSpacing: '0.25em', fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" maxLength={6} />
              <button className="btn btn-forest btn-sm" onClick={verifyOTP} disabled={loading || otp.length !== 6} style={{ flexShrink: 0 }}>
                {loading ? <Spinner size={14} /> : 'Verify'}
              </button>
            </div>
          </div>
          <button style={{ background: 'none', border: 'none', color: 'var(--terra)', fontSize: '0.82rem', cursor: 'pointer', fontWeight: 600 }} onClick={() => setStep('phone')}>
            ← Change number
          </button>
        </div>
      )}
    </LayerCard>
  );
}

// ── Selfie Liveness ────────────────────────────────────────────────────────
function LivenessLayer({ user, toast, refreshUser }) {
  const [step, setStep] = useState(user?.selfieVerified ? 'done' : 'capture'); // capture | captured | done
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast('Max 5 MB', 'error'); return; }
    setPreview(URL.createObjectURL(file));
    uploadSelfie(file);
  };

  const uploadSelfie = async (file) => {
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('selfie', file);
      await livenessApi.capture(fd);
      setStep('captured');
      toast('Selfie uploaded! Now verify liveness.', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Upload failed', 'error');
    } finally { setLoading(false); }
  };

  const verifyLiveness = async () => {
    setLoading(true);
    try {
      const { data } = await livenessApi.verify();
      await refreshUser();
      setStep('done');
      toast(`Liveness verified! Score: ${data.livenessScore}. Trust: ${data.trustScore}`, 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Verification failed', 'error');
    } finally { setLoading(false); }
  };

  return (
    <LayerCard icon="🤳" title="Selfie Liveness" pts={20} done={user?.selfieVerified}
      doneMsg={`Selfie verified (score: ${user?.livenessScore ?? '—'}). +20 points earned.`}
      todoMsg="Take a selfie to prove you're a real person.">
      {step === 'capture' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 120, height: 120, borderRadius: '50%', border: '3px dashed var(--clay-4)', margin: '0 auto 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', background: 'var(--parchment-2)' }}>
            {loading ? <Spinner dark /> : '🤳'}
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--clay-3)', marginBottom: '1rem' }}>Upload a clear selfie showing your face</p>
          <button className="btn btn-terra" onClick={() => fileRef.current?.click()} disabled={loading}>
            {loading ? 'Uploading…' : 'Choose selfie'}
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      )}
      {step === 'captured' && (
        <div style={{ textAlign: 'center' }}>
          {preview && <img src={preview} alt="selfie" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', margin: '0 auto 1rem', display: 'block', border: '3px solid var(--terra)' }} />}
          <p style={{ fontSize: '0.85rem', color: 'var(--clay-3)', marginBottom: '1rem' }}>Selfie uploaded. Click verify to run liveness check.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => { setStep('capture'); setPreview(null); }}>Retake</button>
            <button className="btn btn-forest" onClick={verifyLiveness} disabled={loading}>
              {loading ? <Spinner size={14} /> : 'Verify liveness →'}
            </button>
          </div>
        </div>
      )}
    </LayerCard>
  );
}

// ── Social Links ───────────────────────────────────────────────────────────
function SocialLayer({ user, toast, refreshUser }) {
  const [links, setLinks] = useState({
    linkedin: user?.socialLinks?.linkedin || '',
    instagram: user?.socialLinks?.instagram || '',
    collegeEmail: user?.socialLinks?.collegeEmail || '',
    companyEmail: user?.socialLinks?.companyEmail || '',
  });
  const [loading, setLoading] = useState(false);
  const done = Object.values(user?.socialLinks || {}).some(v => v && typeof v === 'string' && v.length > 0);

  const save = async () => {
    setLoading(true);
    try {
      await socialApi.save(links);
      await refreshUser();
      toast('Social links saved! Pending manual verification.', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Save failed', 'error');
    } finally { setLoading(false); }
  };

  return (
    <LayerCard icon="🔗" title="Social Links" pts={10} done={done}
      doneMsg="Social links saved. Each verified link adds 2.5 points (max 4 links)."
      todoMsg="Add LinkedIn, Instagram, college or company email for up to 10 points.">
      <p style={{ fontSize: '0.82rem', color: 'var(--clay-3)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
        Each verified link adds 2.5 points · Max 4 links · Reviewed manually
      </p>
      {[
        { key: 'linkedin',    label: 'LinkedIn URL',      placeholder: 'https://linkedin.com/in/yourname', verified: user?.socialLinks?.linkedinVerified },
        { key: 'instagram',   label: 'Instagram URL',     placeholder: 'https://instagram.com/yourhandle', verified: user?.socialLinks?.instagramVerified },
        { key: 'collegeEmail',label: 'College Email',     placeholder: 'you@iit.ac.in',                   verified: user?.socialLinks?.collegeEmailVerified },
        { key: 'companyEmail',label: 'Company Email',     placeholder: 'you@company.com',                 verified: user?.socialLinks?.companyEmailVerified },
      ].map(({ key, label, placeholder, verified }) => (
        <div className="form-group" style={{ marginBottom: '0.875rem' }} key={key}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {label}
            {verified && <span style={{ background: 'var(--forest-light)', color: 'var(--forest-text)', fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 100 }}>✓ Verified +2.5pts</span>}
          </label>
          <input className="form-input" value={links[key]} onChange={e => setLinks(l => ({ ...l, [key]: e.target.value }))} placeholder={placeholder} />
        </div>
      ))}
      <button className="btn btn-terra" onClick={save} disabled={loading} style={{ marginTop: '0.5rem' }}>
        {loading ? <Spinner size={14} /> : 'Save social links'}
      </button>
    </LayerCard>
  );
}

// ── Govt ID ────────────────────────────────────────────────────────────────
function GovtIDLayer({ user, toast, refreshUser }) {
  const [docType, setDocType] = useState('aadhar');
  const [docNumber, setDocNumber] = useState('');
  const [step, setStep] = useState(user?.governmentIdVerified ? 'done' : 'upload');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const uploadID = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('idDocument', file);
      fd.append('idDocumentType', docType);
      if (docNumber) fd.append('idDocumentNumber', docNumber);
      await verificationApi.uploadId(fd);
      setStep('uploaded');
      toast('ID uploaded! Click verify to finalize.', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Upload failed', 'error');
    } finally { setLoading(false); }
  };

  const verifyID = async () => {
    setLoading(true);
    try {
      const { data } = await verificationApi.verifyId();
      await refreshUser();
      setStep('done');
      toast(`Govt ID verified! Hash stored. Trust: ${data.trustScore}`, 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Verification failed', 'error');
    } finally { setLoading(false); }
  };

  return (
    <LayerCard icon="🪪" title="Government ID" pts={10} done={user?.governmentIdVerified}
      doneMsg="Government ID verified. Blockchain hash stored. +10 points."
      todoMsg="Optional — upload Aadhar, PAN, Passport or Driving License." optional>
      {step === 'upload' && (
        <div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label">ID Type</label>
            <div className="opt-group">
              {[{v:'aadhar',l:'Aadhar'},{v:'pan',l:'PAN'},{v:'passport',l:'Passport'},{v:'driving_license',l:'Driving License'}].map(o => (
                <div key={o.v} className={`opt ${docType === o.v ? 'active' : ''}`} onClick={() => setDocType(o.v)}>{o.l}</div>
              ))}
            </div>
          </div>
          {docType === 'aadhar' && (
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Aadhar Number (12 digits)</label>
              <input className="form-input" value={docNumber} onChange={e => setDocNumber(e.target.value.replace(/\D/g,'').slice(0,12))} placeholder="XXXXXXXXXXXX" maxLength={12} style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.15em' }} />
            </div>
          )}
          <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current?.click()} disabled={loading}>
            {loading ? 'Uploading…' : '📎 Upload ID document'}
          </button>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={uploadID} />
          <p className="form-hint" style={{ marginTop: '0.5rem' }}>JPEG or PNG · Max 5MB · No data stored on blockchain</p>
        </div>
      )}
      {step === 'uploaded' && (
        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--clay-3)', marginBottom: '1rem' }}>
            ID uploaded. Click verify to generate blockchain hash and earn +10 points.
          </p>
          <button className="btn btn-forest" onClick={verifyID} disabled={loading}>
            {loading ? <Spinner size={14} /> : 'Verify ID →'}
          </button>
        </div>
      )}
    </LayerCard>
  );
}
