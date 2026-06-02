const express = require('express');
const { body, validationResult } = require('express-validator');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// List patients (search + pagination)
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { search, page = 1, limit = 20 } = req.query;
    const query = { doctorId: req.user._id, isActive: true };

    if (search) {
      const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { phone: { $regex: safe } },
        { patientId: { $regex: safe, $options: 'i' } }
      ];
    }

    const [patients, total] = await Promise.all([
      Patient.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10)),
      Patient.countDocuments(query)
    ]);

    res.json({ patients, total, pages: Math.ceil(total / limit), page: parseInt(page, 10) });
  })
);

// Get single
router.get(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  })
);

// Create
router.post(
  '/',
  auth,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }
    const patient = await Patient.create({ ...req.body, doctorId: req.user._id });
    res.status(201).json(patient);
  })
);

// Update
router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    delete updates.doctorId;
    delete updates.patientId;
    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  })
);

// Soft delete
router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const patient = await Patient.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json({ message: 'Patient deleted' });
  })
);

module.exports = router;
