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
