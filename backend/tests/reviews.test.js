const request = require('supertest');
const app = require('../src/app');
const db = require('./helpers');

beforeAll(db.connect);
afterAll(db.disconnect);
beforeEach(db.clear);

async function completedHandover() {
  const owner = await db.registerUser(app);
  const receiver = await db.registerUser(app);
  const stranger = await db.registerUser(app);
  const { body } = await request(app).post('/api/items').set(db.bearer(owner.token)).send(db.sampleItem());
  const id = body.item.id;
  await request(app).post(`/api/items/${id}/claim`).set(db.bearer(receiver.token));
  await request(app).post(`/api/items/${id}/confirm`).set(db.bearer(owner.token));
  return { owner, receiver, stranger, id };
}

describe('Reviews', () => {
  test('cannot review before the hand-over is confirmed', async () => {
    const owner = await db.registerUser(app);
    const { body } = await request(app).post('/api/items').set(db.bearer(owner.token)).send(db.sampleItem());
    const res = await request(app).post(`/api/items/${body.item.id}/reviews`).set(db.bearer(owner.token)).send({ rating: 5 });
    expect(res.status).toBe(409);
  });

  test('both parties can review each other; strangers cannot', async () => {
    const { owner, receiver, stranger, id } = await completedHandover();
    const post = (u, rating) => request(app).post(`/api/items/${id}/reviews`).set(db.bearer(u.token)).send({ rating, comment: 'Great' });

    expect((await post(stranger, 5)).status).toBe(403);
    expect((await post(receiver, 4)).status).toBe(201);
    expect((await post(owner, 5)).status).toBe(201);

    const ownerProfile = await request(app).get(`/api/users/${owner.user.id}`);
    expect(ownerProfile.body.user.ratingCount).toBe(1);
    expect(ownerProfile.body.user.averageRating).toBe(4);
    expect(ownerProfile.body.user.email).toBeUndefined();
  });

  test('duplicate simultaneous reviews: one wins, aggregate counted once', async () => {
    const { owner, receiver, id } = await completedHandover();
    const results = await Promise.all(
      [1, 2, 3, 4].map(() =>
        request(app).post(`/api/items/${id}/reviews`).set(db.bearer(receiver.token)).send({ rating: 5 })
      )
    );
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    expect(results.filter((r) => r.status === 409)).toHaveLength(3);
    const profile = await request(app).get(`/api/users/${owner.user.id}`);
    expect(profile.body.user.ratingCount).toBe(1);
    expect(profile.body.user.ratingSum).toBe(5);
  });

  test('lists a user\'s reviews and lets the author delete (aggregate rolls back)', async () => {
    const { owner, receiver, id } = await completedHandover();
    const created = await request(app).post(`/api/items/${id}/reviews`).set(db.bearer(receiver.token)).send({ rating: 3 });
    const list = await request(app).get(`/api/users/${owner.user.id}/reviews`);
    expect(list.body.data).toHaveLength(1);

    const reviewId = created.body.review.id;
    expect((await request(app).delete(`/api/reviews/${reviewId}`).set(db.bearer(owner.token))).status).toBe(403);
    expect((await request(app).delete(`/api/reviews/${reviewId}`).set(db.bearer(receiver.token))).status).toBe(204);
    const profile = await request(app).get(`/api/users/${owner.user.id}`);
    expect(profile.body.user.ratingCount).toBe(0);
  });

  test('rejects out-of-range ratings', async () => {
    const { receiver, id } = await completedHandover();
    const res = await request(app).post(`/api/items/${id}/reviews`).set(db.bearer(receiver.token)).send({ rating: 9 });
    expect(res.status).toBe(400);
  });
});
