const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userRole: { type: String },
    userName: { type: String },
    action: {
      type: String,
      enum: [
        'create', 'read', 'update', 'delete',
        'login', 'logout', 'failed-login',
        'export', 'print', 'share',
        'prescription-create', 'prescription-update',
        'patient-create', 'patient-update', 'patient-delete',
        'billing-create', 'payment-received',
        'appointment-create', 'appointment-cancel',
        'settings-update', 'role-change',
        'backup-create', 'backup-restore',
        'data-export', 'report-generate'
      ],
      required: true
    },
    resource: { type: String, required: true }, // 'Patient', 'Prescription', etc.
    resourceId: { type: mongoose.Schema.Types.ObjectId },
    description: { type: String },
    // Change details
    changes: {
      before: { type: mongoose.Schema.Types.Mixed },
      after: { type: mongoose.Schema.Types.Mixed }
    },
    // Context
    ipAddress: { type: String },
    userAgent: { type: String },
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    // Severity
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      default: 'info'
    }
  },
  { timestamps: true }
);

// Indexes for efficient querying
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });

// TTL index - auto-delete logs older than 2 years
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
