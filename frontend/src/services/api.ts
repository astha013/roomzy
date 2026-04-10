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
  register: (data: { name: string; email: string; password: string; intent: string; city: string }) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  resendVerification: (email: string) => api.post('/auth/resend-verification', { email }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) => api.post(`/auth/reset-password/${token}`, { password })
};

export const profileAPI = {
  getMe: () => api.get('/profile/me'),
  getProfile: (id: string) => api.get(`/profile/${id}`),
  updateProfile: (data: { name?: string; phone?: string; city?: string; bio?: string; dateOfBirth?: string; gender?: string; intent?: string; area?: string }) => api.put('/profile/profile', data),
  uploadPhoto: (formData: FormData) => api.put('/profile/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updatePreferences: (data: { preferences?: Record<string, unknown>; moveInDate?: string; city?: string; intent?: string; area?: string }) => api.put('/profile/preferences', data),
  updateWeights: (data: Record<string, number>) => api.put('/profile/weights', data)
};

export const matchAPI = {
  getSuggestions: () => api.get('/matches/suggestions'),
  likeUser: (userId: string) => api.post(`/matches/like/${userId}`),
  passUser: (userId: string) => api.post(`/matches/pass/${userId}`),
  getMatches: () => api.get('/matches')
};

export const reviewAPI = {
  createReview: (data: { reviewedUserId: string; ratings: Record<string, number>; comment: string; stayDuration?: string; wouldRecommend?: boolean }) => api.post('/reviews', data),
  getUserReviews: (userId: string) => api.get(`/reviews/user/${userId}`)
};

export const reportAPI = {
  reportUser: (data: { reportedUserId: string; reason: string; description?: string }) => api.post('/reports', data),
  blockUser: (userId: string) => api.post(`/reports/block/${userId}`),
  unblockUser: (userId: string) => api.delete(`/reports/unblock/${userId}`),
  getBlockedUsers: () => api.get('/reports/blocked')
};

export const verificationAPI = {
  uploadId: (formData: FormData) => api.post('/verification/upload-id', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  captureSelfie: (formData: FormData) => api.post('/verification/capture-selfie', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  verify: () => api.post('/verification/verify'),
  getStatus: () => api.get('/verification/status')
};

export const agreementAPI = {
  createAgreement: (data: { matchId: string; rent: number; rentSplit: { userA: number; userB: number }; rules: string[]; moveInDate: string }) => api.post('/agreements/create', data),
  downloadAgreement: (matchId: string) => api.get(`/agreements/download/${matchId}`, { responseType: 'blob' })
};

export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  getReports: () => api.get('/admin/reports'),
  updateReport: (id: string, data: { status: string; resolution?: string; actionTaken?: string }) => api.put(`/admin/reports/${id}`, data),
  getStats: () => api.get('/admin/stats')
};

export const otpAPI = {
  sendOTP: (phoneNumber: string) => api.post('/otp/send', { phoneNumber }),
  verifyOTP: (phoneNumber: string, otp: string) => api.post('/otp/verify', { phoneNumber, otp }),
  getStatus: () => api.get('/otp/status')
};

export const livenessAPI = {
  capture: (formData: FormData) => api.post('/liveness/capture', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  verify: () => api.post('/liveness/verify'),
  getStatus: () => api.get('/liveness/status')
};

export const socialAPI = {
  saveLinks: (links: { linkedin?: string; instagram?: string; collegeEmail?: string; companyEmail?: string }) => api.post('/social/save', links),
  getLinks: () => api.get('/social/my-links')
};

export default api;