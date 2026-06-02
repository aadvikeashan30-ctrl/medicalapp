const mongoose = require('mongoose');

// Personal Health Record (PHR) - comprehensive patient health data
const healthRecordSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Vitals history
    vitals: {
      bp: { type: String },
      pulse: { type: Number },
      temperature: { type: Number },
      weight: { type: Number },
      height: { type: Number },
      spo2: { type: Number },
      bmi: { type: Number },
      bloodSugar: { type: Number },
      respiratoryRate: { type: Number }
    },
    // Record type
    recordType: {
      type: String,
      enum: ['vitals', 'diagnosis', 'procedure', 'lab-result', 'imaging', 'vaccination', 'allergy', 'medication', 'note', 'discharge-summary'],
      required: true
    },
    title: { type: String, required: true },
    description: { type: String },
    // Structured data based on type
    data: { type: mongoose.Schema.Types.Mixed },
    // Attachments (lab reports, images, etc.)
    attachments: [{
      fileName: { type: String },
      fileUrl: { type: String },
      fileType: { type: String },
      uploadedAt: { type: Date, default: Date.now }
    }],
    // Tags for easy search
    tags: [{ type: String }],
    // Privacy
    isConfidential: { type: Boolean, default: false },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // ABDM integration
    abdmHealthId: { type: String },
    abdmLinked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

healthRecordSchema.index({ patientId: 1, recordType: 1, createdAt: -1 });
healthRecordSchema.index({ patientId: 1, tags: 1 });

module.exports = mongoose.model('HealthRecord', healthRecordSchema);
