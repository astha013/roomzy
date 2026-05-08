import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { roomApi } from '../api';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/UI';
import Footer from '../components/Footer';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const FACILITIES_LIST = [
  { key: 'wifi',        label: 'Wi-Fi',         icon: '📶' },
  { key: 'ac',          label: 'AC',             icon: '❄️' },
  { key: 'parking',     label: 'Parking',        icon: '🅿️' },
  { key: 'laundry',     label: 'Laundry',        icon: '🧺' },
  { key: 'kitchen',     label: 'Kitchen',        icon: '🍳' },
  { key: 'gym',         label: 'Gym',            icon: '🏋️' },
  { key: 'security',    label: 'Security',       icon: '🔒' },
  { key: 'powerBackup', label: 'Power Backup',   icon: '🔋' },
  { key: 'furnished',   label: 'Furnished',      icon: '🛋️' },
  { key: 'water',       label: 'Water 24/7',     icon: '💧' },
];

function ImageGallery({ images, title }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div style={{
        height: 320, background: 'var(--parchment-2)', borderRadius: 16,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '0.75rem', color: 'var(--clay-3)',
        border: '2px dashed var(--parchment-3)'
      }}>
        <span style={{ fontSize: '4rem' }}>🏠</span>
        <p style={{ fontWeight: 600 }}>No photos uploaded yet</p>
      </div>
    );
  }

  return (
    <>
      {/* Main image */}
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: '0.75rem', cursor: 'zoom-in' }}
        onClick={() => setLightbox(true)}>
        <img
          src={images[active]?.startsWith('http') ? images[active] : `${BASE}${images[active]}`}
          alt={`${title} - photo ${active + 1}`}
          style={{ width: '100%', height: 380, objectFit: 'cover', display: 'block' }}
          onError={e => {
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
        <div style={{
          display: 'none', width: '100%', height: 380,
          background: 'var(--parchment-2)', alignItems: 'center',
          justifyContent: 'center', flexDirection: 'column', gap: '0.5rem', color: 'var(--clay-3)'
        }}>
          <span style={{ fontSize: '3rem' }}>🖼️</span>
          <p style={{ fontSize: '0.85rem' }}>Image not available</p>
        </div>

        {/* Overlay badges */}
        <div style={{
          position: 'absolute', bottom: 12, left: 12,
          background: 'rgba(0,0,0,0.55)', color: 'white',
          fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20
        }}>
          {active + 1} / {images.length} · Click to zoom
        </div>

        {/* Nav arrows */}
        {images.length > 1 && (
          <>
            <button onClick={e => { e.stopPropagation(); setActive(a => (a - 1 + images.length) % images.length); }}
              style={arrowBtn('left')}>‹</button>
            <button onClick={e => { e.stopPropagation(); setActive(a => (a + 1) % images.length); }}
              style={arrowBtn('right')}>›</button>
          </>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: 4 }}>
          {images.map((img, i) => (
            <button key={i} onClick={() => setActive(i)}
              style={{
                flexShrink: 0, width: 72, height: 54, borderRadius: 10, overflow: 'hidden',
                border: `2.5px solid ${i === active ? 'var(--terra)' : 'transparent'}`,
                padding: 0, cursor: 'pointer', background: 'var(--parchment-2)', transition: 'border-color 0.15s'
              }}>
              <img src={img?.startsWith("http") ? img : `${BASE}${img}`} alt={`thumb ${i + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
            zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: '1rem'
          }}
          onClick={() => setLightbox(false)}
        >
          <img
            src={images[active]?.startsWith('http') ? images[active] : `${BASE}${images[active]}`}
            alt={`${title} - photo ${active + 1}`}
            style={{ maxWidth: '92vw', maxHeight: '82vh', objectFit: 'contain', borderRadius: 12 }}
            onClick={e => e.stopPropagation()}
          />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
            {active + 1} / {images.length} — Click outside to close
          </p>
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={e => { e.stopPropagation(); setActive(a => (a - 1 + images.length) % images.length); }}
                style={{ ...arrowBtn('left'), position: 'static', transform: 'none', padding: '8px 18px', borderRadius: 10, fontSize: '1.5rem' }}>‹ Prev</button>
              <button onClick={e => { e.stopPropagation(); setActive(a => (a + 1) % images.length); }}
                style={{ ...arrowBtn('right'), position: 'static', transform: 'none', padding: '8px 18px', borderRadius: 10, fontSize: '1.5rem' }}>Next ›</button>
            </div>
          )}
        </div>
      )}
    </>
  );
}

const arrowBtn = (side) => ({
  position: 'absolute', top: '50%', [side]: 12,
  transform: 'translateY(-50%)',
  background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none',
  width: 38, height: 38, borderRadius: '50%', cursor: 'pointer',
  fontSize: '1.4rem', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'background 0.15s',
});

export default function RoomDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    roomApi.getById(id)
      .then(({ data }) => setListing(data))
      .catch(() => { toast('Could not load room listing', 'error'); navigate('/rooms'); })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: 68 }}>
        <Spinner dark size={32} />
      </div>
    );
  }

  if (!listing) return null;

  const enabledFacilities = FACILITIES_LIST.filter(f => listing.facilities?.[f.key]);

  return (
    <div style={{ minHeight: '100vh', paddingTop: 68, background: 'var(--parchment)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2rem clamp(1rem, 5vw, 2rem)' }}>

        {/* Back button */}
        <button onClick={() => navigate('/rooms')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--clay-3)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
          ← Back to listings
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr clamp(280px, 32%, 320px)', gap: '2rem', alignItems: 'start' }}>

          {/* Left: images + details */}
          <div>
            <ImageGallery images={listing.images} title={listing.title} />

            <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', marginTop: '1.25rem', border: '1px solid var(--parchment-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div>
                  <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.2rem, 3vw, 1.6rem)', fontWeight: 900, color: 'var(--clay)', marginBottom: '0.3rem' }}>
                    {listing.title}
                  </h1>
                  <p style={{ color: 'var(--clay-3)', fontSize: '0.875rem' }}>
                    📍 {listing.area ? `${listing.area}, ` : ''}{listing.city}
                    {listing.address ? ` · ${listing.address}` : ''}
                  </p>
                </div>
                <span style={{
                  background: 'var(--terra-light)', color: 'var(--terra)',
                  padding: '4px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0
                }}>
                  {listing.roomType}
                </span>
              </div>

              {/* Rent + Deposit */}
              <div style={{ display: 'flex', gap: '1.5rem', padding: '1rem', background: 'var(--parchment-1)', borderRadius: 12, marginBottom: '1.25rem' }}>
                <div>
                  <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--clay-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Monthly Rent</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 900, color: 'var(--terra)' }}>
                    ₹{listing.rent?.toLocaleString('en-IN')}
                  </p>
                </div>
                {listing.deposit > 0 && (
                  <div>
                    <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--clay-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Security Deposit</p>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 900, color: 'var(--clay)' }}>
                      ₹{listing.deposit?.toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
                {listing.availableFrom && (
                  <div>
                    <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--clay-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Available From</p>
                    <p style={{ fontWeight: 700, color: 'var(--clay)', marginTop: 4 }}>
                      {new Date(listing.availableFrom).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              {listing.description && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--clay-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>About this room</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--clay-2)', lineHeight: 1.7 }}>{listing.description}</p>
                </div>
              )}

              {/* Facilities */}
              {enabledFacilities.length > 0 && (
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--clay-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Facilities & Amenities</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {enabledFacilities.map(f => (
                      <span key={f.key} style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        background: 'var(--parchment-2)', padding: '5px 12px', borderRadius: 20,
                        fontSize: '0.8rem', fontWeight: 600, color: 'var(--clay-2)'
                      }}>
                        {f.icon} {f.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Preferences */}
              <div style={{ marginTop: '1.25rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                {listing.genderPreference && listing.genderPreference !== 'any' && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--clay-3)', background: 'var(--parchment-2)', padding: '4px 12px', borderRadius: 20 }}>
                    👤 {listing.genderPreference === 'male' ? 'Male only' : listing.genderPreference === 'female' ? 'Female only' : 'Any'}
                  </span>
                )}
                {listing.viewCount > 0 && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--clay-3)', background: 'var(--parchment-2)', padding: '4px 12px', borderRadius: 20 }}>
                    👁️ {listing.viewCount} views
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Right: owner card + contact */}
          <div style={{ position: 'sticky', top: 88 }}>
            <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', border: '1px solid var(--parchment-3)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--clay-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>Listed By</p>

              <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'center', marginBottom: '1.25rem' }}>
                {listing.owner?.profilePhoto ? (
                  <img src={listing.owner.profilePhoto?.startsWith("http") ? listing.owner.profilePhoto : `${BASE}${listing.owner.profilePhoto}`} alt={listing.owner.name}
                    style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--parchment-3)' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'var(--terra-light)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '1.2rem', color: 'var(--terra)'
                  }}>
                    {(listing.owner?.name || '?')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 2 }}>{listing.owner?.name || 'Owner'}</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--clay-3)' }}>📍 {listing.owner?.city || listing.city}</p>
                  <span style={{
                    display: 'inline-block', marginTop: 4, fontSize: '0.7rem', fontWeight: 700,
                    color: (listing.owner?.trustScore || 0) >= 30 ? 'var(--forest)' : 'var(--terra)',
                    background: (listing.owner?.trustScore || 0) >= 30 ? 'var(--forest-light)' : 'var(--terra-light)',
                    padding: '2px 8px', borderRadius: 20
                  }}>
                    Trust {listing.owner?.trustScore ?? 0}
                  </span>
                </div>
              </div>

              <button
                className="btn btn-terra"
                style={{ width: '100%', justifyContent: 'center', marginBottom: '0.6rem' }}
                onClick={() => navigate('/chat', { state: { userId: listing.owner?._id, listingTitle: listing.title, fromListing: true } })}
              >
                💬 Message Owner
              </button>
              <button
                className="btn btn-ghost btn-sm"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => navigate('/rooms')}
              >
                ← More listings
              </button>
            </div>

            {/* Map placeholder when coords available */}
            {listing.coordinates?.lat && listing.coordinates?.lng && (
              <div style={{ background: 'white', borderRadius: 16, padding: '1.25rem', border: '1px solid var(--parchment-3)' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--clay-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.75rem' }}>Location</p>
                <a
                  href={`https://www.google.com/maps?q=${listing.coordinates.lat},${listing.coordinates.lng}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'block', background: 'var(--parchment-2)', borderRadius: 12,
                    padding: '0.875rem', textAlign: 'center', textDecoration: 'none',
                    color: 'var(--clay)', fontWeight: 600, fontSize: '0.85rem',
                    border: '1px dashed var(--parchment-3)', transition: 'background 0.15s'
                  }}
                >
                  📍 View on Google Maps →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}