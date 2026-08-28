// controllers/auditController.js - Core Audit Trail Controller
const AuditLog = require('../models/AuditLog');
const { verifyChainIntegrity, calculateBlockHash } = require('../services/hashChainService');
const { recordAuditLog } = require('../middleware/auditLogger');
const { generateCsv, generateHtmlReport } = require('../services/exportService');

// @desc    Get audit logs with advanced search and filters
// @route   GET /api/audit-logs
// @access  Private (protect)
const getLogs = async (req, res) => {
  try {
    const {
      search,
      action,
      category,
      severity,
      status,
      actorEmail,
      entityType,
      entityId,
      startDate,
      endDate,
      page = 1,
      limit = 25,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Text search across details, actor name, actor email, entity name
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { details: regex },
        { action: regex },
        { 'actor.name': regex },
        { 'actor.email': regex },
        { 'entity.name': regex },
        { ipAddress: regex },
        { hash: regex }
      ];
    }

    if (action) query.action = action;
    if (category) query.actionCategory = category;
    if (severity) query.severity = severity;
    if (status) query.status = status;
    if (actorEmail) query['actor.email'] = new RegExp(actorEmail, 'i');
    if (entityType) query['entity.type'] = entityType;
    if (entityId) query['entity.id'] = entityId;

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 25;
    const skip = (pageNum - 1) * limitNum;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [logs, total] = await Promise.all([
      AuditLog.find(query).sort(sort).skip(skip).limit(limitNum),
      AuditLog.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get single log by ID
// @route   GET /api/audit-logs/:id
// @access  Private
const getLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Audit log entry not found' });
    }

    res.status(200).json({ success: true, data: log });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Manually record custom audit event
// @route   POST /api/audit-logs
// @access  Private
const createManualLog = async (req, res) => {
  try {
    const { action, actionCategory, entity, details, changes, severity, status, metadata } = req.body;

    if (!action || !details) {
      return res.status(400).json({ success: false, message: 'Action and details are required' });
    }

    const newLog = await recordAuditLog({
      req,
      action,
      actionCategory: actionCategory || 'DATA',
      entity: entity || { type: 'Custom', id: 'N/A', name: 'Custom Entity' },
      details,
      changes: changes || null,
      severity: severity || 'LOW',
      status: status || 'SUCCESS',
      metadata: metadata || {}
    });

    res.status(201).json({
      success: true,
      message: 'Audit log cryptographically recorded',
      data: newLog
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Get dashboard statistics & analytics
// @route   GET /api/audit-logs/stats
// @access  Private
const getStats = async (req, res) => {
  try {
    const totalLogs = await AuditLog.countDocuments();
    
    // Severity breakdown
    const severityCounts = await AuditLog.aggregate([
      { $group: { _id: '$severity', count: { $sum: 1 } } }
    ]);

    const severityMap = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
    severityCounts.forEach((s) => {
      if (s._id) severityMap[s._id] = s.count;
    });

    // Category breakdown
    const categoryCounts = await AuditLog.aggregate([
      { $group: { _id: '$actionCategory', count: { $sum: 1 } } }
    ]);

    // Top active actors
    const topActors = await AuditLog.aggregate([
      { $group: { _id: { email: '$actor.email', name: '$actor.name' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // Recent 7-day activity trend
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activityTrend = await AuditLog.aggregate([
      { $match: { timestamp: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp' }
          },
          total: { $sum: 1 },
          criticals: {
            $sum: { $cond: [{ $eq: ['$severity', 'CRITICAL'] }, 1, 0] }
          },
          failures: {
            $sum: { $cond: [{ $eq: ['$status', 'FAILURE'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Status breakdown
    const statusCounts = await AuditLog.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Check chain integrity overview
    const chainHealth = await verifyChainIntegrity();

    res.status(200).json({
      success: true,
      data: {
        totalLogs,
        severity: severityMap,
        categories: categoryCounts.map((c) => ({ category: c._id || 'DATA', count: c.count })),
        topActors: topActors.map((a) => ({ name: a._id.name, email: a._id.email, count: a.count })),
        activityTrend,
        statusBreakdown: statusCounts.map((s) => ({ status: s._id || 'SUCCESS', count: s.count })),
        chainHealth: {
          isValid: chainHealth.isValid,
          totalChecked: chainHealth.totalChecked,
          compromisedCount: chainHealth.compromisedCount,
          rootHash: chainHealth.rootHash
        }
      }
    });
  } catch (error) {
    console.error('Stats aggregation error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Export audit logs in CSV, PDF/HTML, or JSON
// @route   POST /api/audit-logs/export
// @access  Private
const exportLogs = async (req, res) => {
  try {
    const { format = 'CSV', filters = {} } = req.body;

    const query = {};
    if (filters.severity) query.severity = filters.severity;
    if (filters.action) query.action = filters.action;
    if (filters.actorEmail) query['actor.email'] = new RegExp(filters.actorEmail, 'i');
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }

    const logs = await AuditLog.find(query).sort({ timestamp: -1 }).limit(1000);

    // Record export event in audit trail
    await recordAuditLog({
      req,
      action: 'EXPORT_AUDIT_LOGS',
      actionCategory: 'COMPLIANCE',
      entity: { type: 'AuditExport', id: format, name: `${format} Log Export` },
      details: `User exported ${logs.length} audit logs in ${format} format.`,
      severity: 'LOW',
      status: 'SUCCESS',
      metadata: { format, count: logs.length, filters }
    });

    const upperFormat = format.toUpperCase();

    if (upperFormat === 'CSV') {
      const csvData = generateCsv(logs);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.csv`);
      return res.status(200).send(csvData);
    }

    if (upperFormat === 'JSON') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${Date.now()}.json`);
      return res.status(200).json({
        exportMeta: {
          exportedAt: new Date().toISOString(),
          exportedBy: req.user?.email || 'system',
          totalCount: logs.length
        },
        logs
      });
    }

    if (upperFormat === 'PDF' || upperFormat === 'HTML') {
      const htmlReport = generateHtmlReport(logs, 'Audit Trail Forensic Report', {
        generatedBy: req.user?.name || 'System Auditor'
      });
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(htmlReport);
    }

    res.status(400).json({ success: false, message: 'Invalid export format. Choose CSV, JSON, or PDF.' });
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Verify tamper-proof cryptographic chain
// @route   POST /api/audit-logs/verify
// @access  Private
const verifyChain = async (req, res) => {
  try {
    const verification = await verifyChainIntegrity();

    // Log the verification run
    await recordAuditLog({
      req,
      action: 'TAMPER_VERIFICATION_CHECK',
      actionCategory: 'SECURITY',
      entity: { type: 'HashChain', id: 'CHAIN-01', name: 'Tamper-Proof Audit Chain' },
      details: `Full cryptographic chain integrity check performed. Valid: ${verification.isValid}. Checked: ${verification.totalChecked} records.`,
      severity: verification.isValid ? 'LOW' : 'CRITICAL',
      status: verification.isValid ? 'SUCCESS' : 'WARNING'
    });

    res.status(200).json({
      success: true,
      data: verification
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Simulate tampering with a log (For interactive demo and security testing)
// @route   POST /api/audit-logs/simulate-tamper
// @access  Private
const simulateTamper = async (req, res) => {
  try {
    const { logId, fakeDetails, fakeSeverity } = req.body;
    let log;

    if (logId) {
      log = await AuditLog.findById(logId);
    } else {
      // Pick a random mid-sequence log
      const count = await AuditLog.countDocuments();
      const skip = Math.max(0, Math.floor(count / 2));
      log = await AuditLog.findOne().skip(skip);
    }

    if (!log) {
      return res.status(404).json({ success: false, message: 'No log found to simulate tamper on' });
    }

    log.details = fakeDetails || `[TAMPERED] Direct database unauthorized modification: ${log.details}`;
    if (fakeSeverity) log.severity = fakeSeverity;
    log.isSimulatedTampered = true;
    // Note: deliberately NOT updating the SHA-256 hash to create a cryptographic signature mismatch!
    await log.save();

    res.status(200).json({
      success: true,
      message: `Tamper simulated on Log #${log.sequence}. Run verification to detect integrity breach!`,
      data: {
        sequence: log.sequence,
        id: log._id,
        tamperedField: 'details'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Restore / Re-sign broken chain after simulation
// @route   POST /api/audit-logs/repair-chain
// @access  Private
const repairChain = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ sequence: 1 });
    let prevHash = '0000000000000000000000000000000000000000000000000000000000000000';

    for (let i = 0; i < logs.length; i++) {
      const l = logs[i];
      l.isSimulatedTampered = false;
      l.previousHash = prevHash;
      
      const entityStr = `${l.entity?.type || 'System'}:${l.entity?.id || 'N/A'}`;
      const changesStr = JSON.stringify(l.changes || null);
      
      l.hash = calculateBlockHash({
        sequence: l.sequence,
        timestamp: l.timestamp,
        actorEmail: l.actor?.email,
        action: l.action,
        entityStr,
        changesStr,
        severity: l.severity,
        previousHash: prevHash
      });

      prevHash = l.hash;
      await l.save();
    }

    res.status(200).json({
      success: true,
      message: 'Cryptographic chain re-signed and verified clean.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Collaborative review / Add auditor note
// @route   POST /api/audit-logs/:id/review
// @access  Private
const reviewLog = async (req, res) => {
  try {
    const { text, status = 'APPROVED' } = req.body;
    const log = await AuditLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }

    log.reviewStatus = status;
    log.reviewNotes.push({
      author: req.user?.name || 'Auditor',
      authorEmail: req.user?.email || 'auditor@audittrail.io',
      text,
      status: status === 'FLAGGED' ? 'FLAGGED' : 'APPROVED',
      createdAt: new Date()
    });

    await log.save();

    res.status(200).json({
      success: true,
      message: 'Review note attached',
      data: log
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// @desc    Smart Timeline Reconstruction for an entity or user
// @route   GET /api/audit-logs/timeline
// @access  Private
const getTimeline = async (req, res) => {
  try {
    const { entityType, entityId, actorEmail, limit = 50 } = req.query;

    const query = {};
    if (entityType) query['entity.type'] = entityType;
    if (entityId) query['entity.id'] = entityId;
    if (actorEmail) query['actor.email'] = new RegExp(actorEmail, 'i');

    const timelineEvents = await AuditLog.find(query)
      .sort({ timestamp: 1 })
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      data: {
        entityFilter: { entityType, entityId, actorEmail },
        totalEvents: timelineEvents.length,
        events: timelineEvents
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

module.exports = {
  getLogs,
  getLogById,
  createManualLog,
  getStats,
  exportLogs,
  verifyChain,
  simulateTamper,
  repairChain,
  reviewLog,
  getTimeline
};
