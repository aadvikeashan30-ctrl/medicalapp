const mongoose = require('mongoose');

const familyMemberSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    relationship: {
      type: String,
      enum: ['self', 'spouse', 'child', 'parent', 'sibling', 'grandparent', 'other'],
      required: true
    },
    isPrimary: { type: Boolean, default: false }
  },
  { _id: false }
);

const familyAccountSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    familyName: { type: String, required: true },
    primaryPhone: { type: String, required: true, index: true },
    primaryEmail: { type: String },
    members: [familyMemberSchema],
    // Family health history
    familyMedicalHistory: [{
      condition: { type: String },
      affectedMembers: [{ type: String }],
      notes: { type: String }
    }],
    // Insurance
    insuranceProvider: { type: String },
    insurancePolicyNo: { type: String },
    insuranceExpiry: { type: Date },
    // Billing
    totalBilled: { type: Number, default: 0 },
    outstandingBalance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('FamilyAccount', familyAccountSchema);
