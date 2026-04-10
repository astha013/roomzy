import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authAPI, matchAPI, verificationAPI } from '../services/api';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await authAPI.getMe();
        setUser(userRes.data);
        
        const matchRes = await matchAPI.getMatches();
        setMatches(matchRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div>
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <h1 style={{ marginBottom: '10px' }}>Welcome, {user?.name}!</h1>
        
        {!user?.isVerified && (
          <div style={{ background: '#fef3c7', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
            <p style={{ margin: 0 }}>Complete verification to chat and post listings</p>
            <Link to="/profile" style={{ color: '#d97706', fontWeight: '500' }}>Verify Now →</Link>
          </div>
        )}
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div style={{ background: '#f3f4f6', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#4f46e5' }}>{user?.trustScore || 0}</div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>Trust Score</div>
          </div>
          <div style={{ background: '#f3f4f6', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: '#4f46e5' }}>{matches.length}</div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>Matches</div>
          </div>
          <div style={{ background: '#f3f4f6', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: user?.isVerified ? '#16a34a' : '#dc2626' }}>
              {user?.isVerified ? 'Verified' : 'Unverified'}
            </div>
            <div style={{ color: '#6b7280', fontSize: '14px' }}>Status</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
        <Link to="/matches" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '10px' }}>Find Matches</h3>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Discover compatible roommates</p>
          </div>
        </Link>
        
        <Link to="/listings" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '10px' }}>Browse Listings</h3>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Find rooms and apartments</p>
          </div>
        </Link>
        
        <Link to="/map" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '10px' }}>Map View</h3>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Explore listings near you</p>
          </div>
        </Link>
        
        <Link to="/chat" style={{ textDecoration: 'none' }}>
          <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginBottom: '10px' }}>Messages</h3>
            <p style={{ color: '#6b7280', fontSize: '14px' }}>Chat with your matches</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default Dashboard;