const mongoose = require('mongoose');
const { nextSeq } = require('./Counter');

const membershipPlanSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    planName: { type: String, required: true },
    description: { type: String },
    duration: { type: Number, required: true }, // months
    price: { type: Number, required: true },
    benefits: [{
      title: { type: String },
      description: { type: String },
      value: { type: Number } // discount percentage or fixed amount
    }],
    // Inclusions
    freeConsultations: { type: Number, default: 0 },
    discountPercentage: { type: Number, default: 0 },
    freeLabTests: { type: Number, default: 0 },
    priorityBooking: { type: Boolean, default: false },
    telemedicineIncluded: { type: Boolean, default: false },
    // Limits
    maxMembers: { type: Number, default: 1 }, // family plan support
    isActive: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const membershipSubscriptionSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    planId: { type: mongoose.Schema.Types.ObjectId, ref: 'MembershipPlan', required: true },
    membershipNo: { type: String, unique: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'paused'],
      default: 'active'
    },
    // Usage tracking
    consultationsUsed: { type: Number, default: 0 },
    labTestsUsed: { type: Number, default: 0 },
    totalSavings: { type: Number, default: 0 },
    // Payment
    amountPaid: { type: Number, required: true },
    paymentId: { type: String },
    paymentMethod: { type: String },
    autoRenew: { type: Boolean, default: false },
    // Family members covered
    coveredMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }]
  },
  { timestamps: true }
);

membershipSubscriptionSchema.pre('save', async function (next) {
  if (this.membershipNo) return next();
  try {
    const seq = await nextSeq(`membership:${this.doctorId}`);
    this.membershipNo = `MEM-${String(seq).padStart(5, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

const MembershipPlan = mongoose.model('MembershipPlan', membershipPlanSchema);
const MembershipSubscription = mongoose.model('MembershipSubscription', membershipSubscriptionSchema);

module.exports = { MembershipPlan, MembershipSubscription };
