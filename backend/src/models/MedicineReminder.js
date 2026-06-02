const mongoose = require('mongoose');

const medicineReminderSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    prescriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Prescription' },
    medicineName: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: {
      type: String,
      enum: ['once-daily', 'twice-daily', 'thrice-daily', 'four-times', 'weekly', 'as-needed', 'custom'],
      required: true
    },
    // Specific times for reminders
    reminderTimes: [{ type: String }], // ["08:00", "14:00", "20:00"]
    timing: { type: String, enum: ['before-food', 'after-food', 'empty-stomach', 'bedtime', 'any'] },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    // Tracking
    adherenceLog: [{
      scheduledAt: { type: Date },
      takenAt: { type: Date },
      status: { type: String, enum: ['taken', 'missed', 'skipped', 'late'], default: 'missed' },
      notes: { type: String }
    }],
    // Notification preferences
    notifyVia: {
      type: [String],
      enum: ['push', 'sms', 'whatsapp', 'email'],
      default: ['push']
    },
    isActive: { type: Boolean, default: true },
    adherenceRate: { type: Number, default: 0 } // percentage
  },
  { timestamps: true }
);

medicineReminderSchema.index({ patientId: 1, isActive: 1 });

module.exports = mongoose.model('MedicineReminder', medicineReminderSchema);
