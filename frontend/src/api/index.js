import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach token on every request ──────────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('rz_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Global error handler ───────────────────────────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('rz_token');
      localStorage.removeItem('rz_user');
      window.dispatchEvent(new Event('rz:logout'));
    }
    return Promise.reject(err);
  }
);

// ══════════════════════════════════════════════════════════════════════════
// AUTH  — /api/auth/*
// ══════════════════════════════════════════════════════════════════════════
export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  verifyEmail: (token) => api.get(`/auth/verify-email/${token}`),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
};

// ══════════════════════════════════════════════════════════════════════════
// PROFILE  — /api/profile/*
// ══════════════════════════════════════════════════════════════════════════
export const profileApi = {
  getMe: () => api.get('/profile/me'),
  getById: (id) => api.get(`/profile/${id}`),
  updateProfile: (data) => api.put('/profile/profile', data),
  updatePreferences: (data) => api.put('/profile/preferences', data),
  updateWeights: (data) => api.put('/profile/weights', data),
  uploadPhoto: (formData) =>
    api.put('/profile/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

// ══════════════════════════════════════════════════════════════════════════
// MATCHES  — /api/matches/*
// ══════════════════════════════════════════════════════════════════════════
export const matchApi = {
  getSuggestions: () => api.get('/matches/suggestions'),
  getMatched: () => api.get('/matches'),
  like: (userId) => api.post(`/matches/like/${userId}`),
  pass: (userId) => api.post(`/matches/pass/${userId}`),
};

// ══════════════════════════════════════════════════════════════════════════
// OTP  — /api/otp/*
// ══════════════════════════════════════════════════════════════════════════
export const otpApi = {
  send: (phoneNumber) => api.post('/otp/send', { phoneNumber }),
  verify: (phoneNumber, otp) => api.post('/otp/verify', { phoneNumber, otp }),
  status: () => api.get('/otp/status'),
};

// ══════════════════════════════════════════════════════════════════════════
// LIVENESS  — /api/liveness/*
// ══════════════════════════════════════════════════════════════════════════
export const livenessApi = {
  capture: (formData) =>
    api.post('/liveness/capture', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  verify: () => api.post('/liveness/verify'),
  status: () => api.get('/liveness/status'),
};

// ══════════════════════════════════════════════════════════════════════════
// SOCIAL  — /api/social/*
// ══════════════════════════════════════════════════════════════════════════
export const socialApi = {
  save: (data) => api.post('/social/save', data),
  myLinks: () => api.get('/social/my-links'),
};

// ══════════════════════════════════════════════════════════════════════════
// VERIFICATION  — /api/verification/*
// ══════════════════════════════════════════════════════════════════════════
export const verificationApi = {
  uploadId: (formData) =>
    api.post('/verification/upload-id', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  verifyId: () => api.post('/verification/verify-id'),
  status: () => api.get('/verification/status'),
};

// ══════════════════════════════════════════════════════════════════════════
// REVIEWS  — /api/reviews/*
// ══════════════════════════════════════════════════════════════════════════
export const reviewApi = {
  create: (data) => api.post('/reviews', data),
  getForUser: (userId) => api.get(`/reviews/user/${userId}`),
};

// ══════════════════════════════════════════════════════════════════════════
// REPORTS  — /api/reports/*
// ══════════════════════════════════════════════════════════════════════════
export const reportApi = {
  create: (data) => api.post('/reports', data),
  block: (userId) => api.post(`/reports/block/${userId}`),
  unblock: (userId) => api.delete(`/reports/unblock/${userId}`),
  getBlocked: () => api.get('/reports/blocked'),
};

// ══════════════════════════════════════════════════════════════════════════
// AGREEMENT  — /api/agreements/*
// ══════════════════════════════════════════════════════════════════════════
export const agreementApi = {
  create: (data) => api.post('/agreements/create', data),
  download: (matchId) =>
    api.get(`/agreements/download/${matchId}`, { responseType: 'blob' }),
};

// ══════════════════════════════════════════════════════════════════════════
// CHAT  — /api/chat/*
// ══════════════════════════════════════════════════════════════════════════
export const chatApi = {
  list: () => api.get('/chat/list'),
  messages: (chatId) => api.get(`/chat/${chatId}/messages`),
};

// ══════════════════════════════════════════════════════════════════════════
// ADMIN  — /api/admin/*
// ══════════════════════════════════════════════════════════════════════════
export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  getReports: () => api.get('/admin/reports'),
  updateReport: (id, data) => api.put(`/admin/reports/${id}`, data),
  getStats: () => api.get('/admin/stats'),
};

export default api;
