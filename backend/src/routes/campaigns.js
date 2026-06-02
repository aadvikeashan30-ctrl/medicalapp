const express = require('express');
const { body, validationResult } = require('express-validator');
const { Campaign, ReviewRequest } = require('../models/Campaign');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// ========== WHATSAPP MARKETING CAMPAIGNS ==========

// List campaigns
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { status, type, page = 1, limit = 20 } = req.query;
    const query = { doctorId: req.user._id };
    if (status) query.status = status;
    if (type) query.type = type;

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10)),
      Campaign.countDocuments(query)
    ]);

    res.json({ campaigns, total, pages: Math.ceil(total / limit) });
  })
);

// Get single campaign
router.get(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const campaign = await Campaign.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json(campaign);
  })
);

// Create campaign
router.post(
  '/',
  auth,
  [
    body('name').trim().notEmpty().withMessage('Campaign name is required'),
    body('type').notEmpty().withMessage('Campaign type is required'),
    body('message').trim().notEmpty().withMessage('Message is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }

    // Calculate recipient count
    let totalRecipients = 0;
    if (req.body.audience?.type === 'all') {
      totalRecipients = await Patient.countDocuments({ doctorId: req.user._id, isActive: true });
    } else if (req.body.audience?.type === 'custom') {
      totalRecipients = req.body.audience.customPatientIds?.length || 0;
    }

    const campaign = await Campaign.create({
      ...req.body,
      doctorId: req.user._id,
      totalRecipients
    });

    res.status(201).json(campaign);
  })
);

// Update campaign
router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const campaign = await Campaign.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    if (campaign.status === 'sent' || campaign.status === 'sending') {
      return res.status(400).json({ message: 'Cannot edit a campaign that has been sent' });
    }

    const updated = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  })
);

// Send/Schedule campaign
router.post(
  '/:id/send',
  auth,
  asyncHandler(async (req, res) => {
    const campaign = await Campaign.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      return res.status(400).json({ message: 'Campaign cannot be sent in its current state' });
    }

    const { scheduleAt } = req.body;
    if (scheduleAt) {
      campaign.scheduledAt = new Date(scheduleAt);
      campaign.status = 'scheduled';
    } else {
      campaign.status = 'sending';
      campaign.sentAt = new Date();
      // Trigger actual sending (would be handled by a background job)
    }

    await campaign.save();
    res.json(campaign);
  })
);

// Cancel campaign
router.post(
  '/:id/cancel',
  auth,
  asyncHandler(async (req, res) => {
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id, status: { $in: ['draft', 'scheduled'] } },
      { status: 'cancelled' },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ message: 'Campaign not found or cannot be cancelled' });
    res.json(campaign);
  })
);

// Campaign stats
router.get(
  '/analytics/summary',
  auth,
  asyncHandler(async (req, res) => {
    const stats = await Campaign.aggregate([
      { $match: { doctorId: req.user._id } },
      {
        $group: {
          _id: null,
          totalCampaigns: { $sum: 1 },
          totalSent: { $sum: '$totalRecipients' },
          totalDelivered: { $sum: '$delivered' },
          totalRead: { $sum: '$read' },
          totalReplied: { $sum: '$replied' },
          totalCost: { $sum: '$totalCost' }
        }
      }
    ]);

    res.json(stats[0] || { totalCampaigns: 0, totalSent: 0, totalDelivered: 0, totalRead: 0, totalReplied: 0, totalCost: 0 });
  })
);

// ========== GOOGLE REVIEW AUTOMATION ==========

// List review requests
router.get(
  '/reviews/list',
  auth,
  asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { doctorId: req.user._id };
    if (status) query.status = status;

    const [requests, total] = await Promise.all([
      ReviewRequest.find(query)
        .populate('patientId', 'name phone')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10)),
      ReviewRequest.countDocuments(query)
    ]);

    res.json({ requests, total, pages: Math.ceil(total / limit) });
  })
);

// Send review request
router.post(
  '/reviews/send',
  auth,
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('googleReviewUrl').trim().notEmpty().withMessage('Google review URL is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }

    const request = await ReviewRequest.create({
      ...req.body,
      doctorId: req.user._id,
      sentAt: new Date(),
      status: 'sent'
    });

    // TODO: Trigger actual WhatsApp/SMS message with review link

    res.status(201).json(request);
  })
);

// Bulk send review requests (after appointments)
router.post(
  '/reviews/bulk-send',
  auth,
  asyncHandler(async (req, res) => {
    const { patientIds, googleReviewUrl, sentVia = 'whatsapp' } = req.body;

    if (!patientIds || patientIds.length === 0) {
      return res.status(400).json({ message: 'Patient IDs are required' });
    }

    const requests = await ReviewRequest.insertMany(
      patientIds.map((pid) => ({
        doctorId: req.user._id,
        patientId: pid,
        googleReviewUrl,
        sentVia,
        sentAt: new Date(),
        status: 'sent'
      }))
    );

    res.status(201).json({ sent: requests.length, requests });
  })
);

// Review stats
router.get(
  '/reviews/stats',
  auth,
  asyncHandler(async (req, res) => {
    const [total, sent, clicked, reviewed, avgRating] = await Promise.all([
      ReviewRequest.countDocuments({ doctorId: req.user._id }),
      ReviewRequest.countDocuments({ doctorId: req.user._id, status: 'sent' }),
      ReviewRequest.countDocuments({ doctorId: req.user._id, status: 'clicked' }),
      ReviewRequest.countDocuments({ doctorId: req.user._id, status: 'reviewed' }),
      ReviewRequest.aggregate([
        { $match: { doctorId: req.user._id, rating: { $exists: true } } },
        { $group: { _id: null, avg: { $avg: '$rating' } } }
      ])
    ]);

    res.json({
      totalRequests: total,
      sentRequests: sent,
      clickedRequests: clicked,
      reviewedRequests: reviewed,
      responseRate: total > 0 ? Math.round((reviewed / total) * 100) : 0,
      averageRating: avgRating[0]?.avg?.toFixed(1) || 'N/A'
    });
  })
);

module.exports = router;
