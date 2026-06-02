const express = require('express');
const LabTest = require('../models/LabTest');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// List lab tests (with optional filters)
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { patientId, status, limit = 50, skip = 0 } = req.query;
    const query = { doctorId: req.user._id };
    if (patientId) query.patientId = patientId;
    if (status) query.status = status;

    const [tests, total] = await Promise.all([
      LabTest.find(query)
        .populate('patientId', 'name phone')
        .sort({ createdAt: -1 })
        .skip(parseInt(skip, 10))
        .limit(parseInt(limit, 10)),
      LabTest.countDocuments(query)
    ]);

    res.json({ tests, total });
  })
);

// Get single lab test
router.get(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const test = await LabTest.findOne({ _id: req.params.id, doctorId: req.user._id })
      .populate('patientId', 'name phone age gender');
    if (!test) return res.status(404).json({ message: 'Lab test not found' });
    res.json(test);
  })
);

// Create lab test order
router.post(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { patientId, name, category, instructions, appointmentId } = req.body;
    if (!patientId || !name) {
      return res.status(400).json({ message: 'patientId and name are required' });
    }
    const test = await LabTest.create({
      doctorId: req.user._id,
      patientId,
      name,
      category: category || '',
      instructions: instructions || '',
      appointmentId: appointmentId || undefined
    });
    const populated = await test.populate('patientId', 'name phone');
    res.status(201).json(populated);
  })
);

// Update lab test (status, results, report)
router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const updates = {};
    const allowed = ['status', 'resultSummary', 'reportUrl', 'instructions', 'category', 'name'];
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    if (updates.status === 'reported' && !updates.resultedAt) {
      updates.resultedAt = new Date();
    }

    const test = await LabTest.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      updates,
      { new: true, runValidators: true }
    ).populate('patientId', 'name phone');

    if (!test) return res.status(404).json({ message: 'Lab test not found' });
    res.json(test);
  })
);

// Delete lab test
router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const result = await LabTest.findOneAndDelete({ _id: req.params.id, doctorId: req.user._id });
    if (!result) return res.status(404).json({ message: 'Lab test not found' });
    res.json({ message: 'Lab test deleted' });
  })
);

// Stats for dashboard
router.get(
  '/stats/summary',
  auth,
  asyncHandler(async (req, res) => {
    const doctorId = req.user._id;
    const [total, ordered, reported] = await Promise.all([
      LabTest.countDocuments({ doctorId }),
      LabTest.countDocuments({ doctorId, status: 'ordered' }),
      LabTest.countDocuments({ doctorId, status: 'reported' })
    ]);
    res.json({ total, ordered, reported, pending: total - reported });
  })
);

module.exports = router;
