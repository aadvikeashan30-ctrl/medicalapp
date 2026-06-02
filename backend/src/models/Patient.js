const mongoose = require('mongoose');
const { nextSeq } = require('./Counter');

const patientSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: String, unique: true, index: true }, // Auto-generated: PAT-0001
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    email: { type: String, trim: true, lowercase: true },
    age: { type: Number, min: 0, max: 150 },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    dateOfBirth: { type: Date },
    bloodGroup: { type: String },
    address: { type: String },
    city: { type: String },
    emergencyContact: { type: String },
    allergies: [{ type: String }],
    medicalHistory: [{ type: String }],
    // Specialty-specific fields
    dentalChart: { type: Object },
    visionRecord: { type: Object },
    growthChart: [{ type: Object }],
    skinPhotos: [{ type: String }],
    notes: { type: String },
    lastVisit: { type: Date },
    totalVisits: { type: Number, default: 0 },
    totalBilled: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Atomic patient ID generation
patientSchema.pre('save', async function (next) {
  if (this.patientId) return next();
  try {
    const seq = await nextSeq(`patient:${this.doctorId}`);
    this.patientId = `PAT-${String(seq).padStart(4, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Patient', patientSchema);
