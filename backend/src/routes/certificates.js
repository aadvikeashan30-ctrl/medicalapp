const express = require('express');
const MedicalCertificate = require('../models/MedicalCertificate');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateCertificatePDF } = require('../services/pdfService');

const router = express.Router();

// List certificates (optional filters: patientId, type, status)
router.get(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    const { patientId, type, status, page = 1, limit = 50 } = req.query;
    const query = { doctorId: req.user._id };
    if (patientId) query.patientId = patientId;
    if (type) query.type = type;
    if (status) query.status = status;

    const [certificates, total] = await Promise.all([
      MedicalCertificate.find(query)
        .populate('patientId', 'name phone patientId age gender')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit, 10)),
      MedicalCertificate.countDocuments(query)
    ]);

    res.json({ certificates, total, pages: Math.ceil(total / limit), page: parseInt(page, 10) });
  })
);

// Summary stats for dashboard cards
router.get(
  '/stats/summary',
  auth,
  asyncHandler(async (req, res) => {
    const doctorId = req.user._id;
    const [total, active, sickLeave, fitness] = await Promise.all([
      MedicalCertificate.countDocuments({ doctorId }),
      MedicalCertificate.countDocuments({ doctorId, status: 'active' }),
      MedicalCertificate.countDocuments({ doctorId, type: 'sick-leave' }),
      MedicalCertificate.countDocuments({ doctorId, type: { $in: ['fitness', 'fitness-to-work'] } })
    ]);
    res.json({ total, active, sickLeave, fitness });
  })
);

// Get single certificate
router.get(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const cert = await MedicalCertificate.findOne({ _id: req.params.id, doctorId: req.user._id })
      .populate('patientId', 'name phone patientId age gender');
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });
    res.json(cert);
  })
);

// Download certificate as PDF
router.get(
  '/:id/pdf',
  auth,
  asyncHandler(async (req, res) => {
    const cert = await MedicalCertificate.findOne({ _id: req.params.id, doctorId: req.user._id })
      .populate('patientId', 'name patientId age gender phone');
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });

    const pdfBuffer = await generateCertificatePDF(cert, req.user);
    const inline = req.query.view === '1';

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `${inline ? 'inline' : 'attachment'}; filename="certificate-${cert.certificateNo || 'CERT'}.pdf"`
    );
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  })
);

// Create certificate
router.post(
  '/',
  auth,
  asyncHandler(async (req, res) => {
    if (!req.body.patientId) return res.status(400).json({ message: 'patientId is required' });
    const cert = await MedicalCertificate.create({ ...req.body, doctorId: req.user._id });
    const populated = await cert.populate('patientId', 'name phone patientId age gender');
    res.status(201).json(populated);
  })
);

// Update certificate
router.put(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const updates = { ...req.body };
    // Never allow overwriting ownership or the generated number
    delete updates.doctorId;
    delete updates.certificateNo;

    const cert = await MedicalCertificate.findOneAndUpdate(
      { _id: req.params.id, doctorId: req.user._id },
      updates,
      { new: true, runValidators: true }
    ).populate('patientId', 'name phone patientId age gender');

    if (!cert) return res.status(404).json({ message: 'Certificate not found' });
    res.json(cert);
  })
);

// Delete certificate
router.delete(
  '/:id',
  auth,
  asyncHandler(async (req, res) => {
    const result = await MedicalCertificate.findOneAndDelete({ _id: req.params.id, doctorId: req.user._id });
    if (!result) return res.status(404).json({ message: 'Certificate not found' });
    res.json({ message: 'Certificate deleted' });
  })
);

module.exports = router;
