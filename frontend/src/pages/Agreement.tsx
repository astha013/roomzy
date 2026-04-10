import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { agreementAPI, matchAPI } from '../services/api';

function Agreement() {
  const { matchId } = useParams();
  const [agreement, setAgreement] = useState<any>(null);
  const [existingMatch, setExistingMatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    rent: 20000,
    rentSplitUserA: 10000,
    rentSplitUserB: 10000,
    rules: 'No smoking, No pets',
    moveInDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await matchAPI.getMatches();
        const match = res.data.find((m: any) => m._id === matchId);
        setExistingMatch(match);
        if (match?.agreement) {
          setAgreement(match.agreement);
          setFormData({
            rent: match.agreement.rent || 20000,
            rentSplitUserA: match.agreement.rentSplit?.userA || 10000,
            rentSplitUserB: match.agreement.rentSplit?.userB || 10000,
            rules: match.agreement.rules?.join(', ') || 'No smoking, No pets',
            moveInDate: match.agreement.moveInDate?.split('T')[0] || new Date().toISOString().split('T')[0]
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [matchId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const rules = formData.rules.split(',').map(r => r.trim()).filter(r => r);
      const res = await agreementAPI.createAgreement({
        matchId,
        rent: formData.rent,
        rentSplit: { userA: formData.rentSplitUserA, userB: formData.rentSplitUserB },
        rules,
        moveInDate: formData.moveInDate
      });
      setAgreement(res.data.agreement);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await agreementAPI.downloadAgreement(matchId);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'roomzy-agreement.pdf');
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Rental Agreement</h1>
      
      {!existingMatch ? (
        <div style={{ background: '#fee2e2', padding: '20px', borderRadius: '8px', color: '#dc2626' }}>
          <p>No matched user found. You can only create agreements with matched users.</p>
          <Link to="/matches" style={{ color: '#4f46e5' }}>Go to Matches</Link>
        </div>
      ) : (
        <>
          <form onSubmit={handleSave} style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '15px' }}>Agreement Details</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Monthly Rent (₹)</label>
              <input
                type="number"
                value={formData.rent}
                onChange={(e) => setFormData({ ...formData, rent: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Your Share (₹)</label>
                <input
                  type="number"
                  value={formData.rentSplitUserA}
                  onChange={(e) => setFormData({ ...formData, rentSplitUserA: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Other's Share (₹)</label>
                <input
                  type="number"
                  value={formData.rentSplitUserB}
                  onChange={(e) => setFormData({ ...formData, rentSplitUserB: parseInt(e.target.value) })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Move-in Date</label>
              <input
                type="date"
                value={formData.moveInDate}
                onChange={(e) => setFormData({ ...formData, moveInDate: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>House Rules (comma separated)</label>
              <input
                type="text"
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                placeholder="No smoking, No pets, Guests before 10pm"
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
              />
            </div>

            <button type="submit" disabled={saving} style={{ width: '100%', padding: '12px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
              {saving ? 'Saving...' : agreement ? 'Update Agreement' : 'Create Agreement'}
            </button>
          </form>

          {agreement && (
            <button onClick={handleDownload} style={{ width: '100%', padding: '15px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px' }}>
              Download PDF Agreement
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default Agreement;