const mongoose = require('mongoose');

/**
 * Staff Attendance — daily check-in/out with computed hours.
 */
const attendanceSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    staffName: { type: String, required: true },
    role: { type: String, default: 'staff' },
    date: { type: String, required: true, index: true }, // 'YYYY-MM-DD'
    checkIn: { type: Date },
    checkOut: { type: Date },
    hours: { type: Number, default: 0 },
    status: { type: String, enum: ['present', 'absent', 'half-day', 'leave', 'on-duty'], default: 'on-duty' },
    note: { type: String }
  },
  { timestamps: true }
);

attendanceSchema.index({ doctorId: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
