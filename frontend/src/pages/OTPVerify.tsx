import { useState } from 'react';
import { otpAPI } from '../services/api';

function OTPVerify() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) return setError('Please enter a valid phone number');

    setLoading(true);
    setError('');

    try {
      await otpAPI.sendOTP(phone);
      setMessage('OTP sent! Check your phone.');
      setStep(2);
    } catch (err: unknown) {
      setError(err?.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || code.length < 6) return setError('Please enter the 6-digit OTP');

    setLoading(true);
    setError('');

    try {
      await otpAPI.verifyOTP(phone, code);
      setMessage('Phone verified! +20 trust points earned.');
      setStep(3);
    } catch (err: unknown) {
      setError(err?.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Phone Verification</h1>
      <p style={{ color: '#6b7280', marginBottom: '30px' }}>
        Verify your phone number with OTP to earn +20 trust points.
      </p>

      {error && <div style={{ color: '#dc2626', padding: '10px', background: '#fee2e2', borderRadius: '8px', marginBottom: '15px' }}>{error}</div>}
      {message && <div style={{ color: '#16a34a', padding: '10px', background: '#d1fae5', borderRadius: '8px', marginBottom: '15px' }}>{message}</div>}

      {step === 1 && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>Enter Phone Number</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit phone number"
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
              maxLength={10}
            />
          </div>
          <button onClick={handleSendOTP} disabled={loading} style={{ width: '100%', padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>Enter OTP</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>6-digit Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="Enter 6-digit OTP"
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '18px', textAlign: 'center', letterSpacing: '4px' }}
              maxLength={6}
            />
          </div>
          <button onClick={handleVerifyOTP} disabled={loading} style={{ width: '100%', padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </div>
      )}

      {step === 3 && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>✅</div>
          <h2 style={{ color: '#16a34a' }}>Phone Verified!</h2>
          <p style={{ color: '#6b7280' }}>+20 trust points added</p>
        </div>
      )}
    </div>
  );
}

export default OTPVerify;