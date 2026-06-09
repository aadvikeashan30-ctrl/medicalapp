const express = require('express');
const { body, validationResult } = require('express-validator');
const { DrugInteraction, EMRTemplate } = require('../models/DrugInteraction');
const ESignature = require('../models/ESignature');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// ========== DRUG INTERACTION ALERTS ==========

// Check drug interactions
router.post(
  '/drug-interactions/check',
  auth,
  asyncHandler(async (req, res) => {
    const { medicines } = req.body; // array of medicine names
    if (!medicines || medicines.length < 2) {
      return res.json({ interactions: [], message: 'At least 2 medicines required for interaction check' });
    }

    const drugNames = medicines.map((m) => (typeof m === 'string' ? m : m.name).toLowerCase());
    const interactions = [];

    // Check each pair
    for (let i = 0; i < drugNames.length; i++) {
      for (let j = i + 1; j < drugNames.length; j++) {
        const found = await DrugInteraction.findOne({
          $or: [
            { drug1: drugNames[i], drug2: drugNames[j] },
            { drug1: drugNames[j], drug2: drugNames[i] }
          ]
        });
        if (found) interactions.push(found);
      }
    }

    // Also try AI-based interaction check if no DB results
    if (interactions.length === 0 && drugNames.length >= 2) {
      try {
        const aiService = require('../services/aiService');
        const aiInteractions = await aiService.checkDrugInteractions(drugNames);
        return res.json({ interactions: aiInteractions, source: 'ai' });
      } catch (err) {
        // Continue with empty result
      }
    }

    res.json({ interactions, source: 'database' });
  })
);

// ========== ALLERGY DETECTION ==========

// Check patient allergies against prescribed medicines
router.post(
  '/allergy-check',
  auth,
  asyncHandler(async (req, res) => {
    const { patientId, medicines } = req.body;
    const Patient = require('../models/Patient');

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const allergies = (patient.allergies || []).map((a) => a.toLowerCase());
    const alerts = [];

    if (allergies.length > 0 && medicines && medicines.length > 0) {
      for (const med of medicines) {
        const medName = (typeof med === 'string' ? med : med.name).toLowerCase();
        for (const allergy of allergies) {
          if (medName.includes(allergy) || allergy.includes(medName)) {
            alerts.push({
              medicine: typeof med === 'string' ? med : med.name,
              allergy,
              severity: 'high',
              message: `Patient is allergic to "${allergy}" - "${typeof med === 'string' ? med : med.name}" may cause an adverse reaction`
            });
          }
        }
      }
    }

    // AI-enhanced allergy detection
    if (alerts.length === 0 && allergies.length > 0) {
      try {
        const aiService = require('../services/aiService');
        const aiAlerts = await aiService.checkAllergyInteractions(allergies, medicines);
        if (aiAlerts && aiAlerts.length > 0) {
          return res.json({ alerts: aiAlerts, source: 'ai' });
        }
      } catch (err) {
        // Continue with empty result
      }
    }

    res.json({ alerts, patientAllergies: patient.allergies || [], source: 'database' });
  })
);

// ========== CLINICAL DECISION SUPPORT ==========

// Get clinical suggestions based on symptoms and diagnosis
router.post(
  '/clinical-support',
  auth,
  asyncHandler(async (req, res) => {
    const { symptoms, diagnosis, patientAge, patientGender, medicalHistory } = req.body;

    try {
      const aiService = require('../services/aiService');
      const suggestions = await aiService.clinicalDecisionSupport({
        symptoms,
        diagnosis,
        patientAge,
        patientGender,
        medicalHistory
      });
      res.json(suggestions);
    } catch (err) {
      res.json({
        suggestedDiagnoses: [],
        recommendedTests: [],
        treatmentOptions: [],
        followUpAdvice: 'Please use clinical judgment for treatment decisions.',
        disclaimer: 'AI suggestions are for reference only. Clinical judgment should always take precedence.'
      });
    }
  })
);

// ========== SMART FOLLOW-UP SUGGESTIONS ==========

router.post(
  '/follow-up-suggestions',
  auth,
  asyncHandler(async (req, res) => {
    const { diagnosis, medicines, patientAge, consultationType } = req.body;

    try {
      const aiService = require('../services/aiService');
      const suggestions = await aiService.suggestFollowUp({
        diagnosis,
        medicines,
        patientAge,
        consultationType
      });
      res.json(suggestions);
    } catch (err) {
      res.json({
        suggestedDays: 7,
        reason: 'Standard follow-up recommendation',
        priority: 'normal'
      });
    }
  })
);

// ========== VOICE TO PRESCRIPTION ==========

