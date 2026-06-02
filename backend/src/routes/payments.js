/**
 * Payment Routes — Razorpay integration for online consultations
 * 
 * Env vars (optional — runs in demo/cash mode when blank):
 *   RAZORPAY_KEY_ID=rzp_test_...
 *   RAZORPAY_KEY_SECRET=...
 *   RAZORPAY_WEBHOOK_SECRET=...
 */
const express = require('express');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const Appointment = require('../models/Appointment');
const Billing = require('../models/Billing');
const Patient = require('../models/Patient');
const logger = require('../utils/logger');

const router = express.Router();

// Lazy-load Razorpay SDK
let razorpayInstance = null;
function getRazorpay() {
  if (razorpayInstance) return razorpayInstance;
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  try {
    const Razorpay = require('razorpay');
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
    return razorpayInstance;
  } catch (err) {
    logger.warn(`Razorpay init failed: ${err.message}`);
    return null;
  }
}

// Check if payments are enabled
router.get('/status', (req, res) => {
  const enabled = !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  res.json({
    enabled,
    provider: 'razorpay',
    keyId: enabled ? process.env.RAZORPAY_KEY_ID : null,
    modes: enabled ? ['online', 'upi', 'card', 'netbanking', 'wallet'] : ['cash', 'upi-manual']
  });
});

// Create order for appointment booking (public - patient facing)
router.post(
  '/create-order',
  asyncHandler(async (req, res) => {
    const { doctorId, amount, appointmentId, patientName, patientPhone, currency } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ message: 'amount required (in INR)' });
    }

    const razorpay = getRazorpay();
    if (!razorpay) {
      // Demo mode — return mock order
      return res.json({
        orderId: `demo_order_${Date.now()}`,
        amount: Math.round(amount * 100),
        currency: currency || 'INR',
        keyId: 'rzp_demo_key',
        demo: true,
        notes: { doctorId, appointmentId, patientName, patientPhone }
      });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects paise
      currency: currency || 'INR',
      receipt: `apt_${appointmentId || Date.now()}`,
      notes: {
        doctorId: doctorId || '',
        appointmentId: appointmentId || '',
        patientName: patientName || '',
        patientPhone: patientPhone || ''
      }
    };

    const order = await razorpay.orders.create(options);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      demo: false,
      notes: options.notes
    });
  })
);

// Verify payment after Razorpay checkout completes (client-side call)
router.post(
  '/verify',
  asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Payment details required' });
    }

    // Skip verification in demo mode
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return res.json({ verified: true, demo: true, paymentId: razorpay_payment_id });
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed. Signature mismatch.' });
    }

    // Mark appointment as confirmed + create billing record
    if (appointmentId) {
      try {
        const apt = await Appointment.findById(appointmentId).populate('patientId');
        if (apt) {
          apt.status = 'confirmed';
          apt.paymentId = razorpay_payment_id;
          apt.paymentStatus = 'paid';
          await apt.save();

          // Auto-create billing entry
          await Billing.create({
            doctorId: apt.doctorId,
            patientId: apt.patientId._id,
            appointmentId: apt._id,
            items: [{ description: `Consultation - ${apt.type}`, amount: apt.consultationFee || 500, quantity: 1 }],
            subtotal: apt.consultationFee || 500,
            totalAmount: apt.consultationFee || 500,
            paidAmount: apt.consultationFee || 500,
            paymentMethod: 'online',
            paymentStatus: 'paid',
            notes: `Online payment via Razorpay. Payment ID: ${razorpay_payment_id}`
          });
        }
      } catch (err) {
        logger.error(`Post-payment processing error: ${err.message}`);
      }
    }

    res.json({ verified: true, paymentId: razorpay_payment_id });
  })
);

// Razorpay Webhook (server-to-server payment confirmation)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  asyncHandler(async (req, res) => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return res.status(200).json({ status: 'ok', message: 'webhook not configured' });

    const signature = req.headers['x-razorpay-signature'];
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== expectedSig) {
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const event = req.body;
    const paymentEntity = event?.payload?.payment?.entity;

    if (event.event === 'payment.captured' && paymentEntity) {
      const appointmentId = paymentEntity.notes?.appointmentId;
      if (appointmentId) {
        await Appointment.findByIdAndUpdate(appointmentId, {
          status: 'confirmed',
          paymentId: paymentEntity.id,
          paymentStatus: 'paid'
        });
      }
      logger.info(`Webhook: Payment captured ${paymentEntity.id}`);
    }

    res.json({ status: 'ok' });
  })
);

// Doctor: Get payment analytics (auth required)
router.get(
  '/analytics',
  auth,
  asyncHandler(async (req, res) => {
    const doctorId = req.user._id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const [monthlyOnline, weeklyOnline, totalOnline] = await Promise.all([
      Billing.aggregate([
        { $match: { doctorId, paymentMethod: 'online', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' }, count: { $sum: 1 } } }
      ]),
      Billing.aggregate([
        { $match: { doctorId, paymentMethod: 'online', createdAt: { $gte: startOfWeek } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' }, count: { $sum: 1 } } }
      ]),
      Billing.aggregate([
        { $match: { doctorId, paymentMethod: 'online' } },
        { $group: { _id: null, total: { $sum: '$paidAmount' }, count: { $sum: 1 } } }
      ])
    ]);

    res.json({
      monthly: { amount: monthlyOnline[0]?.total || 0, count: monthlyOnline[0]?.count || 0 },
      weekly: { amount: weeklyOnline[0]?.total || 0, count: weeklyOnline[0]?.count || 0 },
      total: { amount: totalOnline[0]?.total || 0, count: totalOnline[0]?.count || 0 }
    });
  })
);

module.exports = router;
