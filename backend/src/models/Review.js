const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    patientName: { type: String, required: true, trim: true },
    patientPhone: { type: String, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 100 },
    comment: { type: String, trim: true, maxlength: 500 },
    tags: [{ type: String, enum: ['punctual', 'thorough', 'friendly', 'good-listener', 'explains-well', 'affordable', 'clean-clinic', 'short-wait'] }],
    isVerified: { type: Boolean, default: false }, // verified via appointment
    isVisible: { type: Boolean, default: true },
    doctorReply: { type: String, trim: true, maxlength: 300 },
    doctorRepliedAt: { type: Date }
  },
  { timestamps: true }
);

// Compound index to prevent duplicate reviews per patient per doctor
reviewSchema.index({ doctorId: 1, patientPhone: 1 }, { unique: true, sparse: true });

// Static method to get average rating for a doctor
reviewSchema.statics.getAverageRating = async function (doctorId) {
  const result = await this.aggregate([
    { $match: { doctorId: new mongoose.Types.ObjectId(doctorId), isVisible: true } },
    {
      $group: {
        _id: '$doctorId',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        distribution: {
          $push: '$rating'
        }
      }
    }
  ]);

  if (!result.length) return { avgRating: 0, totalReviews: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };

  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  result[0].distribution.forEach(r => { dist[r] = (dist[r] || 0) + 1; });

  return {
    avgRating: Math.round(result[0].avgRating * 10) / 10,
    totalReviews: result[0].totalReviews,
    distribution: dist
  };
};

module.exports = mongoose.model('Review', reviewSchema);
