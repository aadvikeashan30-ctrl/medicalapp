const express = require('express');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Website = require('../models/Website');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

async function googleUrl(userId) {
  const site = await Website.findOne({ doctorId: userId });
  return site?.googleReviewUrl || process.env.GOOGLE_REVIEW_URL || 'https://g.page/r/your-clinic/review';
}

router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const query = { doctorId: req.user._id };
    if (req.query.status) query.status = req.query.status;
    const reviews = await Review.find(query).sort({ createdAt: -1 }).limit(100);
    res.json({ reviews, total: reviews.length });
  })
);

router.get(
  '/stats/summary',
  auth,
  asyncHandler(async (req, res) => {
    const doctorId = req.user._id;
    const [requested, opened, reviewed] = await Promise.all([
      Review.countDocuments({ doctorId }),
      Review.countDocuments({ doctorId, status: { $in: ['opened', 'reviewed'] } }),
      Review.countDocuments({ doctorId, status: 'reviewed' })
    ]);
    const conversion = requested ? Math.round((reviewed / requested) * 100) : 0;
    res.json({ requested, opened, reviewed, conversion });
  })
);

// Send a review request (WhatsApp/SMS) with the Google review link
router.post(
  '/request',
  auth,
  [body('patientName').trim().notEmpty().withMessage('patientName is required')],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });

    const link = await googleUrl(req.user._id);
    const channel = req.body.channel || 'whatsapp';
    const text = `Hi ${req.body.patientName}, thank you for visiting ${req.user.clinicName || 'our clinic'}! If you had a good experience, please leave us a quick review: ${link}`;

    if (req.body.patientPhone) {
      try {
        if (channel === 'sms') { const { sendSMS } = require('../services/smsService'); await sendSMS({ to: req.body.patientPhone, body: text }); }
        else { const { sendMessage } = require('../services/whatsappService'); await sendMessage({ to: req.body.patientPhone, body: text }); }
      } catch (e) { /* non-critical */ }
    }

    const review = await Review.create({
      doctorId: req.user._id, patientId: req.body.patientId, patientName: req.body.patientName,
      patientPhone: req.body.patientPhone, channel, status: 'requested'
    });
    res.status(201).json({ review, link });
  })
);

// Bulk request to recently-seen patients
router.post(
  '/request/bulk',
  auth,
  asyncHandler(async (req, res) => {
    const { patients = [], channel = 'whatsapp' } = req.body;
    if (!Array.isArray(patients) || patients.length === 0) return res.status(400).json({ message: 'patients are required' });
    const link = await googleUrl(req.user._id);
    const wa = require('../services/whatsappService');
    const sms = require('../services/smsService');
    let sent = 0;
    for (const p of patients) {
      const text = `Hi ${p.name}, thanks for visiting ${req.user.clinicName || 'our clinic'}! Please review us: ${link}`;
      if (p.phone) { try { channel === 'sms' ? await sms.sendSMS({ to: p.phone, body: text }) : await wa.sendMessage({ to: p.phone, body: text }); } catch (e) { /* ignore */ } }
      await Review.create({ doctorId: req.user._id, patientId: p._id, patientName: p.name, patientPhone: p.phone, channel, status: 'requested' });
      sent += 1;
    }
    res.json({ sent, message: `Requested reviews from ${sent} patient(s)` });
  })
);

router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const updates = { status: req.body.status };
    if (req.body.status === 'reviewed') updates.reviewedAt = new Date();
    if (req.body.rating) updates.rating = req.body.rating;
    const review = await Review.findOneAndUpdate({ _id: req.params.id, doctorId: req.user._id }, updates, { new: true });
    if (!review) return res.status(404).json({ message: 'Review request not found' });
    res.json(review);
  })
);

router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const result = await Review.findOneAndDelete({ _id: req.params.id, doctorId: req.user._id });
    if (!result) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Removed' });
  })
);

module.exports = router;
