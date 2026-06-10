const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendSMS, sendBulk, isConfigured } = require('../services/smsService');

const router = express.Router();

// In-memory recent log (per process) — real deployments persist to a collection.
const SMS_LOG = [];

const TEMPLATES = [
  { key: 'reminder', label: 'Appointment Reminder', body: 'Hi {name}, reminder: your appointment is on {date} at {time}. Reply STOP to opt out.' },
  { key: 'follow-up', label: 'Follow-up', body: 'Hi {name}, it\u2019s time for your follow-up visit. Call us to book.' },
  { key: 'reports-ready', label: 'Reports Ready', body: 'Hi {name}, your lab reports are ready for collection.' },
  { key: 'review', label: 'Review Request', body: 'Hi {name}, thanks for visiting! We\u2019d love your feedback: {link}' },
  { key: 'offer', label: 'Health Camp / Offer', body: 'Hi {name}, join our free health camp this weekend. Limited slots!' }
];

router.get('/templates', auth, asyncHandler(async (req, res) => res.json({ templates: TEMPLATES })));

router.get('/status', auth, asyncHandler(async (req, res) => {
  res.json({ configured: isConfigured(), provider: process.env.SMS_PROVIDER || 'stub', sender: process.env.SMS_SENDER_ID || 'CLINIC' });
}));

router.get('/log', auth, asyncHandler(async (req, res) => {
  res.json({ log: SMS_LOG.filter((l) => l.doctorId === String(req.user._id)).slice(0, 50), configured: isConfigured() });
}));

// Send a single SMS
router.post(
  '/send',
  auth,
  [body('to').trim().notEmpty().withMessage('Recipient number is required'), body('body').trim().notEmpty().withMessage('Message body is required')],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    const result = await sendSMS({ to: req.body.to, body: req.body.body });
    SMS_LOG.unshift({ doctorId: String(req.user._id), to: req.body.to, body: req.body.body, status: result.success ? 'sent' : 'failed', stubbed: result.stubbed, at: new Date().toISOString() });
    res.json({ message: result.stubbed ? 'SMS sent (simulated — no SMS provider configured)' : 'SMS sent', result });
  })
);

// Bulk send
router.post(
  '/send-bulk',
  auth,
  asyncHandler(async (req, res) => {
    const { recipients = [], body: msg } = req.body;
    if (!Array.isArray(recipients) || recipients.length === 0) return res.status(400).json({ message: 'recipients are required' });
    if (!msg) return res.status(400).json({ message: 'Message body is required' });
    const result = await sendBulk(recipients, msg);
    recipients.forEach((to) => SMS_LOG.unshift({ doctorId: String(req.user._id), to, body: msg, status: 'sent', at: new Date().toISOString() }));
    res.json({ message: `Sent ${result.sent}/${result.total} messages`, ...result });
  })
);

module.exports = router;
