const express = require('express');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendMessage, sendAppointmentReminders } = require('../services/whatsappService');

const router = express.Router();

// Generic WhatsApp send
router.post(
  '/send',
  auth,
  asyncHandler(async (req, res) => {
    const { phone, message } = req.body;
    if (!phone || !message) return res.status(400).json({ message: 'phone and message are required' });
    const result = await sendMessage({ to: phone, body: message });
    res.json(result);
  })
);

// Single appointment reminder
router.post(
  '/remind',
  auth,
  asyncHandler(async (req, res) => {
    const { patientName, phone, date, time, doctorName, clinicName } = req.body;
    if (!phone) return res.status(400).json({ message: 'phone is required' });
    const body =
      `Hello ${patientName || 'patient'}! Reminder for your appointment with Dr. ${doctorName || req.user.name} ` +
      `at ${clinicName || req.user.clinicName || 'the clinic'} on ${date} at ${time}.`;
    const result = await sendMessage({ to: phone, body });
    res.json(result);
  })
);

// Send prescription link
router.post(
  '/prescription',
  auth,
  asyncHandler(async (req, res) => {
    const { phone, prescriptionUrl, patientName } = req.body;
    if (!phone || !prescriptionUrl) {
      return res.status(400).json({ message: 'phone and prescriptionUrl are required' });
    }
    const body =
      `Hello ${patientName || ''}! Your prescription from Dr. ${req.user.name} is ready: ${prescriptionUrl}`;
    const result = await sendMessage({ to: phone, body });
    res.json(result);
  })
);

// Manually trigger the reminder job (admin/doctor)
router.post(
  '/run-reminders',
  auth,
  asyncHandler(async (req, res) => {
    const result = await sendAppointmentReminders();
    res.json(result);
  })
);

module.exports = router;
