const mongoose = require('mongoose');
const { nextSeq } = require('./Counter');

const appointmentSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    date: { type: Date, required: true, index: true },
    timeSlot: { type: String, required: true }, // "10:00 AM"
    duration: { type: Number, default: 30 }, // minutes
    type: {
      type: String,
      enum: ['consultation', 'follow-up', 'procedure', 'emergency', 'checkup'],
      default: 'consultation'
    },
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled'
    },
    symptoms: { type: String },
    notes: { type: String },
    reminderSent: { type: Boolean, default: false },
    reminderSentAt: { type: Date },
    tokenNumber: { type: Number },
    // Payment fields
    paymentId: { type: String },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded', 'failed'], default: 'pending' },
    paymentMethod: { type: String, enum: ['cash', 'online', 'upi', 'card', 'insurance'], default: 'cash' },
    consultationFee: { type: Number },
    // Telemedicine
    consultationMode: { type: String, enum: ['in-person', 'video', 'phone'], default: 'in-person' },
    videoRoomId: { type: String },
    videoJoinUrl: { type: String }
  },
  { timestamps: true }
);

// Compound index for daily queue lookups
appointmentSchema.index({ doctorId: 1, date: 1, timeSlot: 1 });

// Atomic per-day token number
appointmentSchema.pre('save', async function (next) {
  if (this.tokenNumber) return next();
  try {
    const day = new Date(this.date);
    day.setHours(0, 0, 0, 0);
    const key = `token:${this.doctorId}:${day.toISOString().slice(0, 10)}`;
    this.tokenNumber = await nextSeq(key);
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
