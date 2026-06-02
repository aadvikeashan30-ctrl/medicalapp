const express = require('express');
const { body, validationResult } = require('express-validator');
const HealthRecord = require('../models/HealthRecord');
const HealthTimeline = require('../models/HealthTimeline');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Get all health records for a patient (PHR)
router.get(
  '/patient/:patientId',
  auth,
  asyncHandler(async (req, res) => {
    const { recordType, page = 1, limit = 20 } = req.query;
    const query = { patientId: req.params.patientId, doctorId: req.user._id };
    if (recordType) query.recordType = recordType;

    const [records, total] = await Promise.all([
      HealthRecord.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10)),
      HealthRecord.countDocuments(query)
    ]);

    res.json({ records, total, pages: Math.ceil(total / limit) });
  })
);

// Get single health record
router.get(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const record = await HealthRecord.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json(record);
  })
);

// Create health record
router.post(
  '/',
  auth,
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('recordType').notEmpty().withMessage('Record type is required'),
    body('title').trim().notEmpty().withMessage('Title is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }

    const record = await HealthRecord.create({ ...req.body, doctorId: req.user._id });

    // Auto-add to health timeline
    await HealthTimeline.create({
      patientId: req.body.patientId,
      doctorId: req.user._id,
      eventDate: new Date(),
      eventType: req.body.recordType === 'vitals' ? 'vitals-recorded' : 'note',
      title: req.body.title,
      description: req.body.description,
      referenceModel: 'HealthRecord',
      referenceId: record._id
    });

    res.status(201).json(record);
  })
);

// Update health record
router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    delete updates.doctorId;
    delete updates.patientId;

    const record = await HealthRecord.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json(record);
  })
);

// Delete health record
router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const record = await HealthRecord.findOneAndDelete({ _id: req.params.id, doctorId: req.user._id });
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: 'Record deleted' });
  })
);

// Get patient health timeline
router.get(
  '/timeline/:patientId',
  auth,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, eventType } = req.query;
    const query = { patientId: req.params.patientId, doctorId: req.user._id };
    if (eventType) query.eventType = eventType;

    const [events, total] = await Promise.all([
      HealthTimeline.find(query)
        .sort({ eventDate: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10)),
      HealthTimeline.countDocuments(query)
    ]);

    res.json({ events, total, pages: Math.ceil(total / limit) });
  })
);

module.exports = router;
