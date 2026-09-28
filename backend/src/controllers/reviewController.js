const Item = require('../models/Item');
const Review = require('../models/Review');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

// A review is only possible after a completed hand-over, and only between the two people
// involved: the giver reviews the receiver and vice-versa.
exports.create = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const userId = req.user.id;

  const item = await Item.findById(req.params.id).select('owner claimedBy status');
  if (!item) throw new AppError(404, 'Item not found');
  if (item.status !== 'given') throw new AppError(409, 'Reviews can only be left after the item has been handed over');

  const isOwner = item.owner.equals(userId);
  const isReceiver = item.claimedBy && item.claimedBy.equals(userId);
  if (!isOwner && !isReceiver) throw new AppError(403, 'Only the giver and the receiver can review this hand-over');

  const reviewee = isOwner ? item.claimedBy : item.owner;

  // The unique index {item, reviewer} rejects duplicates atomically (-> 409 via error handler),
  // even if the same request is submitted twice at once.
  const review = await Review.create({ item: item._id, reviewer: userId, reviewee, rating, comment });

  try {
    // Atomic aggregate update - never read-modify-write.
    await User.updateOne({ _id: reviewee }, { $inc: { ratingSum: rating, ratingCount: 1 } });
  } catch (err) {
    await Review.deleteOne({ _id: review._id }); // compensate so data stays consistent
    throw err;
  }
  res.status(201).json({ review });
});

exports.remove = asyncHandler(async (req, res) => {
  const review = await Review.findOneAndDelete({ _id: req.params.id, reviewer: req.user.id });
  if (!review) {
    const exists = await Review.exists({ _id: req.params.id });
    throw exists ? new AppError(403, 'You can only delete your own reviews') : new AppError(404, 'Review not found');
  }
  await User.updateOne({ _id: review.reviewee }, { $inc: { ratingSum: -review.rating, ratingCount: -1 } });
  res.status(204).end();
});
