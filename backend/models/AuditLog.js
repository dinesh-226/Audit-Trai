// models/AuditLog.js - Core Audit Log Model
const { getModel } = require('../config/modelFactory');

const AuditLog = getModel('auditlogs', 'AuditLog');

module.exports = AuditLog;
