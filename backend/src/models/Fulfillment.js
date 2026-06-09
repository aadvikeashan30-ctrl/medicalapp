const mongoose = require('mongoose');

/**
 * Internal Fulfillment / Revenue Routing (Leakage Prevention)
 *
 * Every prescription or lab/imaging order generates a fulfillment record that
 * is routed to the in-house pharmacy / diagnostic lab by default, keeping the
 * transaction revenue inside the network instead of leaking to outside vendors.
 */
const fulfillmentItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    estimatedValue: { type: Number, default: 0 }
  },
  { _id: false }
);

const fulfillmentSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', index: true },
    patientName: { type: String },
    source: { type: String, enum: ['prescription', 'lab', 'imaging', 'manual'], default: 'manual' },
    sourceId: { type: mongoose.Schema.Types.ObjectId },
    type: { type: String, enum: ['pharmacy', 'lab', 'imaging'], required: true, index: true },
    items: [fulfillmentItemSchema],
    estimatedValue: { type: Number, default: 0 },
    destination: { type: String, enum: ['internal', 'external'], default: 'internal', index: true },
    status: { type: String, enum: ['routed', 'fulfilled', 'declined'], default: 'routed', index: true },
    note: { type: String }
  },
  { timestamps: true }
);

fulfillmentSchema.index({ doctorId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('Fulfillment', fulfillmentSchema);
