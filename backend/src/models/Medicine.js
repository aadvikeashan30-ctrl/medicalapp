const mongoose = require('mongoose');

// Per-doctor medicine master so they can build their own quick-pick library
const medicineSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    genericName: { type: String, trim: true },
    strength: { type: String }, // e.g. "500mg"
    form: { type: String }, // tablet, syrup, injection, ointment...
    defaultFrequency: { type: String }, // "1-0-1"
    defaultDuration: { type: String }, // "5 days"
    defaultTiming: { type: String, enum: ['before-food', 'after-food', 'empty-stomach', 'bedtime'] },
    notes: { type: String },
    usageCount: { type: Number, default: 0 } // for "most used" sorting
  },
  { timestamps: true }
);

medicineSchema.index({ doctorId: 1, name: 1 });

module.exports = mongoose.model('Medicine', medicineSchema);
