/**
 * Patient Portal — PUBLIC routes (no auth required)
 * Allows patients to:
 * 1. Find a doctor by clinic code or link
 * 2. Book appointments online
 * 3. Check symptoms (AI triage)
 * 4. View their appointment status
 */
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const ai = require('../services/aiService');
const { asyncHandler } = require('../middleware/errorHandler');

// Get doctor's public profile by ID (for booking page)
router.get(
  '/doctor/:doctorId',
  asyncHandler(async (req, res) => {
    const doctor = await User.findById(req.params.doctorId).select(
      'name specialty qualification clinicName clinicAddress clinicCity consultationFee workingHours clinicLogo'
    );
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  })
);

// Search doctors (public)
router.get(
  '/doctors',
  asyncHandler(async (req, res) => {
    const { city, specialty, search } = req.query;
    const query = { isActive: true };
    if (city) query.clinicCity = { $regex: city, $options: 'i' };
    if (specialty && specialty !== 'all') query.specialty = specialty;
    if (search) {
      const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { clinicName: { $regex: safe, $options: 'i' } }
      ];
    }
    const doctors = await User.find(query)
      .select('name specialty qualification clinicName clinicCity consultationFee workingHours')
      .limit(20);
    res.json(doctors);
  })
);

// Get available slots for a doctor on a date
router.get(
  '/doctor/:doctorId/slots',
  asyncHandler(async (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'date query param required' });

    const doctor = await User.findById(req.params.doctorId).select('workingHours consultationFee');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const start = doctor.workingHours?.start || '09:00';
    const end = doctor.workingHours?.end || '18:00';

    // Generate 30-min slots
    const allSlots = [];
    let [h, m] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    while (h < endH || (h === endH && m < endM)) {
      const period = h >= 12 ? 'PM' : 'AM';
      const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
      allSlots.push(`${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`);
      m += 30;
      if (m >= 60) { h++; m = 0; }
    }

    // Find booked slots for that date
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const booked = await Appointment.find({
      doctorId: req.params.doctorId,
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ['cancelled', 'no-show'] }
    }).select('timeSlot');

    const bookedSlots = booked.map(a => a.timeSlot);
    const available = allSlots.filter(s => !bookedSlots.includes(s));

    res.json({ slots: available, bookedCount: bookedSlots.length, fee: doctor.consultationFee });
  })
);

// Patient books appointment (public — creates patient if needed)
router.post(
  '/book',
  asyncHandler(async (req, res) => {
    const { doctorId, patientName, patientPhone, patientEmail, patientAge, patientGender, date, timeSlot, type, symptoms } = req.body;

    if (!doctorId || !patientName || !patientPhone || !date || !timeSlot) {
      return res.status(400).json({ message: 'doctorId, patientName, patientPhone, date, timeSlot are required' });
    }

    // Find or create patient
    let patient = await Patient.findOne({ doctorId, phone: patientPhone });
    if (!patient) {
      patient = await Patient.create({
        doctorId,
        name: patientName,
        phone: patientPhone,
        email: patientEmail || undefined,
        age: patientAge ? Number(patientAge) : undefined,
        gender: patientGender || undefined
      });
    }

    // Check slot not already taken
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const conflict = await Appointment.findOne({
      doctorId,
      date: { $gte: dayStart, $lte: dayEnd },
      timeSlot,
      status: { $nin: ['cancelled', 'no-show'] }
    });
    if (conflict) return res.status(409).json({ message: 'This slot is already booked. Please choose another.' });

    const appointment = await Appointment.create({
      doctorId,
      patientId: patient._id,
      date: new Date(date),
      timeSlot,
      type: type || 'consultation',
      status: 'scheduled',
      symptoms: symptoms || ''
    });

    res.status(201).json({
      message: 'Appointment booked successfully!',
      appointment: {
        id: appointment._id,
        tokenNumber: appointment.tokenNumber,
        date: appointment.date,
        timeSlot: appointment.timeSlot,
        status: appointment.status
      },
      patient: { id: patient._id, patientId: patient.patientId, name: patient.name }
    });
  })
);

