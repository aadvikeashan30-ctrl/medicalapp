const mongoose = require('mongoose');

const eSignatureSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    signatureType: {
      type: String,
      enum: ['drawn', 'typed', 'uploaded'],
      default: 'drawn'
    },
    signatureData: { type: String }, // Base64 for drawn, text for typed, URL for uploaded
    signatureUrl: { type: String },
    fontFamily: { type: String }, // for typed signatures
    // Stamp/seal
    stampUrl: { type: String },
    // Verification
    isVerified: { type: Boolean, default: false },
    registrationNo: { type: String },
    // Usage
    autoApply: { type: Boolean, default: true }, // auto-apply to prescriptions
    applyTo: {
      type: [String],
      enum: ['prescriptions', 'lab-orders', 'referrals', 'certificates', 'invoices'],
      default: ['prescriptions']
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ESignature', eSignatureSchema);
