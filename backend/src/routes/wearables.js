const express = require('express');
const { body, validationResult } = require('express-validator');
const Wearable = require('../models/Wearable');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

const DEFAULTS = {
  'heart-rate': { unit: 'bpm', min: 50, max: 110 },
  glucose: { unit: 'mg/dL', min: 70, max: 180 },
  'blood-pressure': { unit: 'mmHg', min: 90, max: 140, minSecondary: 60, maxSecondary: 90 },
  spo2: { unit: '%', min: 94, max: 100 },
  weight: { unit: 'kg', min: 0, max: 250 },
  steps: { unit: 'steps', min: 0, max: 100000 },
  temperature: { unit: '\u00b0F', min: 97, max: 99.5 }
};

function isOutOfRange(metric, value, secondary, thresholds) {
  const t = thresholds || {};
  if (t.min != null && value < t.min) return true;
  if (t.max != null && value > t.max) return true;
  if (secondary != null) {
    if (t.minSecondary != null && secondary < t.minSecondary) return true;
    if (t.maxSecondary != null && secondary > t.maxSecondary) return true;
  }
  return false;
}

// List devices (filter patientId / alert)
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const query = { doctorId: req.user._id };
    if (req.query.patientId) query.patientId = req.query.patientId;
    if (req.query.alert === 'true') query.alertActive = true;
    const devices = await Wearable.find(query)
      .populate('patientId', 'name phone patientId')
      .sort({ alertActive: -1, updatedAt: -1 });
    res.json({ devices, total: devices.length });
  })
);

// Summary
router.get(
  '/stats/summary',
  auth,
  asyncHandler(async (req, res) => {
    const doctorId = req.user._id;
    const [connected, alerts, total] = await Promise.all([
      Wearable.countDocuments({ doctorId, status: 'connected' }),
      Wearable.countDocuments({ doctorId, alertActive: true }),
      Wearable.countDocuments({ doctorId })
    ]);
    res.json({ connected, alerts, total });
  })
);

// Single
router.get(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const device = await Wearable.findOne({ _id: req.params.id, doctorId: req.user._id })
      .populate('patientId', 'name phone patientId age gender');
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json(device);
  })
);

// Connect a device
router.post(
  '/',
  auth,
  [
    body('patientId').notEmpty().withMessage('patientId is required'),
    body('metric').notEmpty().withMessage('metric is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }
    const patient = await Patient.findOne({ _id: req.body.patientId, doctorId: req.user._id });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const def = DEFAULTS[req.body.metric] || {};
    const device = await Wearable.create({
      doctorId: req.user._id,
      patientId: req.body.patientId,
      patientName: patient.name,
      deviceType: req.body.deviceType || 'apple-watch',
      metric: req.body.metric,
      unit: req.body.unit || def.unit,
      thresholds: req.body.thresholds || {
        min: def.min, max: def.max, minSecondary: def.minSecondary, maxSecondary: def.maxSecondary
      },
      status: 'connected',
      lastSyncedAt: new Date()
    });
    const populated = await device.populate('patientId', 'name phone patientId');
    res.status(201).json(populated);
  })
);

// Ingest a reading (device webhook / manual). Flags out-of-range values.
router.post(
  '/:id/reading',
  auth,
  asyncHandler(async (req, res) => {
    const device = await Wearable.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!device) return res.status(404).json({ message: 'Device not found' });

    const value = Number(req.body.value);
    if (Number.isNaN(value)) return res.status(400).json({ message: 'Numeric value is required' });
    const secondary = req.body.secondaryValue != null ? Number(req.body.secondaryValue) : undefined;
    const flagged = isOutOfRange(device.metric, value, secondary, device.thresholds);

    device.readings.push({ value, secondaryValue: secondary, takenAt: req.body.takenAt || new Date(), flagged, source: req.body.source || 'device' });
    if (device.readings.length > 200) device.readings = device.readings.slice(-200);
    device.lastSyncedAt = new Date();

    if (flagged && !device.alertActive) { device.alertActive = true; device.alertSince = new Date(); }
    if (!flagged) { device.alertActive = false; device.alertSince = undefined; }
    await device.save();

    res.status(201).json({ device, flagged });
  })
);

// Simulate a device sync (pulls a batch of readings) — useful for demos/testing
router.post(
  '/:id/sync',
  auth,
  asyncHandler(async (req, res) => {
    const device = await Wearable.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!device) return res.status(404).json({ message: 'Device not found' });
    const def = DEFAULTS[device.metric] || { min: 0, max: 100 };
    const mid = ((device.thresholds?.min ?? def.min) + (device.thresholds?.max ?? def.max)) / 2;

    let lastFlagged = false;
    for (let i = 0; i < 6; i++) {
      const jitter = (Math.random() - 0.4) * (def.max - def.min) * 0.5;
      const value = Math.round((mid + jitter) * 10) / 10;
      const secondary = device.metric === 'blood-pressure' ? Math.round(mid * 0.65 + jitter * 0.5) : undefined;
      const flagged = isOutOfRange(device.metric, value, secondary, device.thresholds);
      lastFlagged = flagged;
      device.readings.push({ value, secondaryValue: secondary, takenAt: new Date(Date.now() - (6 - i) * 3600000), flagged });
    }
    if (device.readings.length > 200) device.readings = device.readings.slice(-200);
    device.lastSyncedAt = new Date();
    device.alertActive = lastFlagged;
    if (lastFlagged && !device.alertSince) device.alertSince = new Date();
    await device.save();
    res.json({ device, synced: 6 });
  })
);

// Update thresholds / status
router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    delete updates.doctorId;
    delete updates.readings;
    const device = await Wearable.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      updates,
      { new: true, runValidators: true }
    ).populate('patientId', 'name phone patientId');
    if (!device) return res.status(404).json({ message: 'Device not found' });
    res.json(device);
  })
);

// Remove
router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const result = await Wearable.findOneAndDelete({ _id: req.params.id, doctorId: req.user._id });
    if (!result) return res.status(404).json({ message: 'Device not found' });
    res.json({ message: 'Device removed' });
  })
);

module.exports = router;
