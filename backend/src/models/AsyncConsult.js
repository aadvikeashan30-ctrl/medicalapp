const mongoose = require('mongoose');

/**
 * Asynchronous Consultation Panel
 *
 * Patients submit routine, image-based cases (rashes, wound checks, follow-up
 * questions) into a queue the doctor reviews during downtime — instead of
 * booking a live video slot. Reduces synchronous load while keeping care timely.
 */
const asyncConsultSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', index: true },
    patientName: { type: String, required: true },
    patientPhone: { type: String },
    category: {
      type: String,
      enum: ['dermatology', 'wound-check', 'follow-up', 'medication-query', 'lab-review', 'general'],
      default: 'general'
    },
    description: { type: String, required: true },
    photos: [{ type: String }],
    priority: { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
    status: {
      type: String,
      enum: ['pending', 'in-review', 'responded', 'closed'],
      default: 'pending',
      index: true
    },
    response: {
      text: { type: String },
      respondedAt: { type: Date },
      followUpAdvised: { type: Boolean, default: false }
    }
  },
  { timestamps: true }
);

asyncConsultSchema.index({ doctorId: 1, status: 1, priority: -1, createdAt: 1 });

module.exports = mongoose.model('AsyncConsult', asyncConsultSchema);
