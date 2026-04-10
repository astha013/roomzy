import { useState, useEffect } from 'react';
import { profileAPI } from '../services/api';

function Preferences() {
  const [preferences, setPreferences] = useState({
    intent: 'looking_for_roommate',
    city: '',
    area: '',
    budgetMin: 5000,
    budgetMax: 20000,
    locationRadius: 10,
    sleepTime: 'flexible',
    smoking: 'no',
    drinking: 'no',
    foodHabit: 'veg',
    cleanliness: 3,
    guestsAllowed: true,
    workFromHome: false,
    genderPreference: 'any',
    language: 'English',
    personality: 'ambivert',
    noiseTolerance: 3,
    acPreference: 'any',
    pets: 'no',
    religion: '',
    moveInDate: ''
  });

  const [weights, setWeights] = useState({
    budget: 1,
    location: 1,
    sleepTime: 1,
    cleanliness: 1,
    foodHabit: 1,
    genderPreference: 1,
    noiseTolerance: 1,
    personality: 1
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handlePrefChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferences({ ...preferences, [name]: type === 'checkbox' ? checked : value });
  };

  const handleWeightChange = (e) => {
    const { name, value } = e.target;
    setWeights({ ...weights, [name]: parseInt(value) });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      await profileAPI.updatePreferences(preferences);
      await profileAPI.updateWeights(weights);
      setMessage('Preferences saved successfully!');
    } catch (err) {
      setMessage('Failed to save preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Roommate Preferences</h1>
      
      {message && (
        <div style={{ padding: '10px', borderRadius: '8px', marginBottom: '20px', background: message.includes('success') ? '#d1fae5' : '#fee2e2', color: message.includes('success') ? '#065f46' : '#991b1b' }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>Basic Info</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>My Intent</label>
              <select name="intent" value={preferences.intent} onChange={handlePrefChange} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
                <option value="looking_for_roommate">Looking for roommate (need room)</option>
                <option value="have_room_need_roommate">Have room (need roommate)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>City</label>
              <input type="text" name="city" value={preferences.city} onChange={handlePrefChange} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Area (Optional)</label>
              <input type="text" name="area" value={preferences.area} onChange={handlePrefChange} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Move-in Date</label>
              <input type="date" name="moveInDate" value={preferences.moveInDate} onChange={handlePrefChange} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Min Budget (₹)</label>
              <input type="number" name="budgetMin" value={preferences.budgetMin} onChange={handlePrefChange} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Max Budget (₹)</label>
              <input type="number" name="budgetMax" value={preferences.budgetMax} onChange={handlePrefChange} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} />
            </div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>Lifestyle</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Sleep Time</label>
              <select name="sleepTime" value={preferences.sleepTime} onChange={handlePrefChange} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
                <option value="early">Early Bird</option>
                <option value="late">Night Owl</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Smoking</label>
              <select name="smoking" value={preferences.smoking} onChange={handlePrefChange} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
                <option value="occasional">Occasional</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Drinking</label>
              <select name="drinking" value={preferences.drinking} onChange={handlePrefChange} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
                <option value="no">No</option>
                <option value="yes">Yes</option>
                <option value="occasional">Occasional</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Food Habit</label>
              <select name="foodHabit" value={preferences.foodHabit} onChange={handlePrefChange} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}>
                <option value="veg">Vegetarian</option>
                <option value="non-veg">Non-Vegetarian</option>
                <option value="eggetarian">Eggetarian</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginTop: '15px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Cleanliness ({preferences.cleanliness}/5)</label>
              <input type="range" name="cleanliness" min="1" max="5" value={preferences.cleanliness} onChange={handlePrefChange} style={{ width: '100%' }} />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Noise Tolerance ({preferences.noiseTolerance}/5)</label>
              <input type="range" name="noiseTolerance" min="1" max="5" value={preferences.noiseTolerance} onChange={handlePrefChange} style={{ width: '100%' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '15px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input type="checkbox" name="guestsAllowed" checked={preferences.guestsAllowed} onChange={handlePrefChange} />
              Guests Allowed
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input type="checkbox" name="workFromHome" checked={preferences.workFromHome} onChange={handlePrefChange} />
              Work From Home
            </label>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>Preference Weights</h3>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '15px' }}>Adjust how much each factor matters in matching (0-5)</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px' }}>
            {Object.keys(weights).map(key => (
              <div key={key}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500', textTransform: 'capitalize' }}>{key}</label>
                <input type="range" name={key} min="0" max="5" value={weights[key]} onChange={handleWeightChange} style={{ width: '100%' }} />
                <span style={{ fontSize: '12px', color: '#6b7280' }}>{weights[key]}</span>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" style={{ width: '100%', padding: '15px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500', fontSize: '16px' }} disabled={loading}>
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </form>
    </div>
  );
}

export default Preferences;