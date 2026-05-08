/**
 * INTEGRATION TESTS: Match Routes + OTP + Social Routes
 */

const request = require('supertest');
const { app } = require('../server');
const User = require('../models/User');
const Match = require('../models/Match');
const jwt = require('jsonwebtoken');

// ─── HELPERS ────────────────────────────────────────────────────────────────
function makeToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'testsecret', { expiresIn: '7d' });
}

async function createVerifiedUser(overrides = {}) {
  const user = await User.create({
    name: 'Test User',
    email: `user_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`,
    password: 'password123',
    intent: 'looking_for_roommate',
    city: 'Mumbai',
    isEmailVerified: true,
    trustScore: 50,
    preferences: {
      budgetMin: 5000,
      budgetMax: 15000,
      sleepTime: 'early',
      cleanliness: 4,
      foodHabit: 'veg',
      genderPreference: 'any',
      noiseTolerance: 3,
      personality: 'introvert',
      moveInDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    ...overrides,
  });
  const token = makeToken(user._id);
  return { user, token };
}

// ─── MATCH SUGGESTIONS ───────────────────────────────────────────────────────
describe('GET /api/matches/suggestions', () => {
  test('401: rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/matches/suggestions');
    expect(res.status).toBe(401);
  });

  test('400: returns error when profile incomplete (no moveInDate)', async () => {
    const { token } = await createVerifiedUser({
      preferences: { budgetMin: 5000, budgetMax: 15000 }, // no moveInDate
    });
    const res = await request(app)
      .get('/api/matches/suggestions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/move-in date/i);
  });

  test('200: returns empty array when no matching users exist', async () => {
    const { token } = await createVerifiedUser();
    const res = await request(app)
      .get('/api/matches/suggestions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  test('200: returns candidates with opposite intent in same city', async () => {
    const moveInDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const { token: seekerToken } = await createVerifiedUser({
      intent: 'looking_for_roommate',
      city: 'Pune',
      preferences: {
        budgetMin: 5000,
        budgetMax: 15000,
        sleepTime: 'early',
        cleanliness: 3,
        genderPreference: 'any',
        noiseTolerance: 3,
        personality: 'ambivert',
        moveInDate,
      },
    });

    // Create a provider in same city with trustScore >= 30
    await createVerifiedUser({
      intent: 'have_room_need_roommate',
      city: 'Pune',
      trustScore: 40,
      preferences: {
        budgetMin: 8000,
        budgetMax: 20000,
        sleepTime: 'early',
        cleanliness: 4,
        genderPreference: 'any',
        noiseTolerance: 3,
        personality: 'ambivert',
        moveInDate,
      },
    });

    const res = await request(app)
      .get('/api/matches/suggestions')
      .set('Authorization', `Bearer ${seekerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('compatibilityScore');
    expect(res.body[0]).toHaveProperty('breakdown');
  });

  test('200: does not return users with trustScore < 30', async () => {
    const moveInDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const { token: seekerToken } = await createVerifiedUser({
      intent: 'looking_for_roommate',
      city: 'Delhi',
      preferences: { budgetMin: 5000, budgetMax: 15000, moveInDate, genderPreference: 'any', noiseTolerance: 3, personality: 'ambivert', sleepTime: 'flexible', cleanliness: 3 },
    });

    await createVerifiedUser({
      intent: 'have_room_need_roommate',
      city: 'Delhi',
      trustScore: 10, // below threshold
      preferences: { budgetMin: 5000, budgetMax: 15000, moveInDate, genderPreference: 'any', noiseTolerance: 3, personality: 'ambivert', sleepTime: 'flexible', cleanliness: 3 },
    });

    const res = await request(app)
      .get('/api/matches/suggestions')
      .set('Authorization', `Bearer ${seekerToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0);
  });

  test('200: results are sorted by compatibility score descending', async () => {
    const moveInDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const { token } = await createVerifiedUser({
      intent: 'looking_for_roommate',
      city: 'Bangalore',
      preferences: { budgetMin: 5000, budgetMax: 10000, sleepTime: 'early', cleanliness: 5, genderPreference: 'any', noiseTolerance: 1, personality: 'introvert', moveInDate },
    });

    // Good match
    await createVerifiedUser({ intent: 'have_room_need_roommate', city: 'Bangalore', trustScore: 45, preferences: { budgetMin: 5000, budgetMax: 12000, sleepTime: 'early', cleanliness: 5, genderPreference: 'any', noiseTolerance: 1, personality: 'introvert', moveInDate } });
    // Poor match
    await createVerifiedUser({ intent: 'have_room_need_roommate', city: 'Bangalore', trustScore: 45, preferences: { budgetMin: 25000, budgetMax: 50000, sleepTime: 'late', cleanliness: 1, genderPreference: 'any', noiseTolerance: 5, personality: 'extrovert', moveInDate } });

    const res = await request(app)
      .get('/api/matches/suggestions')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    if (res.body.length >= 2) {
      expect(res.body[0].compatibilityScore).toBeGreaterThanOrEqual(res.body[1].compatibilityScore);
    }
  });
});

// ─── LIKE / PASS ─────────────────────────────────────────────────────────────
describe('POST /api/matches/like/:userId', () => {
  test('401: rejects unauthenticated', async () => {
    const { user } = await createVerifiedUser();
    const res = await request(app).post(`/api/matches/like/${user._id}`);
    expect(res.status).toBe(401);
  });

  test('404: returns error for non-existent target user', async () => {
    const { token } = await createVerifiedUser();
    const fakeId = '64f1a2b3c4d5e6f7a8b9c0d1';
    const res = await request(app)
      .post(`/api/matches/like/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test('200: creates a like match', async () => {
    const { user: userA, token: tokenA } = await createVerifiedUser();
    const { user: userB } = await createVerifiedUser();

    const res = await request(app)
      .post(`/api/matches/like/${userB._id}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.match.status).toBe('liked');
    expect(res.body.isNowMatched).toBe(false);
  });

  test('200: FIX BUG 9 — mutual like creates a match (both directions)', async () => {
    const { user: userA, token: tokenA } = await createVerifiedUser();
    const { user: userB, token: tokenB } = await createVerifiedUser();

    // UserA likes UserB first
    await request(app)
      .post(`/api/matches/like/${userB._id}`)
      .set('Authorization', `Bearer ${tokenA}`);

    // UserB likes UserA back → should become 'matched'
    const res = await request(app)
      .post(`/api/matches/like/${userA._id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(200);
    expect(res.body.match.status).toBe('matched');
    expect(res.body.isNowMatched).toBe(true);
    expect(res.body.message).toMatch(/match/i);
  });
});

describe('POST /api/matches/pass/:userId', () => {
  test('200: passes a user', async () => {
    const { user: userA, token: tokenA } = await createVerifiedUser();
    const { user: userB } = await createVerifiedUser();

    const res = await request(app)
      .post(`/api/matches/pass/${userB._id}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/passed/i);
  });
});

describe('GET /api/matches', () => {
  test('200: returns only confirmed matches', async () => {
    const { user: userA, token: tokenA } = await createVerifiedUser();
    const { user: userB } = await createVerifiedUser();

    await Match.create({
      userA: userA._id,
      userB: userB._id,
      compatibilityScore: 80,
      status: 'matched',
    });
    await Match.create({
      userA: userA._id,
      userB: (await createVerifiedUser()).user._id,
      compatibilityScore: 60,
      status: 'liked',
    });

    const res = await request(app)
      .get('/api/matches')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body.every(m => m.status === 'matched')).toBe(true);
  });
});

// ─── OTP ROUTES ──────────────────────────────────────────────────────────────
describe('POST /api/otp/send', () => {
  test('200: sends OTP for valid Indian phone number', async () => {
    const { token } = await createVerifiedUser();
    const res = await request(app)
      .post('/api/otp/send')
      .set('Authorization', `Bearer ${token}`)
      .send({ phoneNumber: '9876543210' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/sent/i);
  });

  test('400: rejects invalid phone number format', async () => {
    const { token } = await createVerifiedUser();
    const res = await request(app)
      .post('/api/otp/send')
      .set('Authorization', `Bearer ${token}`)
      .send({ phoneNumber: '1234567890' }); // starts with 1, not valid Indian number
    expect(res.status).toBe(400);
  });

  test('400: rejects missing phone number', async () => {
    const { token } = await createVerifiedUser();
    const res = await request(app)
      .post('/api/otp/send')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  test('401: rejects unauthenticated', async () => {
    const res = await request(app).post('/api/otp/send').send({ phoneNumber: '9876543210' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/otp/verify', () => {
  test('200: verifies correct OTP and updates trustScore', async () => {
    const { user, token } = await createVerifiedUser();

    // First send OTP
    await request(app)
      .post('/api/otp/send')
      .set('Authorization', `Bearer ${token}`)
      .send({ phoneNumber: '9876543210' });

    // Get the OTP from DB
    const updatedUser = await User.findById(user._id);
    const otp = updatedUser.phoneVerificationCode;

    const res = await request(app)
      .post('/api/otp/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ phoneNumber: '9876543210', otp });

    expect(res.status).toBe(200);
    expect(res.body.phoneVerified).toBe(true);
    expect(typeof res.body.trustScore).toBe('number');
  });

  test('400: rejects wrong OTP', async () => {
    const { token } = await createVerifiedUser();
    await request(app)
      .post('/api/otp/send')
      .set('Authorization', `Bearer ${token}`)
      .send({ phoneNumber: '9876543210' });

    const res = await request(app)
      .post('/api/otp/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ phoneNumber: '9876543210', otp: '000000' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid otp/i);
  });

  test('400: rejects when no OTP was sent', async () => {
    const { token } = await createVerifiedUser();
    const res = await request(app)
      .post('/api/otp/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ phoneNumber: '9876543210', otp: '123456' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/otp/status', () => {
  test('200: returns phone verification status', async () => {
    const { token } = await createVerifiedUser();
    const res = await request(app)
      .get('/api/otp/status')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('phoneVerified');
  });
});

// ─── SOCIAL LINKS ────────────────────────────────────────────────────────────
describe('POST /api/social/save', () => {
  test('200: saves social links', async () => {
    const { token } = await createVerifiedUser();
    const res = await request(app)
      .post('/api/social/save')
      .set('Authorization', `Bearer ${token}`)
      .send({ linkedin: 'https://linkedin.com/in/test', instagram: 'https://instagram.com/test' });
    expect(res.status).toBe(200);
    expect(res.body.socialLinks.linkedin).toBe('https://linkedin.com/in/test');
  });

  test('401: rejects unauthenticated', async () => {
    const res = await request(app).post('/api/social/save').send({ linkedin: 'https://test.com' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/social/my-links', () => {
  test('200: returns social links and trust contribution', async () => {
    const { token } = await createVerifiedUser();
    const res = await request(app)
      .get('/api/social/my-links')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('socialLinks');
    expect(res.body).toHaveProperty('trustContribution');
  });

  test('FIX BUG 6 — unverified collegeEmail contributes 0 trust', async () => {
    const { token } = await createVerifiedUser();
    const res = await request(app)
      .get('/api/social/my-links')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    // collegeEmail not verified → should be 0 (was always 2.5 before fix)
    expect(res.body.trustContribution.collegeEmail).toBe(0);
  });
});

// ─── REPORTS / BLOCK ─────────────────────────────────────────────────────────
describe('POST /api/reports', () => {
  test('201: creates a report', async () => {
    const { token } = await createVerifiedUser();
    const { user: target } = await createVerifiedUser();

    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send({ reportedUserId: target._id, reason: 'spam', description: 'Spamming messages' });
    expect(res.status).toBe(201);
    expect(res.body.report.reason).toBe('spam');
  });
});

describe('POST /api/reports/block/:userId', () => {
  test('200: blocks a user', async () => {
    const { token } = await createVerifiedUser();
    const { user: target } = await createVerifiedUser();

    const res = await request(app)
      .post(`/api/reports/block/${target._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);

    const updatedUser = await User.findById((await createVerifiedUser()).user._id);
    // Verify block is recorded
    const blocker = await User.findOne({ blockedUsers: target._id });
    expect(blocker).toBeTruthy();
  });
});

// ─── REVIEWS ─────────────────────────────────────────────────────────────────
describe('POST /api/reviews', () => {
  test('201: creates a review', async () => {
    const { token } = await createVerifiedUser();
    const { user: target } = await createVerifiedUser();

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        reviewedUserId: target._id,
        ratings: { overall: 5, cleanliness: 4, communication: 5 },
        comment: 'Great roommate!',
        wouldRecommend: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.ratings.overall).toBe(5);
  });

  test('400: rejects duplicate review', async () => {
    const { token } = await createVerifiedUser();
    const { user: target } = await createVerifiedUser();

    const reviewData = {
      reviewedUserId: target._id,
      ratings: { overall: 4 },
    };

    await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send(reviewData);

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send(reviewData);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already reviewed/i);
  });
});

describe('GET /api/reviews/user/:userId', () => {
  test('200: returns reviews for a user', async () => {
    const { user: target } = await createVerifiedUser();
    const { token } = await createVerifiedUser();

    await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ reviewedUserId: target._id, ratings: { overall: 3 } });

    const res = await request(app).get(`/api/reviews/user/${target._id}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });
});
