import { useState, useRef } from 'react';
import { livenessAPI } from '../services/api';

function LivenessVerify() {
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Could not access camera. Please grant permission.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const captureSelfie = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
            setSelfieFile(file);
            setPreview(URL.createObjectURL(file));
          }
        }, 'image/jpeg', 0.9);
      }
    }
    stopCamera();
    setStep(2);
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfieFile) return setError('Please capture a selfie first');

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('selfie', selfieFile);

    try {
      await livenessAPI.capture(formData);
      await livenessAPI.verify();
      setMessage('Liveness verified! +20 trust points earned.');
      setStep(3);
    } catch (err: unknown) {
      setError(err?.response?.data?.message || 'Liveness check failed. Please try again with better lighting.');
      setStep(1);
      setSelfieFile(null);
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const retake = () => {
    setStep(1);
    setSelfieFile(null);
    setPreview(null);
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Selfie Liveness Verification</h1>
      <p style={{ color: '#6b7280', marginBottom: '30px' }}>
        Take a live selfie to verify you're a real person. This earns +20 trust points.
      </p>

      {error && <div style={{ color: '#dc2626', padding: '10px', background: '#fee2e2', borderRadius: '8px', marginBottom: '15px' }}>{error}</div>}
      {message && <div style={{ color: '#16a34a', padding: '10px', background: '#d1fae5', borderRadius: '8px', marginBottom: '15px' }}>{message}</div>}

      {step === 1 && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>Capture Live Selfie</h3>
          
          {!stream ? (
            <button onClick={startCamera} style={{ width: '100%', padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
              Start Camera
            </button>
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', borderRadius: '8px', transform: 'scaleX(-1)' }}
              />
              <button onClick={captureSelfie} style={{ width: '100%', padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', marginTop: '10px' }}>
                Capture
              </button>
            </>
          )}
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '10px' }}>
            Make sure your face is clearly visible with good lighting
          </p>
        </div>
      )}

      {step === 2 && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>Review Your Selfie</h3>
          
          {preview && (
            <img src={preview} alt="Selfie preview" style={{ width: '100%', borderRadius: '8px', marginBottom: '15px' }} />
          )}
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={retake} style={{ flex: 1, padding: '12px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
              Retake
            </button>
            <button onClick={handleVerify} disabled={loading} style={{ flex: 1, padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '20px' }}>✅</div>
          <h2 style={{ color: '#16a34a' }}>Liveness Verified!</h2>
          <p style={{ color: '#6b7280' }}>+20 trust points added</p>
        </div>
      )}
    </div>
  );
}

export default LivenessVerify;