// Process voice transcription into structured prescription
router.post(
  '/voice-prescription',
  auth,
  asyncHandler(async (req, res) => {
    const { transcription, patientId } = req.body;

    if (!transcription) {
      return res.status(400).json({ message: 'Transcription is required' });
    }

    try {
      const aiService = require('../services/aiService');
      const structured = await aiService.voiceToPrescription(transcription);
      res.json({
        ...structured,
        patientId,
        disclaimer: 'AI-generated prescription. Please review before finalizing.'
      });
    } catch (err) {
      res.status(500).json({ message: 'Failed to process voice prescription' });
    }
  })
);

// ========== AI PATIENT RISK ASSESSMENT ==========

// Assess a patient's clinical risk + no-show probability using their real data
router.post(
  '/patient-risk',
  auth,
  asyncHandler(async (req, res) => {
    const { patientId } = req.body;
    if (!patientId) return res.status(400).json({ message: 'patientId is required' });

    const Patient = require('../models/Patient');
    const Appointment = require('../models/Appointment');
    const aiService = require('../services/aiService');

    const patient = await Patient.findOne({ _id: patientId, doctorId: req.user._id });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    // Gather visit history + no-show count for richer context
    const appts = await Appointment.find({ patientId, doctorId: req.user._id })
      .sort({ date: -1 })
      .limit(30)
      .select('status date type diagnosis');

    const noShows = appts.filter((a) => a.status === 'no-show').length;
    const conditions = [...(patient.medicalHistory || [])].filter(Boolean);

    const assessment = await aiService.assessPatientRisk({
      patient: {
        age: patient.age,
        gender: patient.gender,
        bloodGroup: patient.bloodGroup,
        allergies: patient.allergies,
        medicalHistory: patient.medicalHistory,
        totalVisits: patient.totalVisits,
        noShowCount: noShows
      },
      visits: appts.length,
      conditions
    });

    res.json({
      patient: { _id: patient._id, name: patient.name, patientId: patient.patientId },
      historicalNoShows: noShows,
      totalAppointments: appts.length,
      ...assessment,
      disclaimer: 'AI risk assessment is for reference only. Clinical judgment should always take precedence.'
    });
  })
);

// ========== AI SCHEDULE OPTIMIZER ==========

// Analyze a given day's appointments and return scheduling insights
router.post(
  '/optimize-schedule',
  auth,
  asyncHandler(async (req, res) => {
    const Appointment = require('../models/Appointment');
    const aiService = require('../services/aiService');

    const target = req.body.date ? new Date(req.body.date) : new Date();
    if (Number.isNaN(target.getTime())) return res.status(400).json({ message: 'Invalid date' });
    const dayStart = new Date(target); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);

    const appts = await Appointment.find({
      doctorId: req.user._id,
      date: { $gte: dayStart, $lt: dayEnd }
    })
      .populate('patientId', 'name')
      .sort({ timeSlot: 1 })
      .select('timeSlot duration type status patientId');

    const insights = await aiService.optimizeSchedule({
      appointments: appts.map((a) => ({
        timeSlot: a.timeSlot,
        duration: a.duration,
        type: a.type,
        status: a.status,
        patient: a.patientId?.name
      })),
      workingHours: req.user.workingHours || { start: '09:00', end: '18:00' },
      historicalData: req.body.historicalData
    });

    res.json({ date: dayStart, appointmentCount: appts.length, ...insights });
  })
);

// ========== SMART SLOT CLUSTERING ==========

// Reorganize a day into energy-protecting clusters: short virtual follow-ups
// batched in the morning, complex in-person evaluations in the afternoon.
router.post(
  '/slot-plan',
  auth,
  asyncHandler(async (req, res) => {
    const Appointment = require('../models/Appointment');
    const target = req.body.date ? new Date(req.body.date) : new Date();
    if (Number.isNaN(target.getTime())) return res.status(400).json({ message: 'Invalid date' });
    const dayStart = new Date(target); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);

    const appts = await Appointment.find({
      doctorId: req.user._id,
      date: { $gte: dayStart, $lt: dayEnd },
      status: { $nin: ['cancelled', 'no-show'] }
    }).populate('patientId', 'name');

    // Classify each appointment
    const isVirtual = (a) => a.consultationMode === 'video' || a.consultationMode === 'phone';
    const isShort = (a) => ['follow-up', 'checkup'].includes(a.type) || (a.duration || 30) <= 15;

    const morning = []; // short / virtual follow-ups
    const afternoon = []; // complex / in-person
    appts.forEach((a) => {
      const item = { id: a._id, patient: a.patientId?.name, type: a.type, mode: a.consultationMode, duration: a.duration || 30, currentSlot: a.timeSlot };
      if (isVirtual(a) && isShort(a)) morning.push(item);
      else if (isShort(a)) morning.push(item);
      else afternoon.push(item);
    });

    // Assign suggested times
    const hrs = req.user.workingHours || { start: '09:00', end: '18:00' };
    let m = parseInt((hrs.start || '09:00').split(':')[0], 10);
    const assignMorning = morning.map((it, i) => ({ ...it, suggestedSlot: `${String(m + Math.floor(i / 4)).padStart(2, '0')}:${(i % 4) * 15 === 0 ? '00' : (i % 4) * 15}` }));
    let p = 14;
    const assignAfternoon = afternoon.map((it, i) => ({ ...it, suggestedSlot: `${String(p + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 === 0 ? '00' : '30'}` }));

    res.json({
      date: dayStart,
      total: appts.length,
      morningBlock: { label: 'Short / virtual follow-ups (AM)', count: assignMorning.length, items: assignMorning },
      afternoonBlock: { label: 'Complex / in-person evaluations (PM)', count: assignAfternoon.length, items: assignAfternoon },
      rationale: [
        'Batch quick virtual follow-ups early to build momentum and clear volume.',
        'Reserve afternoons for cognitively demanding, in-person evaluations.',
        'Keep context-switching low by grouping similar consultation modes.'
      ]
    });
  })
);

