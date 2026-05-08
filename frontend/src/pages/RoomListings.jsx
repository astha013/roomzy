import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/UI';
import Footer from '../components/Footer';

const FACILITIES_LIST = [
  { key: 'wifi', label: 'Wi-Fi', icon: '📶' },
  { key: 'ac', label: 'AC', icon: '❄️' },
  { key: 'parking', label: 'Parking', icon: '🅿️' },
  { key: 'laundry', label: 'Laundry', icon: '🧺' },
  { key: 'kitchen', label: 'Kitchen', icon: '🍳' },
  { key: 'gym', label: 'Gym', icon: '🏋️' },
  { key: 'security', label: 'Security', icon: '🔒' },
  { key: 'powerBackup', label: 'Power Backup', icon: '🔋' },
];

const CITIES = [
  // Metros
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
  // Major cities
  'Noida', 'Gurugram', 'Navi Mumbai', 'Chandigarh', 'Kochi', 'Indore', 'Bhopal', 'Jaipur',
  'Lucknow', 'Nagpur', 'Surat', 'Vadodara', 'Coimbatore', 'Madurai', 'Thiruvananthapuram',
  'Mysore', 'Mangalore', 'Vijayawada', 'Visakhapatnam', 'Tirupati', 'Ranchi', 'Bhubaneswar',
  'Guwahati', 'Dehradun', 'Amritsar', 'Ludhiana', 'Jodhpur', 'Udaipur', 'Varanasi',
  'Agra', 'Nashik', 'Aurangabad', 'Rajkot', 'Raipur', 'Jabalpur', 'Gwalior',
  'Patna', 'Bhubaneswar', 'Hubli', 'Belgaum', 'Pimpri-Chinchwad', 'Meerut',
];

