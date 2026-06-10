const mongoose = require('mongoose');

/**
 * Patient Reactivation Engine — tracks outreach to lapsed patients.
 */
const reactivationLogSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    patientName: { type: String },
    patientPhone: { type: String },
    channel: { type: String, enum: ['whatsapp', 'sms', 'call', 'email'], default: 'whatsapp' },
    message: { type: String },
    status: { type: String, enum: ['contacted', 'responded', 'rebooked', 'no-response'], default: 'contacted', index: true },
    contactedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

reactivationLogSchema.index({ doctorId: 1, patientId: 1, createdAt: -1 });

module.exports = mongoose.model('ReactivationLog', reactivationLogSchema);