// AI Symptom Checker (public - no auth)
router.post(
  '/symptom-check',
  asyncHandler(async (req, res) => {
    const { symptoms, age, gender } = req.body;
    if (!symptoms) return res.status(400).json({ message: 'symptoms field required' });

    const systemMsg = {
      role: 'system',
      content: `You are an AI medical triage assistant for a patient-facing app. Based on symptoms, assess urgency and provide guidance. Respond ONLY in JSON format:
{
  "urgency": "emergency|urgent|routine",
  "urgencyExplanation": "brief reason for urgency level",
  "possibleConditions": ["condition1", "condition2", "condition3"],
  "immediateAdvice": "what to do right now",
  "shouldVisitDoctor": true/false,
  "suggestedSpecialty": "general|dental|eye|ortho|pediatric|dermatology|ent|cardiology|gynecology",
  "redFlags": ["any warning signs to watch for"],
  "homeRemedies": ["safe home care suggestions"],
  "disclaimer": "This is AI triage only. Always consult a doctor for medical advice."
}`
    };
    const userMsg = {
      role: 'user',
      content: `Patient: ${age || 'unknown'}y ${gender || 'unknown'}. Symptoms: ${symptoms}`
    };

    const result = await ai.chat([systemMsg, userMsg], { json: true, temperature: 0.2 });
    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch {
      parsed = {
        urgency: 'routine',
        urgencyExplanation: 'Unable to assess precisely. Please consult a doctor.',
        possibleConditions: ['Requires in-person evaluation'],
        immediateAdvice: 'If symptoms are severe, visit the nearest hospital.',
        shouldVisitDoctor: true,
        suggestedSpecialty: 'general',
        redFlags: [],
        homeRemedies: ['Rest', 'Stay hydrated'],
        disclaimer: 'This is AI triage only. Always consult a doctor for medical advice.'
      };
    }

    res.json({ ...parsed, provider: ai.getProvider() });
  })
);

// Check appointment status (public - by phone)
router.get(
  '/my-appointments',
  asyncHandler(async (req, res) => {
    const { phone, doctorId } = req.query;
    if (!phone) return res.status(400).json({ message: 'phone query param required' });

    const query = { phone };
    const patients = await Patient.find(query).select('_id doctorId name');
    if (!patients.length) return res.json({ appointments: [] });

    const patientIds = patients.map(p => p._id);
    const filter = { patientId: { $in: patientIds }, status: { $nin: ['cancelled'] } };
    if (doctorId) filter.doctorId = doctorId;

    const appointments = await Appointment.find(filter)
      .populate('doctorId', 'name clinicName specialty')
      .populate('patientId', 'name phone patientId')
      .sort({ date: -1 })
      .limit(20);

    res.json({ appointments });
  })
);

// Patient records lookup (by phone - no auth, phone-based verification)
router.get(
  '/my-records',
  asyncHandler(async (req, res) => {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ message: 'phone query param required' });

    const patient = await Patient.findOne({ phone }).sort({ createdAt: -1 });
    if (!patient) return res.status(404).json({ message: 'No records found for this phone number. Please check with your doctor.' });

    const [appointments, prescriptions, labTests, bills] = await Promise.all([
      Appointment.find({ patientId: patient._id }).populate('doctorId', 'name clinicName').sort({ date: -1 }).limit(20),
      require('../models/Prescription').find({ patientId: patient._id }).sort({ createdAt: -1 }).limit(10),
      require('../models/LabTest').find({ patientId: patient._id }).sort({ createdAt: -1 }).limit(10),
      require('../models/Billing').find({ patientId: patient._id }).sort({ createdAt: -1 }).limit(10)
    ]);

    res.json({ patient: { name: patient.name, patientId: patient.patientId, age: patient.age, gender: patient.gender, phone: patient.phone }, appointments, prescriptions, labTests, bills });
  })
);

