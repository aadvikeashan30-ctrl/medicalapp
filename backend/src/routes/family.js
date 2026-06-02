const express = require('express');
const { body, validationResult } = require('express-validator');
const FamilyAccount = require('../models/FamilyAccount');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// List all family accounts
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { search, page = 1, limit = 20 } = req.query;
    const query = { doctorId: req.user._id, isActive: true };

    if (search) {
      const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { familyName: { $regex: safe, $options: 'i' } },
        { primaryPhone: { $regex: safe } }
      ];
    }

    const [families, total] = await Promise.all([
      FamilyAccount.find(query)
        .populate('members.patientId', 'name phone age gender')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10)),
      FamilyAccount.countDocuments(query)
    ]);

    res.json({ families, total, pages: Math.ceil(total / limit) });
  })
);

// Get single family account
router.get(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const family = await FamilyAccount.findOne({ _id: req.params.id, doctorId: req.user._id })
      .populate('members.patientId', 'name phone age gender bloodGroup allergies');
    if (!family) return res.status(404).json({ message: 'Family account not found' });
    res.json(family);
  })
);

// Create family account
router.post(
  '/',
  auth,
  [
    body('familyName').trim().notEmpty().withMessage('Family name is required'),
    body('primaryPhone').trim().notEmpty().withMessage('Primary phone is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }

    const family = await FamilyAccount.create({ ...req.body, doctorId: req.user._id });
    res.status(201).json(family);
  })
);

// Update family account
router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    delete updates.doctorId;

    const family = await FamilyAccount.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!family) return res.status(404).json({ message: 'Family account not found' });
    res.json(family);
  })
);

// Add member to family
router.post(
  '/:id/members',
  auth,
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('relationship').notEmpty().withMessage('Relationship is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }

    const family = await FamilyAccount.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      { $push: { members: { patientId: req.body.patientId, relationship: req.body.relationship } } },
      { new: true }
    ).populate('members.patientId', 'name phone age gender');

    if (!family) return res.status(404).json({ message: 'Family account not found' });
    res.json(family);
  })
);

// Remove member from family
router.delete(
  '/:id/members/:patientId',
  auth,
  asyncHandler(async (req, res) => {
    const family = await FamilyAccount.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      { $pull: { members: { patientId: req.params.patientId } } },
      { new: true }
    );
    if (!family) return res.status(404).json({ message: 'Family account not found' });
    res.json(family);
  })
);

// Delete family account (soft)
router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const family = await FamilyAccount.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!family) return res.status(404).json({ message: 'Family account not found' });
    res.json({ message: 'Family account deleted' });
  })
);

module.exports = router;
