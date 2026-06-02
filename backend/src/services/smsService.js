/**
 * SMS Service — Sends SMS via Twilio as backup/alternative to WhatsApp.
 * 
 * Priority order:
 *   1. WhatsApp (if TWILIO_WHATSAPP_NUMBER configured)
 *   2. SMS (if TWILIO_SMS_NUMBER configured)
 *   3. Stub mode (log to console)
 * 
 * Env vars:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_SMS_NUMBER — regular phone number for SMS (e.g., +1234567890)
 *   TWILIO_WHATSAPP_NUMBER — WhatsApp sandbox/business number
 */
const logger = require('../utils/logger');

let twilioClient = null;

function getClient() {
  if (twilioClient !== null) return twilioClient || null;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    twilioClient = false;
    return null;
  }
  try {
    twilioClient = require('twilio')(sid, token);
    return twilioClient;
  } catch (err) {
    logger.error(`Twilio init failed: ${err.message}`);
    twilioClient = false;
    return null;
  }
}

function formatPhoneE164(raw) {
  if (!raw) return null;
  const cleaned = String(raw).replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;
  return `+${cleaned}`;
}

/**
 * Send SMS message
 * @returns {{ success: boolean, sid?: string, method: string, stubbed?: boolean }}
 */
async function sendSMS({ to, body }) {
  if (!to || !body) throw new Error('to and body are required');

  const client = getClient();
  const from = process.env.TWILIO_SMS_NUMBER;
  const formattedTo = formatPhoneE164(to);

  if (!client || !from) {
    logger.info(`[SMS-STUB] to=${formattedTo} body="${body.substring(0, 60)}..."`);
    return { success: true, stubbed: true, method: 'stub' };
  }

  try {
    const msg = await client.messages.create({
      from,
      to: formattedTo,
      body
    });
    logger.info(`SMS sent: ${msg.sid} to ${formattedTo.slice(-4)}`);
    return { success: true, sid: msg.sid, method: 'sms' };
  } catch (err) {
    logger.error(`SMS send failed: ${err.message}`);
    return { success: false, error: err.message, method: 'sms' };
  }
}

/**
 * Send notification with automatic channel selection:
 * WhatsApp first, SMS fallback, stub as last resort.
 */
async function sendNotification({ to, body, preferSMS = false }) {
  if (!to || !body) throw new Error('to and body are required');

  const client = getClient();
  const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER;
  const smsFrom = process.env.TWILIO_SMS_NUMBER;
  const formattedTo = formatPhoneE164(to);

  // No Twilio at all: stub mode
  if (!client) {
    logger.info(`[NOTIFY-STUB] to=${formattedTo} body="${body.substring(0, 80)}..."`);
    return { success: true, stubbed: true, method: 'stub' };
  }

  // Determine channel priority
  const channels = preferSMS
    ? [{ type: 'sms', from: smsFrom }, { type: 'whatsapp', from: whatsappFrom }]
    : [{ type: 'whatsapp', from: whatsappFrom }, { type: 'sms', from: smsFrom }];

  for (const channel of channels) {
    if (!channel.from) continue;

    try {
      const msgTo = channel.type === 'whatsapp' ? `whatsapp:${formattedTo}` : formattedTo;
      const msgFrom = channel.type === 'whatsapp' ? channel.from : channel.from;

      const msg = await client.messages.create({
        from: msgFrom,
        to: msgTo,
        body
      });

      logger.info(`Notification sent via ${channel.type}: ${msg.sid}`);
      return { success: true, sid: msg.sid, method: channel.type };
    } catch (err) {
      logger.warn(`${channel.type} failed: ${err.message}. Trying next channel...`);
      continue;
    }
  }

  // All channels failed — stub
  logger.warn(`All notification channels failed for ${formattedTo.slice(-4)}. Message logged only.`);
  return { success: true, stubbed: true, method: 'stub', note: 'All channels failed' };
}

/**
 * Send appointment reminder via best available channel
 */
async function sendAppointmentReminderSMS({ patientName, patientPhone, doctorName, clinicName, date, timeSlot }) {
  const body = `Hi ${patientName}! Reminder: Your appointment with Dr. ${doctorName} at ${clinicName || 'the clinic'} is on ${date} at ${timeSlot}. Please arrive 10 min early. Reply CANCEL to reschedule. - DocClinic`;
  return sendNotification({ to: patientPhone, body });
}

/**
 * Send booking confirmation
 */
async function sendBookingConfirmation({ patientName, patientPhone, doctorName, date, timeSlot, tokenNumber }) {
  const body = `✅ Booking Confirmed!\nHi ${patientName}, your appointment with Dr. ${doctorName} is confirmed.\n📅 ${date}\n🕐 ${timeSlot}\n🎫 Token: #${tokenNumber}\n\nArrive 10 min early. - DocClinic`;
  return sendNotification({ to: patientPhone, body });
}

/**
 * Send prescription link
 */
async function sendPrescriptionLink({ patientName, patientPhone, prescriptionUrl, doctorName }) {
  const body = `Hi ${patientName}, Dr. ${doctorName} has issued your prescription.\nView it here: ${prescriptionUrl}\n\nTake medications as advised. - DocClinic`;
  return sendNotification({ to: patientPhone, body });
}

/**
 * Send payment receipt
 */
async function sendPaymentReceipt({ patientName, patientPhone, amount, invoiceNo }) {
  const body = `✅ Payment of ₹${amount} received!\nInvoice: ${invoiceNo}\nThank you, ${patientName}! - DocClinic`;
  return sendNotification({ to: patientPhone, body, preferSMS: true });
}

/**
 * Send video consultation link
 */
async function sendVideoLink({ patientName, patientPhone, doctorName, joinUrl }) {
  const body = `🎥 Video Consultation\nHi ${patientName}, Dr. ${doctorName} is ready.\nJoin now: ${joinUrl}\n\nPlease join within 5 minutes. - DocClinic`;
  return sendNotification({ to: patientPhone, body });
}

module.exports = {
  sendSMS,
  sendNotification,
  sendAppointmentReminderSMS,
  sendBookingConfirmation,
  sendPrescriptionLink,
  sendPaymentReceipt,
  sendVideoLink
};
