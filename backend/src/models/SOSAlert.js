const mongoose = require('mongoose');

/**
 * Emergency SOS — patient-triggered or staff-logged emergency alert.
 */
const sosAlertSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    patientName: { type: String, required: true },
    patientPhone: { type: String },
    type: {
      type: String,
      enum: ['cardiac', 'fall', 'breathing', 'accident', 'severe-pain', 'other'],
      default: 'other'
    },
    location: { type: String },
    note: { type: String },
    status: { type: String, enum: ['active', 'acknowledged', 'dispatched', 'resolved'], default: 'active', index: true },
    acknowledgedAt: { type: Date },
    resolvedAt: { type: Date }
  },
  { timestamps: true }
);

sosAlertSchema.index({ doctorId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('SOSAlert', sosAlertSchema);
