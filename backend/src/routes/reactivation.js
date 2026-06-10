const express = require('express');
const Patient = require('../models/Patient');
const ReactivationLog = require('../models/ReactivationLog');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Lapsed patients = no visit in `days` (default 120). Excludes recently contacted.
router.get(
  '/lapsed',
  auth,
  asyncHandler(async (req, res) => {
    const days = parseInt(req.query.days, 10) || 120;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const patients = await Patient.find({
      doctorId: req.user._id,
      isActive: true,
      $or: [{ lastVisit: { $lt: cutoff } }, { lastVisit: { $exists: false } }]
    })
      .sort({ lastVisit: 1 })
      .limit(100)
      .select('name phone patientId lastVisit totalVisits totalBilled');

    // Annotate with most recent outreach
    const ids = patients.map((p) => p._id);
    const logs = await ReactivationLog.find({ doctorId: req.user._id, patientId: { $in: ids } }).sort({ createdAt: -1 });
    const lastByPatient = {};
    logs.forEach((l) => { if (!lastByPatient[l.patientId]) lastByPatient[l.patientId] = l; });

    const result = patients.map((p) => ({
      _id: p._id, name: p.name, phone: p.phone, patientId: p.patientId,
      lastVisit: p.lastVisit, totalVisits: p.totalVisits, totalBilled: p.totalBilled,
      daysSinceVisit: p.lastVisit ? Math.floor((Date.now() - new Date(p.lastVisit)) / 86400000) : null,
      lastOutreach: lastByPatient[p._id] ? { status: lastByPatient[p._id].status, at: lastByPatient[p._id].contactedAt } : null
    }));
    res.json({ patients: result, total: result.length, thresholdDays: days });
  })
);

router.get(
  '/stats/summary',
  auth,
  asyncHandler(async (req, res) => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 120);
    const [lapsed, contacted, rebooked] = await Promise.all([
      Patient.countDocuments({ doctorId: req.user._id, isActive: true, $or: [{ lastVisit: { $lt: cutoff } }, { lastVisit: { $exists: false } }] }),
      ReactivationLog.countDocuments({ doctorId: req.user._id, status: 'contacted' }),
      ReactivationLog.countDocuments({ doctorId: req.user._id, status: 'rebooked' })
    ]);
    const potentialRevenue = lapsed * (req.user.consultationFee || 500);
    res.json({ lapsed, contacted, rebooked, potentialRevenue });
  })
);

// Send a reactivation message (and log it)
router.post(
  '/reach-out',
  auth,
  asyncHandler(async (req, res) => {
    const { patientId, channel = 'whatsapp', message } = req.body;
    if (!patientId) return res.status(400).json({ message: 'patientId is required' });
    const patient = await Patient.findOne({ _id: patientId, doctorId: req.user._id });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const body = message || `Hi ${patient.name}, it's been a while since your last visit to ${req.user.clinicName || 'our clinic'}. We'd love to see you for a check-up. Reply to book a slot!`;
    if (patient.phone) {
      try { const { sendMessage } = require('../services/whatsappService'); await sendMessage({ to: patient.phone, body }); } catch (e) { /* non-critical */ }
    }
    const log = await ReactivationLog.create({
      doctorId: req.user._id, patientId, patientName: patient.name, patientPhone: patient.phone,
      channel, message: body, status: 'contacted'
    });
    res.status(201).json(log);
  })
);

// Bulk outreach to several patients
router.post(
  '/reach-out/bulk',
  auth,
  asyncHandler(async (req, res) => {
    const { patientIds = [] } = req.body;
    if (!Array.isArray(patientIds) || patientIds.length === 0) return res.status(400).json({ message: 'patientIds required' });
    const patients = await Patient.find({ _id: { $in: patientIds }, doctorId: req.user._id });
    const { sendMessage } = require('../services/whatsappService');
    let sent = 0;
    for (const p of patients) {
      const body = `Hi ${p.name}, it's been a while since your last visit to ${req.user.clinicName || 'our clinic'}. Reply to book a check-up!`;
      if (p.phone) { try { await sendMessage({ to: p.phone, body }); } catch (e) { /* ignore */ } }
      await ReactivationLog.create({ doctorId: req.user._id, patientId: p._id, patientName: p.name, patientPhone: p.phone, channel: 'whatsapp', message: body, status: 'contacted' });
      sent += 1;
    }
    res.json({ sent, message: `Reached out to ${sent} patient(s)` });
  })
);

router.put(
  '/log/:id',
  auth,
  asyncHandler(async (req, res) => {
    const log = await ReactivationLog.findOneAndUpdate({ _id: req.params.id, doctorId: req.user._id }, { status: req.body.status }, { new: true });
    if (!log) return res.status(404).json({ message: 'Log not found' });
    res.json(log);
  })
);

module.exports = router;
