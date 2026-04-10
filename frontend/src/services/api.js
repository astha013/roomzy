import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me')
};

export const profileAPI = {
  getProfile: (id) => api.get(`/profile/${id}`),
  updateProfile: (data) => api.put('/profile/profile', data),
  updatePreferences: (data) => api.put('/profile/preferences', data),
  updateWeights: (data) => api.put('/profile/weights', data)
};

export const matchAPI = {
  getSuggestions: () => api.get('/matches/suggestions'),
  likeUser: (userId) => api.post(`/matches/like/${userId}`),
  passUser: (userId) => api.post(`/matches/pass/${userId}`),
  getMatches: () => api.get('/matches')
};

export const listingAPI = {
  createListing: (data) => api.post('/listings', data),
  getListings: (params) => api.get('/listings', { params }),
  getListing: (id) => api.get(`/listings/${id}`),
  updateListing: (id, data) => api.put(`/listings/${id}`, data),
  deleteListing: (id) => api.delete(`/listings/${id}`)
};

export const reviewAPI = {
  createReview: (data) => api.post('/reviews', data),
  getUserReviews: (userId) => api.get(`/reviews/user/${userId}`)
};

export const reportAPI = {
  reportUser: (data) => api.post('/reports', data),
  blockUser: (userId) => api.post(`/reports/block/${userId}`),
  unblockUser: (userId) => api.delete(`/reports/unblock/${userId}`),
  getBlockedUsers: () => api.get('/reports/blocked')
};

export const verificationAPI = {
  submitDocuments: (data) => api.post('/verification/submit', data),
  verify: () => api.post('/verification/verify'),
  getStatus: () => api.get('/verification/status')
};

export const agreementAPI = {
  createAgreement: (data) => api.post('/agreements/create', data),
  downloadAgreement: (matchId) => api.get(`/agreements/download/${matchId}`, { responseType: 'blob' })
};

export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  getReports: () => api.get('/admin/reports'),
  updateReport: (id, data) => api.put(`/admin/reports/${id}`, data),
  getStats: () => api.get('/admin/stats')
};

export default api;