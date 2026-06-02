/**
 * Telemedicine Routes — Video consultation using Jitsi Meet (free, no account needed)
 * 
 * Flow:
 * 1. Doctor starts video call for an appointment → generates room + join links
 * 2. Patient receives join link via WhatsApp/SMS
 * 3. Both join the same Jitsi room for video consultation
 * 
 * No external API keys required — Jitsi Meet is free and open-source.
 */
const express = require('express');
const crypto = require('crypto');
const auth = require('../middleware/auth');
const { requireFeature } = require('../middleware/planLimits');
const { asyncHandler } = require('../middleware/errorHandler');
const Appointment = require('../models/Appointment');
const logger = require('../utils/logger');

const router = express.Router();

// Jitsi server (default: public Jitsi Meet, can be self-hosted)
const JITSI_DOMAIN = process.env.JITSI_DOMAIN || 'meet.jit.si';

/**
 * Generate a unique, secure room ID for a video consultation
 */
function generateRoomId(doctorId, appointmentId) {
  const hash = crypto
    .createHash('sha256')
    .update(`${doctorId}-${appointmentId}-${Date.now()}`)
    .digest('hex')
    .substring(0, 12);
  return `DocClinic-${hash}`;
}

/**
 * Generate Jitsi join URL with optional config
 */
function generateJoinUrl(roomId, displayName, options = {}) {
  const baseUrl = `https://${JITSI_DOMAIN}/${roomId}`;
  const params = new URLSearchParams();
  
  if (displayName) params.set('userInfo.displayName', displayName);
  if (options.audioOnly) params.set('config.startWithVideoMuted', 'true');
  if (options.startMuted) params.set('config.startWithAudioMuted', 'true');
  
  const queryStr = params.toString();
  return queryStr ? `${baseUrl}#${queryStr}` : baseUrl;
}

// Start video consultation for an appointment (doctor action)
router.post(
  '/start/:appointmentId',
  auth,
  asyncHandler(async (req, res) => {
    const appointment = await Appointment.findOne({
      _id: req.params.appointmentId,
      doctorId: req.user._id
    }).populate('patientId', 'name phone email');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.status === 'cancelled' || appointment.status === 'completed') {
      return res.status(400).json({ message: 'Cannot start video for cancelled/completed appointment' });
    }

    // Generate room if not already created
    let roomId = appointment.videoRoomId;
    if (!roomId) {
      roomId = generateRoomId(req.user._id, appointment._id);
    }

    const doctorUrl = generateJoinUrl(roomId, `Dr. ${req.user.name}`);
    const patientUrl = generateJoinUrl(roomId, appointment.patientId?.name || 'Patient');

    // Update appointment with video details
    appointment.videoRoomId = roomId;
    appointment.videoJoinUrl = patientUrl;
    appointment.consultationMode = 'video';
    appointment.status = 'in-progress';
    await appointment.save();

    // Try to send WhatsApp notification to patient
    try {
      const whatsappService = require('../services/whatsappService');
      if (appointment.patientId?.phone) {
        await whatsappService.sendMessage(
          appointment.patientId.phone,
          `🎥 Dr. ${req.user.name} has started your video consultation.\n\n` +
          `Join now: ${patientUrl}\n\n` +
          `Token: #${appointment.tokenNumber}\n` +
          `Please join within 5 minutes.`
        );
      }
    } catch (err) {
      logger.warn(`Failed to send video link via WhatsApp: ${err.message}`);
    }

    res.json({
      roomId,
      doctorUrl,
      patientUrl,
      jitsiDomain: JITSI_DOMAIN,
      appointment: {
        id: appointment._id,
        tokenNumber: appointment.tokenNumber,
        patient: appointment.patientId?.name,
        status: appointment.status
      }
    });
  })
);

// Get video room details for an appointment
router.get(
  '/room/:appointmentId',
  auth,
  asyncHandler(async (req, res) => {
    const appointment = await Appointment.findOne({
      _id: req.params.appointmentId,
      doctorId: req.user._id
    }).populate('patientId', 'name phone');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (!appointment.videoRoomId) {
      return res.status(404).json({ message: 'No video room created for this appointment. Start the call first.' });
    }

    res.json({
      roomId: appointment.videoRoomId,
      doctorUrl: generateJoinUrl(appointment.videoRoomId, `Dr. ${req.user.name}`),
      patientUrl: appointment.videoJoinUrl,
      jitsiDomain: JITSI_DOMAIN,
      status: appointment.status
    });
  })
);

// End video consultation
router.post(
  '/end/:appointmentId',
  auth,
  asyncHandler(async (req, res) => {
    const { notes, duration } = req.body;

    const appointment = await Appointment.findOne({
      _id: req.params.appointmentId,
      doctorId: req.user._id
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    appointment.status = 'completed';
    if (notes) appointment.notes = (appointment.notes || '') + `\n[Video Notes] ${notes}`;
    if (duration) appointment.duration = duration;
    await appointment.save();

    res.json({
      message: 'Video consultation ended successfully',
      appointment: {
        id: appointment._id,
        status: 'completed',
        duration: appointment.duration
      }
    });
  })
);

// Patient join link (public - no auth, accessed via shared link)
router.get(
  '/join/:appointmentId',
  asyncHandler(async (req, res) => {
    const { phone } = req.query;

    const appointment = await Appointment.findById(req.params.appointmentId)
      .populate('patientId', 'name phone')
      .populate('doctorId', 'name clinicName specialty');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Basic verification: check phone matches
    if (phone && appointment.patientId?.phone !== phone) {
      return res.status(403).json({ message: 'Phone number does not match appointment records' });
    }

    if (!appointment.videoRoomId) {
      return res.json({
        status: 'waiting',
        message: 'The doctor has not started the consultation yet. Please wait.',
        appointment: {
          id: appointment._id,
          date: appointment.date,
          timeSlot: appointment.timeSlot,
          doctor: appointment.doctorId?.name,
          clinic: appointment.doctorId?.clinicName
        }
      });
    }

    res.json({
      status: 'ready',
      joinUrl: appointment.videoJoinUrl,
      roomId: appointment.videoRoomId,
      jitsiDomain: JITSI_DOMAIN,
      appointment: {
        id: appointment._id,
        tokenNumber: appointment.tokenNumber,
        date: appointment.date,
        timeSlot: appointment.timeSlot,
        doctor: appointment.doctorId?.name,
        specialty: appointment.doctorId?.specialty
      }
    });
  })
);

// Get today's video appointments (doctor dashboard)
router.get(
  '/today',
  auth,
  asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const videoAppointments = await Appointment.find({
      doctorId: req.user._id,
      date: { $gte: today, $lt: tomorrow },
      consultationMode: 'video',
      status: { $nin: ['cancelled'] }
    })
      .populate('patientId', 'name phone age gender')
      .sort({ timeSlot: 1 });

    res.json({
      appointments: videoAppointments,
      total: videoAppointments.length,
      completed: videoAppointments.filter(a => a.status === 'completed').length,
      pending: videoAppointments.filter(a => a.status === 'scheduled' || a.status === 'confirmed').length,
      inProgress: videoAppointments.filter(a => a.status === 'in-progress').length
    });
  })
);

module.exports = router;
