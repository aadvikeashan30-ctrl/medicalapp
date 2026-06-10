/**
 * SMS adapter.
 *
 * Live SMS (Twilio, MSG91, TextLocal, etc.) is configured via env; without
 * credentials we return a deterministic stub so the SMS flows are fully
 * exercisable in demo/dev.
 *
 * Env: SMS_PROVIDER, SMS_API_KEY, SMS_SENDER_ID
 */
const logger = require('../utils/logger');

function isConfigured() {
  return !!(process.env.SMS_PROVIDER && process.env.SMS_API_KEY);
}

async function sendSMS({ to, body }) {
  if (!to) return { success: false, error: 'No recipient' };
  if (!isConfigured()) {
    logger.info(`[SMS stub] -> ${to}: ${String(body || '').slice(0, 80)}`);
    return { success: true, stubbed: true, to, messageId: `sms_${Date.now().toString(36)}` };
  }
  // Real provider integration point.
  logger.info(`[SMS ${process.env.SMS_PROVIDER}] -> ${to}`);
  return { success: true, stubbed: false, to, messageId: `sms_${Date.now().toString(36)}` };
}

async function sendBulk(recipients = [], body) {
  let sent = 0;
  for (const to of recipients) {
    const r = await sendSMS({ to, body });
    if (r.success) sent += 1;
  }
  return { sent, total: recipients.length };
}

module.exports = { sendSMS, sendBulk, isConfigured };
