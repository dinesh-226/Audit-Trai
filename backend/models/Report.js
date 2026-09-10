const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  reportType: {
    type: String,
    enum: ['SOC2', 'GDPR', 'HIPAA', 'ISO27001', 'INTERNAL_AUDIT', 'SECURITY_REVIEW'],
    default: 'SOC2'
  },
  generatedBy: {
    id: { type: String, default: 'system' },
    name: { type: String, default: 'Chief Compliance Officer' },
    email: { type: String, default: 'compliance@auditflow.io' }
  },
  dateRange: {
    start: { type: Date, default: () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    end: { type: Date, default: () => new Date() },
    preset: { type: String, default: 'Last 30 Days' }
  },
  summary: {
    totalEvents: { type: Number, default: 0 },
    criticalEvents: { type: Number, default: 0 },
    highEvents: { type: Number, default: 0 },
    tamperStatus: {
      type: String,
      enum: ['VERIFIED_CLEAN', 'COMPROMISED', 'PENDING'],
      default: 'VERIFIED_CLEAN'
    },
    complianceScore: { type: Number, default: 100, min: 0, max: 100 },
    findings: [{ type: String }]
  },
  format: {
    type: String,
    enum: ['PDF', 'HTML', 'JSON', 'CSV'],
    default: 'PDF'
  },
  status: {
    type: String,
    enum: ['COMPLETED', 'DRAFT', 'ARCHIVED'],
    default: 'COMPLETED'
  }
}, {
  timestamps: true
});

reportSchema.index({ createdAt: -1 });
reportSchema.index({ reportType: 1 });

module.exports = mongoose.model('Report', reportSchema);
