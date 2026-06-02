const mongoose = require('mongoose');

// WhatsApp Marketing Campaigns
const campaignSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['promotional', 'reminder', 'follow-up', 'health-tip', 'birthday', 'festival', 'custom'],
      required: true
    },
    channel: {
      type: String,
      enum: ['whatsapp', 'sms', 'email', 'push'],
      default: 'whatsapp'
    },
    // Content
    message: { type: String, required: true },
    mediaUrl: { type: String },
    templateId: { type: String }, // WhatsApp template ID
    // Audience
    audience: {
      type: { type: String, enum: ['all', 'segment', 'custom'], default: 'all' },
      filters: {
        ageRange: { min: Number, max: Number },
        gender: { type: String },
        lastVisitDays: { type: Number }, // patients who visited in last N days
        condition: { type: String },
        city: { type: String }
      },
      customPatientIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Patient' }]
    },
    // Scheduling
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'],
      default: 'draft'
    },
    // Results
    totalRecipients: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    read: { type: Number, default: 0 },
    replied: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    // Cost tracking
    costPerMessage: { type: Number, default: 0 },
    totalCost: { type: Number, default: 0 }
  },
  { timestamps: true }
);

campaignSchema.index({ doctorId: 1, status: 1, createdAt: -1 });

// Google Review Automation
const reviewRequestSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' },
    // Request details
    sentAt: { type: Date },
    sentVia: { type: String, enum: ['whatsapp', 'sms', 'email'], default: 'whatsapp' },
    googleReviewUrl: { type: String },
    status: {
      type: String,
      enum: ['pending', 'sent', 'clicked', 'reviewed', 'declined'],
      default: 'pending'
    },
    // Response
    rating: { type: Number, min: 1, max: 5 },
    reviewText: { type: String },
    reviewedAt: { type: Date },
    // Internal feedback (if patient gives negative feedback)
    internalFeedback: { type: String },
    internalRating: { type: Number, min: 1, max: 5 }
  },
  { timestamps: true }
);

const Campaign = mongoose.model('Campaign', campaignSchema);
const ReviewRequest = mongoose.model('ReviewRequest', reviewRequestSchema);

module.exports = { Campaign, ReviewRequest };
