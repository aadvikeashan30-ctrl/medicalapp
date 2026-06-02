const express = require('express');
const { body, validationResult } = require('express-validator');
const { Referral, ReferralSettings } = require('../models/Referral');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// ========== REFERRAL SETTINGS ==========

// Get referral settings
router.get(
  '/settings',
  auth,
  asyncHandler(async (req, res) => {
    let settings = await ReferralSettings.findOne({ doctorId: req.user._id });
    if (!settings) {
      settings = await ReferralSettings.create({ doctorId: req.user._id });
    }
    res.json(settings);
  })
);

// Update referral settings
router.put(
  '/settings',
  auth,
  asyncHandler(async (req, res) => {
    const settings = await ReferralSettings.findOneAndUpdate(
      { doctorId: req.user._id },
      { ...req.body, doctorId: req.user._id },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(settings);
  })
);

// ========== REFERRALS ==========

// List all referrals
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { doctorId: req.user._id };
    if (status) query.status = status;

    const [referrals, total] = await Promise.all([
      Referral.find(query)
        .populate('referrerId', 'name phone patientId')
        .populate('referredPatientId', 'name phone')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10)),
      Referral.countDocuments(query)
    ]);

    res.json({ referrals, total, pages: Math.ceil(total / limit) });
  })
);

// Create referral
router.post(
  '/',
  auth,
  [
    body('referrerId').notEmpty().withMessage('Referrer ID is required'),
    body('referredName').trim().notEmpty().withMessage('Referred person name is required'),
    body('referredPhone').trim().notEmpty().withMessage('Referred person phone is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }

    // Get referral settings for reward values
    const settings = await ReferralSettings.findOne({ doctorId: req.user._id });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (settings?.expiryDays || 30));

    const referral = await Referral.create({
      ...req.body,
      doctorId: req.user._id,
      rewardType: settings?.referrerReward?.type || 'discount',
      rewardValue: settings?.referredReward?.value || 10,
      referrerRewardValue: settings?.referrerReward?.value || 10,
      expiresAt
    });

    res.status(201).json(referral);
  })
);

// Update referral status
router.patch(
  '/:id/status',
  auth,
  asyncHandler(async (req, res) => {
    const { status, referredPatientId } = req.body;
    const updates = { status };

    if (status === 'registered') {
      updates.registeredAt = new Date();
      if (referredPatientId) updates.referredPatientId = referredPatientId;
    }
    if (status === 'visited') updates.firstVisitAt = new Date();
    if (status === 'rewarded') {
      updates.rewardedAt = new Date();
      updates.referrerRewarded = true;
      updates.referredRewarded = true;
    }

    const referral = await Referral.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      updates,
      { new: true }
    );
    if (!referral) return res.status(404).json({ message: 'Referral not found' });
    res.json(referral);
  })
);

// Get referral stats
router.get(
  '/stats',
  auth,
  asyncHandler(async (req, res) => {
    const [total, pending, successful, rewards] = await Promise.all([
      Referral.countDocuments({ doctorId: req.user._id }),
      Referral.countDocuments({ doctorId: req.user._id, status: 'pending' }),
      Referral.countDocuments({ doctorId: req.user._id, status: { $in: ['visited', 'rewarded'] } }),
      Referral.aggregate([
        { $match: { doctorId: req.user._id, status: 'rewarded' } },
        { $group: { _id: null, totalRewards: { $sum: '$rewardValue' } } }
      ])
    ]);

    res.json({
      totalReferrals: total,
      pendingReferrals: pending,
      successfulReferrals: successful,
      conversionRate: total > 0 ? Math.round((successful / total) * 100) : 0,
      totalRewardsGiven: rewards[0]?.totalRewards || 0
    });
  })
);

// Validate referral code (public)
router.get(
  '/validate/:code',
  asyncHandler(async (req, res) => {
    const referral = await Referral.findOne({
      referralCode: req.params.code,
      status: 'pending',
      expiresAt: { $gt: new Date() }
    });

    if (!referral) {
      return res.json({ valid: false, message: 'Invalid or expired referral code' });
    }

    res.json({
      valid: true,
      referralCode: referral.referralCode,
      rewardType: referral.rewardType,
      rewardValue: referral.rewardValue
    });
  })
);

module.exports = router;
