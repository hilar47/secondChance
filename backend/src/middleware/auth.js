const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken } = require('../utils/token');

async function resolveUser(header) {
  const [scheme, token] = (header || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new AppError(401, 'Authentication required');

  let payload;
  try {
    payload = verifyToken(token);
  } catch (err) {
    throw new AppError(401, 'Invalid or expired token');
  }
  const user = await User.findById(payload.sub).select('_id role');
  if (!user) throw new AppError(401, 'Account no longer exists');
  return { id: user.id, role: user.role };
}

// Rejects the request unless a valid Bearer token is supplied.
const authenticate = asyncHandler(async (req, res, next) => {
  req.user = await resolveUser(req.headers.authorization);
  next();
});

// Attaches req.user when a token is present, but never fails the request.
const optionalAuth = asyncHandler(async (req, res, next) => {
  if (req.headers.authorization) {
    try {
      req.user = await resolveUser(req.headers.authorization);
    } catch (err) {
      req.user = undefined;
    }
  }
  next();
});

module.exports = { authenticate, optionalAuth };
