const mongoose = require('mongoose');

/**
 * Wearable / IoT Device Sync with Smart Threshold Alerts
 *
 * Connects a patient to a consumer or medical device (Apple Watch, Fitbit,
 * CGM, digital BP cuff) and ingests readings. When values stay outside the
 * safe range, the record is flagged so the care team can prompt a check-in.
 */
const readingSchema = new mongoose.Schema(
  {
    value: { type: Number, required: true },
    secondaryValue: { type: Number }, // e.g. diastolic for BP
    takenAt: { type: Date, default: Date.now },
    flagged: { type: Boolean, default: false },
    source: { type: String, default: 'device' }
  },
  { _id: true }
);

const wearableSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    patientName: { type: String },
    deviceType: {
      type: String,
      enum: ['apple-watch', 'fitbit', 'cgm', 'bp-cuff', 'pulse-ox', 'smart-scale', 'other'],
      default: 'apple-watch'
    },
    metric: {
      type: String,
      enum: ['heart-rate', 'glucose', 'blood-pressure', 'spo2', 'weight', 'steps', 'temperature'],
      required: true
    },
    unit: { type: String },
    thresholds: {
      min: { type: Number },
      max: { type: Number },
      minSecondary: { type: Number },
      maxSecondary: { type: Number }
    },
    status: { type: String, enum: ['connected', 'disconnected'], default: 'connected', index: true },
    readings: [readingSchema],
    lastSyncedAt: { type: Date },
    alertActive: { type: Boolean, default: false, index: true },
    alertSince: { type: Date }
  },
  { timestamps: true }
);

wearableSchema.index({ doctorId: 1, alertActive: 1, updatedAt: -1 });

module.exports = mongoose.model('Wearable', wearableSchema);
