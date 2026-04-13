/**
 * UNIT TESTS: API Client
 * Tests every exported API function against MSW mock handlers
 * Verifies correct HTTP methods, paths, payloads and error handling
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { authApi, profileApi, matchApi, otpApi, livenessApi, socialApi, verificationApi, reviewApi, reportApi, agreementApi, adminApi, chatApi } from '../api';

// ══════════════════════════════════════════════════════════════════════════
// AUTH API
// ══════════════════════════════════════════════════════════════════════════
describe('authApi', () => {
  describe('register()', () => {
    test('201: returns userId and requiresEmailVerification on success', async () => {
      const { data } = await authApi.register({
        name: 'Test User', email: 'new@test.com', password: 'password123',
        city: 'Mumbai', intent: 'looking_for_roommate',
      });
      expect(data.userId).toBeTruthy();
      expect(data.requiresEmailVerification).toBe(true);
      expect(data.message).toMatch(/verification/i);
    });

    test('400: throws on duplicate email', async () => {
      await expect(authApi.register({
        name: 'Test', email: 'existing@test.com', password: 'password123', city: 'Mumbai', intent: 'looking_for_roommate',
      })).rejects.toMatchObject({ response: { status: 400, data: { message: 'User already exists' } } });
    });

    test('400: throws on invalid intent', async () => {
      await expect(authApi.register({
        name: 'Test', email: 'x@test.com', password: 'password123', city: 'Mumbai', intent: 'invalid_intent',
      })).rejects.toMatchObject({ response: { status: 400 } });
    });
  });

  describe('login()', () => {
    test('200: returns token on valid credentials', async () => {
      const { data } = await authApi.login({ email: 'priya@test.com', password: 'password123' });
      expect(data.token).toBe('mock.jwt.token');
      expect(data.name).toBe('Priya Sharma');
      expect(data._id).toBeTruthy();
    });

    test('401: throws on wrong credentials', async () => {
      await expect(authApi.login({ email: 'priya@test.com', password: 'wrongpass' }))
        .rejects.toMatchObject({ response: { status: 401 } });
    });

    test('403: throws with requiresVerification flag for unverified email', async () => {
      await expect(authApi.login({ email: 'unverified@test.com', password: 'password123' }))
        .rejects.toMatchObject({ response: { status: 403, data: { requiresVerification: true } } });
    });
  });

  describe('me()', () => {
    test('200: returns full user object', async () => {
      const { data } = await authApi.me();
      expect(data._id).toBe('user123');
      expect(data.name).toBe('Priya Sharma');
      expect(data).toHaveProperty('preferences');
      expect(data).toHaveProperty('trustScore');
    });
  });

  describe('verifyEmail()', () => {
    test('200: verifies with valid token', async () => {
      const { data } = await authApi.verifyEmail('validtoken');
      expect(data.message).toMatch(/verified/i);
    });

    test('400: throws with invalid token', async () => {
      await expect(authApi.verifyEmail('badtoken'))
        .rejects.toMatchObject({ response: { status: 400 } });
    });
  });

  describe('forgotPassword()', () => {
    test('200: sends reset email', async () => {
      const { data } = await authApi.forgotPassword('priya@test.com');
      expect(data.message).toMatch(/sent/i);
    });

    test('404: throws for unknown email', async () => {
      await expect(authApi.forgotPassword('ghost@nowhere.com'))
        .rejects.toMatchObject({ response: { status: 404 } });
    });

    test('400: throws when email missing', async () => {
      await expect(authApi.forgotPassword(''))
        .rejects.toMatchObject({ response: { status: 400 } });
    });
  });

  describe('resetPassword()', () => {
    test('200: resets password with valid token', async () => {
      const { data } = await authApi.resetPassword('validresettoken', 'newpassword123');
      expect(data.message).toMatch(/reset/i);
    });

    test('400: throws with bad token', async () => {
      await expect(authApi.resetPassword('badtoken', 'newpassword123'))
        .rejects.toMatchObject({ response: { status: 400 } });
    });

    test('400: throws with short password', async () => {
      await expect(authApi.resetPassword('validresettoken', '123'))
        .rejects.toMatchObject({ response: { status: 400 } });
    });
  });

  describe('resendVerification()', () => {
    test('400: throws if already verified', async () => {
      await expect(authApi.resendVerification('verified@test.com'))
        .rejects.toMatchObject({ response: { status: 400 } });
    });

    test('200: sends for unverified user', async () => {
      const { data } = await authApi.resendVerification('unverified@test.com');
      expect(data.message).toMatch(/sent/i);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// PROFILE API
// ══════════════════════════════════════════════════════════════════════════
describe('profileApi', () => {
  test('getMe() returns full user', async () => {
    const { data } = await profileApi.getMe();
    expect(data._id).toBeTruthy();
    expect(data).toHaveProperty('preferences');
    expect(data).toHaveProperty('preferenceWeights');
    expect(data).toHaveProperty('socialLinks');
  });

  test('updateProfile() accepts basic info fields', async () => {
    const { data } = await profileApi.updateProfile({ name: 'New Name', city: 'Pune', bio: 'Hello', gender: 'female' });
    expect(data.name).toBe('New Name');
  });

  test('updatePreferences() accepts full preferences object', async () => {
    const { data } = await profileApi.updatePreferences({
      preferences: { sleepTime: 'late', cleanliness: 5, foodHabit: 'veg' },
      moveInDate: '2026-06-01',
      city: 'Bangalore',
      intent: 'have_room_need_roommate',
    });
    expect(data.preferences).toBeTruthy();
    expect(data).toHaveProperty('aiSummary');
  });

  test('updateWeights() accepts weight object', async () => {
    const { data } = await profileApi.updateWeights({ budget: 5, sleepTime: 4, cleanliness: 3 });
    expect(data.budget).toBe(5);
    expect(data.sleepTime).toBe(4);
  });

  test('getById() returns public profile', async () => {
    const { data } = await profileApi.getById('user456');
    expect(data._id).toBe('user456');
    expect(data.name).toBe('Arjun Kapoor');
  });

  test('getById() throws 404 for unknown user', async () => {
    await expect(profileApi.getById('nonexistent'))
      .rejects.toMatchObject({ response: { status: 404 } });
  });
});

// ══════════════════════════════════════════════════════════════════════════
// MATCH API
// ══════════════════════════════════════════════════════════════════════════
describe('matchApi', () => {
  test('getSuggestions() returns array with compatibilityScore and breakdown', async () => {
    const { data } = await matchApi.getSuggestions();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('compatibilityScore');
    expect(data[0]).toHaveProperty('breakdown');
    expect(data[0]).toHaveProperty('user');
  });

  test('suggestions have breakdown with all scoring keys', async () => {
    const { data } = await matchApi.getSuggestions();
    const { breakdown } = data[0];
    expect(breakdown).toHaveProperty('budget');
    expect(breakdown).toHaveProperty('sleepTime');
    expect(breakdown).toHaveProperty('cleanliness');
    expect(breakdown).toHaveProperty('foodHabit');
    expect(breakdown).toHaveProperty('genderPreference');
    expect(breakdown).toHaveProperty('noiseTolerance');
    expect(breakdown).toHaveProperty('personality');
    expect(breakdown).toHaveProperty('location');
  });

  test('getMatched() returns matched array with both user objects', async () => {
    const { data } = await matchApi.getMatched();
    expect(Array.isArray(data)).toBe(true);
    expect(data[0]).toHaveProperty('userA');
    expect(data[0]).toHaveProperty('userB');
    expect(data[0].status).toBe('matched');
  });

  test('like() returns isNowMatched=true when mutual', async () => {
    const { data } = await matchApi.like('user456');
    expect(data.isNowMatched).toBe(true);
    expect(data.match).toBeTruthy();
    expect(data.message).toMatch(/match/i);
  });

  test('like() returns isNowMatched=false for new like', async () => {
    const { data } = await matchApi.like('user999');
    expect(data.isNowMatched).toBe(false);
    expect(data.message).toMatch(/like/i);
  });

  test('pass() returns success message', async () => {
    const { data } = await matchApi.pass('user456');
    expect(data.message).toMatch(/passed/i);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// OTP API
// ══════════════════════════════════════════════════════════════════════════
describe('otpApi', () => {
  test('send() succeeds with valid Indian number', async () => {
    const { data } = await otpApi.send('9876543210');
    expect(data.message).toMatch(/sent/i);
    expect(data.expiresIn).toBeTruthy();
  });

  test('send() throws 400 for non-Indian number', async () => {
    await expect(otpApi.send('1234567890'))
      .rejects.toMatchObject({ response: { status: 400 } });
  });

  test('send() throws 400 when phoneNumber missing', async () => {
    await expect(otpApi.send(''))
      .rejects.toMatchObject({ response: { status: 400 } });
  });

  test('verify() succeeds with correct OTP', async () => {
    const { data } = await otpApi.verify('9876543210', '123456');
    expect(data.phoneVerified).toBe(true);
    expect(typeof data.trustScore).toBe('number');
  });

  test('verify() throws 400 for wrong OTP', async () => {
    await expect(otpApi.verify('9876543210', '000000'))
      .rejects.toMatchObject({ response: { status: 400, data: { message: 'Invalid OTP' } } });
  });

  test('verify() throws 400 when fields missing', async () => {
    await expect(otpApi.verify('', ''))
      .rejects.toMatchObject({ response: { status: 400 } });
  });

  test('status() returns phoneVerified field', async () => {
    const { data } = await otpApi.status();
    expect(data).toHaveProperty('phoneVerified');
    expect(data).toHaveProperty('phoneNumber');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// LIVENESS API
// ══════════════════════════════════════════════════════════════════════════
describe('livenessApi', () => {
  test('verify() returns selfieVerified=true and livenessScore', async () => {
    const { data } = await livenessApi.verify();
    expect(data.selfieVerified).toBe(true);
    expect(typeof data.livenessScore).toBe('number');
    expect(data.livenessScore).toBeGreaterThanOrEqual(0);
    expect(data.livenessScore).toBeLessThanOrEqual(100);
    expect(typeof data.trustScore).toBe('number');
  });

  test('status() returns selfieCaptured and selfieVerified', async () => {
    const { data } = await livenessApi.status();
    expect(data).toHaveProperty('selfieCaptured');
    expect(data).toHaveProperty('selfieVerified');
    expect(data).toHaveProperty('livenessScore');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// SOCIAL API
// ══════════════════════════════════════════════════════════════════════════
describe('socialApi', () => {
  test('save() stores all social link fields', async () => {
    const { data } = await socialApi.save({
      linkedin: 'https://linkedin.com/in/test',
      instagram: 'https://instagram.com/test',
      collegeEmail: 'test@iit.ac.in',
      companyEmail: 'test@company.com',
    });
    expect(data.socialLinks.linkedin).toBe('https://linkedin.com/in/test');
    expect(data.socialLinks.instagram).toBe('https://instagram.com/test');
  });

  test('myLinks() returns socialLinks and trustContribution', async () => {
    const { data } = await socialApi.myLinks();
    expect(data).toHaveProperty('socialLinks');
    expect(data).toHaveProperty('trustContribution');
    expect(data.trustContribution).toHaveProperty('linkedin');
    expect(data.trustContribution).toHaveProperty('instagram');
    expect(data.trustContribution).toHaveProperty('collegeEmail');
    expect(data.trustContribution).toHaveProperty('companyEmail');
  });

  test('FIX BUG 6: unverified collegeEmail contributes 0 trust', async () => {
    const { data } = await socialApi.myLinks();
    expect(data.trustContribution.collegeEmail).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// REVIEW API
// ══════════════════════════════════════════════════════════════════════════
describe('reviewApi', () => {
  test('create() returns 201 with review object', async () => {
    const { data, status } = await reviewApi.create({
      reviewedUserId: 'user456',
      ratings: { overall: 5, cleanliness: 4, communication: 5 },
      comment: 'Great roommate!',
      wouldRecommend: true,
    });
    expect(status).toBe(201);
    expect(data.ratings.overall).toBe(5);
  });

  test('create() throws 400 for duplicate review', async () => {
    await expect(reviewApi.create({ reviewedUserId: 'already-reviewed', ratings: { overall: 3 } }))
      .rejects.toMatchObject({ response: { status: 400 } });
  });

  test('getForUser() returns array of reviews', async () => {
    const { data } = await reviewApi.getForUser('user456');
    expect(Array.isArray(data)).toBe(true);
    expect(data[0]).toHaveProperty('ratings');
    expect(data[0].ratings).toHaveProperty('overall');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// REPORT API
// ══════════════════════════════════════════════════════════════════════════
describe('reportApi', () => {
  test('create() returns 201 with report object', async () => {
    const { data, status } = await reportApi.create({ reportedUserId: 'user456', reason: 'spam', description: 'Spamming' });
    expect(status).toBe(201);
    expect(data.report.reason).toBe('spam');
    expect(data.report.status).toBe('pending');
  });

  test('block() returns success message', async () => {
    const { data } = await reportApi.block('user456');
    expect(data.message).toMatch(/blocked/i);
  });

  test('unblock() returns success message', async () => {
    const { data } = await reportApi.unblock('user456');
    expect(data.message).toMatch(/unblocked/i);
  });

  test('getBlocked() returns array', async () => {
    const { data } = await reportApi.getBlocked();
    expect(Array.isArray(data)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// AGREEMENT API
// ══════════════════════════════════════════════════════════════════════════
describe('agreementApi', () => {
  test('create() returns agreement object', async () => {
    const { data } = await agreementApi.create({
      matchId: 'match001',
      rent: 20000,
      rentSplit: { userA: 10000, userB: 10000 },
      rules: ['No smoking', 'Quiet after 11pm'],
      moveInDate: '2026-05-01',
    });
    expect(data.agreement).toBeTruthy();
    expect(data.agreement.rent).toBe(20000);
    expect(data.agreement.matchId).toBe('match001');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// ADMIN API
// ══════════════════════════════════════════════════════════════════════════
describe('adminApi', () => {
  test('getStats() returns platform metrics', async () => {
    const { data } = await adminApi.getStats();
    expect(data).toHaveProperty('totalUsers');
    expect(data).toHaveProperty('trustedUsers');
    expect(data).toHaveProperty('blockedUsers');
    expect(data).toHaveProperty('pendingReports');
    expect(data.totalUsers).toBe(1240);
  });

  test('getUsers() returns array of users', async () => {
    const { data } = await adminApi.getUsers();
    expect(Array.isArray(data)).toBe(true);
    expect(data[0]).toHaveProperty('email');
    expect(data[0]).toHaveProperty('trustScore');
  });

  test('getReports() returns array', async () => {
    const { data } = await adminApi.getReports();
    expect(Array.isArray(data)).toBe(true);
  });

  test('updateReport() resolves a report', async () => {
    const { data } = await adminApi.updateReport('report001', { status: 'resolved', actionTaken: 'warned', resolution: 'User warned' });
    expect(data.status).toBe('resolved');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// VERIFICATION API
// ══════════════════════════════════════════════════════════════════════════
describe('verificationApi', () => {
  test('verifyId() returns governmentIdVerified=true with blockchain hash', async () => {
    const { data } = await verificationApi.verifyId();
    expect(data.governmentIdVerified).toBe(true);
    expect(data.verificationHash).toBeTruthy();
    expect(typeof data.trustScore).toBe('number');
  });

  test('status() returns verification fields', async () => {
    const { data } = await verificationApi.status();
    expect(data).toHaveProperty('governmentIdVerified');
    expect(data).toHaveProperty('verificationStatus');
    expect(data.isOptional).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// CHAT API
// ══════════════════════════════════════════════════════════════════════════
describe('chatApi', () => {
  test('list() returns array of conversations with participants', async () => {
    const { data } = await chatApi.list();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('participants');
    expect(data[0]).toHaveProperty('lastMessage');
    expect(data[0]).toHaveProperty('_id');
  });

  test('list() returns participants with name and profilePhoto', async () => {
    const { data } = await chatApi.list();
    const participants = data[0].participants;
    expect(Array.isArray(participants)).toBe(true);
    expect(participants[0]).toHaveProperty('name');
  });

  test('list() returns unread count fields', async () => {
    const { data } = await chatApi.list();
    expect(data[0]).toHaveProperty('userAUnread');
    expect(data[0]).toHaveProperty('userBUnread');
  });

  test('messages() returns array of messages for valid chatId', async () => {
    const { data } = await chatApi.messages('chat001');
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect(data[0]).toHaveProperty('content');
    expect(data[0]).toHaveProperty('sender');
    expect(data[0]).toHaveProperty('createdAt');
  });

  test('messages() returns messages in chronological order', async () => {
    const { data } = await chatApi.messages('chat001');
    if (data.length >= 2) {
      const t1 = new Date(data[0].createdAt).getTime();
      const t2 = new Date(data[1].createdAt).getTime();
      expect(t1).toBeLessThanOrEqual(t2);
    }
  });

  test('messages() includes sender info', async () => {
    const { data } = await chatApi.messages('chat001');
    expect(data[0].sender).toHaveProperty('name');
  });
});
