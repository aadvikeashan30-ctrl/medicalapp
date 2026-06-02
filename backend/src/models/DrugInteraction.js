const mongoose = require('mongoose');

// Drug interaction database for Clinical Decision Support
const drugInteractionSchema = new mongoose.Schema(
  {
    drug1: { type: String, required: true, index: true, lowercase: true },
    drug2: { type: String, required: true, index: true, lowercase: true },
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'major', 'contraindicated'],
      required: true
    },
    description: { type: String, required: true },
    mechanism: { type: String },
    clinicalEffect: { type: String },
    management: { type: String },
    references: [{ type: String }]
  },
  { timestamps: true }
);

drugInteractionSchema.index({ drug1: 1, drug2: 1 }, { unique: true });

// EMR Template for specialty-based templates
const emrTemplateSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    name: { type: String, required: true },
    specialty: {
      type: String,
      enum: ['general', 'dental', 'eye', 'ortho', 'pediatric', 'dermatology', 'ent', 'cardiology', 'gynecology', 'other'],
      required: true
    },
    category: { type: String }, // 'Chief Complaint', 'Review of Systems', etc.
    // Template structure
    sections: [{
      title: { type: String, required: true },
      type: { type: String, enum: ['text', 'checklist', 'dropdown', 'vitals', 'drawing', 'table'] },
      options: [{ type: String }], // for dropdown/checklist
      defaultValue: { type: String },
      required: { type: Boolean, default: false }
    }],
    // Common diagnoses for this template
    commonDiagnoses: [{ type: String }],
    commonMedicines: [{
      name: { type: String },
      dosage: { type: String },
      frequency: { type: String },
      duration: { type: String }
    }],
    isGlobal: { type: Boolean, default: false }, // available to all doctors
    isActive: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

emrTemplateSchema.index({ specialty: 1, isActive: 1 });
emrTemplateSchema.index({ doctorId: 1, specialty: 1 });

const DrugInteraction = mongoose.model('DrugInteraction', drugInteractionSchema);
const EMRTemplate = mongoose.model('EMRTemplate', emrTemplateSchema);

module.exports = { DrugInteraction, EMRTemplate };
