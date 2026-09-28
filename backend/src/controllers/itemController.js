const Item = require('../models/Item');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { escapeRegex, buildLocation, paginate } = require('../utils/helpers');

const OWNER_FIELDS = 'name city ratingSum ratingCount';
const EARTH_RADIUS_KM = 6378.1;

const isParticipant = (item, userId) =>
  Boolean(userId) && (item.owner.equals(userId) || (item.claimedBy && item.claimedBy.equals(userId)));

// ---------------------------------------------------------------- browse / search
exports.list = asyncHandler(async (req, res) => {
  const { q, category, condition, city, status, owner, lat, lng, radiusKm, page, limit, sort } = req.query;

  const filter = { status };
  if (category) filter.category = category;
  if (condition) filter.condition = condition;
  if (owner) filter.owner = owner;
  if (city) filter.city = new RegExp(`^${escapeRegex(city)}$`, 'i');
  if (q) filter.$text = { $search: q };
  if (lat !== undefined) {
    filter.location = { $geoWithin: { $centerSphere: [[lng, lat], radiusKm / EARTH_RADIUS_KM] } };
  }

  // claimedBy is private to the two parties, so it is never returned in public lists.
  const projection = { claimedBy: 0, ...(q && { score: { $meta: 'textScore' } }) };
  const effectiveSort = sort || (q ? 'relevance' : 'newest');
  let sortSpec = { createdAt: -1 };
  if (effectiveSort === 'oldest') sortSpec = { createdAt: 1 };
  if (effectiveSort === 'relevance' && q) sortSpec = { score: { $meta: 'textScore' }, createdAt: -1 };

  const [items, total] = await Promise.all([
    Item.find(filter, projection)
      .sort(sortSpec)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('owner', OWNER_FIELDS),
    Item.countDocuments(filter),
  ]);
  res.json({ data: items, pagination: paginate(page, limit, total) });
});

exports.mine = asyncHandler(async (req, res) => {
  const { type, page, limit } = req.query;
  const filter = type === 'claimed' ? { claimedBy: req.user.id } : { owner: req.user.id };
  const [items, total] = await Promise.all([
    Item.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('owner', OWNER_FIELDS),
    Item.countDocuments(filter),
  ]);
  res.json({ data: items, pagination: paginate(page, limit, total) });
});

exports.getOne = asyncHandler(async (req, res) => {
  const item = await Item.findById(req.params.id).populate('owner', OWNER_FIELDS);
  if (!item) throw new AppError(404, 'Item not found');

  const ownerId = item.owner._id;
  const viewerId = req.user && req.user.id;
  const participant = viewerId && (ownerId.equals(viewerId) || (item.claimedBy && item.claimedBy.equals(viewerId)));

  const body = item.toJSON();
  if (participant && item.claimedBy) {
    await item.populate('claimedBy', 'name city');
    body.claimedBy = item.claimedBy.toJSON();
  } else {
    delete body.claimedBy;
  }
  res.json({ item: body });
});

// ---------------------------------------------------------------- create / update / delete
exports.create = asyncHandler(async (req, res) => {
  const { coordinates, ...fields } = req.body;
  const item = await Item.create({ ...fields, location: buildLocation(coordinates), owner: req.user.id });
  res.status(201).json({ item });
});

exports.update = asyncHandler(async (req, res) => {
  const { version, coordinates, ...fields } = req.body;
  const item = await Item.findById(req.params.id);
  if (!item) throw new AppError(404, 'Item not found');
  if (!item.owner.equals(req.user.id)) throw new AppError(403, 'Only the owner can edit this listing');
  if (item.status !== 'available') throw new AppError(409, `A ${item.status} item cannot be edited`);
  if (version !== undefined && version !== item.__v) {
    throw new AppError(409, 'This listing was modified since you loaded it. Reload and try again.');
  }

  item.set(fields);
  if (coordinates) item.location = buildLocation(coordinates);
  // optimisticConcurrency: if another writer changed the document after we read it,
  // save() throws VersionError, which the error handler turns into 409.
  await item.save();
  res.json({ item });
});

exports.remove = asyncHandler(async (req, res) => {
  const deleted = await Item.findOneAndDelete({ _id: req.params.id, owner: req.user.id, status: 'available' });
  if (deleted) return res.status(204).end();

  const existing = await Item.findById(req.params.id).select('owner status');
  if (!existing) throw new AppError(404, 'Item not found');
  if (!existing.owner.equals(req.user.id)) throw new AppError(403, 'Only the owner can delete this listing');
  throw new AppError(409, `A ${existing.status} item cannot be deleted. Release it first.`);
});

// ---------------------------------------------------------------- claim workflow
// available --claim--> reserved --confirm--> given
//                          \--release--> available
// Every transition is ONE atomic findOneAndUpdate whose filter contains the expected current
// status. MongoDB serialises writes to a single document, so when several people click "claim"
// at the same moment exactly one filter matches; the rest get 409. No locks, no race window.

async function explainFailedTransition(itemId, userId, { ownerOnly = false } = {}) {
  const item = await Item.findById(itemId).select('owner claimedBy status');
  if (!item) throw new AppError(404, 'Item not found');
  if (ownerOnly ? !item.owner.equals(userId) : !isParticipant(item, userId)) {
    throw new AppError(403, 'You are not allowed to perform this action on this item');
  }
  throw new AppError(409, `Action not possible: item is currently "${item.status}"`);
}

exports.claim = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await Item.findOneAndUpdate(
    { _id: id, status: 'available', owner: { $ne: req.user.id } },
    { $set: { status: 'reserved', claimedBy: req.user.id, reservedAt: new Date() }, $inc: { __v: 1 } },
    { new: true }
  );
  if (item) return res.json({ item });

  const existing = await Item.findById(id).select('owner status');
  if (!existing) throw new AppError(404, 'Item not found');
  if (existing.owner.equals(req.user.id)) throw new AppError(403, 'You cannot claim your own item');
  throw new AppError(409, 'Sorry, this item is no longer available');
});

exports.release = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await Item.findOneAndUpdate(
    { _id: id, status: 'reserved', $or: [{ owner: req.user.id }, { claimedBy: req.user.id }] },
    { $set: { status: 'available' }, $unset: { claimedBy: 1, reservedAt: 1 }, $inc: { __v: 1 } },
    { new: true }
  );
  if (!item) await explainFailedTransition(id, req.user.id);
  res.json({ item });
});

exports.confirm = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const item = await Item.findOneAndUpdate(
    { _id: id, owner: req.user.id, status: 'reserved' },
    { $set: { status: 'given', givenAt: new Date() }, $inc: { __v: 1 } },
    { new: true }
  );
  if (!item) await explainFailedTransition(id, req.user.id, { ownerOnly: true });
  res.json({ item });
});
