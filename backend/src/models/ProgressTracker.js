const mongoose = require('mongoose');

/**
 * Visual Wound & Skin Progress Tracker
 *
 * A patient/condition-scoped series of dated photo entries (e.g. post-op wound,
 * dermatological condition) so the care team can visually track healing over time.
 * Each entry captures a photo URL, clinical note, and an assessment of the trend.
 */
const entrySchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    photoUrl: { type: String, required: true },
    note: { type: String },
    assessment: { type: String, enum: ['improving', 'stable', 'worsening', 'healed'], default: 'stable' },
    measurementCm: { type: Number } // optional wound size
  },
  { _id: true, timestamps: true }
);

const progressTrackerSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    patientName: { type: String },
    bodyArea: { type: String, required: true }, // e.g. "Left forearm"
    condition: { type: String },                 // e.g. "Post-op suture site", "Eczema"
    status: { type: String, enum: ['active', 'healed', 'archived'], default: 'active', index: true },
    entries: [entrySchema]
  },
  { timestamps: true }
);

progressTrackerSchema.index({ doctorId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('ProgressTracker', progressTrackerSchema);
