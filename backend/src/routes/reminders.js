const express = require('express');
const { body, validationResult } = require('express-validator');
const MedicineReminder = require('../models/MedicineReminder');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// List reminders for a patient
router.get(
  '/patient/:patientId',
  auth,
  asyncHandler(async (req, res) => {
    const { isActive } = req.query;
    const query = { patientId: req.params.patientId, doctorId: req.user._id };
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const reminders = await MedicineReminder.find(query)
      .populate('prescriptionId', 'prescriptionNo')
      .sort({ createdAt: -1 });

    res.json(reminders);
  })
);

// Get single reminder
router.get(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const reminder = await MedicineReminder.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    res.json(reminder);
  })
);

// Create reminder
router.post(
  '/',
  auth,
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('medicineName').trim().notEmpty().withMessage('Medicine name is required'),
    body('dosage').trim().notEmpty().withMessage('Dosage is required'),
    body('frequency').notEmpty().withMessage('Frequency is required'),
    body('startDate').notEmpty().withMessage('Start date is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }

    const reminder = await MedicineReminder.create({ ...req.body, doctorId: req.user._id });
    res.status(201).json(reminder);
  })
);

// Update reminder
router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    delete updates.doctorId;

    const reminder = await MedicineReminder.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    res.json(reminder);
  })
);

// Log adherence
router.post(
  '/:id/log',
  auth,
  asyncHandler(async (req, res) => {
    const { status, notes } = req.body;
    const reminder = await MedicineReminder.findOneAndUpdate(
      { _id: req.params.id },
      {
        $push: {
          adherenceLog: {
            scheduledAt: new Date(),
            takenAt: status === 'taken' ? new Date() : null,
            status: status || 'taken',
            notes
          }
        }
      },
      { new: true }
    );
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });

    // Calculate adherence rate
    const total = reminder.adherenceLog.length;
    const taken = reminder.adherenceLog.filter((l) => l.status === 'taken').length;
    reminder.adherenceRate = total > 0 ? Math.round((taken / total) * 100) : 0;
    await reminder.save();

    res.json(reminder);
  })
);

// Deactivate reminder
router.patch(
  '/:id/deactivate',
  auth,
  asyncHandler(async (req, res) => {
    const reminder = await MedicineReminder.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    res.json(reminder);
  })
);

// Delete reminder
router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const reminder = await MedicineReminder.findOneAndDelete({ _id: req.params.id, doctorId: req.user._id });
    if (!reminder) return res.status(404).json({ message: 'Reminder not found' });
    res.json({ message: 'Reminder deleted' });
  })
);

module.exports = router;
