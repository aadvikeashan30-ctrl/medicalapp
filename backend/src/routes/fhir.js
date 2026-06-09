const express = require('express');
const fhir = require('../services/fhirService');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const auth = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// FHIR capability statement
router.get(
  '/metadata',
  auth,
  asyncHandler(async (req, res) => {
    res.json({ ...fhir.capabilityStatement(), externalServer: fhir.externalBaseUrl() });
  })
);

// Export a single patient as a FHIR Patient resource
router.get(
  '/Patient/:id',
  auth,
  asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(fhir.toFhirPatient(patient));
  })
);

// Export full patient record as a FHIR Bundle ($everything)
router.get(
  '/Patient/:id/everything',
  auth,
  asyncHandler(async (req, res) => {
    const patient = await Patient.findOne({ _id: req.params.id, doctorId: req.user._id });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const [appointments, prescriptions] = await Promise.all([
      Appointment.find({ patientId: patient._id, doctorId: req.user._id }).sort({ date: -1 }).limit(50),
      Prescription.find({ patientId: patient._id, doctorId: req.user._id, isTemplate: { $ne: true } }).sort({ createdAt: -1 }).limit(50)
    ]);

    res.json(fhir.buildEverythingBundle({ patient, appointments, prescriptions }));
  })
);

// Import a FHIR Patient resource (create a local patient)
router.post(
  '/Patient',
  auth,
  asyncHandler(async (req, res) => {
    let mapped;
    try {
      mapped = fhir.fromFhirPatient(req.body);
    } catch (err) {
      return res.status(400).json({ message: err.message });
    }
    if (!mapped.phone) mapped.phone = '0000000000'; // phone is required locally
    const patient = await Patient.create({ ...mapped, doctorId: req.user._id });
    res.status(201).json({ message: 'Imported', localId: patient._id, patientId: patient.patientId, fhir: fhir.toFhirPatient(patient) });
  })
);

module.exports = router;