// AI Health Tips (public - personalized by condition)
router.get(
  '/health-tips',
  asyncHandler(async (req, res) => {
    const { condition, age, gender } = req.query;
    const systemMsg = {
      role: 'system',
      content: `You are a health education AI. Generate 5 practical, evidence-based daily health tips. Respond ONLY in JSON:
{
  "tips": [
    { "title": "short title", "content": "2-3 sentence practical advice", "category": "nutrition|exercise|sleep|mental|medication|lifestyle|prevention" }
  ],
  "dailyFact": "one interesting health fact",
  "reminder": "one important health reminder for today"
}`
    };
    const userMsg = {
      role: 'user',
      content: `Generate health tips for: ${condition || 'general wellness'}. Patient: ${age || 'adult'}y ${gender || ''}.`
    };
    const result = await ai.chat([systemMsg, userMsg], { json: true, temperature: 0.5 });
    let parsed;
    try { parsed = JSON.parse(result); } catch {
      parsed = {
        tips: [
          { title: 'Stay Hydrated', content: 'Drink 8-10 glasses of water daily. Start your morning with a glass of warm water.', category: 'nutrition' },
          { title: 'Walk 30 Minutes', content: 'A daily 30-minute walk reduces heart disease risk by 30% and improves mood significantly.', category: 'exercise' },
          { title: 'Sleep Schedule', content: 'Maintain a consistent sleep schedule. 7-8 hours of quality sleep boosts immunity and focus.', category: 'sleep' },
          { title: 'Portion Control', content: 'Use smaller plates to naturally reduce portions. Eat slowly — it takes 20 minutes for your brain to register fullness.', category: 'nutrition' },
          { title: 'Stress Management', content: 'Practice deep breathing for 5 minutes daily. Inhale 4 counts, hold 4, exhale 6.', category: 'mental' }
        ],
        dailyFact: 'Your body contains about 60,000 miles of blood vessels — enough to circle the Earth twice.',
        reminder: 'Have you taken your medications today? Set a daily alarm if needed.'
      };
    }
    res.json({ ...parsed, provider: ai.getProvider() });
  })
);

// Medication Reminders (lookup by phone)
router.get(
  '/medication-reminders',
  asyncHandler(async (req, res) => {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ message: 'phone query param required' });

    const patient = await Patient.findOne({ phone });
    if (!patient) return res.status(404).json({ message: 'No records found' });

    const Prescription = require('../models/Prescription');
    const recentRx = await Prescription.find({ patientId: patient._id })
      .sort({ createdAt: -1 })
      .limit(3);

    // Build active medication schedule
    const activeMeds = [];
    for (const rx of recentRx) {
      for (const med of (rx.medicines || [])) {
        activeMeds.push({
          name: med.name,
          dosage: med.dosage || '',
          frequency: med.frequency || '',
          duration: med.duration || '',
          timing: med.timing || 'after-food',
          diagnosis: rx.diagnosis || '',
          prescribedDate: rx.createdAt,
          prescriptionNo: rx.prescriptionNo
        });
      }
    }

    res.json({
      patient: { name: patient.name, patientId: patient.patientId },
      medications: activeMeds,
      totalActive: activeMeds.length
    });
  })
);

