const mongoose = require('mongoose');

/**
 * Automated Care Pathway (Digital Checklist)
 *
 * Translates a doctor's post-visit instructions into a recurring daily
 * checklist the patient (or care team) can tick off — medications, exercises,
 * measurements, diet, etc. Completion is logged per task per calendar day.
 */
const taskSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    category: {
      type: String,
      enum: ['medication', 'exercise', 'measurement', 'diet', 'appointment', 'other'],
      default: 'other'
    },
    time: { type: String },        // e.g. "08:00 AM" or "Morning"
    frequency: { type: String, enum: ['daily', 'once', 'weekly'], default: 'daily' },
    instructions: { type: String }
  },
  { _id: true }
);

const completionSchema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, required: true },
    date: { type: String, required: true } // 'YYYY-MM-DD'
  },
  { _id: false }
);

const carePathwaySchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    patientName: { type: String },
    patientPhone: { type: String },
    title: { type: String, required: true },
    diagnosis: { type: String },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    status: { type: String, enum: ['active', 'completed', 'archived'], default: 'active', index: true },
    tasks: [taskSchema],
    completions: [completionSchema]
  },
  { timestamps: true }
);

carePathwaySchema.index({ doctorId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('CarePathway', carePathwaySchema);
