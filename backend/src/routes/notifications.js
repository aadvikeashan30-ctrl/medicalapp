/**
 * Notifications Routes — Unified SMS + WhatsApp notification management
 */
const express = require('express');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const smsService = require('../services/smsService');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const logger = require('../utils/logger');

const router = express.Router();

// Get notification status / available channels
router.get('/status', auth, asyncHandler(async (req, res) => {
  const hasTwilio = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
  const hasWhatsApp = !!process.env.TWILIO_WHATSAPP_NUMBER;
  const hasSMS = !!process.env.TWILIO_SMS_NUMBER;

  res.json({
    enabled: hasTwilio,
    channels: {
      whatsapp: hasTwilio && hasWhatsApp,
      sms: hasTwilio && hasSMS,
      stub: !hasTwilio
    },
    primaryChannel: hasTwilio ? (hasWhatsApp ? 'whatsapp' : 'sms') : 'stub'
  });
}));

// Send custom notification to a patient
router.post('/send', auth, asyncHandler(async (req, res) => {
  const { phone, message, channel } = req.body;
  if (!phone || !message) return res.status(400).json({ message: 'phone and message required' });

  const result = await smsService.sendNotification({
    to: phone,
    body: message,
    preferSMS: channel === 'sms'
  });

  res.json(result);
}));

// Send booking confirmation to patient
router.post('/booking-confirmation', auth, asyncHandler(async (req, res) => {
  const { appointmentId } = req.body;
  if (!appointmentId) return res.status(400).json({ message: 'appointmentId required' });

  const apt = await Appointment.findOne({ _id: appointmentId, doctorId: req.user._id })
    .populate('patientId', 'name phone');
  if (!apt) return res.status(404).json({ message: 'Appointment not found' });
  if (!apt.patientId?.phone) return res.status(400).json({ message: 'Patient has no phone number' });

  const result = await smsService.sendBookingConfirmation({
    patientName: apt.patientId.name,
    patientPhone: apt.patientId.phone,
    doctorName: req.user.name,
    date: apt.date.toLocaleDateString('en-IN'),
    timeSlot: apt.timeSlot,
    tokenNumber: apt.tokenNumber
  });

  res.json({ ...result, patient: apt.patientId.name });
}));

// Send reminders for tomorrow's appointments (manual trigger)
router.post('/send-reminders', auth, asyncHandler(async (req, res) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const appointments = await Appointment.find({
    doctorId: req.user._id,
    date: { $gte: tomorrow, $lt: dayAfter },
    status: { $in: ['scheduled', 'confirmed'] },
    reminderSent: false
  })
    .populate('patientId', 'name phone')
    .populate('doctorId', 'name clinicName');

  let sent = 0;
  let failed = 0;

  for (const apt of appointments) {
    if (!apt.patientId?.phone) continue;

    const result = await smsService.sendAppointmentReminderSMS({
      patientName: apt.patientId.name,
      patientPhone: apt.patientId.phone,
      doctorName: req.user.name,
      clinicName: req.user.clinicName || '',
      date: apt.date.toLocaleDateString('en-IN'),
      timeSlot: apt.timeSlot
    });

    if (result.success) {
      apt.reminderSent = true;
      apt.reminderSentAt = new Date();
      await apt.save();
      sent++;
    } else {
      failed++;
    }
  }

  res.json({ processed: appointments.length, sent, failed });
}));

// Bulk SMS to all patients (e.g., clinic closure notice)
router.post('/bulk', auth, asyncHandler(async (req, res) => {
  const { message, filter } = req.body;
  if (!message) return res.status(400).json({ message: 'message required' });

  const query = { doctorId: req.user._id, isActive: true, phone: { $exists: true, $ne: '' } };
  if (filter === 'recent') {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    query.lastVisit = { $gte: thirtyDaysAgo };
  }

  const patients = await Patient.find(query).select('name phone').limit(100);
  let sent = 0;

  for (const patient of patients) {
    const personalizedMsg = message.replace('{name}', patient.name);
    const result = await smsService.sendNotification({ to: patient.phone, body: personalizedMsg });
    if (result.success) sent++;
  }

  res.json({ totalPatients: patients.length, sent, message: `Sent to ${sent}/${patients.length} patients` });
}));

// Get notification history/log (placeholder — in production use a NotificationLog model)
router.get('/log', auth, asyncHandler(async (req, res) => {
  // For now, return reminders sent today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sentToday = await Appointment.countDocuments({
    doctorId: req.user._id,
    reminderSent: true,
    reminderSentAt: { $gte: today }
  });

  res.json({
    today: { remindersSent: sentToday },
    channels: {
      whatsapp: !!process.env.TWILIO_WHATSAPP_NUMBER,
      sms: !!process.env.TWILIO_SMS_NUMBER
    }
  });
}));

module.exports = router;
