import { useState, useEffect } from 'react';
import { socialAPI } from '../services/api';

function SocialLinks() {
  const [links, setLinks] = useState<{ linkedin?: string; instagram?: string; collegeEmail?: string; companyEmail?: string }>({});
  const [linkedin, setLinkedin] = useState('');
  const [instagram, setInstagram] = useState('');
  const [collegeEmail, setCollegeEmail] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const res = await socialAPI.getLinks();
      setLinks(res.data.socialLinks || {});
      if (res.data.socialLinks) {
        setLinkedin(res.data.socialLinks.linkedin || '');
        setInstagram(res.data.socialLinks.instagram || '');
        setCollegeEmail(res.data.socialLinks.collegeEmail || '');
        setCompanyEmail(res.data.socialLinks.companyEmail || '');
      }
    } catch (err) {
      console.error('Failed to load links');
    }
  };

  const handleSaveLinks = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      await socialAPI.saveLinks({
        linkedin: linkedin || undefined,
        instagram: instagram || undefined,
        collegeEmail: collegeEmail || undefined,
        companyEmail: companyEmail || undefined
      });
      setMessage('Social links saved! +5 trust points per link (max +10).');
      loadLinks();
    } catch (err: unknown) {
      setError(err?.response?.data?.message || 'Failed to save links');
    } finally {
      setLoading(false);
    }
  };

  const verifiedCount = Object.values(links).filter(v => v).length;
  const currentTrust = Math.min(verifiedCount * 5, 10);

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Social Links</h1>
      <p style={{ color: '#6b7280', marginBottom: '30px' }}>
        Connect your social profiles to build trust. Earn +5 points per link (max +10).
      </p>

      {error && <div style={{ color: '#dc2626', padding: '10px', background: '#fee2e2', borderRadius: '8px', marginBottom: '15px' }}>{error}</div>}
      {message && <div style={{ color: '#16a34a', padding: '10px', background: '#d1fae5', borderRadius: '8px', marginBottom: '15px' }}>{message}</div>}

      <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '15px', marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>+{currentTrust} Trust Points</div>
        <div style={{ color: '#6b7280', fontSize: '14px' }}>{verifiedCount} of 2 links added</div>
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>Add Social Links</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>LinkedIn Profile</label>
          <input
            type="url"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            placeholder="https://linkedin.com/in/yourprofile"
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Instagram Profile</label>
          <input
            type="url"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="https://instagram.com/yourusername"
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>College Email (optional)</label>
          <input
            type="email"
            value={collegeEmail}
            onChange={(e) => setCollegeEmail(e.target.value)}
            placeholder="your.name@college.edu"
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Company Email (optional)</label>
          <input
            type="email"
            value={companyEmail}
            onChange={(e) => setCompanyEmail(e.target.value)}
            placeholder="your.name@company.com"
            style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
          />
        </div>

        <button onClick={handleSaveLinks} disabled={loading} style={{ width: '100%', padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '500', opacity: loading ? 0.7 : 1 }}>
          {loading ? 'Saving...' : 'Save Links'}
        </button>
      </div>
    </div>
  );
}

export default SocialLinks;