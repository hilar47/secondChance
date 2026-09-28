// Usage: npm run seed   (WARNING: wipes users, items and reviews)
const config = require('../src/config/env');
const { connectDB } = require('../src/config/db');
const { User, Item, Review } = require('../src/models');
const { hash } = require('../src/utils/password');

(async () => {
  await connectDB(config.mongoUri);
  await Promise.all([User.deleteMany({}), Item.deleteMany({}), Review.deleteMany({})]);

  const passwordHash = await hash('Password123');
  const [alice, bob] = await User.create([
    { name: 'Alice Green', email: 'alice@example.com', passwordHash, city: 'Dubai' },
    { name: 'Bob Stone', email: 'bob@example.com', passwordHash, city: 'Dubai' },
  ]);

  await Item.create([
    { title: 'Wooden bookshelf', description: 'Sturdy 5-shelf bookcase, minor scratches.', category: 'furniture',
      condition: 'good', tags: ['shelf', 'wood'], city: 'Dubai', owner: alice._id,
      location: { type: 'Point', coordinates: [55.2708, 25.2048] } },
    { title: 'Kids bicycle (16")', description: 'Outgrown by my daughter. New tyres.', category: 'sports',
      condition: 'like_new', tags: ['bike', 'kids'], city: 'Dubai', owner: alice._id },
    { title: 'Blender', description: 'Works perfectly, glass jug.', category: 'kitchen',
      condition: 'good', tags: ['appliance'], city: 'Dubai', owner: bob._id },
  ]);

  console.log('Seeded. Log in with alice@example.com / Password123'); // eslint-disable-line no-console
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); }); // eslint-disable-line no-console
