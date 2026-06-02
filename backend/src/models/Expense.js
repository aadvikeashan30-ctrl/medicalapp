const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: {
      type: String,
      enum: ['rent', 'salary', 'supplies', 'equipment', 'utilities', 'marketing', 'insurance', 'maintenance', 'travel', 'other'],
      required: true
    },
    description: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, required: true, default: Date.now },
    vendor: { type: String, trim: true },
    paymentMethod: {
      type: String,
      enum: ['cash', 'upi', 'card', 'online', 'cheque'],
      default: 'cash'
    },
    isRecurring: { type: Boolean, default: false },
    recurringFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly', ''],
      default: ''
    },
    receiptUrl: { type: String },
    notes: { type: String },
    tags: [{ type: String }]
  },
  { timestamps: true }
);

expenseSchema.index({ doctorId: 1, date: -1 });
expenseSchema.index({ doctorId: 1, category: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
