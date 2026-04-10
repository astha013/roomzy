import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const { data } = await authAPI.forgotPassword(email);
      setMessage(data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '5px' }}>Forgot Password</h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '25px' }}>Enter your email to reset your password</p>
        
        {error && <div style={{ color: '#dc2626', marginBottom: '15px', padding: '10px', background: '#fee2e2', borderRadius: '8px' }}>{error}</div>}
        {message && <div style={{ color: '#16a34a', marginBottom: '15px', padding: '10px', background: '#d1fae5', borderRadius: '8px' }}>{message}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email</label>
            <input
              type="email"
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" style={{ width: '100%', padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }} disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280' }}>
          Remember your password? <Link to="/login" style={{ color: '#4f46e5', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;