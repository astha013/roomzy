/**
 * UNIT TESTS: Trust Score Calculation
 * Tests every layer of the trust scoring system
 */

const { calculateTrustScore, updateTrustScore, getTrustBreakdown, TRUST_POINTS } = require('../utils/trustScore');

// We need mongoose + models for these tests
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const Review = require('../models/Review');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
});

afterEach(async () => {
  await User.deleteMany({});
  await Review.deleteMany({});
});

// Helper to create a user quickly
async function createUser(overrides = {}) {
  return await User.create({
    name: 'Test User',
    email: `test_${Date.now()}_${Math.random()}@test.com`,
    password: 'password123',
    intent: 'looking_for_roommate',
    city: 'Mumbai',
    ...overrides,
  });
}

describe('TRUST_POINTS constants', () => {
  test('emailVerified is 10', () => expect(TRUST_POINTS.emailVerified).toBe(10));
  test('phoneVerified is 20', () => expect(TRUST_POINTS.phoneVerified).toBe(20));
  test('selfieVerified is 20', () => expect(TRUST_POINTS.selfieVerified).toBe(20));
  test('governmentIdVerified is 10', () => expect(TRUST_POINTS.governmentIdVerified).toBe(10));
  test('reviewMaxPoints is 30', () => expect(TRUST_POINTS.reviewMaxPoints).toBe(30));
});

describe('calculateTrustScore()', () => {
  test('new user with no verifications gets 0', async () => {
    const user = await createUser();
    const score = await calculateTrustScore(user._id);
    expect(score).toBe(0);
  });

  test('email verified adds 10 points', async () => {
    const user = await createUser({ isEmailVerified: true });
    const score = await calculateTrustScore(user._id);
    expect(score).toBe(10);
  });

  test('email + phone verified adds 30 points', async () => {
    const user = await createUser({ isEmailVerified: true, phoneVerified: true });
    const score = await calculateTrustScore(user._id);
    expect(score).toBe(30);
  });

  test('email + phone + selfie verified adds 50 points', async () => {
    const user = await createUser({
      isEmailVerified: true,
      phoneVerified: true,
      selfieVerified: true,
    });
    const score = await calculateTrustScore(user._id);
    expect(score).toBe(50);
  });

  test('all verifications (no social/reviews) adds 60 points', async () => {
    const user = await createUser({
      isEmailVerified: true,
      phoneVerified: true,
      selfieVerified: true,
      governmentIdVerified: true,
    });
    const score = await calculateTrustScore(user._id);
    expect(score).toBe(60);
  });

  test('one verified social link adds 2.5 points (rounded)', async () => {
    const user = await createUser({
      isEmailVerified: true,
      socialLinks: { linkedinVerified: true },
    });
    const score = await calculateTrustScore(user._id);
    // 10 + 2.5 = 12.5, rounded = 13 (Math.round)
    expect(score).toBeGreaterThanOrEqual(12);
    expect(score).toBeLessThanOrEqual(13);
  });

  test('four verified social links adds 10 points max', async () => {
    const user = await createUser({
      socialLinks: {
        linkedinVerified: true,
        instagramVerified: true,
        collegeEmailVerified: true,
        companyEmailVerified: true,
      },
    });
    const score = await calculateTrustScore(user._id);
    // 4 * 2.5 = 10, capped at maxSocialLinks (4)
    expect(score).toBe(10);
  });

  test('reviews add trust points based on avg rating', async () => {
    const user = await createUser({ isEmailVerified: true });
    const reviewer = await createUser({ email: `reviewer_${Date.now()}@test.com` });

    await Review.create({
      reviewer: reviewer._id,
      reviewedUser: user._id,
      ratings: { overall: 5, cleanliness: 5, communication: 5 },
      comment: 'Great!',
    });

    const score = await calculateTrustScore(user._id);
    // email(10) + review points (5*6=30, capped at 30) = 40
    expect(score).toBe(40);
  });

  test('review trust points are capped at 30', async () => {
    const user = await createUser();
    const reviewer1 = await createUser({ email: `r1_${Date.now()}@test.com` });
    const reviewer2 = await createUser({ email: `r2_${Date.now()}@test.com` });

    await Review.create({
      reviewer: reviewer1._id,
      reviewedUser: user._id,
      ratings: { overall: 5 },
    });
    await Review.create({
      reviewer: reviewer2._id,
      reviewedUser: user._id,
      ratings: { overall: 5 },
    });

    const score = await calculateTrustScore(user._id);
    expect(score).toBeLessThanOrEqual(100);
    const reviewContrib = score; // no other verifications
    expect(reviewContrib).toBeLessThanOrEqual(30);
  });

  test('total score is capped at 100', async () => {
    const user = await createUser({
      isEmailVerified: true,
      phoneVerified: true,
      selfieVerified: true,
      governmentIdVerified: true,
      socialLinks: {
        linkedinVerified: true,
        instagramVerified: true,
        collegeEmailVerified: true,
        companyEmailVerified: true,
      },
    });
    const score = await calculateTrustScore(user._id);
    expect(score).toBeLessThanOrEqual(100);
  });

  test('returns 0 for non-existent userId', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const score = await calculateTrustScore(fakeId);
    expect(score).toBe(0);
  });
});

