const mongoose = require('mongoose');
const { baseTransform } = require('../utils/helpers');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    city: { type: String, trim: true, maxlength: 80 },
    bio: { type: String, trim: true, maxlength: 500 },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    // Rating aggregates are updated atomically with $inc, so concurrent reviews never lose updates.
    ratingSum: { type: Number, default: 0, min: 0 },
    ratingCount: { type: Number, default: 0, min: 0 },
    // Brute-force protection
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.failedLoginAttempts;
        delete ret.lockUntil;
        return baseTransform(doc, ret);
      },
    },
  }
);

userSchema.virtual('averageRating').get(function averageRating() {
  if (!this.ratingCount) return null;
  return Math.round((this.ratingSum / this.ratingCount) * 10) / 10;
});

module.exports = mongoose.model('User', userSchema);
