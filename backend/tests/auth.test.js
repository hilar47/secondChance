const request = require('supertest');
const app = require('../src/app');
const db = require('./helpers');

beforeAll(db.connect);
afterAll(db.disconnect);
beforeEach(db.clear);

describe('Auth', () => {
  test('registers a user, hashes the password and never returns it', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ann', email: 'ANN@Example.com', password: 'Password123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('ann@example.com');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  test('rejects weak passwords and invalid emails', async () => {
    const weak = await request(app).post('/api/auth/register').send({ name: 'Ann', email: 'a@b.com', password: 'short' });
    expect(weak.status).toBe(400);
    const bad = await request(app).post('/api/auth/register').send({ name: 'Ann', email: 'nope', password: 'Password123' });
    expect(bad.status).toBe(400);
  });

  test('rejects duplicate e-mail, even when registered concurrently', async () => {
    const payload = { name: 'Ann', email: 'dup@example.com', password: 'Password123' };
    const results = await Promise.all([1, 2, 3].map(() => request(app).post('/api/auth/register').send(payload)));
    const codes = results.map((r) => r.status).sort();
    expect(codes).toEqual([201, 409, 409]);
  });

  test('logs in with correct credentials, rejects wrong ones', async () => {
    const { email, password } = await db.registerUser(app);
    const ok = await request(app).post('/api/auth/login').send({ email, password });
    expect(ok.status).toBe(200);
    expect(ok.body.token).toBeTruthy();
    const bad = await request(app).post('/api/auth/login').send({ email, password: 'Wrong12345' });
    expect(bad.status).toBe(401);
  });

  test('blocks NoSQL operator injection in login', async () => {
    await db.registerUser(app);
    const res = await request(app).post('/api/auth/login').send({ email: { $gt: '' }, password: { $gt: '' } });
    expect(res.status).toBe(400);
  });

  test('locks the account after repeated failures', async () => {
    const { email, password } = await db.registerUser(app);
    for (let i = 0; i < 5; i += 1) {
      await request(app).post('/api/auth/login').send({ email, password: 'Wrong12345' });
    }
    const res = await request(app).post('/api/auth/login').send({ email, password });
    expect(res.status).toBe(423);
  });

  test('protects /me and accepts a valid token', async () => {
    const { token } = await db.registerUser(app);
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect((await request(app).get('/api/auth/me').set('Authorization', 'Bearer garbage')).status).toBe(401);
    const me = await request(app).get('/api/auth/me').set(db.bearer(token));
    expect(me.status).toBe(200);
  });
});
