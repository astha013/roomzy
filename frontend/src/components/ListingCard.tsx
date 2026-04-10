import { Link } from 'react-router-dom';

function ListingCard({ listing }) {
  return (
    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
      <div style={{ position: 'relative', height: '200px' }}>
        <img src={listing.photos?.[0] || 'https://via.placeholder.com/300x200'} alt={listing.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <span style={{ position: 'absolute', top: '10px', left: '10px', padding: '5px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '500', background: listing.intent === 'roommate' ? '#4f46e5' : '#059669', color: 'white' }}>
          {listing.intent === 'roommate' ? 'Looking for Roommate' : 'Looking for Room'}
        </span>
      </div>
      <div style={{ padding: '20px' }}>
        <h3 style={{ margin: '0 0 5px', fontSize: '18px' }}>{listing.title}</h3>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '10px' }}>{listing.location?.address}</p>
        <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
          <span style={{ fontSize: '20px', fontWeight: '700', color: '#4f46e5' }}>₹{listing.rent}</span>
          <span style={{ color: '#6b7280', fontSize: '14px' }}>Deposit: ₹{listing.deposit || 0}</span>
        </div>
        {listing.owner && (
          <p style={{ marginBottom: '15px', fontSize: '14px', color: '#6b7280' }}>Owner: {listing.owner.name}</p>
        )}
        <Link to={`/listings/${listing._id}`} style={{ display: 'inline-block', padding: '10px 20px', background: '#4f46e5', color: 'white', borderRadius: '8px', textDecoration: 'none' }}>View Details</Link>
      </div>
    </div>
  );
}

export default ListingCard;