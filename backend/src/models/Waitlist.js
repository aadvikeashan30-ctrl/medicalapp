const mongoose = require('mongoose');

/**
 * Waitlist — No-Show / Cancellation Auto-Fill
 *
 * When a high-value slot (MRI, CT, specialist visit, etc.) is freed up,
 * the scheduler blasts the waiting patients so the slot — and the
 * hospital's equipment/clinician time — doesn't sit idle.
 */
const waitlistSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    // Captured directly so we can notify even non-registered patients
    patientName: { type: String, required: true },
    patientPhone: { type: String, required: true },
    // What they're waiting for — e.g. "MRI", "consultation", "CT scan"
    service: { type: String, default: 'consultation' },
    preferredDate: { type: Date },
    preferredTime: { type: String },
    priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
    status: {
      type: String,
      enum: ['waiting', 'notified', 'booked', 'expired', 'cancelled'],
      default: 'waiting',
      index: true
    },
    notifiedAt: { type: Date },
    notifyCount: { type: Number, default: 0 },
    note: { type: String }
  },
  { timestamps: true }
);

waitlistSchema.index({ doctorId: 1, status: 1, priority: -1, createdAt: 1 });

module.exports = mongoose.model('Waitlist', waitlistSchema);
