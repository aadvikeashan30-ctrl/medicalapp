const express = require('express');
const { body, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { emitQueueUpdate, emitTokenCalled, emitAppointmentCompleted } = require('../services/socketService');

const router = express.Router();

// List with filters
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { date, status, page = 1, limit = 50 } = req.query;
    const query = {};
    if (req.user.role === 'doctor') {
      query.doctorId = req.user._id;
    }

    if (date) {
      const start = new Date(date);
      if (Number.isNaN(start.getTime())) return res.status(400).json({ message: 'Invalid date' });
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      query.date = { $gte: start, $lt: end };
    }
    if (status) query.status = status;

    const [appointments, total] = await Promise.all([
      Appointment.find(query)
        .populate('patientId', 'name phone patientId age gender')
        .sort({ date: 1, tokenNumber: 1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10)),
      Appointment.countDocuments(query)
    ]);

    res.json({ appointments, total, pages: Math.ceil(total / limit), page: parseInt(page, 10) });
  })
);

// Today's queue (active statuses only)
router.get(
  '/queue/today',
  auth,
  asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const query = {
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['scheduled', 'confirmed', 'in-progress', 'REGISTERED', 'PAYMENT_PENDING', 'PAYMENT_COMPLETED', 'VITALS_PENDING', 'VITALS_COMPLETED', 'WAITING_FOR_DOCTOR', 'IN_CONSULTATION', 'CONSULTATION_COMPLETED', 'CHECKOUT_COMPLETED'] }
    };

    if (req.user.role === 'doctor') {
      query.doctorId = req.user._id;
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name phone patientId age gender')
      .sort({ tokenNumber: 1 });

    res.json(appointments);
  })
);

// Get single appointment
router.get(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const query = { _id: req.params.id };
    if (req.user.role === 'doctor') {
      query.doctorId = req.user._id;
    }
    const appointment = await Appointment.findOne(query).populate('patientId', 'name phone patientId age gender allergies');
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appointment);
  })
);

// Create with slot-conflict check
router.post(
  '/',
  auth,
  [
    body('patientId').notEmpty().withMessage('patientId is required'),
    body('date').notEmpty().withMessage('date is required'),
    body('timeSlot').notEmpty().withMessage('timeSlot is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }

    const apptDate = new Date(req.body.date);
    if (Number.isNaN(apptDate.getTime())) return res.status(400).json({ message: 'Invalid date' });

    const dayStart = new Date(apptDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    // Conflict: same doctor, same date+timeSlot, not cancelled
    const conflict = await Appointment.findOne({
      doctorId: req.user._id,
      date: { $gte: dayStart, $lt: dayEnd },
      timeSlot: req.body.timeSlot,
      status: { $ne: 'cancelled' }
    });
    if (conflict) {
      return res.status(409).json({ message: 'Time slot already booked' });
    }

    // Block bookings when the doctor is on leave / has blocked this slot
    const DoctorAvailability = require('../models/DoctorAvailability');
    const block = await DoctorAvailability.findBlock(req.user._id, apptDate, req.body.timeSlot);
    if (block) {
      const label = block.type === 'full-day' ? 'on leave' : 'unavailable';
      return res.status(409).json({
        message: `Doctor is ${label} on this date${block.note ? ` (${block.note})` : ''}. Please choose another slot.`,
        block
      });
    }

    const appointment = await Appointment.create({ ...req.body, doctorId: req.user._id });

    await Patient.findByIdAndUpdate(req.body.patientId, {
      lastVisit: new Date(),
      $inc: { totalVisits: 1 }
    });

    const populated = await appointment.populate('patientId', 'name phone patientId age gender');

    // Auto-send WhatsApp confirmation to patient
    if (populated.patientId?.phone && req.body.sendNotification !== false) {
      try {
        const { sendMessage } = require('../services/whatsappService');
        const dateStr = new Date(populated.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
        await sendMessage({
          to: populated.patientId.phone,
          body: `Hi ${populated.patientId.name}! Your appointment is confirmed for ${dateStr} at ${populated.timeSlot}. Token #${populated.tokenNumber}. Please arrive 10 min early. - ${req.user.clinicName || 'Your Clinic'}`
        });
      } catch (e) { /* non-critical */ }
    }

    res.status(201).json(populated);
  })
);

// Reschedule appointment (change date/time without cancelling)
router.put(
  '/:id/reschedule',
  auth,
  [
    body('date').notEmpty().withMessage('New date is required'),
    body('timeSlot').notEmpty().withMessage('New time slot is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }

    const appointment = await Appointment.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.status === 'completed' || appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot reschedule a completed or cancelled appointment' });
    }

    const newDate = new Date(req.body.date);
    const dayStart = new Date(newDate); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);

    // Check for conflicts at new slot
    const conflict = await Appointment.findOne({
      doctorId: req.user._id,
      _id: { $ne: appointment._id },
      date: { $gte: dayStart, $lt: dayEnd },
      timeSlot: req.body.timeSlot,
      status: { $ne: 'cancelled' }
    });
    if (conflict) return res.status(409).json({ message: 'New time slot is already booked' });

    // Block reschedule onto a leave / blocked slot
    const DoctorAvailability = require('../models/DoctorAvailability');
    const block = await DoctorAvailability.findBlock(req.user._id, newDate, req.body.timeSlot);
    if (block) {
      const label = block.type === 'full-day' ? 'on leave' : 'unavailable';
      return res.status(409).json({
        message: `Doctor is ${label} on the selected date${block.note ? ` (${block.note})` : ''}.`,
        block
      });
    }

    appointment.date = newDate;
    appointment.timeSlot = req.body.timeSlot;
    appointment.status = 'scheduled';
    await appointment.save();

    const populated = await appointment.populate('patientId', 'name phone patientId age gender');

    // Notify patient about reschedule
    if (populated.patientId?.phone) {
      try {
        const { sendMessage } = require('../services/whatsappService');
        const dateStr = newDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
        await sendMessage({
          to: populated.patientId.phone,
          body: `Hi ${populated.patientId.name}, your appointment has been rescheduled to ${dateStr} at ${req.body.timeSlot}. Please contact the clinic if you need to change. - ${req.user.clinicName || 'Your Clinic'}`
        });
      } catch (e) { /* non-critical */ }
    }

    res.json(populated);
  })
);

// Update
router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const query = { _id: req.params.id };
    if (req.user.role === 'doctor') {
      query.doctorId = req.user._id;
    }
    const appointment = await Appointment.findOneAndUpdate(
      query,
      req.body,
      { new: true, runValidators: true }
    ).populate('patientId', 'name phone patientId age gender');

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Emit real-time queue updates
    try {
      if (req.body.status === 'in-progress' || req.body.status === 'IN_CONSULTATION') {
        emitTokenCalled(appointment._id.toString(), appointment.tokenNumber);
      } else if (req.body.status === 'completed' || req.body.status === 'CONSULTATION_COMPLETED') {
        emitAppointmentCompleted(appointment._id.toString());
      }
      // Always emit queue update on any status change
      emitQueueUpdate(appointment.doctorId.toString());
    } catch (e) { /* non-critical */ }

    res.json(appointment);
  })
);

// Delete (hard delete OK; status:cancelled is also supported via PUT)
router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const result = await Appointment.findOneAndDelete({ _id: req.params.id, doctorId: req.user._id });
    if (!result) return res.status(404).json({ message: 'Appointment not found' });
    res.json({ message: 'Appointment cancelled' });
  })
);

module.exports = router;