function RoomCard({ listing, onSave, saved }) {
  const navigate = useNavigate();
  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  return (
    <div style={{
      background: 'white', borderRadius: 16, overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid var(--parchment-3)',
      transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer',
      display: 'flex', flexDirection: 'column'
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'; }}
    >
      {/* Image */}
      <div style={{ position: 'relative', height: 180, background: 'var(--parchment-2)', overflow: 'hidden' }}>
        {listing.images?.[0] ? (
          <>
            <img
              src={listing.images[0]?.startsWith('http') ? listing.images[0] : `${BASE}${listing.images[0]}`}
              alt={listing.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => {
                e.target.style.display = 'none';
                const fallback = e.target.nextSibling;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            <div style={{ display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🏠</div>
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🏠</div>
        )}
        <button onClick={(e) => { e.stopPropagation(); onSave(listing._id); }}
          style={{ position: 'absolute', top: 10, right: 10, background: 'white', border: 'none', borderRadius: '50%', width: 36, height: 36, cursor: 'pointer', fontSize: '1.1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
          {saved ? '❤️' : '🤍'}
        </button>
        <div style={{ position: 'absolute', bottom: 10, left: 10, background: 'var(--terra)', color: 'white', borderRadius: 8, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.05em' }}>
          {listing.roomType?.toUpperCase()}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column' }}
        onClick={() => navigate(`/rooms/${listing._id}`)}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, marginBottom: '0.3rem', color: 'var(--clay)' }}>
          {listing.title}
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--clay-3)', marginBottom: '0.75rem' }}>
          📍 {listing.area ? `${listing.area}, ` : ''}{listing.city}
        </p>

        {/* Facilities */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: '0.75rem' }}>
          {FACILITIES_LIST.filter(f => listing.facilities?.[f.key]).slice(0, 4).map(f => (
            <span key={f.key} style={{ fontSize: '0.7rem', background: 'var(--parchment-2)', padding: '2px 7px', borderRadius: 6, color: 'var(--clay-3)' }}>
              {f.icon} {f.label}
            </span>
          ))}
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 900, color: 'var(--terra)' }}>
              ₹{listing.rent?.toLocaleString('en-IN')}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--clay-3)' }}>/mo</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {listing.owner?.profilePhoto && (
              <img src={listing.owner.profilePhoto?.startsWith('http') ? listing.owner.profilePhoto : `${BASE}${listing.owner.profilePhoto}`} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--clay-3)' }}>{listing.owner?.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateListingModal({ onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState({ title: '', description: '', city: '', area: '', rent: '', deposit: '', roomType: 'single', genderPreference: 'any', availableFrom: '' });
  const [facilities, setFacilities] = useState({});
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);
  const [useGPS, setUseGPS] = useState(false);
  const [gpsCoords, setGpsCoords] = useState(null);

  const getGPS = () => {
    if (!navigator.geolocation) return toast('GPS not supported', 'error');
    navigator.geolocation.getCurrentPosition(pos => {
      setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setUseGPS(true);
      toast('📍 Location captured!', 'success');
    }, () => toast('Could not get location', 'error'));
  };

  const submit = async () => {
    if (!form.title || !form.city || !form.rent) return toast('Title, city and rent are required', 'error');
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v && fd.append(k, v));
      fd.append('facilities', JSON.stringify(facilities));
      if (gpsCoords) { fd.append('lat', gpsCoords.lat); fd.append('lng', gpsCoords.lng); }
      images.forEach(img => fd.append('images', img));
      await roomApi.create(fd);
      toast('Room listed successfully! 🏠', 'success');
      onCreated();
      onClose();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to create listing', 'error');
    } finally { setSaving(false); }
  };

  const inputStyle = { width: '100%', padding: '0.6rem 0.875rem', border: '1.5px solid var(--parchment-3)', borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: '0.875rem', background: 'var(--parchment-1)', outline: 'none', boxSizing: 'border-box' };
  const labelStyle = { fontSize: '0.78rem', fontWeight: 700, color: 'var(--clay-3)', marginBottom: 4, display: 'block' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '2rem', maxWidth: 580, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 900 }}>List Your Room 🏠</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Room Title *</label>
            <input style={inputStyle} placeholder="e.g. Spacious 1BHK near Metro" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>City *</label>
            <select style={inputStyle} value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}>
              <option value="">Select city</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Area / Locality</label>
            <input style={inputStyle} placeholder="e.g. Koramangala" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Monthly Rent (₹) *</label>
            <input style={inputStyle} type="number" placeholder="8000" value={form.rent} onChange={e => setForm(f => ({ ...f, rent: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Security Deposit (₹)</label>
            <input style={inputStyle} type="number" placeholder="16000" value={form.deposit} onChange={e => setForm(f => ({ ...f, deposit: e.target.value }))} />
          </div>
          <div>
            <label style={labelStyle}>Room Type</label>
            <select style={inputStyle} value={form.roomType} onChange={e => setForm(f => ({ ...f, roomType: e.target.value }))}>
              {['single', 'shared', 'studio', 'flat'].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Gender Preference</label>
            <select style={inputStyle} value={form.genderPreference} onChange={e => setForm(f => ({ ...f, genderPreference: e.target.value }))}>
              {['any', 'male', 'female'].map(g => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1/-1' }}>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Describe the room, neighbourhood, rules..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </div>

        {/* Facilities */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Facilities</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {FACILITIES_LIST.map(f => (
              <button key={f.key} onClick={() => setFacilities(prev => ({ ...prev, [f.key]: !prev[f.key] }))}
                style={{ padding: '5px 12px', borderRadius: 20, border: `1.5px solid ${facilities[f.key] ? 'var(--terra)' : 'var(--parchment-3)'}`, background: facilities[f.key] ? 'var(--terra-light)' : 'white', color: facilities[f.key] ? 'var(--terra-text)' : 'var(--clay-3)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                {f.icon} {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Images */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={labelStyle}>Room Photos (up to 6)</label>
          <input type="file" accept="image/*" multiple style={{ fontSize: '0.82rem' }}
            onChange={e => setImages(Array.from(e.target.files).slice(0, 6))} />
          {images.length > 0 && <p style={{ fontSize: '0.75rem', color: 'var(--clay-3)', marginTop: 4 }}>{images.length} photo(s) selected</p>}
        </div>

        {/* GPS */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={getGPS} style={{ padding: '7px 16px', borderRadius: 10, border: '1.5px solid var(--terra)', background: gpsCoords ? 'var(--terra-light)' : 'white', color: 'var(--terra)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 700 }}>
            📍 {gpsCoords ? 'Location Captured' : 'Add My Location'}
          </button>
          <span style={{ fontSize: '0.75rem', color: 'var(--clay-3)' }}>Helps users find you on the map</span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={onClose}>Cancel</button>
          <button className="btn btn-terra btn-sm" style={{ flex: 1 }} onClick={submit} disabled={saving}>
            {saving ? 'Posting...' : 'Post Room Listing'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RoomListings() {
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ city: '', minRent: '', maxRent: '', roomType: '' });
  const [showCreate, setShowCreate] = useState(false);
  const [saved, setSaved] = useState(new Set());
  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const recogRef = useRef(null);

  const loadListings = async (f = filters) => {
    setLoading(true);
    try {
      const { data } = await roomApi.list(f);
      setListings(data.listings || []);
    } catch { toast('Failed to load listings', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadListings(); }, []);

  const handleSave = async (id) => {
    if (!isAuthenticated) return toast('Login to save listings', 'error');
    try {
      const { data } = await roomApi.save(id);
      setSaved(prev => {
        const next = new Set(prev);
        data.saved ? next.add(id) : next.delete(id);
        return next;
      });
    } catch { toast('Failed to save', 'error'); }
  };

  // Feature 8: Voice Search
  const startVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return toast('Voice search not supported in this browser', 'error');

    const recog = new SpeechRecognition();
    recog.lang = 'en-IN';
    recog.interimResults = false;
    recogRef.current = recog;

    recog.onstart = () => setVoiceListening(true);
    recog.onend = () => setVoiceListening(false);

    recog.onresult = (e) => {
      const transcript = e.results[0][0].transcript.toLowerCase();
      setVoiceText(transcript);

      // Parse voice commands
      const cityMatch = CITIES.find(c => transcript.includes(c.toLowerCase()));
      const budgetMatch = transcript.match(/(\d+)\s*(thousand|k|rupees)?/);
      const typeMatch = ['single', 'shared', 'studio', 'flat'].find(t => transcript.includes(t));

      const newFilters = { ...filters };
      if (cityMatch) newFilters.city = cityMatch;
      if (budgetMatch) newFilters.maxRent = String(parseInt(budgetMatch[1]) * (budgetMatch[2]?.match(/thousand|k/) ? 1000 : 1));
      if (typeMatch) newFilters.roomType = typeMatch;

      setFilters(newFilters);
      loadListings(newFilters);
      toast(`🎙️ Searching: "${transcript}"`, 'info', 3000);
    };

    recog.start();
  };

  const applyFilters = () => loadListings(filters);

  const inputStyle = { padding: '0.6rem 0.875rem', border: '1.5px solid var(--parchment-3)', borderRadius: 10, fontFamily: 'var(--font-body)', fontSize: '0.875rem', background: 'var(--parchment-1)', outline: 'none' };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 68 }}>
      {/* Header */}
      <section style={{ background: 'var(--parchment-2)', padding: '2.5rem clamp(1.5rem, 5vw, 4rem)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, marginBottom: '0.5rem' }}>
            Find Your <em style={{ color: 'var(--terra)', fontStyle: 'italic' }}>Perfect Room</em>
          </h1>
          <p style={{ color: 'var(--clay-3)', marginBottom: '1.5rem' }}>Browse available rooms with photos, rent details & facilities</p>

          {/* Filters */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <select style={inputStyle} value={filters.city} onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}>
              <option value="">All Cities</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input style={{ ...inputStyle, width: 110 }} type="number" placeholder="Min ₹" value={filters.minRent} onChange={e => setFilters(f => ({ ...f, minRent: e.target.value }))} />
            <input style={{ ...inputStyle, width: 110 }} type="number" placeholder="Max ₹" value={filters.maxRent} onChange={e => setFilters(f => ({ ...f, maxRent: e.target.value }))} />
            <select style={inputStyle} value={filters.roomType} onChange={e => setFilters(f => ({ ...f, roomType: e.target.value }))}>
              <option value="">All Types</option>
              {['single', 'shared', 'studio', 'flat'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button className="btn btn-terra btn-sm" onClick={applyFilters}>Search</button>

            {/* Voice search button */}
            <button onClick={startVoiceSearch} title="Voice Search"
              style={{ padding: '0.55rem 1rem', borderRadius: 10, border: `2px solid ${voiceListening ? 'var(--terra)' : 'var(--parchment-3)'}`, background: voiceListening ? 'var(--terra-light)' : 'white', cursor: 'pointer', fontSize: '1.1rem', animation: voiceListening ? 'pulse 1s infinite' : 'none' }}>
              🎙️
            </button>

            {isAuthenticated && (
              <button className="btn btn-ghost btn-sm" onClick={() => setShowCreate(true)} style={{ marginLeft: 'auto' }}>
                + List My Room
              </button>
            )}
          </div>

          {voiceText && (
            <p style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--clay-3)' }}>
              🎙️ Heard: "<em>{voiceText}</em>"
            </p>
          )}
        </div>
      </section>

      {/* Listings Grid */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem clamp(1.5rem, 5vw, 4rem)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}><Spinner dark /></div>
        ) : listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--clay-3)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏚️</div>
            <p>No rooms found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
            {listings.map(listing => (
              <RoomCard key={listing._id} listing={listing} onSave={handleSave} saved={saved.has(listing._id)} />
            ))}
          </div>
        )}
      </section>

      {showCreate && <CreateListingModal onClose={() => setShowCreate(false)} onCreated={() => loadListings()} />}
      <Footer />
    </div>
  );
}