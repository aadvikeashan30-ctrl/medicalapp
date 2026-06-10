const mongoose = require('mongoose');

/**
 * Google Review Automation — track review requests sent to patients and
 * conversions, nudging happy patients toward a public 5-star review.
 */
const reviewSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    patientName: { type: String, required: true },
    patientPhone: { type: String },
    channel: { type: String, enum: ['whatsapp', 'sms'], default: 'whatsapp' },
    rating: { type: Number, min: 1, max: 5 }, // internal pre-rating if captured
    status: {
      type: String,
      enum: ['requested', 'opened', 'reviewed', 'declined'],
      default: 'requested',
      index: true
    },
    requestedAt: { type: Date, default: Date.now },
    reviewedAt: { type: Date }
  },
  { timestamps: true }
);

reviewSchema.index({ doctorId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Review', reviewSchema);
