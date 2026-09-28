const mongoose = require('mongoose');

async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  // Make sure unique / text / geo indexes exist. The unique indexes are what make
  // several operations (registration, one-review-per-transaction) safe under concurrency.
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  return mongoose.connection;
}

module.exports = { connectDB };
