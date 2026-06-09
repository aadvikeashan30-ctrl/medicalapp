const express = require('express');
const { body, validationResult } = require('express-validator');
const DoctorAvailability = require('../models/DoctorAvailability');
const Appointment = require('../models/Appointment');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// List blocks (optionally upcoming only, or within a range)
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { from, to, upcoming } = req.query;
    const query = { doctorId: req.user._id };

    if (from || to) {
      query.endDate = {};
      if (from) query.endDate.$gte = new Date(from);
      if (to) query.startDate = { $lte: new Date(to) };
    } else if (upcoming === 'true') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query.endDate = { $gte: today };
    }

    const blocks = await DoctorAvailability.find(query).sort({ startDate: 1 });
    res.json({ blocks, total: blocks.length });
  })
);

// Check if a specific date/time is blocked (used by the booking UI)
router.get(
  '/check',
  auth,
  asyncHandler(async (req, res) => {
    const { date, timeSlot } = req.query;
    if (!date) return res.status(400).json({ message: 'date is required' });
    const block = await DoctorAvailability.findBlock(req.user._id, date, timeSlot);
    res.json({ blocked: !!block, block: block || null });
  })
);

// Create a block (full-day range or a slot within a day)
router.post(
  '/',
  auth,
  [
    body('startDate').notEmpty().withMessage('startDate is required'),
    body('type').optional().isIn(['full-day', 'slot'])
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }

    const type = req.body.type || 'full-day';
    const startDate = new Date(req.body.startDate);
    if (Number.isNaN(startDate.getTime())) return res.status(400).json({ message: 'Invalid startDate' });
    startDate.setHours(0, 0, 0, 0);

    let endDate = req.body.endDate ? new Date(req.body.endDate) : new Date(startDate);
    if (Number.isNaN(endDate.getTime())) return res.status(400).json({ message: 'Invalid endDate' });
    endDate.setHours(0, 0, 0, 0);
    if (endDate < startDate) return res.status(400).json({ message: 'endDate cannot be before startDate' });

    if (type === 'slot') {
      if (!req.body.startTime || !req.body.endTime) {
        return res.status(400).json({ message: 'startTime and endTime are required for a slot block' });
      }
      // Slot blocks apply to a single day
      endDate = new Date(startDate);
    }

    const block = await DoctorAvailability.create({
      doctorId: req.user._id,
      type,
      startDate,
      endDate,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      reason: req.body.reason || 'leave',
      note: req.body.note
    });

    // Warn (but don't block) if existing appointments fall inside this window
    const dayEnd = new Date(endDate); dayEnd.setDate(dayEnd.getDate() + 1);
    const affected = await Appointment.countDocuments({
      doctorId: req.user._id,
      date: { $gte: startDate, $lt: dayEnd },
      status: { $nin: ['cancelled', 'completed', 'no-show'] }
    });

    res.status(201).json({ block, affectedAppointments: affected });
  })
);

// Update a block
router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    delete updates.doctorId;
    if (updates.startDate) { const d = new Date(updates.startDate); d.setHours(0, 0, 0, 0); updates.startDate = d; }
    if (updates.endDate) { const d = new Date(updates.endDate); d.setHours(0, 0, 0, 0); updates.endDate = d; }

    const block = await DoctorAvailability.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!block) return res.status(404).json({ message: 'Block not found' });
    res.json(block);
  })
);

// Delete a block
router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const result = await DoctorAvailability.findOneAndDelete({ _id: req.params.id, doctorId: req.user._id });
    if (!result) return res.status(404).json({ message: 'Block not found' });
    res.json({ message: 'Availability block removed' });
  })
);

module.exports = router;
