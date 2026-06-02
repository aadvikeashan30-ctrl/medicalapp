const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

function checkValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    return false;
  }
  return true;
}

function signToken(userId) {
  const secret = process.env.JWT_SECRET || 'demo-fallback-secret-key-32chars!!';
  return jwt.sign({ userId }, secret, {
    expiresIn: process.env.JWT_EXPIRY || '30d'
  });
}

function publicUser(u) {
  return {
    id: u._id,
    name: u.name,
    email: u.email,
    role: u.role,
    specialty: u.specialty,
    clinicName: u.clinicName,
    plan: u.plan
  };
}

// Register Doctor
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').notEmpty().withMessage('Phone is required')
  ],
  asyncHandler(async (req, res) => {
    if (!checkValidation(req, res)) return;
    const { name, email, password, phone, specialty, clinicName, clinicCity, qualification } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hashed,
      phone,
      specialty,
      clinicName,
      clinicCity,
      qualification,
      plan: 'free',
      planExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });

    res.status(201).json({ token: signToken(user._id), user: publicUser(user) });
  })
);

// Login
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  asyncHandler(async (req, res) => {
    if (!checkValidation(req, res)) return;
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    if (!user.isActive) return res.status(403).json({ message: 'Account disabled' });

    res.json({ token: signToken(user._id), user: publicUser(user) });
  })
);

// Get profile
router.get('/profile', auth, asyncHandler(async (req, res) => res.json(req.user)));

// Update profile (no password)
router.put(
  '/profile',
  auth,
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    ['password', 'email', 'role', 'plan', 'planExpiry', 'isActive', 'passwordResetToken'].forEach(
      (k) => delete updates[k]
    );
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json(user);
  })
);

// Change password
router.post(
  '/change-password',
  auth,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
  ],
  asyncHandler(async (req, res) => {
    if (!checkValidation(req, res)) return;
    const user = await User.findById(req.user._id);
    const ok = await bcrypt.compare(req.body.currentPassword, user.password);
    if (!ok) return res.status(401).json({ message: 'Current password is incorrect' });
    user.password = await bcrypt.hash(req.body.newPassword, 10);
    await user.save();
    res.json({ message: 'Password updated' });
  })
);

// Forgot password (stub - returns token; integrate email later)
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  asyncHandler(async (req, res) => {
    if (!checkValidation(req, res)) return;
    const user = await User.findOne({ email: req.body.email });
    // Respond identically whether or not the user exists, to avoid email enumeration
    if (user) {
      const token = require('crypto').randomBytes(32).toString('hex');
      user.passwordResetToken = token;
      user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      // TODO: send via email service
    }
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  })
);

module.exports = router;
