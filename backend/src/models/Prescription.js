const mongoose = require('mongoose');
const { nextSeq } = require('./Counter');

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dosage: { type: String }, // "500mg"
    frequency: { type: String }, // "1-0-1" or "Twice daily"
    duration: { type: String }, // "5 days"
    timing: { type: String, enum: ['before-food', 'after-food', 'empty-stomach', 'bedtime'] },
    notes: { type: String }
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    prescriptionNo: { type: String, index: true },
    diagnosis: { type: String },
    symptoms: [{ type: String }],
    medicines: [medicineSchema],
    tests: [{ type: String }],
    advice: { type: String },
    followUpDate: { type: Date },
    vitals: {
      bp: { type: String },
      pulse: { type: Number },
      temperature: { type: Number },
      weight: { type: Number },
      height: { type: Number },
      spo2: { type: Number }
    },
    isTemplate: { type: Boolean, default: false },
    templateName: { type: String }
  },
  { timestamps: true }
);

prescriptionSchema.pre('save', async function (next) {
  if (this.prescriptionNo || this.isTemplate) return next();
  try {
    const seq = await nextSeq(`rx:${this.doctorId}`);
    this.prescriptionNo = `RX-${String(seq).padStart(5, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Prescription', prescriptionSchema);
