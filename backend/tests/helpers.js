const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

exports.connect = async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  require('../src/models');
  // Build unique / text / 2dsphere indexes before any test runs.
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
};

exports.clear = async () => {
  for (const c of Object.values(mongoose.connection.collections)) await c.deleteMany({});
};

exports.disconnect = async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
};

let counter = 0;
exports.registerUser = async (app, overrides = {}) => {
  counter += 1;
  const body = {
    name: `Tester ${counter}`,
    email: `tester${counter}@example.com`,
    password: 'Password123',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(body);
  return { token: res.body.token, user: res.body.user, email: body.email, password: body.password };
};

exports.sampleItem = (overrides = {}) => ({
  title: 'Wooden bookshelf',
  description: 'Five shelves, small scratches',
  category: 'furniture',
  condition: 'good',
  tags: ['wood'],
  city: 'Dubai',
  ...overrides,
});

exports.bearer = (token) => ({ Authorization: `Bearer ${token}` });
