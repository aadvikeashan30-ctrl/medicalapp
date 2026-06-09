const express = require('express');
const { body, validationResult } = require('express-validator');
const Waitlist = require('../models/Waitlist');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// List waitlist entries (optional status / service filter)
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { status, service } = req.query;
    const query = { doctorId: req.user._id };
    if (status) query.status = status;
    if (service) query.service = service;

    const entries = await Waitlist.find(query)
      .populate('patientId', 'name phone patientId')
      .sort({ priority: -1, createdAt: 1 });

    res.json({ entries, total: entries.length });
  })
);

// Summary stats
router.get(
  '/stats/summary',
  auth,
  asyncHandler(async (req, res) => {
    const doctorId = req.user._id;
    const [waiting, notified, booked, high] = await Promise.all([
      Waitlist.countDocuments({ doctorId, status: 'waiting' }),
      Waitlist.countDocuments({ doctorId, status: 'notified' }),
      Waitlist.countDocuments({ doctorId, status: 'booked' }),
      Waitlist.countDocuments({ doctorId, status: 'waiting', priority: 'high' })
    ]);
    res.json({ waiting, notified, booked, high });
  })
);

// Add to waitlist
router.post(
  '/',
  auth,
  [
    body('patientName').trim().notEmpty().withMessage('patientName is required'),
    body('patientPhone').trim().notEmpty().withMessage('patientPhone is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }
    const entry = await Waitlist.create({ ...req.body, doctorId: req.user._id });
    const populated = await entry.populate('patientId', 'name phone patientId');
    res.status(201).json(populated);
  })
);

// Notify a single waitlisted patient about a freed slot
router.post(
  '/:id/notify',
  auth,
  asyncHandler(async (req, res) => {
    const entry = await Waitlist.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!entry) return res.status(404).json({ message: 'Waitlist entry not found' });

    const { date, timeSlot } = req.body;
    const { sendMessage } = require('../services/whatsappService');
    const slotText = [date ? new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : null, timeSlot]
      .filter(Boolean)
      .join(' at ');

    const body =
      `Hi ${entry.patientName}, a ${entry.service} slot has just opened up${slotText ? ` on ${slotText}` : ''} ` +
      `at ${req.user.clinicName || 'our clinic'}. Reply or call to confirm — first come, first served!`;

    let result = { success: true, stubbed: true };
    try { result = await sendMessage({ to: entry.patientPhone, body }); } catch (e) { /* non-critical */ }

    entry.status = 'notified';
    entry.notifiedAt = new Date();
    entry.notifyCount += 1;
    await entry.save();

    res.json({ message: 'Patient notified', delivery: result, entry });
  })
);

// Auto-fill: notify the best-matching waiting patients for a freed slot
router.post(
  '/fill',
  auth,
  asyncHandler(async (req, res) => {
    const { date, timeSlot, service, limit = 5 } = req.body;
    const query = { doctorId: req.user._id, status: 'waiting' };
    if (service) query.service = service;

    const candidates = await Waitlist.find(query)
      .sort({ priority: -1, createdAt: 1 })
      .limit(parseInt(limit, 10));

    if (candidates.length === 0) {
      return res.json({ notified: 0, message: 'No waiting patients to notify', entries: [] });
    }

    const { sendMessage } = require('../services/whatsappService');
    const slotText = [date ? new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : null, timeSlot]
      .filter(Boolean)
      .join(' at ');

    let notified = 0;
    for (const entry of candidates) {
      const body =
        `Hi ${entry.patientName}, a ${entry.service} slot has just opened up${slotText ? ` on ${slotText}` : ''} ` +
        `at ${req.user.clinicName || 'our clinic'}. Reply or call to confirm — first come, first served!`;
      try { await sendMessage({ to: entry.patientPhone, body }); } catch (e) { /* non-critical */ }
      entry.status = 'notified';
      entry.notifiedAt = new Date();
      entry.notifyCount += 1;
      await entry.save();
      notified += 1;
    }

    res.json({ notified, message: `Notified ${notified} waitlisted patient(s)`, entries: candidates });
  })
);

// Update entry (e.g. mark booked, change priority)
router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    delete updates.doctorId;
    const entry = await Waitlist.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      updates,
      { new: true, runValidators: true }
    ).populate('patientId', 'name phone patientId');
    if (!entry) return res.status(404).json({ message: 'Waitlist entry not found' });
    res.json(entry);
  })
);

// Remove from waitlist
router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const result = await Waitlist.findOneAndDelete({ _id: req.params.id, doctorId: req.user._id });
    if (!result) return res.status(404).json({ message: 'Waitlist entry not found' });
    res.json({ message: 'Removed from waitlist' });
  })
);

module.exports = router;
