const mongoose = require('mongoose');

// Digital Health Timeline - chronological view of all health events
const healthTimelineSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    eventDate: { type: Date, required: true, index: true },
    eventType: {
      type: String,
      enum: [
        'appointment', 'prescription', 'lab-test', 'vaccination',
        'vitals-recorded', 'diagnosis', 'procedure', 'hospitalization',
        'imaging', 'allergy-detected', 'medication-started', 'medication-stopped',
        'referral', 'follow-up', 'discharge', 'emergency', 'note'
      ],
      required: true
    },
    title: { type: String, required: true },
    description: { type: String },
    // Reference to source document
    referenceModel: { type: String }, // 'Appointment', 'Prescription', etc.
    referenceId: { type: mongoose.Schema.Types.ObjectId },
    // Key data snapshot
    data: { type: mongoose.Schema.Types.Mixed },
    // Importance
    importance: {
      type: String,
      enum: ['routine', 'notable', 'important', 'critical'],
      default: 'routine'
    },
    // AI insights
    aiInsight: { type: String },
    tags: [{ type: String }]
  },
  { timestamps: true }
);

healthTimelineSchema.index({ patientId: 1, eventDate: -1 });
healthTimelineSchema.index({ patientId: 1, eventType: 1 });

module.exports = mongoose.model('HealthTimeline', healthTimelineSchema);