// Track appointment (live queue position)
router.get(
  '/track/:appointmentId',
  asyncHandler(async (req, res) => {
    const apt = await Appointment.findById(req.params.appointmentId)
      .populate('doctorId', 'name clinicName specialty workingHours')
      .populate('patientId', 'name phone');
    if (!apt) return res.status(404).json({ message: 'Appointment not found' });

    // Get today's queue to determine position
    const dayStart = new Date(apt.date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(apt.date);
    dayEnd.setHours(23, 59, 59, 999);

    const todayQueue = await Appointment.find({
      doctorId: apt.doctorId._id,
      date: { $gte: dayStart, $lte: dayEnd },
      status: { $nin: ['cancelled', 'no-show'] }
    }).sort({ tokenNumber: 1 });

    const completed = todayQueue.filter(a => a.status === 'completed').length;
    const inProgress = todayQueue.find(a => a.status === 'in-progress');
    const myPosition = todayQueue.findIndex(a => a._id.toString() === apt._id.toString()) + 1;
    const patientsAhead = Math.max(0, myPosition - completed - (inProgress ? 1 : 0) - 1);
    const estimatedWait = patientsAhead * 15; // ~15 min per patient

    res.json({
      appointment: {
        id: apt._id,
        tokenNumber: apt.tokenNumber,
        date: apt.date,
        timeSlot: apt.timeSlot,
        status: apt.status,
        type: apt.type
      },
      doctor: apt.doctorId,
      patient: apt.patientId,
      queue: {
        totalToday: todayQueue.length,
        completed,
        currentToken: inProgress?.tokenNumber || null,
        myToken: apt.tokenNumber,
        myPosition,
        patientsAhead,
        estimatedWaitMinutes: estimatedWait
      }
    });
  })
);

// Patient submits review (with actual persistence)
router.post(
  '/review',
  asyncHandler(async (req, res) => {
    const { doctorId, patientName, patientPhone, rating, title, comment, tags, appointmentId } = req.body;

    if (!doctorId || !patientName || !rating) {
      return res.status(400).json({ message: 'doctorId, patientName, and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const Review = require('../models/Review');

    // Check if verified via actual appointment
    let isVerified = false;
    let patientId = null;
    if (appointmentId) {
      const apt = await Appointment.findOne({ _id: appointmentId, status: 'completed' });
      if (apt) {
        isVerified = true;
        patientId = apt.patientId;
      }
    } else if (patientPhone) {
      const patient = await Patient.findOne({ phone: patientPhone, doctorId });
      if (patient) {
        isVerified = true;
        patientId = patient._id;
      }
    }

    // Upsert: one review per patient-phone per doctor
    const review = await Review.findOneAndUpdate(
      { doctorId, patientPhone: patientPhone || undefined },
      {
        doctorId,
        patientId,
        appointmentId: appointmentId || undefined,
        patientName,
        patientPhone: patientPhone || undefined,
        rating: Number(rating),
        title: title || undefined,
        comment: comment || undefined,
        tags: tags || [],
        isVerified
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ message: 'Review submitted successfully. Thank you!', review: { id: review._id, rating: review.rating, isVerified } });
  })
);

// Get reviews for a doctor (public)
router.get(
  '/doctor/:doctorId/reviews',
  asyncHandler(async (req, res) => {
    const Review = require('../models/Review');
    const { page = 1, limit = 10, sort = 'recent' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const sortOrder = sort === 'highest' ? { rating: -1 } : sort === 'lowest' ? { rating: 1 } : { createdAt: -1 };

    const [reviews, stats] = await Promise.all([
      Review.find({ doctorId: req.params.doctorId, isVisible: true })
        .sort(sortOrder)
        .skip(skip)
        .limit(Number(limit))
        .select('patientName rating title comment tags isVerified createdAt doctorReply doctorRepliedAt'),
      Review.getAverageRating(req.params.doctorId)
    ]);

    res.json({ reviews, ...stats, page: Number(page), limit: Number(limit) });
  })
);

// Enhanced doctor search with ratings (public)
router.get(
  '/discover',
  asyncHandler(async (req, res) => {
    const { city, specialty, search, sort, page = 1, limit = 12 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const query = { isActive: true };

    if (city) query.clinicCity = { $regex: city, $options: 'i' };
    if (specialty && specialty !== 'all') query.specialty = specialty;
    if (search) {
      const safe = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { name: { $regex: safe, $options: 'i' } },
        { clinicName: { $regex: safe, $options: 'i' } },
        { qualification: { $regex: safe, $options: 'i' } }
      ];
    }

    const doctors = await User.find(query)
      .select('name specialty qualification clinicName clinicCity clinicAddress consultationFee workingHours experience clinicLogo')
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments(query);

    // Attach ratings to each doctor
    const Review = require('../models/Review');
    const doctorsWithRatings = await Promise.all(
      doctors.map(async (doc) => {
        const ratingData = await Review.getAverageRating(doc._id);
        return {
          ...doc.toObject(),
          avgRating: ratingData.avgRating,
          totalReviews: ratingData.totalReviews
        };
      })
    );

    // Sort by rating if requested
    if (sort === 'rating') {
      doctorsWithRatings.sort((a, b) => b.avgRating - a.avgRating);
    } else if (sort === 'fee-low') {
      doctorsWithRatings.sort((a, b) => (a.consultationFee || 0) - (b.consultationFee || 0));
    } else if (sort === 'fee-high') {
      doctorsWithRatings.sort((a, b) => (b.consultationFee || 0) - (a.consultationFee || 0));
    } else if (sort === 'experience') {
      doctorsWithRatings.sort((a, b) => (b.experience || 0) - (a.experience || 0));
    }

    res.json({
      doctors: doctorsWithRatings,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit))
    });
  })
);

// Doctor replies to a review (auth required)
router.post(
  '/review/:reviewId/reply',
  asyncHandler(async (req, res) => {
    // Simple auth check via header
    const jwt = require('jsonwebtoken');
    const token = (req.header('Authorization') || '').replace(/^Bearer\s+/i, '').trim();
    if (!token) return res.status(401).json({ message: 'Auth required to reply' });

    const secret = process.env.JWT_SECRET || 'demo-fallback-secret-key-32chars!!';
    let decoded;
    try { decoded = jwt.verify(token, secret); } catch { return res.status(401).json({ message: 'Invalid token' }); }

    const Review = require('../models/Review');
    const review = await Review.findOne({ _id: req.params.reviewId, doctorId: decoded.userId });
    if (!review) return res.status(404).json({ message: 'Review not found' });

    review.doctorReply = req.body.reply;
    review.doctorRepliedAt = new Date();
    await review.save();

    res.json({ message: 'Reply posted', review });
  })
);

// ══════ Patient Reviews (real feedback system) ══════
router.post(
  '/review',
  asyncHandler(async (req, res) => {
    const { doctorId, patientName, patientPhone, rating, comment, tags, appointmentId } = req.body;
    if (!doctorId || !patientName || !rating) {
      return res.status(400).json({ message: 'doctorId, patientName, and rating are required' });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const Review = require('../models/Review');

    // Check if patient already reviewed this doctor
    if (patientPhone) {
      const existing = await Review.findOne({ doctorId, patientPhone });
      if (existing) {
        // Update existing review
        existing.rating = rating;
        existing.comment = comment || existing.comment;
        existing.tags = tags || existing.tags;
        await existing.save();
        return res.json({ message: 'Review updated successfully. Thank you!' });
      }
    }

    // Verify appointment if provided (marks review as verified)
    let isVerified = false;
    if (appointmentId) {
      const Appointment = require('../models/Appointment');
      const apt = await Appointment.findOne({ _id: appointmentId, doctorId, status: 'completed' });
      if (apt) isVerified = true;
    }

    await Review.create({
      doctorId,
      patientName,
      patientPhone: patientPhone || undefined,
      rating,
      comment: comment || '',
      tags: tags || [],
      appointmentId: appointmentId || undefined,
      isVerified
    });

    res.status(201).json({ message: 'Review submitted successfully. Thank you!' });
  })
);

// Get reviews for a doctor (public)
router.get(
  '/reviews/:doctorId',
  asyncHandler(async (req, res) => {
    const Review = require('../models/Review');
    const [reviews, stats] = await Promise.all([
      Review.find({ doctorId: req.params.doctorId, isVisible: true })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('patientName rating comment tags isVerified createdAt doctorReply doctorRepliedAt'),
      Review.getAverageRating(req.params.doctorId)
    ]);
    res.json({ reviews, ...stats });
  })
);

// ══════ Patient Prescription PDF Download (public, by phone verification) ══════
router.get(
  '/prescription-pdf/:id',
  asyncHandler(async (req, res) => {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ message: 'Phone number required for verification' });

    const Prescription = require('../models/Prescription');
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'name patientId age gender phone')
      .populate('doctorId', 'name specialty qualification clinicName clinicAddress clinicCity phone registrationNo');

    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });

    // Verify patient's phone matches
    if (prescription.patientId?.phone !== phone) {
      return res.status(403).json({ message: 'Phone number does not match patient records' });
    }

    const { generatePrescriptionPDF } = require('../services/pdfService');
    const pdfBuffer = await generatePrescriptionPDF(prescription, prescription.doctorId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="prescription-${prescription.prescriptionNo || 'RX'}.pdf"`);
    res.send(pdfBuffer);
  })
);

module.exports = router;
