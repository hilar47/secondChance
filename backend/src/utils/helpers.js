const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const buildLocation = (coordinates) =>
  coordinates ? { type: 'Point', coordinates: [coordinates.lng, coordinates.lat] } : undefined;

const paginate = (page, limit, total) => ({
  page,
  limit,
  total,
  pages: Math.max(1, Math.ceil(total / limit)),
});

// Shared toJSON transform: _id -> id, hide __v.
const baseTransform = (doc, ret) => {
  ret.id = ret._id;
  delete ret._id;
  delete ret.__v;
  return ret;
};

module.exports = { escapeRegex, buildLocation, paginate, baseTransform };
