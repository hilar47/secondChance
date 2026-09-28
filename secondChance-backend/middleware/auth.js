const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

// Requires "Authorization: Bearer <token>" and sets req.user = { email, name }.
module.exports = function authenticate(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = { email: payload.email, name: payload.name };
    return next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
