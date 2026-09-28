const mongoose = require('mongoose');
const { CATEGORIES, CONDITIONS, STATUSES } = require('../constants');
const { baseTransform } = require('../utils/helpers');

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], required: true },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  { _id: false }
);

const itemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 3, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    category: { type: String, enum: CATEGORIES, required: true },
    condition: { type: String, enum: CONDITIONS, required: true },
    tags: [{ type: String, trim: true, lowercase: true, maxlength: 30 }],
    images: [{ type: String }],
    city: { type: String, trim: true, maxlength: 80 },
    location: { type: pointSchema, default: undefined },
    status: { type: String, enum: STATUSES, default: 'available' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    claimedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reservedAt: Date,
    givenAt: Date,
  },
  {
    timestamps: true,
    // save() on a stale document throws VersionError -> HTTP 409 (lost-update protection).
    optimisticConcurrency: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.version = ret.__v;
        return baseTransform(doc, ret);
      },
    },
  }
);

itemSchema.index(
  { title: 'text', description: 'text', tags: 'text' },
  { weights: { title: 10, tags: 5, description: 1 }, default_language: 'none', name: 'item_text' }
);
itemSchema.index({ status: 1, createdAt: -1 });
itemSchema.index({ category: 1, status: 1 });
itemSchema.index({ owner: 1, createdAt: -1 });
itemSchema.index({ claimedBy: 1 });
itemSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Item', itemSchema);
