const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, required: true },
    phone: { type: String, required: true, trim: true },
    role: { type: String, enum: ['doctor', 'staff', 'admin'], default: 'doctor' },
    specialty: {
      type: String,
      enum: ['general', 'dental', 'eye', 'ortho', 'pediatric', 'dermatology', 'ent', 'cardiology', 'gynecology', 'other'],
      default: 'general'
    },
    clinicName: { type: String },
    clinicAddress: { type: String },
    clinicCity: { type: String },
    clinicLogo: { type: String },
    qualification: { type: String },
    registrationNo: { type: String },
    experience: { type: Number },
    consultationFee: { type: Number, default: 500 },
    workingHours: {
      start: { type: String, default: '09:00' },
      end: { type: String, default: '18:00' }
    },
    workingDays: [{ type: String }],
    plan: { type: String, enum: ['free', 'basic', 'pro', 'enterprise'], default: 'free' },
    planExpiry: { type: Date },
    isActive: { type: Boolean, default: true },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date }
  },
  { timestamps: true }
);

// Never leak password / reset fields
userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.password;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
