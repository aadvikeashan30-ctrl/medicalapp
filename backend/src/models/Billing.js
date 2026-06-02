const mongoose = require('mongoose');
const { nextSeq } = require('./Counter');

const billingItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    amount: { type: Number, required: true }
  },
  { _id: false }
);

const billingSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    invoiceNo: { type: String, index: true },
    items: [billingItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card', 'online', 'insurance'],
      default: 'cash'
    },
    paymentStatus: {
      type: String,
      enum: ['paid', 'partial', 'pending', 'refunded'],
      default: 'pending'
    },
    notes: { type: String }
  },
  { timestamps: true }
);

billingSchema.pre('save', async function (next) {
  if (this.invoiceNo) return next();
  try {
    const seq = await nextSeq(`invoice:${this.doctorId}`);
    this.invoiceNo = `INV-${String(seq).padStart(5, '0')}`;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Billing', billingSchema);
