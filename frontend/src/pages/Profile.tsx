import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { profileAPI, verificationAPI } from '../services/api';
import TrustScoreBadge from '../components/TrustScoreBadge';

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  bio: string;
  dateOfBirth: string;
  gender: string;
  profilePhoto: string;
  isVerified: boolean;
  isEmailVerified: boolean;
  trustScore: number;
  aiSummary: string;
  preferences: {
    budgetMin: number;
    budgetMax: number;
    moveInDate: string;
  };
}

function Profile() {
  const { id } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    phone: '', 
    city: '',
    bio: '',
    dateOfBirth: '',
    gender: 'prefer_not_to_say'
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = id ? await profileAPI.getProfile(id) : await profileAPI.getMe();
        setUser(res.data);
        if (!id) {
          setCurrentUserId(res.data._id);
        }
        setFormData({ 
          name: res.data.name || '', 
          phone: res.data.phone || '', 
          city: res.data.city || '',
          bio: res.data.bio || '',
          dateOfBirth: res.data.dateOfBirth ? res.data.dateOfBirth.split('T')[0] : '',
          gender: res.data.gender || 'prefer_not_to_say'
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleSave = async () => {
    try {
      await profileAPI.updateProfile(formData);
      setUser({ ...user, ...formData } as User);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('profilePhoto', file);
    
    try {
      const res = await profileAPI.uploadPhoto(formData);
      setUser({ ...user, profilePhoto: res.data.profilePhoto } as User);
    } catch (err) {
      console.error(err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  const isOwnProfile = !id || (currentUserId && id === currentUserId) || (id === localStorage.getItem('userId'));

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px' }}>Profile</h1>
      
      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
          <div style={{ position: 'relative' }}>
            <img 
              src={user?.profilePhoto ? `http://localhost:5000/${user.profilePhoto}` : 'https://via.placeholder.com/100'} 
              alt="Profile" 
              style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }} 
            />
            {isOwnProfile && (
              <label style={{ 
                position: 'absolute', 
                bottom: 0, 
                right: 0, 
                background: '#4f46e5', 
                color: 'white', 
                borderRadius: '50%', 
                padding: '8px', 
                cursor: 'pointer',
                fontSize: '12px'
              }}>
                📷
                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} disabled={uploadingPhoto} />
              </label>
            )}
          </div>
          <div>
            <h2 style={{ margin: '0 0 5px' }}>{user?.name}</h2>
            <p style={{ color: '#6b7280', margin: '0 0 5px', fontSize: '14px' }}>{user?.email}</p>
            <TrustScoreBadge score={user?.trustScore || 50} />
          </div>
        </div>

        {isEditing && isOwnProfile ? (
          <div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Name</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} 
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Phone</label>
              <input 
                type="text" 
                value={formData.phone} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} 
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>City</label>
              <input 
                type="text" 
                value={formData.city} 
                onChange={(e) => setFormData({ ...formData, city: e.target.value })} 
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} 
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Bio</label>
              <textarea 
                value={formData.bio} 
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })} 
                placeholder="Tell us about yourself..."
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px', minHeight: '100px' }} 
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Gender</label>
              <select 
                value={formData.gender} 
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })} 
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>Date of Birth</label>
              <input 
                type="date" 
                value={formData.dateOfBirth} 
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })} 
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '8px' }} 
              />
            </div>
            <button onClick={handleSave} style={{ padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginRight: '10px' }}>Save</button>
            <button onClick={() => setIsEditing(false)} style={{ padding: '10px 20px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
          </div>
        ) : (
          <>
            {isOwnProfile && (
              <button onClick={() => setIsEditing(true)} style={{ padding: '10px 20px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Edit Profile</button>
            )}
            {user?.bio && (
              <div style={{ marginTop: '15px' }}>
                <h4 style={{ color: '#6b7280', marginBottom: '5px' }}>About</h4>
                <p style={{ color: '#374151' }}>{user.bio}</p>
              </div>
            )}
            {user?.city && (
              <p style={{ marginTop: '10px', color: '#6b7280' }}>📍 {user.city}</p>
            )}
          </>
        )}
      </div>

      <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>Verification Status</h3>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ padding: '10px', background: user?.isEmailVerified ? '#d1fae5' : '#fee2e2', borderRadius: '8px' }}>
            {user?.isEmailVerified ? '✅' : '❌'} Email Verified
          </div>
          <div style={{ padding: '10px', background: user?.isVerified ? '#d1fae5' : '#fee2e2', borderRadius: '8px' }}>
            {user?.isVerified ? '✅' : '❌'} Identity Verified
          </div>
        </div>
        {isOwnProfile && !user?.isVerified && (
          <Link to="/verification" style={{ display: 'inline-block', marginTop: '15px', padding: '10px 20px', background: '#f59e0b', color: 'white', borderRadius: '8px', textDecoration: 'none' }}>
            Verify Identity
          </Link>
        )}
      </div>

      {user?.aiSummary && (
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '10px' }}>AI Summary</h3>
          <p style={{ color: '#4b5563' }}>{user.aiSummary}</p>
        </div>
      )}
    </div>
  );
}

export default Profile;