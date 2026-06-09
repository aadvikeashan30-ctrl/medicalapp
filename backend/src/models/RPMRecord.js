const mongoose = require('mongoose');

/**
 * Remote Patient Monitoring (RPM) Reimbursement Tracker
 *
 * For chronic-care patients using connected devices, logs the monitoring
 * minutes & transmission days required by reimbursement rules and derives the
 * billable CPT codes (99453/99454/99457/99458) the hospital can claim.
 */
const rpmLogSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    minutes: { type: Number, default: 0 },   // clinician monitoring/management time
    readings: { type: Number, default: 0 },  // device transmissions logged
    note: { type: String }
  },
  { _id: true }
);

const rpmRecordSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    patientName: { type: String },
    deviceType: {
      type: String,
      enum: ['bp-cuff', 'cgm', 'weight-scale', 'pulse-ox', 'spirometer', 'ecg', 'other'],
      default: 'bp-cuff'
    },
    condition: { type: String },
    status: { type: String, enum: ['active', 'paused', 'ended'], default: 'active', index: true },
    enrolledDate: { type: Date, default: Date.now },
    setupBilled: { type: Boolean, default: false }, // 99453 claimed once
    logs: [rpmLogSchema]
  },
  { timestamps: true }
);

rpmRecordSchema.index({ doctorId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('RPMRecord', rpmRecordSchema);
