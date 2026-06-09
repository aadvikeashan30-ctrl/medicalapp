const express = require('express');
const { body, validationResult } = require('express-validator');
const RPMRecord = require('../models/RPMRecord');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Reference reimbursement amounts (configurable; shown as estimates)
const CODE_RATES = {
  '99453': { rate: 1500, label: 'Initial device setup & education' },
  '99454': { rate: 4800, label: 'Device supply + daily readings (16+ days)' },
  '99457': { rate: 4000, label: 'First 20 min monitoring / month' },
  '99458': { rate: 3200, label: 'Each additional 20 min / month' }
};

function currentMonthKey(d = new Date()) {
  return d.toISOString().slice(0, 7);
}

// Compute billable codes for the current calendar month
function computeCodes(record) {
  const month = currentMonthKey();
  const monthLogs = (record.logs || []).filter((l) => new Date(l.date).toISOString().slice(0, 7) === month);
  const minutes = monthLogs.reduce((s, l) => s + (l.minutes || 0), 0);
  const days = new Set(monthLogs.filter((l) => (l.readings || 0) > 0).map((l) => new Date(l.date).toISOString().slice(0, 10))).size;

  const codes = [];
  if (!record.setupBilled) codes.push({ code: '99453', ...CODE_RATES['99453'], units: 1, eligible: true });
  if (days >= 16) codes.push({ code: '99454', ...CODE_RATES['99454'], units: 1, eligible: true });
  if (minutes >= 20) codes.push({ code: '99457', ...CODE_RATES['99457'], units: 1, eligible: true });
  if (minutes >= 40) {
    const extra = Math.floor((minutes - 20) / 20);
    if (extra > 0) codes.push({ code: '99458', ...CODE_RATES['99458'], units: extra, eligible: true });
  }
  const estimatedReimbursement = codes.reduce((s, c) => s + c.rate * c.units, 0);
  return { month, minutes, daysTransmitted: days, codes, estimatedReimbursement };
}

// List enrolled patients
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { status } = req.query;
    const query = { doctorId: req.user._id };
    if (status) query.status = status;
    const records = await RPMRecord.find(query)
      .populate('patientId', 'name phone patientId')
      .sort({ updatedAt: -1 });
    const withCodes = records.map((r) => ({ ...r.toObject(), billing: computeCodes(r) }));
    res.json({ records: withCodes, total: withCodes.length });
  })
);

// Summary stats
router.get(
  '/stats/summary',
  auth,
  asyncHandler(async (req, res) => {
    const records = await RPMRecord.find({ doctorId: req.user._id });
    const active = records.filter((r) => r.status === 'active').length;
    let totalMinutes = 0;
    let estimatedReimbursement = 0;
    let readyToBill = 0;
    records.forEach((r) => {
      const c = computeCodes(r);
      totalMinutes += c.minutes;
      estimatedReimbursement += c.estimatedReimbursement;
      if (c.codes.length > 0) readyToBill += 1;
    });
    res.json({ enrolled: records.length, active, totalMinutes, estimatedReimbursement, readyToBill });
  })
);

// Single record with codes
router.get(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const record = await RPMRecord.findOne({ _id: req.params.id, doctorId: req.user._id })
      .populate('patientId', 'name phone patientId age gender');
    if (!record) return res.status(404).json({ message: 'RPM record not found' });
    res.json({ ...record.toObject(), billing: computeCodes(record) });
  })
);

// Enroll a patient
router.post(
  '/',
  auth,
  [body('patientId').notEmpty().withMessage('patientId is required')],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }
    const patient = await Patient.findOne({ _id: req.body.patientId, doctorId: req.user._id });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const record = await RPMRecord.create({
      doctorId: req.user._id,
      patientId: req.body.patientId,
      patientName: patient.name,
      deviceType: req.body.deviceType || 'bp-cuff',
      condition: req.body.condition
    });
    const populated = await record.populate('patientId', 'name phone patientId');
    res.status(201).json({ ...populated.toObject(), billing: computeCodes(populated) });
  })
);

// Log monitoring time / readings
router.post(
  '/:id/log',
  auth,
  asyncHandler(async (req, res) => {
    const record = await RPMRecord.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!record) return res.status(404).json({ message: 'RPM record not found' });
    record.logs.push({
      date: req.body.date || new Date(),
      minutes: Number(req.body.minutes || 0),
      readings: Number(req.body.readings || 0),
      note: req.body.note
    });
    await record.save();
    await record.populate('patientId', 'name phone patientId');
    res.status(201).json({ ...record.toObject(), billing: computeCodes(record) });
  })
);

// Mark setup code (99453) as billed
router.post(
  '/:id/bill-setup',
  auth,
  asyncHandler(async (req, res) => {
    const record = await RPMRecord.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      { setupBilled: true },
      { new: true }
    ).populate('patientId', 'name phone patientId');
    if (!record) return res.status(404).json({ message: 'RPM record not found' });
    res.json({ ...record.toObject(), billing: computeCodes(record) });
  })
);

// Update (status, condition, device)
router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    delete updates.doctorId;
    delete updates.logs;
    const record = await RPMRecord.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      updates,
      { new: true, runValidators: true }
    ).populate('patientId', 'name phone patientId');
    if (!record) return res.status(404).json({ message: 'RPM record not found' });
    res.json({ ...record.toObject(), billing: computeCodes(record) });
  })
);

// Delete
router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const result = await RPMRecord.findOneAndDelete({ _id: req.params.id, doctorId: req.user._id });
    if (!result) return res.status(404).json({ message: 'RPM record not found' });
    res.json({ message: 'RPM enrollment removed' });
  })
);

module.exports = router;
