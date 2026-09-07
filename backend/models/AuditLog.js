const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  userName: {
    type: String,
    default: 'System User'
  },
  userEmail: {
    type: String,
    default: ''
  },
  userRole: {
    type: String,
    enum: ['admin', 'manager', 'lead', 'auditor', 'member', 'developer', 'viewer', 'system'],
    default: 'member'
  },
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'IMPORT', 'EXPORT', 'LOGIN', 'LOGOUT', 'PERMISSION_CHANGE', 'ACCESS_REVOKED'],
    index: true
  },
  entityType: {
    type: String,
    required: true,
    enum: ['Project', 'Task', 'Budget', 'Document', 'Approval', 'Member', 'User', 'System', 'Security', 'File', 'Setting', 'Record'],
    index: true
  },
  entityId: {
    type: String,
    required: true
  },
  entityName: {
    type: String,
    default: ''
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    index: true
  },
  projectName: {
    type: String,
    default: ''
  },
  fieldName: {
    type: String,
    default: null
  },
  oldValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  newValue: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE', 'WARNING', 'PENDING'],
    default: 'SUCCESS',
    index: true
  },
  criticality: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW',
    index: true
  },
  reason: {
    type: String,
    default: ''
  },
  source: {
    type: String,
    enum: ['web', 'api', 'integration_jira', 'system', 'cli'],
    default: 'web'
  },
  ipAddress: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  isRisky: {
    type: Boolean,
    default: false
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  episodeId: {
    type: String,
    default: null
  },
  episodeTitle: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Compound indexes for optimal filtering and sort queries
auditLogSchema.index({ projectId: 1, timestamp: -1 });
auditLogSchema.index({ entityType: 1, action: 1 });
auditLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
