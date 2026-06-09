const express = require('express');
const Fulfillment = require('../models/Fulfillment');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// List fulfillment records (filters: type, status, destination)
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { type, status, destination } = req.query;
    const query = { doctorId: req.user._id };
    if (type) query.type = type;
    if (status) query.status = status;
    if (destination) query.destination = destination;

    const records = await Fulfillment.find(query)
      .populate('patientId', 'name phone patientId')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json({ records, total: records.length });
  })
);

// Summary — prevented leakage (internal) vs at-risk (external)
router.get(
  '/stats/summary',
  auth,
  asyncHandler(async (req, res) => {
    const doctorId = req.user._id;
    const agg = await Fulfillment.aggregate([
      { $match: { doctorId } },
      { $group: { _id: '$destination', count: { $sum: 1 }, value: { $sum: '$estimatedValue' } } }
    ]);
    const internal = agg.find((a) => a._id === 'internal') || { count: 0, value: 0 };
    const external = agg.find((a) => a._id === 'external') || { count: 0, value: 0 };
    const totalValue = internal.value + external.value;
    const captureRate = totalValue > 0 ? Math.round((internal.value / totalValue) * 100) : 100;

    const [pharmacy, lab, imaging, pending] = await Promise.all([
      Fulfillment.countDocuments({ doctorId, type: 'pharmacy' }),
      Fulfillment.countDocuments({ doctorId, type: 'lab' }),
      Fulfillment.countDocuments({ doctorId, type: 'imaging' }),
      Fulfillment.countDocuments({ doctorId, status: 'routed' })
    ]);

    res.json({
      retainedRevenue: internal.value,
      retainedCount: internal.count,
      leakedRevenue: external.value,
      leakedCount: external.count,
      captureRate,
      byType: { pharmacy, lab, imaging },
      pending
    });
  })
);

// Manual fulfillment entry
router.post(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    if (!req.body.type) return res.status(400).json({ message: 'type is required' });
    const items = req.body.items || [];
    const estimatedValue = req.body.estimatedValue != null
      ? Number(req.body.estimatedValue)
      : items.reduce((s, i) => s + Number(i.estimatedValue || 0) * Number(i.quantity || 1), 0);

    const record = await Fulfillment.create({
      ...req.body,
      estimatedValue,
      doctorId: req.user._id
    });
    const populated = await record.populate('patientId', 'name phone patientId');
    res.status(201).json(populated);
  })
);

// Update (mark fulfilled, or flip destination internal/external)
router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    delete updates.doctorId;
    const record = await Fulfillment.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      updates,
      { new: true, runValidators: true }
    ).populate('patientId', 'name phone patientId');
    if (!record) return res.status(404).json({ message: 'Fulfillment record not found' });
    res.json(record);
  })
);

// Delete
router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const result = await Fulfillment.findOneAndDelete({ _id: req.params.id, doctorId: req.user._id });
    if (!result) return res.status(404).json({ message: 'Fulfillment record not found' });
    res.json({ message: 'Fulfillment record deleted' });
  })
);

module.exports = router;
