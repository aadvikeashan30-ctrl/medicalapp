const mongoose = require('mongoose');
const { nextSeq } = require('./Counter');

const referralSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    referrerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    referredPatientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    referralCode: { type: String, unique: true, index: true },
    referredName: { type: String, required: true },
    referredPhone: { type: String, required: true },
    // Status tracking
    status: {
      type: String,
      enum: ['pending', 'registered', 'visited', 'rewarded', 'expired'],
      default: 'pending'
    },
    // Reward configuration
    rewardType: { type: String, enum: ['discount', 'cashback', 'free-consultation', 'points'], default: 'discount' },
    rewardValue: { type: Number, default: 0 },
    referrerRewardValue: { type: Number, default: 0 },
    referrerRewarded: { type: Boolean, default: false },
    referredRewarded: { type: Boolean, default: false },
    // Tracking
    registeredAt: { type: Date },
    firstVisitAt: { type: Date },
    rewardedAt: { type: Date },
    expiresAt: { type: Date }
  },
  { timestamps: true }
);

referralSchema.pre('save', async function (next) {
  if (this.referralCode) return next();
  try {
    const seq = await nextSeq(`referral:${this.doctorId}`);
    const code = `REF-${String(seq).padStart(4, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    this.referralCode = code;
    next();
  } catch (err) {
    next(err);
  }
});

// Referral Program Settings
const referralSettingsSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    isActive: { type: Boolean, default: true },
    referrerReward: {
      type: { type: String, enum: ['discount', 'cashback', 'free-consultation', 'points'], default: 'discount' },
      value: { type: Number, default: 10 } // percentage or fixed
    },
    referredReward: {
      type: { type: String, enum: ['discount', 'cashback', 'free-consultation', 'points'], default: 'discount' },
      value: { type: Number, default: 10 }
    },
    expiryDays: { type: Number, default: 30 },
    maxReferralsPerPatient: { type: Number, default: 10 },
    termsAndConditions: { type: String }
  },
  { timestamps: true }
);

const Referral = mongoose.model('Referral', referralSchema);
const ReferralSettings = mongoose.model('ReferralSettings', referralSettingsSchema);

module.exports = { Referral, ReferralSettings };
