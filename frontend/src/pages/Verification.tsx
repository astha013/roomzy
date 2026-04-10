import { useState } from 'react';
import { verificationAPI } from '../services/api';

function Verification() {
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [idNumber, setIdNumber] = useState('');
  const [idType, setIdType] = useState('aadhar');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const handleIdUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idFile) return setError('Please select an ID document');

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('idDocument', idFile);
    if (idType === 'aadhar') {
      formData.append('idDocumentNumber', idNumber);
    }
    formData.append('idDocumentType', idType);

    try {
      await verificationAPI.uploadId(formData);
      setMessage('ID uploaded successfully! Now capture your selfie.');
      setStep(2);
    } catch (err: unknown) {
      setError(err?.response?.data?.message || 'Failed to upload ID');
    } finally {
      setLoading(false);
    }
  };

  const handleSelfieCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfieFile) return setError('Please capture a selfie');

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('selfie', selfieFile);

    try {
      await verificationAPI.captureSelfie(formData);
      setMessage('Selfie captured! Submitting for verification...');
      await verificationAPI.verify();
      setMessage('Verification complete! You are now a verified user.');
      setStep(3);
    } catch (err: unknown) {
      setError(err?.response?.data?.message || 'Failed to capture selfie');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Identity Verification</h1>
      <p style={{ color: '#6b7280', marginBottom: '30px' }}>
        Upload a masked Aadhar card and capture a selfie to verify your identity.
      </p>

      {error && <div style={{ color: '#dc2626', padding: '10px', background: '#fee2e2', borderRadius: '8px', marginBottom: '15px' }}>{error}</div>}
      {message && <div style={{ color: '#16a34a', padding: '10px', background: '#d1fae5', borderRadius: '8px', marginBottom: '15px' }}>{message}</div>}

      {step === 1 && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>Step 1: Upload ID Document</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>ID Type</label>
            <select value={idType} onChange={(e) => setIdType(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
              <option value="aadhar">Aadhar Card</option>
              <option value="pan">PAN Card</option>
              <option value="passport">Passport</option>
              <option value="driving_license">Driving License</option>
            </select>
          </div>

          {idType === 'aadhar' && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Aadhar Number (12 digits)
                <span style={{ fontWeight: 'normal', color: '#6b7280', marginLeft: '10px', fontSize: '12px' }}>Only first 4 and last 4 digits will be stored</span>
              </label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder="Enter 12-digit Aadhar"
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
                maxLength={12}
              />
            </div>
          )}

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Upload {idType === 'aadhar' ? 'Masked Aadhar' : 'ID Document'}
              <span style={{ fontWeight: 'normal', color: '#6b7280', marginLeft: '10px', fontSize: '12px' }}>(Blur/cover middle digits)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setIdFile(e.target.files?.[0] || null)}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            />
          </div>

          <button onClick={handleIdUpload} disabled={loading} style={{ width: '100%', padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
            {loading ? 'Uploading...' : 'Upload ID'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>Step 2: Capture Selfie</h3>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Take a selfie</label>
            <input
              type="file"
              accept="image/*"
              capture="user"
              onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
              style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '5px' }}>Use your phone camera for best results</p>
          </div>

          <button onClick={handleSelfieCapture} disabled={loading} style={{ width: '100%', padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
            {loading ? 'Processing...' : 'Capture & Verify'}
          </button>
        </div>
      )}

      {step === 3 && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>✅</div>
          <h2 style={{ color: '#16a34a' }}>Verification Complete!</h2>
          <p style={{ color: '#6b7280' }}>Your identity has been verified successfully.</p>
        </div>
      )}
    </div>
  );
}

export default Verification;