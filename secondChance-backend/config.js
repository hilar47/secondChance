require('dotenv').config();

const jwtSecret =
  process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? null : 'dev-only-secret-change-me');
if (!jwtSecret) throw new Error('JWT_SECRET must be set in production');

module.exports = {
  port: parseInt(process.env.PORT || '3060', 10),
  mongoUrl: process.env.MONGO_URL || 'mongodb://localhost:27017',
  dbName: process.env.MONGO_DB || 'secondChance',
  jwtSecret,
};
