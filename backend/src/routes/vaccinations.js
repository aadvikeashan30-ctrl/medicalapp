const express = require('express');
const { body, validationResult } = require('express-validator');
const Vaccination = require('../models/Vaccination');
const HealthTimeline = require('../models/HealthTimeline');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// List vaccinations for a patient
router.get(
  '/patient/:patientId',
  auth,
  asyncHandler(async (req, res) => {
    const { status, vaccineType } = req.query;
    const query = { patientId: req.params.patientId, doctorId: req.user._id };
    if (status) query.status = status;
    if (vaccineType) query.vaccineType = vaccineType;

    const vaccinations = await Vaccination.find(query).sort({ administeredDate: -1 });
    res.json(vaccinations);
  })
);

// Get overdue vaccinations
router.get(
  '/overdue',
  auth,
  asyncHandler(async (req, res) => {
    const overdue = await Vaccination.find({
      doctorId: req.user._id,
      status: 'scheduled',
      nextDueDate: { $lt: new Date() }
    }).populate('patientId', 'name phone age');

    // Update status to overdue
    const overdueIds = overdue.map((v) => v._id);
    if (overdueIds.length) {
      await Vaccination.updateMany({ _id: { $in: overdueIds } }, { status: 'overdue' });
    }

    res.json(overdue);
  })
);

// Get upcoming vaccinations (next 30 days)
router.get(
  '/upcoming',
  auth,
  asyncHandler(async (req, res) => {
    const now = new Date();
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const upcoming = await Vaccination.find({
      doctorId: req.user._id,
      status: 'scheduled',
      nextDueDate: { $gte: now, $lte: thirtyDays }
    })
      .populate('patientId', 'name phone age')
      .sort({ nextDueDate: 1 });

    res.json(upcoming);
  })
);

// Get single vaccination
router.get(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const vaccination = await Vaccination.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!vaccination) return res.status(404).json({ message: 'Vaccination record not found' });
    res.json(vaccination);
  })
);

// Create vaccination record
router.post(
  '/',
  auth,
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('vaccineName').trim().notEmpty().withMessage('Vaccine name is required'),
    body('administeredDate').notEmpty().withMessage('Administered date is required')
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
    }

    const vaccination = await Vaccination.create({ ...req.body, doctorId: req.user._id });

    // Add to health timeline
    await HealthTimeline.create({
      patientId: req.body.patientId,
      doctorId: req.user._id,
      eventDate: req.body.administeredDate,
      eventType: 'vaccination',
      title: `Vaccination: ${req.body.vaccineName}`,
      description: `Dose ${req.body.doseNumber || 1} of ${req.body.totalDoses || 1}`,
      referenceModel: 'Vaccination',
      referenceId: vaccination._id,
      importance: 'notable'
    });

    res.status(201).json(vaccination);
  })
);

// Update vaccination
router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    delete updates.doctorId;

    const vaccination = await Vaccination.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );
    if (!vaccination) return res.status(404).json({ message: 'Vaccination record not found' });
    res.json(vaccination);
  })
);

// Delete vaccination
router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const vaccination = await Vaccination.findOneAndDelete({ _id: req.params.id, doctorId: req.user._id });
    if (!vaccination) return res.status(404).json({ message: 'Vaccination record not found' });
    res.json({ message: 'Vaccination record deleted' });
  })
);

module.exports = router;
