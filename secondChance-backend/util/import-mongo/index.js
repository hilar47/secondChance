// Usage:  npm run import
// Loads secondChanceItems.json into MongoDB (collection: secondChanceItems).
// Re-running is safe: the collection is emptied first, so you always end with exactly 16 items.
const fs = require('fs');
const path = require('path');
const { connectToDatabase } = require('../../models/db');

(async () => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'secondChanceItems.json'), 'utf8'));
    const db = await connectToDatabase();
    const collection = db.collection('secondChanceItems');

    await collection.deleteMany({});
    const result = await collection.insertMany(data);
    await collection.createIndex({ id: 1 }, { unique: true });
    // next id for POST /items (see the atomic counter in secondChanceItemsRoutes.js)
    await db.collection('counters').updateOne(
      { _id: 'secondChanceItems' },
      { $set: { seq: data.length } },
      { upsert: true }
    );

    console.log(`Inserted ${result.insertedCount} documents into secondChance.secondChanceItems`); // eslint-disable-line no-console
    console.log(`inserted_items: ${JSON.stringify(Object.values(result.insertedIds).length)} ids`); // eslint-disable-line no-console
    const sample = await collection.find({}, { projection: { _id: 0, id: 1, name: 1, category: 1, condition: 1 } }).toArray();
    console.table(sample); // eslint-disable-line no-console
    process.exit(0);
  } catch (err) {
    console.error('Import failed:', err.message); // eslint-disable-line no-console
    process.exit(1);
  }
})();
