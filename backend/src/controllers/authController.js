const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { hash, compare, DUMMY_HASH } = require('../utils/password');
const { signToken } = require('../utils/token');
const { maxFailedLogins, lockMinutes } = require('../config/env');

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, city } = req.body;
  // Friendly pre-check; the unique index on email is what actually prevents duplicates
  // when two registrations race (error handler maps E11000 -> 409).
  if (await User.exists({ email })) throw new AppError(409, 'Email is already registered');

  const user = await User.create({ name, email, city, passwordHash: await hash(password) });
  res.status(201).json({ token: signToken(user), user });
});

async function registerFailedAttempt(userId) {
  // Atomic increment: parallel guesses cannot slip past the counter.
  const updated = await User.findByIdAndUpdate(userId, { $inc: { failedLoginAttempts: 1 } }, { new: true })
    .select('+failedLoginAttempts');
  if (updated && updated.failedLoginAttempts >= maxFailedLogins) {
    await User.updateOne(
      { _id: userId },
      { $set: { failedLoginAttempts: 0, lockUntil: new Date(Date.now() + lockMinutes * 60 * 1000) } }
    );
  }
}

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash +failedLoginAttempts +lockUntil');

  if (user && user.lockUntil && user.lockUntil > new Date()) {
    throw new AppError(423, 'Account temporarily locked after too many failed attempts. Try again later.');
  }

  const valid = await compare(password, user ? user.passwordHash : DUMMY_HASH);
  if (!user || !valid) {
    if (user) await registerFailedAttempt(user._id);
    throw new AppError(401, 'Invalid email or password');
  }

  if (user.failedLoginAttempts > 0 || user.lockUntil) {
    await User.updateOne({ _id: user._id }, { $set: { failedLoginAttempts: 0 }, $unset: { lockUntil: 1 } });
  }
  res.json({ token: signToken(user), user });
});

exports.me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ user });
});
