/**
 * OTP Routes — Phone-based OTP verification for patient portal security
 * 
 * Uses Twilio SMS when configured, otherwise generates demo OTP (logged to console).
 * OTPs are stored in-memory with 5-minute expiry for simplicity.
 * In production, use Redis or a dedicated OTP collection.
 */
const express = require('express');
const crypto = require('crypto');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// In-memory OTP store (production: use Redis with TTL)
const otpStore = new Map();
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const OTP_COOLDOWN_MS = 30 * 1000; // 30 seconds between resends

// Clean expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [phone, data] of otpStore.entries()) {
    if (now - data.createdAt > OTP_EXPIRY_MS) otpStore.delete(phone);
  }
}, 60 * 1000);

/**
 * Generate a 6-digit OTP
 */
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Send OTP via SMS (Twilio) or log to console in demo mode
 */
async function sendOTP(phone, otp) {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_SMS_NUMBER || process.env.TWILIO_WHATSAPP_NUMBER;

  if (sid && token && from) {
    try {
      const twilio = require('twilio')(sid, token);
      const smsFrom = from.replace('whatsapp:', ''); // use regular SMS number
      await twilio.messages.create({
        body: `Your DocClinic verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`,
        from: smsFrom,
        to: phone.startsWith('+') ? phone : `+91${phone.replace(/\D/g, '').slice(-10)}`
      });
      logger.info(`OTP sent via SMS to ${phone.slice(-4)}`);
      return { sent: true, method: 'sms' };
    } catch (err) {
      logger.warn(`SMS send failed: ${err.message}. Falling back to demo mode.`);
    }
  }

  // Demo mode: log to console
  logger.info(`[DEMO OTP] Phone: ${phone} → OTP: ${otp}`);
  return { sent: true, method: 'demo', hint: otp.substring(0, 2) + '****' };
}

// Request OTP
router.post(
  '/send',
  asyncHandler(async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number required' });

    // Normalize phone
    const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
    if (normalizedPhone.length !== 10) {
      return res.status(400).json({ message: 'Invalid phone number. Provide 10-digit number.' });
    }

    // Check cooldown
    const existing = otpStore.get(normalizedPhone);
    if (existing && Date.now() - existing.createdAt < OTP_COOLDOWN_MS) {
      const waitSec = Math.ceil((OTP_COOLDOWN_MS - (Date.now() - existing.createdAt)) / 1000);
      return res.status(429).json({
        message: `Please wait ${waitSec}s before requesting another OTP`,
        retryAfter: waitSec
      });
    }

    // Generate and store OTP
    const otp = generateOTP();
    otpStore.set(normalizedPhone, {
      otp,
      createdAt: Date.now(),
      attempts: 0
    });

    // Send OTP
    const result = await sendOTP(phone, otp);

    res.json({
      message: 'OTP sent successfully',
      method: result.method,
      expiresIn: 300, // 5 minutes
      // In demo mode, provide a hint (first 2 digits)
      ...(result.method === 'demo' ? { demoHint: result.hint, demoOtp: otp } : {})
    });
  })
);

// Verify OTP
router.post(
  '/verify',
  asyncHandler(async (req, res) => {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ message: 'Phone and OTP required' });

    const normalizedPhone = phone.replace(/\D/g, '').slice(-10);
    const stored = otpStore.get(normalizedPhone);

    if (!stored) {
      return res.status(400).json({ message: 'No OTP found. Request a new one.' });
    }

    // Check expiry
    if (Date.now() - stored.createdAt > OTP_EXPIRY_MS) {
      otpStore.delete(normalizedPhone);
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    // Check max attempts (prevent brute force)
    if (stored.attempts >= 5) {
      otpStore.delete(normalizedPhone);
      return res.status(429).json({ message: 'Too many attempts. Request a new OTP.' });
    }

    // Verify
    stored.attempts++;
    if (stored.otp !== otp.toString()) {
      return res.status(400).json({
        message: 'Invalid OTP. Please try again.',
        attemptsRemaining: 5 - stored.attempts
      });
    }

    // Success — delete OTP and generate a session token
    otpStore.delete(normalizedPhone);

    // Create a short-lived patient session token (24 hours)
    const jwt = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'demo-fallback-secret-key-32chars!!';
    const patientToken = jwt.sign(
      { phone: normalizedPhone, type: 'patient', verified: true },
      secret,
      { expiresIn: '24h' }
    );

    res.json({
      verified: true,
      message: 'Phone verified successfully',
      token: patientToken,
      phone: normalizedPhone
    });
  })
);

// Check if a patient session token is valid
router.get(
  '/session',
  asyncHandler(async (req, res) => {
    const token = (req.header('X-Patient-Token') || req.query.token || '').trim();
    if (!token) return res.json({ valid: false });

    try {
      const jwt = require('jsonwebtoken');
      const secret = process.env.JWT_SECRET || 'demo-fallback-secret-key-32chars!!';
      const decoded = jwt.verify(token, secret);
      if (decoded.type !== 'patient') return res.json({ valid: false });
      res.json({ valid: true, phone: decoded.phone, verified: decoded.verified });
    } catch {
      res.json({ valid: false });
    }
  })
);

module.exports = router;