// ========== AI CLINICAL NOTE SUMMARIZER ==========

// Convert free-text / voice notes into a structured SOAP summary with ICD-10
router.post(
  '/summarize-notes',
  auth,
  asyncHandler(async (req, res) => {
    const { text, type } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ message: 'Note text is required' });

    const aiService = require('../services/aiService');
    const summary = await aiService.summarizeNotes({ text, type });
    res.json(summary);
  })
);

// ========== AMBIENT AI CONSULTATION SCRIBE ==========

// Turn a live consultation transcript into a sign-off-ready structured note
// (SOAP summary + draft prescription) so the doctor reviews instead of typing.
router.post(
  '/scribe',
  auth,
  asyncHandler(async (req, res) => {
    const { transcript, patientId } = req.body;
    if (!transcript || !transcript.trim()) {
      return res.status(400).json({ message: 'Consultation transcript is required' });
    }

    const aiService = require('../services/aiService');

    // Run summary + prescription extraction together
    const [note, rx] = await Promise.all([
      aiService.summarizeNotes({ text: transcript, type: 'voice' }),
      aiService.voiceToPrescription(transcript)
    ]);

    res.json({
      patientId: patientId || null,
      soap: note.soap || null,
      icd10Suggestions: note.icd10Suggestions || [],
      keyFindings: note.keyFindings || [],
      followUpSuggested: note.followUpSuggested || rx.followUpDays || null,
      draftPrescription: {
        diagnosis: rx.diagnosis || note?.soap?.assessment || '',
        symptoms: rx.symptoms || [],
        medicines: rx.medicines || [],
        tests: rx.tests || [],
        advice: rx.advice || '',
        vitals: rx.vitals || {}
      },
      disclaimer: 'AI-generated draft from the consultation transcript. Review and edit before signing off.'
    });
  })
);

// ========== PRE-VISIT AI TRIAGE SUMMARY ==========

// 3-bullet brief the doctor reads before entering the room
router.get(
  '/triage/:appointmentId',
  auth,
  asyncHandler(async (req, res) => {
    const Appointment = require('../models/Appointment');
    const aiService = require('../services/aiService');

    const appt = await Appointment.findOne({ _id: req.params.appointmentId, doctorId: req.user._id })
      .populate('patientId', 'name age gender allergies medicalHistory bloodGroup');
    if (!appt) return res.status(404).json({ message: 'Appointment not found' });

    const patient = appt.patientId || {};
    const summary = await aiService.triageSummary({
      symptoms: appt.symptoms || appt.chiefComplaint,
      patient: { age: patient.age, gender: patient.gender, allergies: patient.allergies, bloodGroup: patient.bloodGroup },
      history: (patient.medicalHistory || []).join(', '),
      vitals: appt.vitals || {}
    });

    res.json({
      appointmentId: appt._id,
      patient: { _id: patient._id, name: patient.name, age: patient.age, gender: patient.gender },
      tokenNumber: appt.tokenNumber,
      timeSlot: appt.timeSlot,
      ...summary
    });
  })
);

// ========== DRUG INTERACTION & DOSAGE GUARD ==========

