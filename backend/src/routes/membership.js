const express = require('express');
const { body, validationResult } = require('express-validator');
const { MembershipPlan, MembershipSubscription } = require('../models/Membership');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// ========== MEMBERSHIP PLANS ==========

// List all plans
router.get(
  '/plans',
  auth,
  asyncHandler(async (req, res) => {
    const plans = await MembershipPlan.find({ doctorId: req.user._id, isActive: true })
      .sort({ price: 1 });
    res.json(plans);
  })
);

// Get single plan
router.get(
  '/plans/:id',
  auth,
  asyncHandler(async (req, res) => {
    const plan = await MembershipPlan.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(plan);
  })
);

// Create plan
router.post(
  '/plans',
  auth,
  [
    body('planName').trim().notEmpty().withMessage('Plan name is required'),
    body('duration').isNumeric().withMessage('Duration is required'),
    body('price').isNumeric().withMessage('Price is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }

    const plan = await MembershipPlan.create({ ...req.body, doctorId: req.user._id });
    res.status(201).json(plan);
  })
);

// Update plan
router.put(
  '/plans/:id',
  auth,
  asyncHandler(async (req, res) => {
    const plan = await MembershipPlan.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json(plan);
  })
);

// Delete plan (soft)
router.delete(
  '/plans/:id',
  auth,
  asyncHandler(async (req, res) => {
    const plan = await MembershipPlan.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    res.json({ message: 'Plan deleted' });
  })
);

// ========== SUBSCRIPTIONS ==========

// List all active subscriptions
router.get(
  '/subscriptions',
  auth,
  asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const query = { doctorId: req.user._id };
    if (status) query.status = status;

    const [subscriptions, total] = await Promise.all([
      MembershipSubscription.find(query)
        .populate('patientId', 'name phone patientId')
        .populate('planId', 'planName duration price')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10)),
      MembershipSubscription.countDocuments(query)
    ]);

    res.json({ subscriptions, total, pages: Math.ceil(total / limit) });
  })
);

// Get subscription for a patient
router.get(
  '/subscriptions/patient/:patientId',
  auth,
  asyncHandler(async (req, res) => {
    const subscription = await MembershipSubscription.findOne({
      patientId: req.params.patientId,
      doctorId: req.user._id,
      status: 'active'
    }).populate('planId');
    res.json(subscription || { active: false });
  })
);

// Create subscription
router.post(
  '/subscriptions',
  auth,
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('planId').notEmpty().withMessage('Plan ID is required'),
    body('amountPaid').isNumeric().withMessage('Amount paid is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }

    // Get plan details to calculate end date
    const plan = await MembershipPlan.findById(req.body.planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + plan.duration);

    const subscription = await MembershipSubscription.create({
      ...req.body,
      doctorId: req.user._id,
      startDate,
      endDate,
      status: 'active'
    });

    res.status(201).json(subscription);
  })
);

// Cancel subscription
router.patch(
  '/subscriptions/:id/cancel',
  auth,
  asyncHandler(async (req, res) => {
    const subscription = await MembershipSubscription.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      { status: 'cancelled' },
      { new: true }
    );
    if (!subscription) return res.status(404).json({ message: 'Subscription not found' });
    res.json(subscription);
  })
);

// Get membership stats
router.get(
  '/stats',
  auth,
  asyncHandler(async (req, res) => {
    const [activeCount, totalRevenue, expiringSoon] = await Promise.all([
      MembershipSubscription.countDocuments({ doctorId: req.user._id, status: 'active' }),
      MembershipSubscription.aggregate([
        { $match: { doctorId: req.user._id } },
        { $group: { _id: null, total: { $sum: '$amountPaid' } } }
      ]),
      MembershipSubscription.countDocuments({
        doctorId: req.user._id,
        status: 'active',
        endDate: { $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) }
      })
    ]);

    res.json({
      activeMembers: activeCount,
      totalRevenue: totalRevenue[0]?.total || 0,
      expiringSoon
    });
  })
);

module.exports = router;
