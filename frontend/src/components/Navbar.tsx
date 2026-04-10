import { useState } from 'react';
import { Link } from 'react-router-dom';

function Navbar({ setIsAuthenticated }) {
  const [trustOpen, setTrustOpen] = useState(false);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  return (
    <nav style={{ background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '15px 0', marginBottom: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/dashboard" style={{ fontSize: '24px', fontWeight: '700', color: '#4f46e5', textDecoration: 'none' }}>Roomzy</Link>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/dashboard" style={{ color: '#374151', textDecoration: 'none', fontWeight: '500' }}>Dashboard</Link>
          <Link to="/matches" style={{ color: '#374151', textDecoration: 'none', fontWeight: '500' }}>Matches</Link>
          <Link to="/chat" style={{ color: '#374151', textDecoration: 'none', fontWeight: '500' }}>Chat</Link>
          <Link to="/preferences" style={{ color: '#374151', textDecoration: 'none', fontWeight: '500' }}>Preferences</Link>
          <Link to="/profile" style={{ color: '#374151', textDecoration: 'none', fontWeight: '500' }}>Profile</Link>
          
          <div style={{ position: 'relative' }}>
            <button onClick={() => setTrustOpen(!trustOpen)} style={{ background: '#fef3c7', color: '#92400e', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>
              Trust 🔒
            </button>
            {trustOpen && (
              <div style={{ position: 'absolute', top: '100%', right: 0, background: 'white', border: '1px solid #d1d5db', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginTop: '5px', minWidth: '180px', zIndex: 100 }}>
                <Link to="/verification" style={{ display: 'block', padding: '10px 15px', color: '#374151', textDecoration: 'none' }}>ID Verification</Link>
                <Link to="/otp-verify" style={{ display: 'block', padding: '10px 15px', color: '#374151', textDecoration: 'none' }}>Phone OTP</Link>
                <Link to="/liveness-verify" style={{ display: 'block', padding: '10px 15px', color: '#374151', textDecoration: 'none' }}>Selfie Liveness</Link>
                <Link to="/social-links" style={{ display: 'block', padding: '10px 15px', color: '#374151', textDecoration: 'none' }}>Social Links</Link>
              </div>
            )}
          </div>
          
          <button onClick={handleLogout} style={{ background: '#fee2e2', color: '#dc2626', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Logout</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;