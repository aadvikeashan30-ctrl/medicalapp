const mongoose = require('mongoose');

/**
 * Doctor Availability / Leave Blocking
 *
 * Lets a doctor block off time so the scheduler won't accept bookings during it.
 * Two granularities:
 *   - "full-day"  → entire day(s) blocked (e.g. on leave, holiday, conference)
 *   - "slot"      → specific time window(s) within a single day blocked
 *
 * The appointment create/reschedule flow consults this collection and rejects
 * any booking that overlaps an active block.
 */
const doctorAvailabilitySchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['full-day', 'slot'], default: 'full-day' },
    // Inclusive date range. For a single day, startDate === endDate (date-only, normalized to 00:00).
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    // For "slot" blocks — HH:MM 24h strings, e.g. "13:00".."14:00"
    startTime: { type: String },
    endTime: { type: String },
    reason: {
      type: String,
      enum: ['leave', 'holiday', 'conference', 'personal', 'break', 'emergency', 'other'],
      default: 'leave'
    },
    note: { type: String }
  },
  { timestamps: true }
);

doctorAvailabilitySchema.index({ doctorId: 1, startDate: 1, endDate: 1 });

/**
 * Parse a "10:00 AM" / "14:30" style time slot into minutes since midnight.
 * Returns null if it cannot be parsed.
 */
function slotToMinutes(slot) {
  if (!slot || typeof slot !== 'string') return null;
  const s = slot.trim().toUpperCase();
  const m = s.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/);
  if (!m) return null;
  let hour = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ampm = m[3];
  if (ampm === 'PM' && hour < 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return hour * 60 + min;
}

/**
 * Check whether a doctor is blocked for a given date + (optional) time slot.
 * @returns {Promise<Object|null>} the blocking record, or null if free.
 */
doctorAvailabilitySchema.statics.findBlock = async function (doctorId, date, timeSlot) {
  const day = new Date(date);
  if (Number.isNaN(day.getTime())) return null;
  day.setHours(0, 0, 0, 0);

  const blocks = await this.find({
    doctorId,
    startDate: { $lte: day },
    endDate: { $gte: day }
  });

  if (blocks.length === 0) return null;

  const slotMin = slotToMinutes(timeSlot);

  for (const block of blocks) {
    if (block.type === 'full-day') return block;
    // slot block — only blocks the matching window
    if (block.type === 'slot') {
      if (slotMin == null) continue; // can't evaluate without a parseable time
      const from = slotToMinutes(block.startTime);
      const to = slotToMinutes(block.endTime);
      if (from == null || to == null) continue;
      if (slotMin >= from && slotMin < to) return block;
    }
  }
  return null;
};

module.exports = mongoose.model('DoctorAvailability', doctorAvailabilitySchema);
module.exports.slotToMinutes = slotToMinutes;
