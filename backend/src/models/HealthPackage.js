const mongoose = require('mongoose');

const healthPackageSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    category: {
      type: String,
      enum: ['preventive', 'wellness', 'chronic-care', 'women-health', 'senior-care', 'child-care', 'corporate', 'custom'],
      default: 'preventive'
    },
    // Included services
    services: [{
      name: { type: String, required: true },
      type: { type: String, enum: ['consultation', 'lab-test', 'procedure', 'imaging', 'other'] },
      normalPrice: { type: Number },
      included: { type: Boolean, default: true }
    }],
    // Pricing
    totalValue: { type: Number, required: true },
    packagePrice: { type: Number, required: true },
    discountPercentage: { type: Number },
    // Validity
    validityDays: { type: Number, default: 365 },
    // Availability
    ageGroup: { type: String }, // "18-40", "40-60", "60+"
    gender: { type: String, enum: ['male', 'female', 'all'], default: 'all' },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    bookingsCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const packageBookingSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'HealthPackage', required: true },
    status: {
      type: String,
      enum: ['booked', 'in-progress', 'completed', 'cancelled'],
      default: 'booked'
    },
    servicesCompleted: [{
      serviceName: { type: String },
      completedAt: { type: Date },
      result: { type: String },
      notes: { type: String }
    }],
    amountPaid: { type: Number },
    paymentId: { type: String },
    validUntil: { type: Date },
    reportUrl: { type: String }
  },
  { timestamps: true }
);

const HealthPackage = mongoose.model('HealthPackage', healthPackageSchema);
const PackageBooking = mongoose.model('PackageBooking', packageBookingSchema);

module.exports = { HealthPackage, PackageBooking };
