/**
 * Subscription Management Routes
 * Handles plan upgrades, billing cycle, usage tracking
 */
const express = require('express');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { getPlanLimits, PLAN_LIMITS } = require('../middleware/planLimits');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const Billing = require('../models/Billing');
const logger = require('../utils/logger');

const router = express.Router();

const PLAN_PRICES = {
  basic: { monthly: 499, quarterly: 1299, half: 2499, yearly: 4499 },
  pro: { monthly: 1499, quarterly: 3999, half: 7499, yearly: 13499 },
  enterprise: { monthly: 4999, quarterly: 13499, half: 24999, yearly: 44999 }
};

// Get current subscription details
router.get(
  '/current',
  auth,
  asyncHandler(async (req, res) => {
    const user = req.user;
    const plan = user.plan || 'free';
    const limits = getPlanLimits(plan);

    // Get current month usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [patientCount, appointmentCount, prescriptionCount, billCount] = await Promise.all([
      Patient.countDocuments({ doctorId: user._id }),
      Appointment.countDocuments({ doctorId: user._id, createdAt: { $gte: startOfMonth } }),
      Prescription.countDocuments({ doctorId: user._id, createdAt: { $gte: startOfMonth } }),
      Billing.countDocuments({ doctorId: user._id, createdAt: { $gte: startOfMonth } })
    ]);

    const isExpired = user.planExpiry && new Date(user.planExpiry) < new Date();
    const daysRemaining = user.planExpiry
      ? Math.max(0, Math.ceil((new Date(user.planExpiry) - new Date()) / (1000 * 60 * 60 * 24)))
      : null;

    res.json({
      plan,
      planExpiry: user.planExpiry,
      isExpired,
      daysRemaining,
      limits,
      usage: {
        patients: { used: patientCount, limit: limits.patients },
        appointments: { used: appointmentCount, limit: limits.appointments },
        prescriptions: { used: prescriptionCount, limit: limits.prescriptions },
        bills: { used: billCount, limit: limits.bills }
      },
      features: {
        ai: limits.ai,
        reports: limits.reports,
        videoConsultation: limits.videoConsultation,
        multiStaff: limits.multiStaff,
        whatsapp: limits.whatsapp !== 0
      }
    });
  })
);

// Get available plans with pricing
router.get('/plans', (req, res) => {
  res.json({
    plans: Object.entries(PLAN_LIMITS).map(([name, limits]) => ({
      name,
      prices: PLAN_PRICES[name] || null,
      limits,
      popular: name === 'pro'
    })),
    prices: PLAN_PRICES
  });
});

// Create upgrade order (Razorpay)
router.post(
  '/upgrade',
  auth,
  asyncHandler(async (req, res) => {
    const { plan, cycle } = req.body; // cycle: monthly, quarterly, half, yearly

    if (!plan || !PLAN_PRICES[plan]) {
      return res.status(400).json({ message: 'Invalid plan. Choose basic, pro, or enterprise.' });
    }
    if (!cycle || !PLAN_PRICES[plan][cycle]) {
      return res.status(400).json({ message: 'Invalid billing cycle.' });
    }

    const amount = PLAN_PRICES[plan][cycle];

    // Check if Razorpay is configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      // Demo mode: directly upgrade
      const durationDays = { monthly: 30, quarterly: 90, half: 180, yearly: 365 }[cycle];
      const expiry = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

      await User.findByIdAndUpdate(req.user._id, {
        plan,
        planExpiry: expiry
      });

      return res.json({
        success: true,
        demo: true,
        plan,
        cycle,
        amount,
        planExpiry: expiry,
        message: `Upgraded to ${plan.toUpperCase()} plan (demo mode)`
      });
    }

    // Create Razorpay order for subscription
    try {
      const Razorpay = require('razorpay');
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
      });

      const order = await razorpay.orders.create({
        amount: amount * 100,
        currency: 'INR',
        receipt: `sub_${req.user._id}_${Date.now()}`,
        notes: {
          userId: req.user._id.toString(),
          plan,
          cycle,
          type: 'subscription_upgrade'
        }
      });

      res.json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: process.env.RAZORPAY_KEY_ID,
        plan,
        cycle
      });
    } catch (err) {
      logger.error(`Subscription order creation failed: ${err.message}`);
      res.status(500).json({ message: 'Failed to create payment order' });
    }
  })
);

// Verify subscription payment and activate plan
router.post(
  '/activate',
  auth,
  asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan, cycle } = req.body;

    if (!plan || !cycle) {
      return res.status(400).json({ message: 'plan and cycle required' });
    }

    // Verify signature if Razorpay configured
    if (process.env.RAZORPAY_KEY_SECRET && razorpay_order_id && razorpay_signature) {
      const expectedSig = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSig !== razorpay_signature) {
        return res.status(400).json({ message: 'Payment verification failed' });
      }
    }

    // Calculate plan expiry
    const durationDays = { monthly: 30, quarterly: 90, half: 180, yearly: 365 }[cycle] || 30;
    const currentExpiry = req.user.planExpiry && new Date(req.user.planExpiry) > new Date()
      ? new Date(req.user.planExpiry)
      : new Date();
    const newExpiry = new Date(currentExpiry.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await User.findByIdAndUpdate(req.user._id, {
      plan,
      planExpiry: newExpiry
    });

    logger.info(`User ${req.user._id} upgraded to ${plan} (${cycle}) until ${newExpiry.toISOString()}`);

    res.json({
      success: true,
      plan,
      cycle,
      planExpiry: newExpiry,
      paymentId: razorpay_payment_id || 'demo',
      message: `Successfully upgraded to ${plan.toUpperCase()} plan!`
    });
  })
);

// Downgrade plan (effective at end of current billing period)
router.post(
  '/downgrade',
  auth,
  asyncHandler(async (req, res) => {
    const { targetPlan } = req.body;
    const hierarchy = ['free', 'basic', 'pro', 'enterprise'];
    const currentLevel = hierarchy.indexOf(req.user.plan || 'free');
    const targetLevel = hierarchy.indexOf(targetPlan || 'free');

    if (targetLevel >= currentLevel) {
      return res.status(400).json({ message: 'Cannot downgrade to same or higher plan. Use upgrade instead.' });
    }

    // Schedule downgrade at expiry
    await User.findByIdAndUpdate(req.user._id, {
      $set: { scheduledDowngrade: targetPlan }
    });

    res.json({
      message: `Plan will be downgraded to ${targetPlan.toUpperCase()} when your current plan expires.`,
      currentPlan: req.user.plan,
      targetPlan,
      effectiveDate: req.user.planExpiry || 'immediately'
    });
  })
);

// Get usage history (for billing page)
router.get(
  '/usage-history',
  auth,
  asyncHandler(async (req, res) => {
    const months = 6;
    const history = [];

    for (let i = 0; i < months; i++) {
      const start = new Date();
      start.setMonth(start.getMonth() - i);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);

      const [patients, appointments, prescriptions, bills] = await Promise.all([
        Patient.countDocuments({ doctorId: req.user._id, createdAt: { $gte: start, $lt: end } }),
        Appointment.countDocuments({ doctorId: req.user._id, createdAt: { $gte: start, $lt: end } }),
        Prescription.countDocuments({ doctorId: req.user._id, createdAt: { $gte: start, $lt: end } }),
        Billing.countDocuments({ doctorId: req.user._id, createdAt: { $gte: start, $lt: end } })
      ]);

      history.push({
        month: start.toISOString().slice(0, 7),
        label: start.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        patients,
        appointments,
        prescriptions,
        bills
      });
    }

    res.json({ history: history.reverse() });
  })
);

module.exports = router;
