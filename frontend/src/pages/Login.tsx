import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

function Login({ setIsAuthenticated }) {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await authAPI.login(formData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', data._id);
      setIsAuthenticated(true);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '5px' }}>Welcome Back</h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '25px' }}>Sign in to find your perfect roommate</p>
        
        {error && <div style={{ color: '#dc2626', marginBottom: '15px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Email</label>
            <input
              type="email"
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Password</label>
            <input
              type="password"
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>
          
          <button type="submit" style={{ width: '100%', padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '10px' }}>
          <Link to="/forgot-password" style={{ color: '#6b7280', fontSize: '14px', textDecoration: 'none' }}>Forgot Password?</Link>
        </p>
        
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280' }}>
          Don't have an account? <Link to="/register" style={{ color: '#4f46e5', textDecoration: 'none' }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}

export default Login;