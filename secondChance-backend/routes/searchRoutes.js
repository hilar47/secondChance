/*
 * GET /api/secondchance/search?name=&category=&condition=&age_years=
 * All filters are optional and combined with AND.
 */
const express = require('express');
const { connectToDatabase } = require('../models/db');

const router = express.Router();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Query-string values can be arrays/objects (?category[$ne]=x). Only plain strings are accepted.
const asString = (v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined);

router.get('/', async (req, res, next) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('secondChanceItems');

    const query = {};
    const name = asString(req.query.name);
    const category = asString(req.query.category);
    const condition = asString(req.query.condition);
    const ageYears = asString(req.query.age_years);

    if (name) query.name = { $regex: escapeRegex(name), $options: 'i' }; // partial, case-insensitive
    if (category) query.category = category;                             // filter on category
    if (condition) query.condition = condition;                          // filter on condition
    if (ageYears !== undefined) {
      const n = Number(ageYears);
      if (!Number.isFinite(n)) return res.status(400).json({ error: 'age_years must be a number' });
      query.age_years = { $lte: n };                                     // "at most N years old"
    }

    const items = await collection.find(query, { projection: { _id: 0 } }).toArray();
    res.json(items);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
