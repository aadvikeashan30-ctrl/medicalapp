/**
 * PDF Download Routes — Generate and stream prescription/invoice PDFs
 */
const express = require('express');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { generatePrescriptionPDF, generateInvoicePDF } = require('../services/pdfService');
const Prescription = require('../models/Prescription');
const Billing = require('../models/Billing');

const router = express.Router();

// Download prescription as PDF (auth required)
router.get(
  '/prescription/:id',
  auth,
  asyncHandler(async (req, res) => {
    const prescription = await Prescription.findOne({
      _id: req.params.id,
      doctorId: req.user._id
    }).populate('patientId', 'name patientId age gender phone');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    const pdfBuffer = await generatePrescriptionPDF(prescription, req.user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="prescription-${prescription.prescriptionNo || 'RX'}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  })
);

// View prescription PDF inline (auth required)
router.get(
  '/prescription/:id/view',
  auth,
  asyncHandler(async (req, res) => {
    const prescription = await Prescription.findOne({
      _id: req.params.id,
      doctorId: req.user._id
    }).populate('patientId', 'name patientId age gender phone');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    const pdfBuffer = await generatePrescriptionPDF(prescription, req.user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="prescription-${prescription.prescriptionNo || 'RX'}.pdf"`);
    res.send(pdfBuffer);
  })
);

// Download invoice as PDF (auth required)
router.get(
  '/invoice/:id',
  auth,
  asyncHandler(async (req, res) => {
    const invoice = await Billing.findOne({
      _id: req.params.id,
      doctorId: req.user._id
    }).populate('patientId', 'name patientId phone');

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const pdfBuffer = await generateInvoicePDF(invoice, req.user);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNo || 'INV'}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  })
);

// Public prescription view (for patient portal — no auth, by prescription ID)
router.get(
  '/prescription/public/:id',
  asyncHandler(async (req, res) => {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'name patientId age gender phone')
      .populate('doctorId', 'name specialty qualification clinicName clinicAddress clinicCity phone registrationNo');

    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }

    const pdfBuffer = await generatePrescriptionPDF(prescription, prescription.doctorId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="prescription-${prescription.prescriptionNo || 'RX'}.pdf"`);
    res.send(pdfBuffer);
  })
);

module.exports = router;
