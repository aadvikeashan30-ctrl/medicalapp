const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    name: { type: String, required: true }, // "Complete Blood Count"
    category: { type: String }, // "Hematology", "Imaging", etc.
    instructions: { type: String },
    reportUrl: { type: String }, // Uploaded report file
    status: {
      type: String,
      enum: ['ordered', 'sample-collected', 'reported', 'cancelled'],
      default: 'ordered'
    },
    resultSummary: { type: String },
    resultedAt: { type: Date }
  },
  { timestamps: true }
);

module.exports = mongoose.model('LabTest', labTestSchema);
