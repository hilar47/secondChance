/*
 *   POST /api/auth/register   create an account
 *   POST /api/auth/login      log in, receive a JWT
 *   PUT  /api/auth/update     update name and/or password (requires Bearer token)
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { connectToDatabase } = require('../models/db');
const authenticate = require('../middleware/auth');
const { jwtSecret } = require('../config');

const router = express.Router();
const ROUNDS = 12;
const sign = (user) => jwt.sign({ email: user.email, name: user.name }, jwtSecret, { expiresIn: '1d' });

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array().map((e) => ({ field: e.path, message: e.msg })) });
  return next();
};

const rules = {
  name: body('name').isString().trim().isLength({ min: 2, max: 60 }).withMessage('name must be 2-60 characters'),
  email: body('email').isString().trim().isEmail().withMessage('valid email required').normalizeEmail(),
  password: body('password').isString().isLength({ min: 8, max: 72 }).withMessage('password must be 8-72 characters'),
};

// ---- REGISTER -----------------------------------------------------------------
router.post('/register', [rules.name, rules.email, rules.password], validate, async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const db = await connectToDatabase();
    const users = db.collection('users');
    await users.createIndex({ email: 1 }, { unique: true }); // guarantees no duplicate accounts, even concurrently

    const user = { name, email, password: await bcrypt.hash(password, ROUNDS), createdAt: new Date() };
    try {
      await users.insertOne(user);
    } catch (err) {
      if (err.code === 11000) return res.status(409).json({ error: 'Email is already registered' });
      throw err;
    }
    res.status(201).json({ authtoken: sign(user), name, email });
  } catch (e) {
    next(e);
  }
});

// ---- LOGIN ------------------------------------------------------------------
router.post(
  '/login',
  [rules.email, body('password').isString().notEmpty().withMessage('password required')],
  validate,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const db = await connectToDatabase();
      const user = await db.collection('users').findOne({ email });
      // Same message for unknown e-mail and wrong password (no user enumeration).
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      return res.json({ authtoken: sign(user), name: user.name, email: user.email });
    } catch (e) {
      return next(e);
    }
  }
);

// ---- UPDATE USER INFORMATION -------------------------------------------------
router.put(
  '/update',
  authenticate,
  [
    body('name').optional().isString().trim().isLength({ min: 2, max: 60 }).withMessage('name must be 2-60 characters'),
    body('password').optional().isString().isLength({ min: 8, max: 72 }).withMessage('password must be 8-72 characters'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const changes = {};
      if (req.body.name) changes.name = req.body.name;
      if (req.body.password) changes.password = await bcrypt.hash(req.body.password, ROUNDS);
      if (Object.keys(changes).length === 0) return res.status(400).json({ error: 'Provide name and/or password' });

      const db = await connectToDatabase();
      const updated = await db
        .collection('users')
        .findOneAndUpdate({ email: req.user.email }, { $set: { ...changes, updatedAt: new Date() } }, { returnDocument: 'after' });
      if (!updated) return res.status(404).json({ error: 'User not found' });
      return res.json({ authtoken: sign(updated), name: updated.name, email: updated.email });
    } catch (e) {
      return next(e);
    }
  }
);

module.exports = router;
