const logger = require('./logger');

const REQUIRED = ['MONGODB_URI', 'JWT_SECRET'];

const PRODUCTION_REQUIRED = [
  'MONGODB_URI',
  'JWT_SECRET',
  'ALLOWED_ORIGINS'
];

const SECURITY_WARNINGS = [];

function validateEnv() {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  const isProduction = process.env.NODE_ENV === 'production';

  if (missing.length) {
    logger.warn('====================================================================');
    logger.warn(`Missing env vars: ${missing.join(', ')}`);
    logger.warn('Running in DEMO MODE — you can log in with demo@docclinic.com / demo1234');
    logger.warn('To use real data, set these in backend/.env and restart.');
    logger.warn('====================================================================');
    if (isProduction) {
      logger.error('FATAL: Cannot start in production with missing required env vars.');
      process.exit(1);
    }
  }

  // Security checks
  if (process.env.JWT_SECRET) {
    if (process.env.JWT_SECRET.length < 32) {
      SECURITY_WARNINGS.push('JWT_SECRET is short (<32 chars). Use at least 32 random chars.');
    }
    if (process.env.JWT_SECRET === 'replace_me_with_a_long_random_string' ||
        process.env.JWT_SECRET === 'change_me_to_a_long_random_string') {
      SECURITY_WARNINGS.push('JWT_SECRET is using the default placeholder! Change it immediately.');
      if (isProduction) process.exit(1);
    }
  }

  if (isProduction) {
    const prodMissing = PRODUCTION_REQUIRED.filter(k => !process.env[k]);
    if (prodMissing.length) {
      logger.error(`Production requires: ${prodMissing.join(', ')}`);
      process.exit(1);
    }

    if (process.env.ALLOWED_ORIGINS === '*') {
      SECURITY_WARNINGS.push('ALLOWED_ORIGINS is set to *. Restrict to your domain(s) in production.');
    }

    if (!process.env.RAZORPAY_WEBHOOK_SECRET && process.env.RAZORPAY_KEY_ID) {
      SECURITY_WARNINGS.push('RAZORPAY_WEBHOOK_SECRET not set. Webhook verification will be skipped.');
    }
  }

  // Informational warnings
  if (!process.env.TWILIO_ACCOUNT_SID) {
    logger.info('Twilio not configured — WhatsApp/SMS will run in stub mode (logs only).');
  }
  if (!process.env.OPENAI_API_KEY && !process.env.GEMINI_API_KEY) {
    logger.info('No AI API key set — AI features will use intelligent demo responses.');
  }
  if (!process.env.RAZORPAY_KEY_ID) {
    logger.info('Razorpay not configured — online payments disabled (cash/UPI manual only).');
  }

  // Print security warnings
  if (SECURITY_WARNINGS.length) {
    logger.warn('=== SECURITY WARNINGS ===');
    SECURITY_WARNINGS.forEach(w => logger.warn(`⚠️  ${w}`));
    logger.warn('=========================');
  }

  // Print startup summary
  logger.info('--- Environment Summary ---');
  logger.info(`  Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  logger.info(`  Database: ${process.env.MONGODB_URI ? '✓ configured' : '✗ missing (demo mode)'}`);
  logger.info(`  Auth: JWT (${process.env.JWT_EXPIRY || '30d'} expiry)`);
  logger.info(`  AI: ${process.env.OPENAI_API_KEY ? 'OpenAI' : process.env.GEMINI_API_KEY ? 'Gemini' : 'Demo mode'}`);
  logger.info(`  Payments: ${process.env.RAZORPAY_KEY_ID ? 'Razorpay ✓' : 'Disabled'}`);
  logger.info(`  Messaging: ${process.env.TWILIO_ACCOUNT_SID ? 'Twilio ✓' : 'Stub mode'}`);
  logger.info('---------------------------');
}

module.exports = { validateEnv };
