/**
 * INTEGRATION TESTS: Chat REST Routes
 * Tests GET /api/chat/list and GET /api/chat/:chatId/messages
 */

const request = require('supertest');
const { app } = require('../server');
const User = require('../models/User');
const Chat = require('../models/Chat');
const jwt = require('jsonwebtoken');

function makeToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'testsecret', { expiresIn: '7d' });
}

async function createUser(overrides = {}) {
  return User.create({
    name: 'Chat User',
    email: `chat_${Date.now()}_${Math.random().toString(36).slice(2)}@test.com`,
    password: 'password123',
    intent: 'looking_for_roommate',
    city: 'Mumbai',
    isEmailVerified: true,
    trustScore: 50,
    ...overrides,
  });
}

async function createChat(userA, userB, messages = []) {
  return Chat.create({
    participants: [userA._id, userB._id],
    messages,
    lastMessage: messages.length ? messages[messages.length - 1].content : '',
    lastMessageAt: new Date(),
    userAUnread: 0,
    userBUnread: messages.length,
  });
}

// ── GET /api/chat/list ─────────────────────────────────────────────────────
describe('GET /api/chat/list', () => {
  test('401: rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/chat/list');
    expect(res.status).toBe(401);
  });

  test('200: returns empty array when user has no chats', async () => {
    const user = await createUser();
    const token = makeToken(user._id);
    const res = await request(app)
      .get('/api/chat/list')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  test('200: returns chats where user is a participant', async () => {
    const userA = await createUser();
    const userB = await createUser();
    await createChat(userA, userB, [{ sender: userB._id, content: 'Hello!', createdAt: new Date() }]);

    const token = makeToken(userA._id);
    const res = await request(app)
      .get('/api/chat/list')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0]).toHaveProperty('participants');
    expect(res.body[0]).toHaveProperty('lastMessage');
  });

  test('200: populates participant name and profilePhoto', async () => {
    const userA = await createUser({ name: 'Alice' });
    const userB = await createUser({ name: 'Bob' });
    await createChat(userA, userB);

    const token = makeToken(userA._id);
    const res = await request(app)
      .get('/api/chat/list')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const participants = res.body[0].participants;
    expect(participants.some(p => p.name === 'Alice' || p.name === 'Bob')).toBe(true);
  });

  test('200: returns multiple chats sorted by lastMessageAt desc', async () => {
    const userA = await createUser();
    const userB = await createUser();
    const userC = await createUser();

    const older = await createChat(userA, userB);
    older.lastMessageAt = new Date(Date.now() - 10000);
    await older.save();

    const newer = await createChat(userA, userC);
    newer.lastMessageAt = new Date();
    await newer.save();

    const token = makeToken(userA._id);
    const res = await request(app)
      .get('/api/chat/list')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    // Sorted newest first
    expect(new Date(res.body[0].lastMessageAt).getTime())
      .toBeGreaterThanOrEqual(new Date(res.body[1].lastMessageAt).getTime());
  });

  test('200: does not return chats that user is not part of', async () => {
    const userA = await createUser();
    const userB = await createUser();
    const userC = await createUser();

    // Chat between B and C — userA should NOT see this
    await createChat(userB, userC, [{ sender: userB._id, content: 'Private', createdAt: new Date() }]);

    const token = makeToken(userA._id);
    const res = await request(app)
      .get('/api/chat/list')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0);
  });

  test('200: blocked user is still in participant list (blocking is enforced in socket)', async () => {
    const userA = await createUser();
    const userB = await createUser();
    userA.blockedUsers.push(userB._id);
    await userA.save();

    await createChat(userA, userB, [{ sender: userB._id, content: 'Hi', createdAt: new Date() }]);

    const token = makeToken(userA._id);
    const res = await request(app)
      .get('/api/chat/list')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });
});

// ── GET /api/chat/:chatId/messages ──────────────────────────────────────────
describe('GET /api/chat/:chatId/messages', () => {
  test('401: rejects unauthenticated request', async () => {
    const res = await request(app).get('/api/chat/fakeid/messages');
    expect(res.status).toBe(401);
  });

  test('404: returns 404 for non-existent chat', async () => {
    const user = await createUser();
    const token = makeToken(user._id);
    const fakeId = '64f1a2b3c4d5e6f7a8b9c0d1';
    const res = await request(app)
      .get(`/api/chat/${fakeId}/messages`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  test('403: rejects non-participant user', async () => {
    const userA = await createUser();
    const userB = await createUser();
    const outsider = await createUser();
    const chat = await createChat(userA, userB);

    const token = makeToken(outsider._id);
    const res = await request(app)
      .get(`/api/chat/${chat._id}/messages`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not a participant/i);
  });

  test('200: returns messages array for valid participant', async () => {
    const userA = await createUser();
    const userB = await createUser();
    const chat = await createChat(userA, userB, [
      { sender: userB._id, content: 'First message', createdAt: new Date(Date.now() - 5000) },
      { sender: userA._id, content: 'Second message', createdAt: new Date() },
    ]);

    const token = makeToken(userA._id);
    const res = await request(app)
      .get(`/api/chat/${chat._id}/messages`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2);
    expect(res.body[0].content).toBe('First message');
    expect(res.body[1].content).toBe('Second message');
  });

  test('200: marks unread count to 0 for userA when they fetch', async () => {
    const userA = await createUser();
    const userB = await createUser();
    const chat = await createChat(userA, userB, [
      { sender: userB._id, content: 'Hey!', createdAt: new Date() },
    ]);
    // Set unread for userA
    chat.userAUnread = 3;
    await chat.save();

    const token = makeToken(userA._id);
    await request(app)
      .get(`/api/chat/${chat._id}/messages`)
      .set('Authorization', `Bearer ${token}`);

    const updated = await Chat.findById(chat._id);
    expect(updated.userAUnread).toBe(0);
  });

  test('200: both participants can fetch messages', async () => {
    const userA = await createUser();
    const userB = await createUser();
    const chat = await createChat(userA, userB, [
      { sender: userA._id, content: 'Hello from A', createdAt: new Date() },
    ]);

    const tokenB = makeToken(userB._id);
    const resB = await request(app)
      .get(`/api/chat/${chat._id}/messages`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(resB.status).toBe(200);
    expect(resB.body[0].content).toBe('Hello from A');
  });

  test('200: returns empty array for chat with no messages', async () => {
    const userA = await createUser();
    const userB = await createUser();
    const chat = await createChat(userA, userB, []);

    const token = makeToken(userA._id);
    const res = await request(app)
      .get(`/api/chat/${chat._id}/messages`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(0);
  });
});
