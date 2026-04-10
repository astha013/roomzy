import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function EmailVerify() {
  const { token } = useParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const { data } = await axios.get(`${apiUrl}/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(data.message);
      } catch (err: unknown) {
        setStatus('error');
        const errorMessage = err?.response?.data?.message || 'Verification failed';
        setMessage(errorMessage);
      }
    };
    verifyEmail();
  }, [token]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
        {status === 'loading' && (
          <>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>⏳</div>
            <h2>Verifying your email...</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>✅</div>
            <h2 style={{ color: '#16a34a' }}>Email Verified!</h2>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>{message}</p>
            <Link to="/login" style={{ display: 'inline-block', padding: '12px 24px', background: '#4f46e5', color: 'white', borderRadius: '8px', textDecoration: 'none' }}>
              Go to Login
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '40px', marginBottom: '20px' }}>❌</div>
            <h2 style={{ color: '#dc2626' }}>Verification Failed</h2>
            <p style={{ color: '#6b7280', marginBottom: '20px' }}>{message}</p>
            <Link to="/login" style={{ display: 'inline-block', padding: '12px 24px', background: '#4f46e5', color: 'white', borderRadius: '8px', textDecoration: 'none' }}>
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default EmailVerify;