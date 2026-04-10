import { Link } from 'react-router-dom';
import CompatibilityBar from './CompatibilityBar';
import TrustScoreBadge from './TrustScoreBadge';

function MatchCard({ match, onLike, onPass }) {
  const user = match.user;
  const score = match.compatibilityScore;
  const breakdown = match.breakdown;

  return (
    <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
        <img src={user.profilePhoto || 'https://via.placeholder.com/60'} alt={user.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} />
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: '0 0 5px', fontSize: '18px' }}>{user.name}</h3>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: '0 0 5px' }}>{user.city}</p>
          <TrustScoreBadge score={user.trustScore || 50} />
        </div>
        <div style={{ textAlign: 'center', background: '#f3f4f6', padding: '10px 15px', borderRadius: '8px' }}>
          <span style={{ display: 'block', fontSize: '24px', fontWeight: '700', color: '#4f46e5' }}>{score}%</span>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>Match</span>
        </div>
      </div>

      {user.aiSummary && (
        <p style={{ color: '#4b5563', fontSize: '14px', marginBottom: '15px', padding: '10px', background: '#f9fafb', borderRadius: '6px' }}>{user.aiSummary}</p>
      )}

      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ fontSize: '14px', marginBottom: '10px', color: '#374151' }}>Compatibility Breakdown</h4>
        <CompatibilityBar label="Budget" value={breakdown?.budget || 0} />
        <CompatibilityBar label="Sleep" value={breakdown?.sleepTime || 0} />
        <CompatibilityBar label="Cleanliness" value={breakdown?.cleanliness || 0} />
        <CompatibilityBar label="Food" value={breakdown?.foodHabit || 0} />
        <CompatibilityBar label="Noise" value={breakdown?.noiseTolerance || 0} />
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <button onClick={() => onPass(user._id)} style={{ padding: '10px 20px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Pass</button>
        <button onClick={() => onLike(user._id)} style={{ padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Like</button>
      </div>
    </div>
  );
}

export default MatchCard;