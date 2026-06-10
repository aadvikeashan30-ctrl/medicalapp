const express = require('express');
const { body, validationResult } = require('express-validator');
const Payroll = require('../models/Payroll');
const Attendance = require('../models/Attendance');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const query = { doctorId: req.user._id };
    if (req.query.month) query.month = req.query.month;
    if (req.query.status) query.status = req.query.status;
    const slips = await Payroll.find(query).sort({ month: -1, staffName: 1 });
    res.json({ slips, total: slips.length });
  })
);

router.get(
  '/stats/summary',
  auth,
  asyncHandler(async (req, res) => {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const slips = await Payroll.find({ doctorId: req.user._id, month });
    const totalPayout = slips.reduce((s, p) => s + (p.netPay || 0), 0);
    const paid = slips.filter((p) => p.status === 'paid').length;
    const pending = slips.filter((p) => p.status !== 'paid').length;
    res.json({ month, totalPayout, paid, pending, count: slips.length });
  })
);

router.post(
  '/',
  auth,
  [
    body('staffName').trim().notEmpty().withMessage('staffName is required'),
    body('month').trim().notEmpty().withMessage('month (YYYY-MM) is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });

    // Auto-count days present from attendance for the month
    let daysPresent = req.body.daysPresent;
    if (daysPresent == null) {
      daysPresent = await Attendance.countDocuments({
        doctorId: req.user._id, staffName: req.body.staffName,
        date: { $regex: `^${req.body.month}` }, status: { $in: ['present', 'on-duty', 'half-day'] }
      });
    }
    const slip = await Payroll.create({ ...req.body, daysPresent, doctorId: req.user._id });
    res.status(201).json(slip);
  })
);

router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    delete updates.doctorId;
    if (updates.status === 'paid') updates.paidAt = new Date();
    const slip = await Payroll.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!slip) return res.status(404).json({ message: 'Slip not found' });
    Object.assign(slip, updates);
    await slip.save(); // re-computes netPay
    res.json(slip);
  })
);

router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const result = await Payroll.findOneAndDelete({ _id: req.params.id, doctorId: req.user._id });
    if (!result) return res.status(404).json({ message: 'Slip not found' });
    res.json({ message: 'Slip removed' });
  })
);

module.exports = router;
