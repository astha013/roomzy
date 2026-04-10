import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { reviewAPI, authAPI } from '../services/api';

function Reviews() {
  const { userId } = useParams();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ ratings: { cleanliness: 3, communication: 3, responsibility: 3, friendliness: 3, overall: 3 }, comment: '' });

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await reviewAPI.getUserReviews(userId);
        setReviews(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await reviewAPI.createReview({ reviewedUserId: userId, ...formData });
      window.location.reload();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Reviews</h1>
      
      <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '20px' }}>
        {showForm ? 'Cancel' : 'Write a Review'}
      </button>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>Rate this user</h3>
          {['cleanliness', 'communication', 'responsibility', 'friendliness', 'overall'].map(field => (
            <div key={field} style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', textTransform: 'capitalize' }}>{field}</label>
              <input type="range" min="1" max="5" value={formData.ratings[field]} onChange={(e) => setFormData({ ...formData, ratings: { ...formData.ratings, [field]: parseInt(e.target.value) } })} style={{ width: '100%' }} />
            </div>
          ))}
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Comment</label>
            <textarea value={formData.comment} onChange={(e) => setFormData({ ...formData, comment: e.target.value })} style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', minHeight: '100px' }} />
          </div>
          <button type="submit" style={{ padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Submit Review</button>
        </form>
      )}

      {reviews.length > 0 ? (
        reviews.map(review => (
          <div key={review._id} style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
              <img src={review.reviewer?.profilePhoto || 'https://via.placeholder.com/40'} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
              <div>
                <h4 style={{ margin: 0 }}>{review.reviewer?.name}</h4>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>{review.ratings.overall}/5</span>
              </div>
            </div>
            <p style={{ color: '#4b5563' }}>{review.comment}</p>
          </div>
        ))
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '12px' }}>
          <p style={{ color: '#6b7280' }}>No reviews yet</p>
        </div>
      )}
    </div>
  );
}

export default Reviews;