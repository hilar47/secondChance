const request = require('supertest');
const app = require('../src/app');
const db = require('./helpers');

beforeAll(db.connect);
afterAll(db.disconnect);
beforeEach(db.clear);

const create = (token, overrides) =>
  request(app).post('/api/items').set(db.bearer(token)).send(db.sampleItem(overrides));

describe('Items: CRUD & search', () => {
  test('requires auth to create; validates input', async () => {
    expect((await request(app).post('/api/items').send(db.sampleItem())).status).toBe(401);
    const { token } = await db.registerUser(app);
    const bad = await request(app).post('/api/items').set(db.bearer(token)).send({ title: 'x' });
    expect(bad.status).toBe(400);
    expect((await create(token)).status).toBe(201);
  });

  test('full-text search, category filter and pagination', async () => {
    const { token } = await db.registerUser(app);
    await create(token, { title: 'Wooden bookshelf' });
    await create(token, { title: 'Red bicycle', description: 'Fast', category: 'sports', tags: ['bike'] });
    await create(token, { title: 'Blue bicycle', description: 'Slow', category: 'sports', tags: ['bike'] });

    const search = await request(app).get('/api/items?q=bookshelf');
    expect(search.body.data).toHaveLength(1);
    expect(search.body.data[0].title).toBe('Wooden bookshelf');

    const cat = await request(app).get('/api/items?category=sports');
    expect(cat.body.pagination.total).toBe(2);

    const page = await request(app).get('/api/items?limit=2&page=2');
    expect(page.body.data).toHaveLength(1);
    expect(page.body.pagination.pages).toBe(2);
  });

  test('geo radius search', async () => {
    const { token } = await db.registerUser(app);
    await create(token, { title: 'Near item', coordinates: { lat: 25.2048, lng: 55.2708 } });
    await create(token, { title: 'Far item', coordinates: { lat: 51.5074, lng: -0.1278 } });
    const res = await request(app).get('/api/items?lat=25.2&lng=55.27&radiusKm=20');
    expect(res.body.data.map((i) => i.title)).toEqual(['Near item']);
  });

  test('only the owner can edit or delete', async () => {
    const owner = await db.registerUser(app);
    const other = await db.registerUser(app);
    const { body } = await create(owner.token);
    const id = body.item.id;

    expect((await request(app).patch(`/api/items/${id}`).set(db.bearer(other.token)).send({ title: 'Hacked' })).status).toBe(403);
    expect((await request(app).delete(`/api/items/${id}`).set(db.bearer(other.token))).status).toBe(403);
    expect((await request(app).patch(`/api/items/${id}`).set(db.bearer(owner.token)).send({ title: 'Better title' })).status).toBe(200);
    expect((await request(app).delete(`/api/items/${id}`).set(db.bearer(owner.token))).status).toBe(204);
    expect((await request(app).get(`/api/items/${id}`)).status).toBe(404);
  });

  test('optimistic concurrency: stale version is rejected with 409', async () => {
    const owner = await db.registerUser(app);
    const { body } = await create(owner.token);
    const { id, version } = body.item;
    const first = await request(app).patch(`/api/items/${id}`).set(db.bearer(owner.token)).send({ title: 'Edit one', version });
    expect(first.status).toBe(200);
    const stale = await request(app).patch(`/api/items/${id}`).set(db.bearer(owner.token)).send({ title: 'Edit two', version });
    expect(stale.status).toBe(409);
  });

  test('rejects malformed ids with 400', async () => {
    expect((await request(app).get('/api/items/not-an-id')).status).toBe(400);
  });
});

describe('Items: claim workflow', () => {
  test('exactly one of many simultaneous claimers wins', async () => {
    const owner = await db.registerUser(app);
    const claimers = await Promise.all(Array.from({ length: 8 }, () => db.registerUser(app)));
    const { body } = await create(owner.token);

    const results = await Promise.all(
      claimers.map((c) => request(app).post(`/api/items/${body.item.id}/claim`).set(db.bearer(c.token)))
    );
    const wins = results.filter((r) => r.status === 200);
    const losses = results.filter((r) => r.status === 409);
    expect(wins).toHaveLength(1);
    expect(losses).toHaveLength(7);
  });

  test('owner cannot claim own item; reserved items disappear from default search', async () => {
    const owner = await db.registerUser(app);
    const other = await db.registerUser(app);
    const { body } = await create(owner.token);
    const id = body.item.id;

    expect((await request(app).post(`/api/items/${id}/claim`).set(db.bearer(owner.token))).status).toBe(403);
    expect((await request(app).post(`/api/items/${id}/claim`).set(db.bearer(other.token))).status).toBe(200);
    expect((await request(app).get('/api/items')).body.data).toHaveLength(0);
    expect((await request(app).get('/api/items?status=reserved')).body.data).toHaveLength(1);
  });

  test('release makes an item available again; confirm completes the hand-over', async () => {
    const owner = await db.registerUser(app);
    const receiver = await db.registerUser(app);
    const stranger = await db.registerUser(app);
    const { body } = await create(owner.token);
    const id = body.item.id;

    await request(app).post(`/api/items/${id}/claim`).set(db.bearer(receiver.token));
    expect((await request(app).post(`/api/items/${id}/release`).set(db.bearer(stranger.token))).status).toBe(403);
    expect((await request(app).post(`/api/items/${id}/confirm`).set(db.bearer(receiver.token))).status).toBe(403);

    const released = await request(app).post(`/api/items/${id}/release`).set(db.bearer(receiver.token));
    expect(released.body.item.status).toBe('available');
    expect(released.body.item.claimedBy).toBeUndefined();

    await request(app).post(`/api/items/${id}/claim`).set(db.bearer(receiver.token));
    const confirmed = await request(app).post(`/api/items/${id}/confirm`).set(db.bearer(owner.token));
    expect(confirmed.body.item.status).toBe('given');
    expect((await request(app).post(`/api/items/${id}/claim`).set(db.bearer(stranger.token))).status).toBe(409);
  });

  test('claimedBy is hidden from strangers but visible to participants', async () => {
    const owner = await db.registerUser(app);
    const receiver = await db.registerUser(app);
    const { body } = await create(owner.token);
    const id = body.item.id;
    await request(app).post(`/api/items/${id}/claim`).set(db.bearer(receiver.token));

    const anon = await request(app).get(`/api/items/${id}`);
    expect(anon.body.item.claimedBy).toBeUndefined();
    const asOwner = await request(app).get(`/api/items/${id}`).set(db.bearer(owner.token));
    expect(asOwner.body.item.claimedBy.name).toBe(receiver.user.name);
  });
});
