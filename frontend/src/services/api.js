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
  getMe: () => api.get('/auth/me'),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password })
};

export const profileAPI = {
  getMe: () => api.get('/profile/me'),
  getProfile: (id) => api.get(`/profile/${id}`),
  updateProfile: (data) => api.put('/profile/profile', data),
  uploadPhoto: (formData) => api.put('/profile/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updatePreferences: (data) => api.put('/profile/preferences', data),
  updateWeights: (data) => api.put('/profile/weights', data)
};

export const matchAPI = {
  getSuggestions: () => api.get('/matches/suggestions'),
  likeUser: (userId) => api.post(`/matches/like/${userId}`),
  passUser: (userId) => api.post(`/matches/pass/${userId}`),
  getMatches: () => api.get('/matches')
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
  uploadId: (formData) => api.post('/verification/upload-id', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  captureSelfie: (formData) => api.post('/verification/capture-selfie', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
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

export const otpAPI = {
  sendOTP: (phoneNumber) => api.post('/otp/send', { phoneNumber }),
  verifyOTP: (phoneNumber, otp) => api.post('/otp/verify', { phoneNumber, otp }),
  getStatus: () => api.get('/otp/status')
};

export const livenessAPI = {
  capture: (formData) => api.post('/liveness/capture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  verify: () => api.post('/liveness/verify'),
  getStatus: () => api.get('/liveness/status')
};

export const socialAPI = {
  saveLinks: (links) => api.post('/social/save', links),
  getLinks: () => api.get('/social/my-links')
};

export default api;
