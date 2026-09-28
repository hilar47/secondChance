/*
 * Item routes. app.js mounts this router at  /api/secondchance/items
 *
 *   GET    /api/secondchance/items        list all items
 *   POST   /api/secondchance/items        add an item (multipart/form-data, optional image "file")
 *   GET    /api/secondchance/items/:id    item details
 *   PUT    /api/secondchance/items/:id    update an item (owner only)
 *   DELETE /api/secondchance/items/:id    delete an item (owner only)
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { connectToDatabase } = require('../models/db');
const authenticate = require('../middleware/auth');

const router = express.Router();
const COLLECTION = 'secondChanceItems';
const CATEGORIES = ['Living', 'Bedroom', 'Bathroom', 'Kitchen', 'Office'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

// ---- file upload (multer) --------------------------------------------------
const imagesDir = path.join(__dirname, '..', 'public', 'images');
fs.mkdirSync(imagesDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imagesDir),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^\w.-]/g, '_')}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) =>
    /^image\//.test(file.mimetype) ? cb(null, true) : cb(new Error('Only image files are allowed')),
});

const asString = (v) => (typeof v === 'string' ? v.trim() : undefined);

// ---- GET all items -----------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const db = await connectToDatabase();
    const items = await db.collection(COLLECTION).find({}, { projection: { _id: 0 } }).toArray();
    res.json(items);
  } catch (e) {
    next(e);
  }
});

// ---- POST a new item (with optional image upload) ---------------------------
router.post('/', authenticate, upload.single('file'), async (req, res, next) => {
  try {
    const name = asString(req.body.name);
    const category = asString(req.body.category);
    const condition = asString(req.body.condition);
    const description = asString(req.body.description) || '';
    const zipcode = asString(req.body.zipcode) || '';
    const ageYears = Number(req.body.age_years ?? 0);

    if (!name || name.length < 3) return res.status(400).json({ error: 'name is required (min 3 chars)' });
    if (!CATEGORIES.includes(category)) return res.status(400).json({ error: `category must be one of ${CATEGORIES.join(', ')}` });
    if (!CONDITIONS.includes(condition)) return res.status(400).json({ error: `condition must be one of ${CONDITIONS.join(', ')}` });
    if (!Number.isFinite(ageYears) || ageYears < 0) return res.status(400).json({ error: 'age_years must be a positive number' });

    const db = await connectToDatabase();
    // Atomic counter: two simultaneous posts can never receive the same id.
    const counter = await db
      .collection('counters')
      .findOneAndUpdate({ _id: COLLECTION }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: 'after' });

    const item = {
      id: String(counter.seq),
      name,
      category,
      condition,
      description,
      zipcode,
      age_years: ageYears,
      age_days: Math.round(ageYears * 365),
      image: req.file ? `/images/${req.file.filename}` : '/images/placeholder.svg',
      posted_by: req.user.name,
      owner: req.user.email,
      date_added: Math.floor(Date.now() / 1000),
    };
    await db.collection(COLLECTION).insertOne({ ...item });
    res.status(201).json(item);
  } catch (e) {
    next(e);
  }
});

// ---- GET one item ------------------------------------------------------------
router.get('/:id', async (req, res, next) => {
  try {
    const db = await connectToDatabase();
    const item = await db.collection(COLLECTION).findOne({ id: String(req.params.id) }, { projection: { _id: 0 } });
    if (!item) return res.status(404).json({ error: 'Item not found' });
    res.json(item);
  } catch (e) {
    next(e);
  }
});

// ---- PUT update an item (owner only) ----------------------------------------
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const allowed = {};
    const name = asString(req.body.name);
    const description = asString(req.body.description);
    const condition = asString(req.body.condition);
    const category = asString(req.body.category);
    if (name) allowed.name = name;
    if (description !== undefined) allowed.description = description;
    if (condition) {
      if (!CONDITIONS.includes(condition)) return res.status(400).json({ error: 'Invalid condition' });
      allowed.condition = condition;
    }
    if (category) {
      if (!CATEGORIES.includes(category)) return res.status(400).json({ error: 'Invalid category' });
      allowed.category = category;
    }
    if (Object.keys(allowed).length === 0) return res.status(400).json({ error: 'Nothing to update' });

    const db = await connectToDatabase();
    const col = db.collection(COLLECTION);
    const updated = await col.findOneAndUpdate(
      { id: String(req.params.id), owner: req.user.email },
      { $set: allowed },
      { returnDocument: 'after', projection: { _id: 0 } }
    );
    if (updated) return res.json(updated);
    return (await col.findOne({ id: String(req.params.id) }))
      ? res.status(403).json({ error: 'Only the owner can update this item' })
      : res.status(404).json({ error: 'Item not found' });
  } catch (e) {
    next(e);
  }
});

// ---- DELETE an item via /:id (owner only) -----------------------------------
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const db = await connectToDatabase();
    const col = db.collection(COLLECTION);
    const result = await col.deleteOne({ id: String(req.params.id), owner: req.user.email });
    if (result.deletedCount === 1) return res.json({ deleted: true, id: String(req.params.id) });
    return (await col.findOne({ id: String(req.params.id) }))
      ? res.status(403).json({ error: 'Only the owner can delete this item' })
      : res.status(404).json({ error: 'Item not found' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
