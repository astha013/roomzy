import { http, HttpResponse } from 'msw';

const BASE = 'http://localhost:5000/api';

// ── Fixture data ─────────────────────────────────────────────────────────────
export const MOCK_USER = {
  _id: 'user123',
  name: 'Priya Sharma',
  email: 'priya@test.com',
  city: 'Mumbai',
  intent: 'looking_for_roommate',
  trustScore: 50,
  isEmailVerified: true,
  phoneVerified: true,
  selfieVerified: false,
  governmentIdVerified: false,
  isAdmin: false,
  isBlocked: false,
  aiSummary: 'A clean and organized person who prefers quiet evenings.',
  preferences: {
    budgetMin: 8000,
    budgetMax: 18000,
    sleepTime: 'early',
    cleanliness: 4,
    foodHabit: 'veg',
    genderPreference: 'any',
    noiseTolerance: 3,
    personality: 'introvert',
    moveInDate: '2026-05-01T00:00:00.000Z',
  },
  preferenceWeights: { budget:3, sleepTime:3, cleanliness:3, foodHabit:3, genderPreference:2, noiseTolerance:2, personality:3, location:3 },
  socialLinks: { linkedin:'', linkedinVerified:false, instagram:'', instagramVerified:false, collegeEmail:'', collegeEmailVerified:false, companyEmail:'', companyEmailVerified:false },
  blockedUsers: [],
  reviewTrustPoints: 0,
};

export const MOCK_TOKEN = 'mock.jwt.token';

export const MOCK_MATCH_SUGGESTIONS = [
  {
    user: {
      _id: 'user456', name: 'Arjun Kapoor', city: 'Mumbai',
      intent: 'have_room_need_roommate', trustScore: 62,
      aiSummary: 'Friendly and social person.',
      preferences: { budgetMin:10000, budgetMax:20000, sleepTime:'flexible', cleanliness:3, foodHabit:'non-veg', genderPreference:'any', noiseTolerance:4, personality:'extrovert', moveInDate:'2026-05-05T00:00:00.000Z' },
    },
    compatibilityScore: 82,
    breakdown: { budget:88, sleepTime:75, cleanliness:75, foodHabit:60, genderPreference:100, noiseTolerance:75, personality:50, location:80 },
  },
  {
    user: {
      _id: 'user789', name: 'Neha Kulkarni', city: 'Mumbai',
      intent: 'have_room_need_roommate', trustScore: 55,
      aiSummary: 'Early riser who loves cooking.',
      preferences: { budgetMin:6000, budgetMax:14000, sleepTime:'early', cleanliness:5, foodHabit:'veg', genderPreference:'female', noiseTolerance:2, personality:'ambivert', moveInDate:'2026-04-28T00:00:00.000Z' },
    },
    compatibilityScore: 91,
    breakdown: { budget:95, sleepTime:100, cleanliness:75, foodHabit:100, genderPreference:100, noiseTolerance:75, personality:75, location:80 },
  },
];

export const MOCK_MATCHED = [
  {
    _id: 'match001',
    userA: { _id: 'user123', name: 'Priya Sharma', city: 'Mumbai', trustScore: 50 },
    userB: { _id: 'user456', name: 'Arjun Kapoor', city: 'Mumbai', trustScore: 62 },
    compatibilityScore: 82,
    status: 'matched',
  },
];

export const MOCK_STATS = {
  totalUsers: 1240,
  trustedUsers: 856,
  blockedUsers: 12,
  pendingReports: 4,
};

