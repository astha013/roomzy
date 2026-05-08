import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { matchApi, agreementApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Avatar, Spinner } from '../components/UI';
import Footer from '../components/Footer';

export default function Agreement() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [form, setForm] = useState({
    rent: '',
    splitA: '',
    splitB: '',
    moveInDate: '',
    rules: ['No smoking indoors', 'Quiet hours after 11 PM'],
  });
  const [newRule, setNewRule] = useState('');
  const [created, setCreated] = useState(false);

  useEffect(() => {
    matchApi.getMatched()
      .then(({ data }) => setMatches(data))
      .catch(() => toast('Could not load matches', 'error'))
      .finally(() => setLoading(false));
  }, []);

  const other = selectedMatch
    ? (selectedMatch.userA?._id === user?._id ? selectedMatch.userB : selectedMatch.userA)
    : null;

  const handleRentChange = (val) => {
    const rent = Number(val);
    setForm(f => ({
      ...f,
      rent: val,
      splitA: Math.ceil(rent / 2).toString(),
      splitB: Math.floor(rent / 2).toString(),
    }));
  };

  const addRule = () => {
    if (!newRule.trim()) return;
    setForm(f => ({ ...f, rules: [...f.rules, newRule.trim()] }));
    setNewRule('');
  };

  const removeRule = (i) => setForm(f => ({ ...f, rules: f.rules.filter((_, idx) => idx !== i) }));

  const handleSubmit = async () => {
    if (!selectedMatch || !form.rent || !form.moveInDate) {
      toast('Please fill in rent and move-in date', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      await agreementApi.create({
        matchId: selectedMatch._id,
        rent: Number(form.rent),
        rentSplit: { userA: Number(form.splitA), userB: Number(form.splitB) },
        rules: form.rules,
        moveInDate: form.moveInDate,
      });
      toast('Agreement created! You can now download it.', 'success');
      setCreated(true);
    } catch (err) {
      toast(err.response?.data?.message || 'Failed to create agreement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedMatch) return;
    setDownloading(true);
    try {
      const { data } = await agreementApi.download(selectedMatch._id);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `roomzy-agreement-${selectedMatch._id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast('PDF downloaded!', 'success');
    } catch (err) {
      toast(err.response?.data?.message || 'Could not download PDF', 'error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="page-pad"
      style={{
        minHeight: '100vh',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'calc(68px + clamp(1rem, 3vw, 2rem))',
        paddingLeft: 0,
        paddingRight: 0,
        paddingBottom: 0,
      }}
    >
      <div style={{
        flex: 1,
        maxWidth: 720,
        width: '100%',
        paddingBottom: '3rem',
        paddingLeft: 'clamp(1rem, 4vw, 2.5rem)',
        paddingRight: 'clamp(1rem, 4vw, 2.5rem)',
        boxSizing: 'border-box',
      }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => navigate('/matches')}
            style={{ background: 'none', border: 'none', color: 'var(--clay-3)', fontSize: '0.85rem', cursor: 'pointer', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
          >
            ← Back to matches
          </button>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.25rem)', fontWeight: 700, marginBottom: '0.5rem' }}>
            Rental Agreement
          </h1>
          <p style={{ color: 'var(--clay-3)', fontSize: '0.9rem' }}>
            Create a shared rental agreement with your matched roommate and download it as a PDF.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}><Spinner dark /></div>
        ) : matches.length === 0 ? (
          <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❤️</div>
            <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, marginBottom: '0.5rem' }}>No confirmed matches yet</h3>
            <p style={{ color: 'var(--clay-3)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              You need a mutual match to create an agreement.
            </p>
            <button className="btn btn-terra btn-sm" onClick={() => navigate('/matches')}>Browse matches →</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Step 1: Select match */}
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 800, marginBottom: '1rem', fontSize: '1rem' }}>
                1 · Select your matched roommate
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {matches.map(match => {
                  const partner = match.userA?._id === user?._id ? match.userB : match.userA;
                  if (!partner) return null;
                  const selected = selectedMatch?._id === match._id;
                  return (
                    <div
                      key={match._id}
                      onClick={() => { setSelectedMatch(match); setCreated(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '1rem',
                        padding: '1rem', borderRadius: 'var(--r-md)', cursor: 'pointer',
                        border: `2px solid ${selected ? 'var(--terra)' : 'var(--parchment-3)'}`,
                        background: selected ? 'var(--terra-light)' : 'white',
                        transition: 'all 0.18s',
                      }}
                    >
                      <Avatar name={partner.name} src={partner.profilePhoto} size="md" />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{partner.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--clay-3)' }}>
                          📍 {partner.city} · {match.compatibilityScore}% compatible
                        </div>
                      </div>
                      {selected && (
                        <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--terra)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg viewBox="0 0 12 12" width="12" height="12"><path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Agreement form */}
            {selectedMatch && (
              <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 800, marginBottom: '1.25rem', fontSize: '1rem' }}>
                  2 · Fill agreement details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Rent */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Total Rent (₹)</label>
                      <input
                        className="form-input"
                        type="number"
                        placeholder="e.g. 20000"
                        value={form.rent}
                        onChange={e => handleRentChange(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Your share (₹)</label>
                      <input
                        className="form-input"
                        type="number"
                        value={form.splitA}
                        onChange={e => setForm(f => ({ ...f, splitA: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{other?.name?.split(' ')[0]}'s share (₹)</label>
                      <input
                        className="form-input"
                        type="number"
                        value={form.splitB}
                        onChange={e => setForm(f => ({ ...f, splitB: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* Move-in date */}
                  <div className="form-group">
                    <label className="form-label">Move-in Date</label>
                    <input
                      className="form-input"
                      type="date"
                      value={form.moveInDate}
                      onChange={e => setForm(f => ({ ...f, moveInDate: e.target.value }))}
                      style={{ maxWidth: 220 }}
                    />
                  </div>

                  {/* House rules */}
                  <div className="form-group">
                    <label className="form-label">House Rules</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      {form.rules.map((rule, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--parchment-2)', borderRadius: 'var(--r)', fontSize: '0.85rem' }}>
                          <span style={{ flex: 1 }}>{i + 1}. {rule}</span>
                          <button
                            onClick={() => removeRule(i)}
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--clay-3)', fontSize: '1rem', lineHeight: 1 }}
                          >×</button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        className="form-input"
                        placeholder="Add a house rule…"
                        value={newRule}
                        onChange={e => setNewRule(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && addRule()}
                        style={{ flex: 1 }}
                      />
                      <button className="btn btn-ghost btn-sm" onClick={addRule} style={{ flexShrink: 0 }}>+ Add</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Actions */}
            {selectedMatch && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {!created ? (
                  <button
                    className="btn btn-terra"
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{ minWidth: 200 }}
                  >
                    {submitting ? <Spinner size={16} /> : '📝 Create Agreement'}
                  </button>
                ) : (
                  <>
                    <button
                      className="btn btn-forest"
                      onClick={handleDownload}
                      disabled={downloading}
                      style={{ minWidth: 220 }}
                    >
                      {downloading ? <Spinner size={16} /> : '⬇️ Download PDF'}
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => { setCreated(false); setSelectedMatch(null); }}
                    >
                      Create another
                    </button>
                  </>
                )}
              </div>
            )}

            {created && (
              <div style={{ background: 'var(--forest-light)', border: '1px solid var(--forest)', borderRadius: 'var(--r-md)', padding: '1rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.25rem' }}>✅</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--forest-text)' }}>Agreement created successfully!</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--forest-text)', marginTop: '0.2rem' }}>
                    Click "Download PDF" to save your rental agreement document.
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}