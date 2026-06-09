const mongoose = require('mongoose');
const { nextSeq } = require('./Counter');

/**
 * Medical Certificate
 * Doctors routinely issue sick-leave, fitness, and medical certificates.
 * Each certificate gets a clinic-friendly sequential number (CERT-00001)
 * scoped per doctor, mirroring the prescription/invoice numbering pattern.
 */
const medicalCertificateSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    certificateNo: { type: String, index: true },
    type: {
      type: String,
      enum: ['sick-leave', 'fitness', 'medical', 'fitness-to-work', 'travel', 'custom'],
      default: 'sick-leave'
    },
    // Clinical context
    diagnosis: { type: String },
    // Sick-leave / rest advised window
    restFromDate: { type: Date },
    restToDate: { type: Date },
    restDays: { type: Number },
    // Fitness-to-resume
    fitToResumeDate: { type: Date },
    // Free-form body / remarks (used directly for "custom" certificates)
    remarks: { type: String },
    // Who the certificate is addressed to (employer, school, authority, etc.)
    issuedTo: { type: String },
    issuedDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'cancelled'], default: 'active' }
  },
  { timestamps: true }
);

medicalCertificateSchema.index({ doctorId: 1, createdAt: -1 });

// Compute restDays from the date window when not supplied
medicalCertificateSchema.pre('validate', function (next) {
  if (this.restFromDate && this.restToDate && !this.restDays) {
    const ms = new Date(this.restToDate) - new Date(this.restFromDate);
    if (ms >= 0) this.restDays = Math.floor(ms / (1000 * 60 * 60 * 24)) + 1;
  }
  next();
});

// Atomic per-doctor certificate number
medicalCertificateSchema.pre('save', async function (next) {
  if (this.certificateNo) return next();
  try {
    const seq = await nextSeq(`cert:${this.doctorId}`);
    this.certificateNo = `CERT-${String(seq).padStart(5, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('MedicalCertificate', medicalCertificateSchema);
