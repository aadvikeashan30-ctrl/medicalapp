const mongoose = require('mongoose');

// AI Health Assistant Chat messages
const chatMessageSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    sessionId: { type: String, required: true, index: true },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: { type: String, required: true },
    // AI metadata
    model: { type: String },
    tokens: { type: Number },
    // Context
    context: {
      type: { type: String, enum: ['general', 'symptom-check', 'medication-query', 'lab-interpretation', 'diet-advice', 'follow-up'] },
      relatedRecords: [{ type: mongoose.Schema.Types.ObjectId }]
    },
    // Safety
    flagged: { type: Boolean, default: false },
    disclaimer: { type: String },
    // Attachments (lab reports, images)
    attachments: [{
      type: { type: String },
      url: { type: String },
      name: { type: String }
    }]
  },
  { timestamps: true }
);

chatMessageSchema.index({ sessionId: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
