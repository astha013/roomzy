import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

function Register({ setIsAuthenticated }) {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', intent: 'looking_for_roommate', city: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const { data } = await authAPI.register(formData);
      setSuccess(data.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h1 style={{ textAlign: 'center', marginBottom: '5px' }}>Create Account</h1>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '25px' }}>Join Roomzy to find your perfect roommate</p>
        
        {error && <div style={{ color: '#dc2626', marginBottom: '15px', padding: '10px', background: '#fee2e2', borderRadius: '8px' }}>{error}</div>}
        {success && <div style={{ color: '#16a34a', marginBottom: '15px', padding: '10px', background: '#d1fae5', borderRadius: '8px' }}>{success}</div>}
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Full Name</label>
            <input
              type="text"
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          
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
              minLength={6}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>I am a...</label>
            <select
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
              value={formData.intent}
              onChange={(e) => setFormData({ ...formData, intent: e.target.value })}
              required
            >
              <option value="looking_for_roommate">Looking for a roommate (need room)</option>
              <option value="have_room_need_roommate">Have a room (need roommate)</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>City</label>
            <input
              type="text"
              style={{ width: '100%', padding: '12px', border: '1px solid #d1d5db', borderRadius: '8px' }}
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g., Mumbai, Bangalore, Pune"
              required
            />
          </div>
          
          <button type="submit" style={{ width: '100%', padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }} disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280' }}>
          Already have an account? <Link to="/login" style={{ color: '#4f46e5', textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;