// ══════════════════════════════════════════════════════════════════════════
// HANDLERS — mirror every backend route exactly
// ══════════════════════════════════════════════════════════════════════════
export const handlers = [

  // ── AUTH ────────────────────────────────────────────────────────────────
  http.post(`${BASE}/auth/register`, async ({ request }) => {
    const body = await request.json();
    if (!body.name || !body.email || !body.password || !body.city || !body.intent) {
      return HttpResponse.json({ message: 'All fields required' }, { status: 400 });
    }
    if (body.email === 'existing@test.com') {
      return HttpResponse.json({ message: 'User already exists' }, { status: 400 });
    }
    if (!['have_room_need_roommate','looking_for_roommate'].includes(body.intent)) {
      return HttpResponse.json({ message: 'Invalid intent. Must be "have_room_need_roommate" or "looking_for_roommate"' }, { status: 400 });
    }
    if (body.password.length < 6) {
      return HttpResponse.json({ errors: [{ msg: 'Password too short' }] }, { status: 400 });
    }
    return HttpResponse.json({ message: 'Registration successful. Please verify your email to complete signup.', userId: 'newuser123', requiresEmailVerification: true }, { status: 201 });
  }),

  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = await request.json();
    if (body.email === 'priya@test.com' && body.password === 'password123') {
      return HttpResponse.json({ _id: MOCK_USER._id, name: MOCK_USER.name, email: MOCK_USER.email, trustScore: MOCK_USER.trustScore, token: MOCK_TOKEN });
    }
    if (body.email === 'unverified@test.com') {
      return HttpResponse.json({ message: 'Please verify your email first', requiresVerification: true }, { status: 403 });
    }
    return HttpResponse.json({ message: 'Invalid email or password' }, { status: 401 });
  }),

  http.get(`${BASE}/auth/me`, () => {
    return HttpResponse.json(MOCK_USER);
  }),

  http.get(`${BASE}/auth/verify-email/:token`, ({ params }) => {
    if (params.token === 'validtoken') return HttpResponse.json({ message: 'Email verified successfully. You can now login.' });
    return HttpResponse.json({ message: 'Invalid or expired verification token' }, { status: 400 });
  }),

  http.post(`${BASE}/auth/resend-verification`, async ({ request }) => {
    const body = await request.json();
    if (!body.email) return HttpResponse.json({ message: 'Email is required' }, { status: 400 });
    if (body.email === 'verified@test.com') return HttpResponse.json({ message: 'Email already verified' }, { status: 400 });
    return HttpResponse.json({ message: 'Verification email sent successfully' });
  }),

  http.post(`${BASE}/auth/forgot-password`, async ({ request }) => {
    const body = await request.json();
    if (!body.email) return HttpResponse.json({ message: 'Email is required' }, { status: 400 });
    if (body.email === 'ghost@nowhere.com') return HttpResponse.json({ message: 'User not found' }, { status: 404 });
    return HttpResponse.json({ message: 'Password reset email sent successfully' });
  }),

  http.post(`${BASE}/auth/reset-password/:token`, async ({ params, request }) => {
    const body = await request.json();
    if (!body.password || body.password.length < 6) return HttpResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 });
    if (params.token === 'badtoken') return HttpResponse.json({ message: 'Invalid or expired reset token' }, { status: 400 });
    return HttpResponse.json({ message: 'Password reset successfully. You can now login.' });
  }),

  // ── PROFILE ─────────────────────────────────────────────────────────────
  http.get(`${BASE}/profile/me`, () => HttpResponse.json(MOCK_USER)),

  http.put(`${BASE}/profile/profile`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ name: body.name || MOCK_USER.name, city: body.city || MOCK_USER.city, bio: body.bio || '', phoneNumber: body.phone || '' });
  }),

  http.put(`${BASE}/profile/preferences`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      preferences: { ...MOCK_USER.preferences, ...body.preferences },
      moveInDate: body.moveInDate || MOCK_USER.preferences.moveInDate,
      city: body.city || MOCK_USER.city,
      intent: body.intent || MOCK_USER.intent,
      aiSummary: 'Updated AI summary based on new preferences.',
    });
  }),

  http.put(`${BASE}/profile/weights`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...MOCK_USER.preferenceWeights, ...body });
  }),

  http.put(`${BASE}/profile/photo`, () => HttpResponse.json({ profilePhoto: 'uploads/newphoto.jpg' })),

  http.get(`${BASE}/profile/:id`, ({ params }) => {
    if (params.id === 'user456') return HttpResponse.json({ _id:'user456', name:'Arjun Kapoor', city:'Mumbai', trustScore:62 });
    return HttpResponse.json({ message: 'User not found' }, { status: 404 });
  }),

  // ── MATCHES ─────────────────────────────────────────────────────────────
  http.get(`${BASE}/matches/suggestions`, () => HttpResponse.json(MOCK_MATCH_SUGGESTIONS)),

  http.get(`${BASE}/matches`, () => HttpResponse.json(MOCK_MATCHED)),

  http.post(`${BASE}/matches/like/:userId`, ({ params }) => {
    if (params.userId === 'user456') {
      return HttpResponse.json({ message: "It's a match!", match: MOCK_MATCHED[0], isNowMatched: true });
    }
    return HttpResponse.json({ message: 'Like sent', match: { status:'liked', compatibilityScore:75 }, isNowMatched: false });
  }),

  http.post(`${BASE}/matches/pass/:userId`, () => HttpResponse.json({ message: 'User passed' })),

  // ── OTP ─────────────────────────────────────────────────────────────────
  http.post(`${BASE}/otp/send`, async ({ request }) => {
    const body = await request.json();
    if (!body.phoneNumber) return HttpResponse.json({ message: 'Phone number is required' }, { status: 400 });
    if (!/^[6-9]\d{9}$/.test(body.phoneNumber)) return HttpResponse.json({ message: 'Invalid Indian phone number format' }, { status: 400 });
    return HttpResponse.json({ message: 'OTP sent successfully', expiresIn: '10 minutes' });
  }),

  http.post(`${BASE}/otp/verify`, async ({ request }) => {
    const body = await request.json();
    if (!body.phoneNumber || !body.otp) return HttpResponse.json({ message: 'Phone number and OTP are required' }, { status: 400 });
    if (body.otp === '000000') return HttpResponse.json({ message: 'Invalid OTP' }, { status: 400 });
    if (body.otp === '123456') return HttpResponse.json({ message: 'Phone verified successfully', phoneVerified: true, trustScore: 70 });
    return HttpResponse.json({ message: 'Invalid OTP' }, { status: 400 });
  }),

  http.get(`${BASE}/otp/status`, () => HttpResponse.json({ phoneNumber: '9876543210', phoneVerified: true })),

  // ── LIVENESS ─────────────────────────────────────────────────────────────
  http.post(`${BASE}/liveness/capture`, () => HttpResponse.json({ message: 'Selfie captured successfully', proceedToVerify: true })),

  http.post(`${BASE}/liveness/verify`, () => HttpResponse.json({ message: 'Selfie verification successful', selfieVerified: true, livenessScore: 91, trustScore: 90 })),

  http.get(`${BASE}/liveness/status`, () => HttpResponse.json({ selfieCaptured: true, selfieVerified: false, livenessScore: null })),

  // ── SOCIAL ───────────────────────────────────────────────────────────────
  http.post(`${BASE}/social/save`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({
      message: 'Social links saved successfully',
      socialLinks: { linkedin: body.linkedin || '', instagram: body.instagram || '', collegeEmail: body.collegeEmail || '', companyEmail: body.companyEmail || '' },
    });
  }),

  http.get(`${BASE}/social/my-links`, () => HttpResponse.json({
    socialLinks: MOCK_USER.socialLinks,
    trustContribution: { linkedin: 0, instagram: 0, collegeEmail: 0, companyEmail: 0 },
  })),

  // ── REVIEWS ──────────────────────────────────────────────────────────────
  http.post(`${BASE}/reviews`, async ({ request }) => {
    const body = await request.json();
    if (!body.reviewedUserId || !body.ratings) return HttpResponse.json({ message: 'Missing fields' }, { status: 400 });
    if (body.reviewedUserId === 'already-reviewed') return HttpResponse.json({ message: 'Already reviewed this user' }, { status: 400 });
    return HttpResponse.json({ _id: 'review001', reviewer: MOCK_USER._id, reviewedUser: body.reviewedUserId, ratings: body.ratings, comment: body.comment }, { status: 201 });
  }),

  http.get(`${BASE}/reviews/user/:userId`, ({ params }) => {
    return HttpResponse.json([
      { _id:'rev1', reviewer: { name:'Past Roommate', profilePhoto:null }, ratings:{ overall:5, cleanliness:5, communication:4 }, comment:'Great roommate!', createdAt: new Date().toISOString() },
    ]);
  }),

  // ── REPORTS ──────────────────────────────────────────────────────────────
  http.post(`${BASE}/reports`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ message: 'Report submitted', report: { _id:'report001', reason: body.reason, status:'pending' } }, { status: 201 });
  }),

  http.post(`${BASE}/reports/block/:userId`, () => HttpResponse.json({ message: 'User blocked' })),
  http.delete(`${BASE}/reports/unblock/:userId`, () => HttpResponse.json({ message: 'User unblocked' })),
  http.get(`${BASE}/reports/blocked`, () => HttpResponse.json([])),

  // ── VERIFICATION ─────────────────────────────────────────────────────────
  http.post(`${BASE}/verification/upload-id`, () => HttpResponse.json({ message: 'ID document uploaded successfully.', verificationStatus:'pending', isOptional: true })),

  http.post(`${BASE}/verification/verify-id`, () => HttpResponse.json({ message: 'Government ID verification successful', governmentIdVerified: true, verificationHash: 'abc123hash', trustScore: 100 })),

  http.get(`${BASE}/verification/status`, () => HttpResponse.json({ governmentIdVerified: false, verificationStatus:'none', isOptional:true })),

  // ── AGREEMENT ────────────────────────────────────────────────────────────
  http.post(`${BASE}/agreements/create`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ message: 'Agreement created', agreement: { matchId: body.matchId, rent: body.rent, moveInDate: body.moveInDate } });
  }),

  http.get(`${BASE}/agreements/download/:matchId`, () => {
    return new HttpResponse(new Blob(['%PDF mock content'], { type: 'application/pdf' }), { headers: { 'Content-Type':'application/pdf', 'Content-Disposition':'attachment; filename=roomzy-agreement.pdf' } });
  }),

  // ── ADMIN ─────────────────────────────────────────────────────────────────
  http.get(`${BASE}/admin/stats`, () => HttpResponse.json(MOCK_STATS)),

  http.get(`${BASE}/admin/users`, () => HttpResponse.json([MOCK_USER])),

  http.get(`${BASE}/admin/reports`, () => HttpResponse.json([])),

  http.put(`${BASE}/admin/reports/:id`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ _id: 'report001', status: body.status, resolution: body.resolution });
  }),

  http.get(`${BASE}/health`, () => HttpResponse.json({ status:'ok', timestamp: new Date().toISOString() })),

  // ── CHAT ─────────────────────────────────────────────────────────────────
  http.get(`${BASE}/chat/list`, () => HttpResponse.json([
    {
      _id: 'chat001',
      participants: [
        { _id: 'user123', name: 'Priya Sharma', profilePhoto: null, city: 'Mumbai', trustScore: 50 },
        { _id: 'user456', name: 'Arjun Kapoor', profilePhoto: null, city: 'Mumbai', trustScore: 62 },
      ],
      messages: [],
      lastMessage: 'Hey! Are you still looking?',
      lastMessageAt: new Date().toISOString(),
      userAUnread: 1,
      userBUnread: 0,
    },
  ])),

  http.get(`${BASE}/chat/:chatId/messages`, ({ params }) => {
    if (params.chatId === 'chat001') {
      return HttpResponse.json([
        { _id: 'msg1', sender: { _id: 'user456', name: 'Arjun Kapoor' }, content: 'Hey! Are you still looking?', createdAt: new Date(Date.now() - 120000).toISOString() },
        { _id: 'msg2', sender: { _id: 'user123', name: 'Priya Sharma' }, content: 'Yes, still looking! Your profile looks great.', createdAt: new Date(Date.now() - 60000).toISOString() },
      ]);
    }
    return HttpResponse.json({ message: 'Chat not found' }, { status: 404 });
  }),
];
