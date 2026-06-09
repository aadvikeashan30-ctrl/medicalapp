const express = require('express');
const { body, validationResult } = require('express-validator');
const AsyncConsult = require('../models/AsyncConsult');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// List (filter status / category / priority)
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { status, category, priority } = req.query;
    const query = { doctorId: req.user._id };
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;

    const consults = await AsyncConsult.find(query)
      .populate('patientId', 'name phone patientId')
      .sort({ priority: -1, createdAt: 1 });
    res.json({ consults, total: consults.length });
  })
);

// Summary stats
router.get(
  '/stats/summary',
  auth,
  asyncHandler(async (req, res) => {
    const doctorId = req.user._id;
    const [pending, inReview, responded, high] = await Promise.all([
      AsyncConsult.countDocuments({ doctorId, status: 'pending' }),
      AsyncConsult.countDocuments({ doctorId, status: 'in-review' }),
      AsyncConsult.countDocuments({ doctorId, status: 'responded' }),
      AsyncConsult.countDocuments({ doctorId, status: { $in: ['pending', 'in-review'] }, priority: 'high' })
    ]);
    res.json({ pending, inReview, responded, high, openTotal: pending + inReview });
  })
);

// Single
router.get(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const consult = await AsyncConsult.findOne({ _id: req.params.id, doctorId: req.user._id })
      .populate('patientId', 'name phone patientId age gender');
    if (!consult) return res.status(404).json({ message: 'Consultation not found' });
    res.json(consult);
  })
);

// Create (doctor logging an inbound async case)
router.post(
  '/',
  auth,
  [
    body('patientName').trim().notEmpty().withMessage('patientName is required'),
    body('description').trim().notEmpty().withMessage('description is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }
    const consult = await AsyncConsult.create({ ...req.body, doctorId: req.user._id });
    const populated = await consult.populate('patientId', 'name phone patientId');
    res.status(201).json(populated);
  })
);

// Mark in-review
router.post(
  '/:id/claim',
  auth,
  asyncHandler(async (req, res) => {
    const consult = await AsyncConsult.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      { status: 'in-review' },
      { new: true }
    ).populate('patientId', 'name phone patientId');
    if (!consult) return res.status(404).json({ message: 'Consultation not found' });
    res.json(consult);
  })
);

// Respond (and optionally notify patient)
router.post(
  '/:id/respond',
  auth,
  [body('text').trim().notEmpty().withMessage('Response text is required')],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }
    const consult = await AsyncConsult.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!consult) return res.status(404).json({ message: 'Consultation not found' });

    consult.response = { text: req.body.text, respondedAt: new Date(), followUpAdvised: !!req.body.followUpAdvised };
    consult.status = 'responded';
    await consult.save();

    if (consult.patientPhone) {
      try {
        const { sendMessage } = require('../services/whatsappService');
        await sendMessage({ to: consult.patientPhone, body: `Reply from Dr. ${req.user.name}: ${req.body.text}` });
      } catch (e) { /* non-critical */ }
    }

    await consult.populate('patientId', 'name phone patientId');
    res.json(consult);
  })
);

// Update / close
router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    delete updates.doctorId;
    const consult = await AsyncConsult.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      updates,
      { new: true, runValidators: true }
    ).populate('patientId', 'name phone patientId');
    if (!consult) return res.status(404).json({ message: 'Consultation not found' });
    res.json(consult);
  })
);

// Delete
router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const result = await AsyncConsult.findOneAndDelete({ _id: req.params.id, doctorId: req.user._id });
    if (!result) return res.status(404).json({ message: 'Consultation not found' });
    res.json({ message: 'Consultation removed' });
  })
);

module.exports = router;
