const Appointment = require('../models/Appointment');
const logger = require('../utils/logger');

let twilioClient = null;
function getClient() {
  if (twilioClient !== null) return twilioClient;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) {
    twilioClient = false; // explicit "no creds" sentinel
    logger.warn('Twilio credentials not set. WhatsApp will run in stub mode (logs only).');
    return null;
  }
  try {
    // eslint-disable-next-line global-require
    twilioClient = require('twilio')(sid, token);
    logger.info('Twilio WhatsApp client initialized.');
    return twilioClient;
  } catch (err) {
    logger.error(`Failed to init Twilio: ${err.message}`);
    twilioClient = false;
    return null;
  }
}

function formatPhone(raw) {
  if (!raw) return null;
  const cleaned = String(raw).replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) return `whatsapp:${cleaned}`;
  // Default to India country code if user only typed 10 digits
  if (cleaned.length === 10) return `whatsapp:+91${cleaned}`;
  return `whatsapp:+${cleaned}`;
}

// Send a single WhatsApp message; returns { success, sid?, stubbed? }
async function sendMessage({ to, body }) {
  if (!to || !body) throw new Error('to and body are required');
  const client = getClient();
  const from = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';
  const formattedTo = formatPhone(to);

  if (!client) {
    logger.info(`[WA-STUB] to=${formattedTo} body=${body}`);
    return { success: true, stubbed: true };
  }

  try {
    const msg = await client.messages.create({ from, to: formattedTo, body });
    return { success: true, sid: msg.sid };
  } catch (err) {
    logger.error(`WhatsApp send failed: ${err.message}`);
    return { success: false, error: err.message };
  }
}

// Cron-driven reminders for tomorrow's appointments
async function sendAppointmentReminders() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const appointments = await Appointment.find({
    date: { $gte: tomorrow, $lt: dayAfter },
    status: { $in: ['scheduled', 'confirmed'] },
    reminderSent: false
  })
    .populate('patientId', 'name phone')
    .populate('doctorId', 'name clinicName');

  let sent = 0;
  for (const apt of appointments) {
    if (!apt.patientId?.phone) continue;
    const body =
      `Hello ${apt.patientId.name}! Reminder: appointment with Dr. ${apt.doctorId.name} ` +
      `at ${apt.doctorId.clinicName || 'the clinic'} on ${apt.date.toDateString()} at ${apt.timeSlot}. ` +
      `Please arrive 10 minutes early.`;

    const result = await sendMessage({ to: apt.patientId.phone, body });
    if (result.success) {
      apt.reminderSent = true;
      apt.reminderSentAt = new Date();
      await apt.save();
      sent += 1;
    }
  }

  logger.info(`Appointment reminders processed: sent=${sent}/${appointments.length}`);
  return { processed: appointments.length, sent };
}

module.exports = { sendMessage, sendAppointmentReminders };