describe('updateTrustScore()', () => {
  test('updates and persists trust score in database', async () => {
    const user = await createUser({ isEmailVerified: true, phoneVerified: true });
    const newScore = await updateTrustScore(user._id);
    expect(newScore).toBe(30);

    const updatedUser = await User.findById(user._id);
    expect(updatedUser.trustScore).toBe(30);
  });
});

describe('getTrustBreakdown()', () => {
  test('returns breakdown object with all keys', () => {
    const fakeUser = {
      isEmailVerified: true,
      phoneVerified: false,
      selfieVerified: false,
      governmentIdVerified: false,
      socialLinks: {},
      createdAt: new Date(),
    };
    const breakdown = getTrustBreakdown(fakeUser);
    expect(breakdown).toHaveProperty('emailVerified');
    expect(breakdown).toHaveProperty('phoneVerified');
    expect(breakdown).toHaveProperty('selfieVerified');
    expect(breakdown).toHaveProperty('governmentId');
    expect(breakdown).toHaveProperty('socialLinks');
    expect(breakdown).toHaveProperty('reviews');
    expect(breakdown).toHaveProperty('accountAge');
  });

  test('emailVerified breakdown value is 10 when verified', () => {
    const fakeUser = {
      isEmailVerified: true,
      phoneVerified: false,
      selfieVerified: false,
      governmentIdVerified: false,
      socialLinks: {},
      createdAt: new Date(),
    };
    const { emailVerified } = getTrustBreakdown(fakeUser);
    expect(emailVerified.value).toBe(10);
  });

  test('emailVerified breakdown value is 0 when not verified', () => {
    const fakeUser = {
      isEmailVerified: false,
      phoneVerified: false,
      selfieVerified: false,
      governmentIdVerified: false,
      socialLinks: {},
      createdAt: new Date(),
    };
    const { emailVerified } = getTrustBreakdown(fakeUser);
    expect(emailVerified.value).toBe(0);
  });

  test('accountAge gives 0 for brand new account', () => {
    const fakeUser = {
      isEmailVerified: false,
      phoneVerified: false,
      selfieVerified: false,
      governmentIdVerified: false,
      socialLinks: {},
      createdAt: new Date(), // just created
    };
    const { accountAge } = getTrustBreakdown(fakeUser);
    expect(accountAge.value).toBe(0);
  });

  test('accountAge gives 10 for account older than 180 days', () => {
    const oldDate = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);
    const fakeUser = {
      isEmailVerified: false,
      phoneVerified: false,
      selfieVerified: false,
      governmentIdVerified: false,
      socialLinks: {},
      createdAt: oldDate,
    };
    const { accountAge } = getTrustBreakdown(fakeUser);
    expect(accountAge.value).toBe(10); // 3+4+3
  });
});