// One call that runs interactions + allergy check + weight-based pediatric dosing
router.post(
  '/rx-guard',
  auth,
  asyncHandler(async (req, res) => {
    const { patientId, medicines = [], weightKg, ageYears } = req.body;
    if (!Array.isArray(medicines) || medicines.length === 0) {
      return res.status(400).json({ message: 'At least one medicine is required' });
    }

    const aiService = require('../services/aiService');
    const Patient = require('../models/Patient');
    const { DrugInteraction } = require('../models/DrugInteraction');

    const names = medicines.map((m) => (typeof m === 'string' ? m : m.name)).filter(Boolean);
    const lower = names.map((n) => n.toLowerCase());

    // Resolve patient context (allergies, age, weight)
    let allergies = [];
    let age = ageYears;
    let weight = weightKg;
    if (patientId) {
      const patient = await Patient.findOne({ _id: patientId, doctorId: req.user._id });
      if (patient) {
        allergies = (patient.allergies || []).map((a) => a.toLowerCase());
        if (age == null) age = patient.age;
      }
    }

    // 1) Interactions — DB first, AI fallback
    let interactions = [];
    for (let i = 0; i < lower.length; i++) {
      for (let j = i + 1; j < lower.length; j++) {
        const found = await DrugInteraction.findOne({
          $or: [
            { drug1: lower[i], drug2: lower[j] },
            { drug1: lower[j], drug2: lower[i] }
          ]
        });
        if (found) interactions.push(found);
      }
    }
    if (interactions.length === 0 && lower.length >= 2) {
      try { interactions = await aiService.checkDrugInteractions(lower); } catch (e) { /* ignore */ }
    }

    // 2) Allergy cross-check
    const allergyAlerts = [];
    for (const med of names) {
      const m = med.toLowerCase();
      for (const a of allergies) {
        if (m.includes(a) || a.includes(m)) {
          allergyAlerts.push({ medicine: med, allergy: a, severity: 'high', message: `Patient allergic to "${a}" — review "${med}".` });
        }
      }
    }

    // 3) Pediatric weight-based dosing (when child / weight provided)
    const isPediatric = (age != null && age <= 12) || (weight && weight <= 40);
    const dosing = (isPediatric || weight)
      ? names.map((n) => aiService.pediatricDosage({ drug: n, weightKg: weight, ageYears: age }))
      : [];

    res.json({
      medicines: names,
      patientContext: { ageYears: age ?? null, weightKg: weight ?? null, allergies, isPediatric: !!isPediatric },
      interactions,
      allergyAlerts,
      dosing,
      hasCriticalAlerts: allergyAlerts.length > 0 || interactions.some((i) => ['major', 'contraindicated'].includes((i.severity || '').toLowerCase())),
      disclaimer: 'Automated safety check for reference only. Clinical judgment is required before prescribing.'
    });
  })
);

// ========== EMR TEMPLATES ==========

// List templates for doctor's specialty
router.get(
  '/emr-templates',
  auth,
  asyncHandler(async (req, res) => {
    const { specialty, category } = req.query;
    const query = {
      $or: [{ doctorId: req.user._id }, { isGlobal: true }],
      isActive: true
    };
    if (specialty) query.specialty = specialty;
    if (category) query.category = category;

    const templates = await EMRTemplate.find(query).sort({ usageCount: -1 });
    res.json(templates);
  })
);

// Get single template
router.get(
  '/emr-templates/:id',
  auth,
  asyncHandler(async (req, res) => {
    const template = await EMRTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ message: 'Template not found' });

    // Increment usage count
    template.usageCount += 1;
    await template.save();

    res.json(template);
  })
);

// Create template
router.post(
  '/emr-templates',
  auth,
  [
    body('name').trim().notEmpty().withMessage('Template name is required'),
    body('specialty').notEmpty().withMessage('Specialty is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }

    const template = await EMRTemplate.create({ ...req.body, doctorId: req.user._id });
    res.status(201).json(template);
  })
);

// Update template
router.put(
  '/emr-templates/:id',
  auth,
  asyncHandler(async (req, res) => {
    const template = await EMRTemplate.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json(template);
  })
);

// Delete template
router.delete(
  '/emr-templates/:id',
  auth,
  asyncHandler(async (req, res) => {
    const template = await EMRTemplate.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json({ message: 'Template deleted' });
  })
);

// ========== E-SIGNATURE ==========

// Get doctor's e-signature
router.get(
  '/e-signature',
  auth,
  asyncHandler(async (req, res) => {
    const signature = await ESignature.findOne({ doctorId: req.user._id });
    res.json(signature || { exists: false });
  })
);

// Create/Update e-signature
router.post(
  '/e-signature',
  auth,
  asyncHandler(async (req, res) => {
    const data = { ...req.body, doctorId: req.user._id };
    const signature = await ESignature.findOneAndUpdate(
      { doctorId: req.user._id },
      data,
      { new: true, upsert: true, runValidators: true }
    );
    res.json(signature);
  })
);

// Delete e-signature
router.delete(
  '/e-signature',
  auth,
  asyncHandler(async (req, res) => {
    await ESignature.findOneAndDelete({ doctorId: req.user._id });
    res.json({ message: 'E-signature deleted' });
  })
);

module.exports = router;
