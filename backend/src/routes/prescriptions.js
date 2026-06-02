const express = require('express');
const Prescription = require('../models/Prescription');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { patientId, page = 1, limit = 20 } = req.query;
    const query = { doctorId: req.user._id, isTemplate: false };
    if (patientId) query.patientId = patientId;

    const [prescriptions, total] = await Promise.all([
      Prescription.find(query)
        .populate('patientId', 'name phone patientId age gender')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10)),
      Prescription.countDocuments(query)
    ]);

    res.json({ prescriptions, total, pages: Math.ceil(total / limit), page: parseInt(page, 10) });
  })
);

router.get(
  '/templates',
  auth,
  asyncHandler(async (req, res) => {
    const templates = await Prescription.find({ doctorId: req.user._id, isTemplate: true });
    res.json(templates);
  })
);

router.post(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    if (!req.body.patientId) return res.status(400).json({ message: 'patientId is required' });
    const prescription = await Prescription.create({ ...req.body, doctorId: req.user._id });
    res.status(201).json(prescription);
  })
);

router.post(
  '/template',
  auth,
  asyncHandler(async (req, res) => {
    const template = await Prescription.create({
      ...req.body,
      doctorId: req.user._id,
      isTemplate: true
    });
    res.status(201).json(template);
  })
);

router.get(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const prescription = await Prescription.findOne({ _id: req.params.id, doctorId: req.user._id })
      .populate('patientId', 'name phone patientId age gender bloodGroup allergies');
    if (!prescription) return res.status(404).json({ message: 'Prescription not found' });
    res.json(prescription);
  })
);

router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const result = await Prescription.findOneAndDelete({ _id: req.params.id, doctorId: req.user._id });
    if (!result) return res.status(404).json({ message: 'Prescription not found' });
    res.json({ message: 'Prescription deleted' });
  })
);

module.exports = router;
