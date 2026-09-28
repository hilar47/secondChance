require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret =
  process.env.JWT_SECRET || (nodeEnv === 'production' ? null : 'dev-only-secret-change-me');

if (!jwtSecret) {
  throw new Error('JWT_SECRET must be set when NODE_ENV=production');
}

module.exports = Object.freeze({
  nodeEnv,
  isTest: nodeEnv === 'test',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/secondchance',
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || (nodeEnv === 'test' ? '4' : '12'), 10),
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map((s) => s.trim()),
  trustProxy: process.env.TRUST_PROXY === 'true',
  maxFailedLogins: 5,
  lockMinutes: 15,
});
