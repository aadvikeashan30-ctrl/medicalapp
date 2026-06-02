const mongoose = require('mongoose');

const vaccinationSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    vaccineName: { type: String, required: true },
    vaccineType: {
      type: String,
      enum: ['childhood', 'adult', 'travel', 'seasonal', 'covid', 'other'],
      default: 'other'
    },
    manufacturer: { type: String },
    batchNumber: { type: String },
    doseNumber: { type: Number, default: 1 },
    totalDoses: { type: Number, default: 1 },
    administeredDate: { type: Date, required: true },
    nextDueDate: { type: Date },
    administeredBy: { type: String },
    site: { type: String }, // Left arm, Right thigh, etc.
    route: { type: String, enum: ['intramuscular', 'subcutaneous', 'oral', 'intranasal', 'intradermal'] },
    // Adverse reactions
    adverseReaction: { type: Boolean, default: false },
    reactionDetails: { type: String },
    // Certificate
    certificateUrl: { type: String },
    // Status
    status: {
      type: String,
      enum: ['completed', 'scheduled', 'overdue', 'cancelled'],
      default: 'completed'
    },
    reminderSent: { type: Boolean, default: false },
    notes: { type: String }
  },
  { timestamps: true }
);

vaccinationSchema.index({ patientId: 1, status: 1 });
vaccinationSchema.index({ nextDueDate: 1, status: 1 });

module.exports = mongoose.model('Vaccination', vaccinationSchema);
