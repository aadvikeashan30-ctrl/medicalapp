const mongoose = require('mongoose');

const backupSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    backupType: {
      type: String,
      enum: ['full', 'incremental', 'patients', 'prescriptions', 'billing', 'custom'],
      default: 'full'
    },
    // File details
    fileName: { type: String, required: true },
    fileUrl: { type: String },
    fileSize: { type: Number }, // bytes
    format: { type: String, enum: ['json', 'csv', 'xlsx'], default: 'json' },
    // Content
    collections: [{ type: String }], // which collections were backed up
    recordCount: { type: Number, default: 0 },
    // Status
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'failed', 'expired'],
      default: 'in-progress'
    },
    error: { type: String },
    completedAt: { type: Date },
    // Encryption
    isEncrypted: { type: Boolean, default: true },
    encryptionKey: { type: String }, // encrypted key reference
    // Restore info
    lastRestoredAt: { type: Date },
    restoredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    // Auto-delete after 30 days
    expiresAt: { type: Date }
  },
  { timestamps: true }
);

backupSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Backup', backupSchema);
