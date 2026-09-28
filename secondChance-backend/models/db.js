// MongoDB connection helper. The client is created once and re-used by every route.
const { MongoClient } = require('mongodb');
const { mongoUrl, dbName } = require('../config');

let dbInstance = null;
let connecting = null;

async function connectToDatabase() {
  if (dbInstance) return dbInstance;
  if (!connecting) {
    connecting = (async () => {
      const client = new MongoClient(mongoUrl);
      await client.connect(); // <- connect to MongoDB
      dbInstance = client.db(dbName);
      return dbInstance;
    })().catch((err) => {
      connecting = null; // allow a retry after a failed attempt
      throw err;
    });
  }
  return connecting;
}

module.exports = { connectToDatabase };
