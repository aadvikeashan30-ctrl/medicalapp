const mongoose = require('mongoose');

/**
 * Payroll — per-staff monthly salary slip with allowances/deductions.
 */
const payrollSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    staffName: { type: String, required: true },
    role: { type: String, default: 'staff' },
    month: { type: String, required: true, index: true }, // 'YYYY-MM'
    baseSalary: { type: Number, default: 0 },
    allowances: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    daysPresent: { type: Number },
    netPay: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'approved', 'paid'], default: 'draft', index: true },
    paidAt: { type: Date },
    note: { type: String }
  },
  { timestamps: true }
);

payrollSchema.index({ doctorId: 1, month: -1 });

payrollSchema.pre('save', function (next) {
  this.netPay = (this.baseSalary || 0) + (this.allowances || 0) - (this.deductions || 0);
  next();
});

module.exports = mongoose.model('Payroll', payrollSchema);
