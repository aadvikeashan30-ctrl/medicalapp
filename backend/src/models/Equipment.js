const mongoose = require('mongoose');

/**
 * Equipment registry with maintenance history, service scheduling and AMC
 * (Annual Maintenance Contract) tracking.
 */

const maintenanceLogSchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    type: { type: String, enum: ['preventive', 'repair', 'calibration', 'inspection'], default: 'preventive' },
    description: { type: String, trim: true },
    cost: { type: Number, default: 0, min: 0 },
    technician: { type: String, trim: true },
    nextDue: { type: Date }
  },
  { _id: true }
);

const equipmentSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, trim: true }, // diagnostic, surgical, monitoring, lab...
    serialNo: { type: String, trim: true },
    model: { type: String, trim: true },
    manufacturer: { type: String, trim: true },
    location: { type: String, trim: true }, // room / branch
    status: {
      type: String,
      enum: ['operational', 'maintenance', 'out-of-service', 'retired'],
      default: 'operational'
    },
    purchaseDate: { type: Date },
    purchasePrice: { type: Number, default: 0, min: 0 },
    // Service scheduling
    serviceIntervalDays: { type: Number, default: 180 },
    lastServiceDate: { type: Date },
    nextServiceDate: { type: Date },
    // AMC tracking
    amc: {
      provider: { type: String, trim: true },
      contractNo: { type: String, trim: true },
      startDate: { type: Date },
      endDate: { type: Date },
      cost: { type: Number, default: 0, min: 0 },
      active: { type: Boolean, default: false }
    },
    maintenanceLogs: [maintenanceLogSchema],
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

equipmentSchema.index({ doctorId: 1, name: 1 });

module.exports = mongoose.model('Equipment', equipmentSchema);
