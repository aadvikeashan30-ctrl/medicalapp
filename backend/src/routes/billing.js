const express = require('express');
const Billing = require('../models/Billing');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { patientId, status, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = { doctorId: req.user._id };

    if (patientId) query.patientId = patientId;
    if (status) query.paymentStatus = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [bills, total] = await Promise.all([
      Billing.find(query)
        .populate('patientId', 'name phone patientId')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10)),
      Billing.countDocuments(query)
    ]);

    res.json({ bills, total, pages: Math.ceil(total / limit), page: parseInt(page, 10) });
  })
);

router.post(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    if (!req.body.patientId) return res.status(400).json({ message: 'patientId is required' });
    if (!Array.isArray(req.body.items) || !req.body.items.length) {
      return res.status(400).json({ message: 'At least one billing item is required' });
    }

    // Recompute server-side to prevent client tampering
    const subtotal = req.body.items.reduce(
      (sum, i) => sum + Number(i.amount || 0) * Number(i.quantity || 1),
      0
    );
    const discount = Number(req.body.discount || 0);
    const tax = Number(req.body.tax || 0);
    const totalAmount = Math.max(0, subtotal - discount + tax);
    const paidAmount = Number(req.body.paidAmount || 0);

    let paymentStatus = 'pending';
    if (paidAmount >= totalAmount && totalAmount > 0) paymentStatus = 'paid';
    else if (paidAmount > 0) paymentStatus = 'partial';

    const bill = await Billing.create({
      ...req.body,
      doctorId: req.user._id,
      subtotal,
      discount,
      tax,
      totalAmount,
      paidAmount,
      paymentStatus
    });

    if (paidAmount > 0) {
      await Patient.findByIdAndUpdate(req.body.patientId, { $inc: { totalBilled: paidAmount } });
    }

    const populated = await bill.populate('patientId', 'name phone patientId');
    res.status(201).json(populated);
  })
);

router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const bill = await Billing.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    const previousPaid = bill.paidAmount;
    Object.assign(bill, req.body);

    // Recompute status if paidAmount changed
    if (typeof req.body.paidAmount === 'number') {
      if (bill.paidAmount >= bill.totalAmount && bill.totalAmount > 0) bill.paymentStatus = 'paid';
      else if (bill.paidAmount > 0) bill.paymentStatus = 'partial';
      else bill.paymentStatus = 'pending';
    }

    await bill.save();

    const delta = bill.paidAmount - previousPaid;
    if (delta !== 0) {
      await Patient.findByIdAndUpdate(bill.patientId, { $inc: { totalBilled: delta } });
    }

    const populated = await bill.populate('patientId', 'name phone patientId');
    res.json(populated);
  })
);

router.get(
  '/revenue/summary',
  auth,
  asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const sumPaid = (since) =>
      Billing.aggregate([
        {
          $match: {
            doctorId: req.user._id,
            ...(since ? { createdAt: { $gte: since } } : {}),
            paymentStatus: { $in: ['paid', 'partial'] }
          }
        },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } }
      ]);

    const [todayR, weekR, monthR, totalR] = await Promise.all([
      sumPaid(today),
      sumPaid(startOfWeek),
      sumPaid(startOfMonth),
      sumPaid(null)
    ]);

    res.json({
      today: todayR[0]?.total || 0,
      week: weekR[0]?.total || 0,
      month: monthR[0]?.total || 0,
      total: totalR[0]?.total || 0
    });
  })
);

module.exports = router;
