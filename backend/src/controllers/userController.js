const User = require('../models/User');
const Review = require('../models/Review');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { paginate } = require('../utils/helpers');

exports.getProfile = asyncHandler(async (req, res) => {
  // Public profile: e-mail and role are deliberately not selected.
  const user = await User.findById(req.params.id).select('name city bio ratingSum ratingCount createdAt');
  if (!user) throw new AppError(404, 'User not found');
  res.json({ user });
});

exports.updateMe = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user.id, { $set: req.body }, { new: true, runValidators: true });
  res.json({ user });
});

exports.listReviews = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  const filter = { reviewee: req.params.id };
  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('reviewer', 'name city')
      .populate('item', 'title'),
    Review.countDocuments(filter),
  ]);
  res.json({ data: reviews, pagination: paginate(page, limit, total) });
});
