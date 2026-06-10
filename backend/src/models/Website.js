const mongoose = require('mongoose');

/**
 * Doctor Personal Website Generator — config for a public clinic microsite.
 */
const websiteSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    slug: { type: String, unique: true, sparse: true, index: true },
    published: { type: Boolean, default: false },
    headline: { type: String },
    about: { type: String },
    theme: { type: String, enum: ['teal', 'blue', 'violet', 'emerald', 'rose'], default: 'teal' },
    services: [{ type: String }],
    highlights: [{ type: String }], // e.g. "15+ years experience"
    photoUrl: { type: String },
    bookingEnabled: { type: Boolean, default: true },
    googleReviewUrl: { type: String },
    // Denormalized contact (falls back to user profile)
    contact: {
      phone: { type: String },
      email: { type: String },
      address: { type: String },
      mapUrl: { type: String }
    },
    views: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Website', websiteSchema);
