const express = require('express');
const { body, validationResult } = require('express-validator');
const SOSAlert = require('../models/SOSAlert');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const query = { doctorId: req.user._id };
    if (req.query.status) query.status = req.query.status;
    const alerts = await SOSAlert.find(query).sort({ status: 1, createdAt: -1 }).limit(100);
    res.json({ alerts, total: alerts.length });
  })
);

router.get(
  '/stats/summary',
  auth,
  asyncHandler(async (req, res) => {
    const doctorId = req.user._id;
    const [active, resolved, total] = await Promise.all([
      SOSAlert.countDocuments({ doctorId, status: { $in: ['active', 'acknowledged', 'dispatched'] } }),
      SOSAlert.countDocuments({ doctorId, status: 'resolved' }),
      SOSAlert.countDocuments({ doctorId })
    ]);
    res.json({ active, resolved, total });
  })
);

router.post(
  '/',
  auth,
  [body('patientName').trim().notEmpty().withMessage('patientName is required')],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    const alert = await SOSAlert.create({ ...req.body, doctorId: req.user._id });

    // Best-effort notify the patient that help is coming
    if (alert.patientPhone) {
      try {
        const { sendMessage } = require('../services/whatsappService');
        await sendMessage({ to: alert.patientPhone, body: `Your emergency alert has been received by ${req.user.clinicName || 'the clinic'}. Help is being arranged. Stay calm.` });
      } catch (e) { /* non-critical */ }
    }
    res.status(201).json(alert);
  })
);

router.put(
  '/:id/status',
  auth,
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const updates = { status };
    if (status === 'acknowledged') updates.acknowledgedAt = new Date();
    if (status === 'resolved') updates.resolvedAt = new Date();
    const alert = await SOSAlert.findOneAndUpdate({ _id: req.params.id, doctorId: req.user._id }, updates, { new: true });
    if (!alert) return res.status(404).json({ message: 'Alert not found' });
    res.json(alert);
  })
);

router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const result = await SOSAlert.findOneAndDelete({ _id: req.params.id, doctorId: req.user._id });
    if (!result) return res.status(404).json({ message: 'Alert not found' });
    res.json({ message: 'Alert removed' });
  })
);

module.exports = router;
