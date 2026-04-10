import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { matchAPI } from '../services/api';
import MatchCard from '../components/MatchCard';

function Matches() {
  const [suggestions, setSuggestions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('suggestions');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [suggestRes, matchRes] = await Promise.all([
          matchAPI.getSuggestions(),
          matchAPI.getMatches()
        ]);
        setSuggestions(suggestRes.data);
        setMatches(matchRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLike = async (userId) => {
    try {
      await matchAPI.likeUser(userId);
      setSuggestions(prev => prev.filter(s => s.user._id !== userId));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePass = async (userId) => {
    try {
      await matchAPI.passUser(userId);
      setSuggestions(prev => prev.filter(s => s.user._id !== userId));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div>
      <h1 style={{ marginBottom: '20px' }}>Find Roommates</h1>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setActiveTab('suggestions')} style={{ padding: '10px 20px', background: activeTab === 'suggestions' ? '#4f46e5' : '#e5e7eb', color: activeTab === 'suggestions' ? 'white' : '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          Suggestions ({suggestions.length})
        </button>
        <button onClick={() => setActiveTab('matches')} style={{ padding: '10px 20px', background: activeTab === 'matches' ? '#4f46e5' : '#e5e7eb', color: activeTab === 'matches' ? 'white' : '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
          My Matches ({matches.length})
        </button>
      </div>

      {activeTab === 'suggestions' ? (
        suggestions.length > 0 ? (
          suggestions.map(match => (
            <MatchCard key={match.user._id} match={match} onLike={handleLike} onPass={handlePass} />
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px' }}>
            <p style={{ color: '#6b7280' }}>No more suggestions. Check back later!</p>
            <Link to="/preferences" style={{ color: '#4f46e5' }}>Update preferences</Link>
          </div>
        )
      ) : (
        matches.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {matches.map(match => {
              const otherUser = match.userA._id === localStorage.getItem('userId') ? match.userB : match.userA;
              return (
                <div key={match._id} style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                    <img src={otherUser.profilePhoto || 'https://via.placeholder.com/50'} alt={otherUser.name} style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
                    <div>
                      <h3 style={{ margin: 0 }}>{otherUser.name}</h3>
                      <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>{otherUser.city}</p>
                    </div>
                  </div>
                  <p style={{ color: '#6b7280', fontSize: '14px' }}>Compatibility: {match.compatibilityScore}%</p>
                  <Link to={`/chat/${otherUser._id}`} style={{ display: 'inline-block', marginTop: '10px', padding: '8px 16px', background: '#4f46e5', color: 'white', borderRadius: '6px', textDecoration: 'none' }}>Message</Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px' }}>
            <p style={{ color: '#6b7280' }}>No matches yet. Like some users to get matches!</p>
          </div>
        )
      )}
    </div>
  );
}

export default Matches;