const express = require('express');
const { body, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

const todayStr = () => new Date().toISOString().slice(0, 10);

// List (filter date / staffName)
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const query = { doctorId: req.user._id };
    if (req.query.date) query.date = req.query.date;
    if (req.query.staffName) query.staffName = req.query.staffName;
    const records = await Attendance.find(query).sort({ date: -1, checkIn: -1 }).limit(200);
    res.json({ records, total: records.length });
  })
);

// Today's roster + stats
router.get(
  '/stats/summary',
  auth,
  asyncHandler(async (req, res) => {
    const date = req.query.date || todayStr();
    const records = await Attendance.find({ doctorId: req.user._id, date });
    const present = records.filter((r) => ['present', 'on-duty', 'half-day'].includes(r.status)).length;
    const onDuty = records.filter((r) => r.status === 'on-duty').length;
    const leave = records.filter((r) => r.status === 'leave' || r.status === 'absent').length;
    res.json({ date, present, onDuty, leave, total: records.length });
  })
);

// Check in
router.post(
  '/check-in',
  auth,
  [body('staffName').trim().notEmpty().withMessage('staffName is required')],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    const date = todayStr();
    let rec = await Attendance.findOne({ doctorId: req.user._id, staffName: req.body.staffName, date });
    if (rec && rec.checkIn) return res.status(409).json({ message: 'Already checked in today' });
    if (!rec) rec = new Attendance({ doctorId: req.user._id, staffName: req.body.staffName, role: req.body.role || 'staff', date });
    rec.checkIn = new Date();
    rec.status = 'on-duty';
    await rec.save();
    res.status(201).json(rec);
  })
);

// Check out (computes hours)
router.post(
  '/:id/check-out',
  auth,
  asyncHandler(async (req, res) => {
    const rec = await Attendance.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!rec) return res.status(404).json({ message: 'Record not found' });
    if (!rec.checkIn) return res.status(400).json({ message: 'No check-in on record' });
    rec.checkOut = new Date();
    rec.hours = Math.round(((rec.checkOut - rec.checkIn) / 3600000) * 10) / 10;
    rec.status = rec.hours >= 4 ? 'present' : 'half-day';
    await rec.save();
    res.json(rec);
  })
);

// Mark leave/absent directly
router.post(
  '/mark',
  auth,
  asyncHandler(async (req, res) => {
    const { staffName, status, role } = req.body;
    if (!staffName || !status) return res.status(400).json({ message: 'staffName and status are required' });
    const date = req.body.date || todayStr();
    const rec = await Attendance.findOneAndUpdate(
      { doctorId: req.user._id, staffName, date },
      { status, role: role || 'staff', note: req.body.note },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    res.json(rec);
  })
);

router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const result = await Attendance.findOneAndDelete({ _id: req.params.id, doctorId: req.user._id });
    if (!result) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: 'Record removed' });
  })
);

module.exports = router;
