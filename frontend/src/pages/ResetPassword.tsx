import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);

    try {
      const { data } = await authAPI.resetPassword(token!, password);
      setMessage(data.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '5px' }}>Reset Password</h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '25px' }}>Enter your new password</p>
        
        {error && <div style={{ color: '#dc2626', marginBottom: '15px', padding: '10px', background: '#fee2e2', borderRadius: '8px' }}>{error}</div>}
        {message && <div style={{ color: '#16a34a', marginBottom: '15px', padding: '10px', background: '#d1fae5', borderRadius: '8px' }}>{message}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>New Password</label>
            <input
              type="password"
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Confirm Password</label>
            <input
              type="password"
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          
          <button type="submit" style={{ width: '100%', padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }} disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280' }}>
          <Link to="/login" style={{ color: '#4f46e5', textDecoration: 'none' }}>Back to Login</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;