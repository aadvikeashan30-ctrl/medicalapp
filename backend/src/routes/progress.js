const express = require('express');
const { body, validationResult } = require('express-validator');
const ProgressTracker = require('../models/ProgressTracker');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// List trackers (optional patientId / status filter)
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { patientId, status } = req.query;
    const query = { doctorId: req.user._id };
    if (patientId) query.patientId = patientId;
    if (status) query.status = status;

    const trackers = await ProgressTracker.find(query)
      .populate('patientId', 'name phone patientId')
      .sort({ updatedAt: -1 });
    res.json({ trackers, total: trackers.length });
  })
);

// Summary stats
router.get(
  '/stats/summary',
  auth,
  asyncHandler(async (req, res) => {
    const doctorId = req.user._id;
    const [active, healed, total] = await Promise.all([
      ProgressTracker.countDocuments({ doctorId, status: 'active' }),
      ProgressTracker.countDocuments({ doctorId, status: 'healed' }),
      ProgressTracker.countDocuments({ doctorId })
    ]);
    res.json({ active, healed, total });
  })
);

// Single tracker
router.get(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const tracker = await ProgressTracker.findOne({ _id: req.params.id, doctorId: req.user._id })
      .populate('patientId', 'name phone patientId age gender');
    if (!tracker) return res.status(404).json({ message: 'Tracker not found' });
    res.json(tracker);
  })
);

// Create tracker (optionally with a first entry)
router.post(
  '/',
  auth,
  [
    body('patientId').notEmpty().withMessage('patientId is required'),
    body('bodyArea').trim().notEmpty().withMessage('bodyArea is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }

    const patient = await Patient.findOne({ _id: req.body.patientId, doctorId: req.user._id });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const tracker = await ProgressTracker.create({
      doctorId: req.user._id,
      patientId: req.body.patientId,
      patientName: patient.name,
      bodyArea: req.body.bodyArea,
      condition: req.body.condition,
      entries: req.body.photoUrl
        ? [{ photoUrl: req.body.photoUrl, note: req.body.note, assessment: req.body.assessment || 'stable', measurementCm: req.body.measurementCm }]
        : []
    });
    const populated = await tracker.populate('patientId', 'name phone patientId');
    res.status(201).json(populated);
  })
);

// Add a photo entry
router.post(
  '/:id/entries',
  auth,
  [body('photoUrl').notEmpty().withMessage('photoUrl is required')],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }
    const tracker = await ProgressTracker.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!tracker) return res.status(404).json({ message: 'Tracker not found' });

    tracker.entries.push({
      photoUrl: req.body.photoUrl,
      note: req.body.note,
      assessment: req.body.assessment || 'stable',
      measurementCm: req.body.measurementCm,
      date: req.body.date || new Date()
    });
    if (req.body.assessment === 'healed') tracker.status = 'healed';
    await tracker.save();
    await tracker.populate('patientId', 'name phone patientId');
    res.status(201).json(tracker);
  })
);

// Delete an entry
router.delete(
  '/:id/entries/:entryId',
  auth,
  asyncHandler(async (req, res) => {
    const tracker = await ProgressTracker.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!tracker) return res.status(404).json({ message: 'Tracker not found' });
    tracker.entries.pull(req.params.entryId);
    await tracker.save();
    await tracker.populate('patientId', 'name phone patientId');
    res.json(tracker);
  })
);

// Update tracker (status, condition, bodyArea)
router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    delete updates.doctorId;
    delete updates.entries;
    const tracker = await ProgressTracker.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      updates,
      { new: true, runValidators: true }
    ).populate('patientId', 'name phone patientId');
    if (!tracker) return res.status(404).json({ message: 'Tracker not found' });
    res.json(tracker);
  })
);

// Delete tracker
router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const result = await ProgressTracker.findOneAndDelete({ _id: req.params.id, doctorId: req.user._id });
    if (!result) return res.status(404).json({ message: 'Tracker not found' });
    res.json({ message: 'Tracker deleted' });
  })
);

module.exports = router;
