const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Inspection = require('../models/Inspection');
const Container = require('../models/Container');
const Alert = require('../models/Alert');
const Evidence = require('../models/Evidence');
const { requireAuth, requireRole } = require('../middleware/auth');
const { createAuditLog } = require('../services/auditEngine');
const { calculateContainerRisk } = require('../services/riskAnalysisEngine');
const { resolveGeoCoordinates } = require('../utils/geoCoordinates');

// 1. List Inspections with advanced filters
router.get('/', async (req, res) => {
  try {
    const { containerId, result, status, inspectorId, port, limit = 50 } = req.query;
    const query = {};
    if (containerId && containerId.trim() && containerId !== 'All') {
      query.containerId = new RegExp(containerId.trim(), 'i');
    }
    if (result && result.trim() && result !== 'All') {
      query.result = result.trim();
    }
    if (status && status.trim() && status !== 'All') {
      query.status = status.trim();
    }
    if (inspectorId && inspectorId.trim() && inspectorId !== 'All') {
      query.inspectorId = inspectorId.trim();
    }
    if (port && port.trim() && port !== 'All') {
      query.port = new RegExp(port.trim(), 'i');
    }

    const inspections = await Inspection.find(query).sort({ createdAt: -1 }).limit(Number(limit));
    res.json(inspections);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve inspection records' });
  }
});

// 2. Inspection Stats Summary
router.get('/stats', async (req, res) => {
  try {
    const port = req.query.port;
    const query = port ? { port: new RegExp(port, 'i') } : {};

    const all = await Inspection.find(query);
    const total = all.length;
    const passed = all.filter(i => i.result === 'Passed').length;
    const failed = all.filter(i => i.result === 'Failed' || i.result === 'Flagged for Quarantine').length;
    const onHold = all.filter(i => i.status === 'On Hold' || i.result === 'On Hold').length;
    const reInspection = all.filter(i => i.status === 'Re-inspection Required' || i.result === 'Requires Re-inspection').length;
    const repairRequired = all.filter(i => i.status === 'Repair Required').length;
    const inProgress = all.filter(i => i.status === 'In Progress' || i.status === 'Assigned').length;

    res.json({
      total,
      passed,
      failed,
      onHold,
      reInspection,
      repairRequired,
      inProgress,
      passRate: total > 0 ? `${Math.round((passed / total) * 100)}%` : '100%'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve inspection statistics' });
  }
});

// 3. Get Single Inspection
router.get('/:inspectionId', async (req, res) => {
  try {
    const inspection = await Inspection.findOne({ inspectionId: req.params.inspectionId });
    if (!inspection) {
      return res.status(404).json({ error: 'Inspection not found' });
    }
    const container = await Container.findOne({ containerId: inspection.containerId });
    res.json({ inspection, container });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve inspection details' });
  }
});

// 4. Create / Submit Inspection (Inspector, Admin, Port Manager, Ship Manager)
router.post('/', requireAuth, requireRole('inspector', 'admin', 'port_manager', 'ship_manager'), async (req, res) => {
  try {
    const {
      containerId,
      shipId,
      port,
      inspectionType = 'Safety & Structural',
      result,
      status,
      expectedSealNumber,
      physicalSealNumber,
      sealIntact = true,
      temperatureRecorded,
      checklist,
      defectsDetected,
      recommendation,
      notes,
      evidenceIds,
      photographs,
      gpsLocation,
      deviceInfo
    } = req.body;

    if (!containerId || !result) {
      return res.status(400).json({ error: 'Container ID and Inspection Result are required' });
    }

    const cleanContainerId = String(containerId).trim();
    const container = await Container.findOne({
      $or: [
        { containerId: cleanContainerId.toUpperCase() },
        { containerId: cleanContainerId },
        { containerId: new RegExp(`^${cleanContainerId}$`, 'i') }
      ]
    });

    if (!container) {
      return res.status(404).json({ error: `Container ${containerId} not found in system` });
    }

    const count = await Inspection.countDocuments();
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    const inspectionId = `INS-${datePrefix}-${String(count + 1).padStart(3, '0')}-${randomSuffix}`;

    // Verify seal match
    const expSeal = expectedSealNumber || container.sealNumber;
    const physSeal = physicalSealNumber || expSeal;
    const sealMatch = expSeal && physSeal ? expSeal.trim().toUpperCase() === physSeal.trim().toUpperCase() : true;

    // Process photo hashes
    const processedPhotos = (photographs || []).map((p, idx) => {
      const hash = p.fileHashSha256 || crypto.createHash('sha256').update(`${inspectionId}-${p.fileName || 'photo'}-${Date.now()}-${idx}`).digest('hex');
      return {
        photoId: p.photoId || `PHT-${Date.now()}-${idx}`,
        fileName: p.fileName || `inspection-evidence-${idx + 1}.jpg`,
        fileUrl: p.fileUrl || 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
        fileHashSha256: hash,
        capturedAt: p.capturedAt ? new Date(p.capturedAt) : new Date(),
        caption: p.caption || 'Physical container inspection proof photograph'
      };
    });

    const targetPort = port || req.user.assignedPort || container.currentLocation || 'Mumbai Port';
    const computedGps = gpsLocation || resolveGeoCoordinates(targetPort, 'Port Terminal', container.containerId);

    // Sanitize checklist for Mongoose schema compliance
    const sanitizedChecklist = Array.isArray(checklist) ? checklist.map(item => ({
      item: item.item || 'Inspection Item',
      status: (item.status && ['Pass', 'Fail', 'N/A'].includes(item.status))
        ? item.status
        : (item.passed ? 'Pass' : 'Fail'),
      passed: Boolean(item.passed ?? (item.status === 'Pass' || item.status === 'N/A')),
      comments: item.comments || '',
      defectType: item.defectType || null,
      severity: (item.severity && ['Minor', 'Moderate', 'Major', 'Critical'].includes(item.severity))
        ? item.severity
        : null
    })) : [];

    const computedStatus = status || ({
      Passed: 'Passed',
      Failed: 'Failed',
      'Requires Re-inspection': 'Re-inspection Required',
      'Flagged for Quarantine': 'On Hold',
      'On Hold': 'On Hold',
      'Repair Required': 'Repair Required',
      'In Progress': 'In Progress',
      Assigned: 'Assigned',
      Submitted: 'Submitted'
    }[result] || 'Submitted');

    const inspection = new Inspection({
      inspectionId,
      containerId: container.containerId,
      shipId: shipId || container.assignedShipId,
      inspectorId: req.user.userId || 'inspector-001',
      inspectorName: req.user.name || 'Inspector Officer',
      port: targetPort,
      inspectionType,
      status: computedStatus,
      result,
      expectedSealNumber: expSeal,
      physicalSealNumber: physSeal,
      sealMatch,
      sealIntact: Boolean(sealIntact),
      temperatureRecorded: temperatureRecorded !== undefined && temperatureRecorded !== '' && temperatureRecorded !== null ? Number(temperatureRecorded) : null,
      checklist: sanitizedChecklist,
      defectsDetected: defectsDetected || [],
      recommendation: recommendation || (result === 'Passed' ? 'Approve for Sea Loading' : 'Hold for Quarantine Review'),
      notes: notes || '',
      evidenceIds: evidenceIds || [],
      photographs: processedPhotos,
      gpsLocation: { lat: computedGps?.lat || 18.94, lng: computedGps?.lng || 72.83 },
      deviceInfo: deviceInfo || 'Rugged Port Inspector Terminal (v2.4)'
    });

    await inspection.save();

    // Ensure array properties exist on container
    if (!Array.isArray(container.journeyMilestones)) {
      container.journeyMilestones = [];
    }
    if (!Array.isArray(container.riskReasons)) {
      container.riskReasons = [];
    }

    // Update container operational status based on result
    if (result === 'Passed') {
      container.status = 'Ready for Loading';
    } else if (result === 'Failed' || result === 'Flagged for Quarantine' || result === 'On Hold') {
      container.status = 'Flagged';
      container.riskLevel = 'High';
      container.riskScore = Math.max(container.riskScore || 0, 80);
      container.riskReasons.push(`Failed ${inspectionType}: ${notes || 'Defects detected'}`);
    } else if (result === 'Repair Required') {
      container.status = 'Delayed';
      container.isDelayed = true;
      container.delayReason = `Repair required: ${notes || 'Structural defect'}`;
    } else if (result === 'Requires Re-inspection' || result === 'In Progress' || result === 'Assigned') {
      container.status = 'Under Inspection';
    }

    // Add milestone
    container.journeyMilestones.push({
      stage: result === 'Passed' ? 'INSPECTED' : 'FLAGGED',
      status: container.status,
      location: inspection.port,
      timestamp: new Date(),
      performedBy: req.user.name,
      userRole: req.user.role,
      shipId: container.assignedShipId,
      notes: `Inspection completed: ${result} (${inspectionType}). Recommendation: ${inspection.recommendation}`
    });

    await container.save();

    // Create Alert if inspection failed or hold required
    if (result === 'Failed' || result === 'Flagged for Quarantine' || result === 'On Hold' || !sealMatch) {
      await Alert.create({
        alertId: `ALT-INSP-${Date.now()}`,
        title: `Inspection Alert: Container ${container.containerId} ${result.toUpperCase()}`,
        message: `Inspector ${req.user.name} reported inspection failure (${inspectionType}). Seal Match: ${sealMatch ? 'Yes' : 'MISMATCH'}. Recommendation: ${inspection.recommendation}`,
        severity: result === 'Failed' ? 'critical' : 'high',
        category: 'inspection_failed',
        entityType: 'Container',
        entityId: container.containerId,
        metadata: { inspectionId, port: inspection.port, inspector: req.user.name }
      });
    }

    // Write Cryptographic Audit Log
    const audit = await createAuditLog({
      userId: req.user.userId,
      username: req.user.name,
      userRole: req.user.role,
      action: result === 'Passed' ? 'CONTAINER_INSPECTION_COMPLETED' : 'CONTAINER_INSPECTION_FAILED',
      entityType: 'Inspection',
      entityId: inspection.inspectionId,
      containerId: container.containerId,
      shipId: container.assignedShipId,
      location: inspection.port,
      newValue: {
        inspectionType,
        result,
        status: inspection.status,
        sealIntact: inspection.sealIntact,
        sealMatch,
        recommendation: inspection.recommendation,
        defectsCount: (inspection.defectsDetected || []).length,
        photosCount: (inspection.photographs || []).length
      }
    });

    inspection.auditId = audit.auditId;
    await inspection.save();

    // Recalculate container risk score safely
    try {
      await calculateContainerRisk(container);
    } catch (riskErr) {
      console.warn('Risk score recalculation warning:', riskErr.message);
    }

    res.status(201).json({
      message: `Inspection ${inspection.inspectionId} recorded successfully (${result})`,
      inspection,
      auditId: audit.auditId
    });
  } catch (error) {
    console.error('Error recording inspection:', error);
    res.status(500).json({ error: error.message || 'Failed to record inspection' });
  }
});

// 5. Update Inspection Status (e.g. In Progress, On Hold, Repair Required, Re-inspection Required)
router.patch('/:inspectionId/status', requireAuth, requireRole('inspector', 'admin', 'port_manager', 'ship_manager'), async (req, res) => {
  try {
    const { status, result, recommendation, notes } = req.body;
    const inspection = await Inspection.findOne({ inspectionId: req.params.inspectionId });

    if (!inspection) {
      return res.status(404).json({ error: 'Inspection record not found' });
    }

    const prevStatus = inspection.status;
    if (status) inspection.status = status;
    if (result) inspection.result = result;
    if (recommendation) inspection.recommendation = recommendation;
    if (notes) inspection.notes = notes;

    await inspection.save();

    const audit = await createAuditLog({
      userId: req.user.userId,
      username: req.user.name,
      userRole: req.user.role,
      action: 'INSPECTION_STATUS_UPDATED',
      entityType: 'Inspection',
      entityId: inspection.inspectionId,
      containerId: inspection.containerId,
      location: inspection.port,
      previousValue: { status: prevStatus },
      newValue: { status: inspection.status, result: inspection.result, notes }
    });

    res.json({
      message: `Inspection status updated to ${status || result}`,
      inspection,
      auditId: audit.auditId
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to update inspection status' });
  }
});

// 6. Request Re-inspection / Repair
router.post('/:inspectionId/request-reinspection', requireAuth, requireRole('inspector', 'admin', 'port_manager', 'ship_manager'), async (req, res) => {
  try {
    const { reason, priority = 'High', deadlineHours = 24, notes } = req.body;
    const inspection = await Inspection.findOne({ inspectionId: req.params.inspectionId });

    if (!inspection) {
      return res.status(404).json({ error: 'Inspection record not found' });
    }

    inspection.status = 'Re-inspection Required';
    inspection.result = 'Requires Re-inspection';
    await inspection.save();

    // Alert
    await Alert.create({
      alertId: `ALT-REINSP-${Date.now()}`,
      title: `Re-inspection Requested: ${inspection.containerId}`,
      message: `Priority ${priority} re-inspection requested by ${req.user.name}. Reason: ${reason} (Deadline: ${deadlineHours}h)`,
      severity: priority === 'High' ? 'high' : 'medium',
      category: 'inspection_failed',
      entityType: 'Container',
      entityId: inspection.containerId,
      metadata: { inspectionId: inspection.inspectionId, reason, priority, deadlineHours }
    });

    // Audit Log
    const audit = await createAuditLog({
      userId: req.user.userId,
      username: req.user.name,
      userRole: req.user.role,
      action: 'REINSPECTION_REQUESTED',
      entityType: 'Inspection',
      entityId: inspection.inspectionId,
      containerId: inspection.containerId,
      location: inspection.port,
      newValue: { reason, priority, deadlineHours, notes }
    });

    res.json({
      message: `Re-inspection request registered for container ${inspection.containerId}`,
      inspection,
      auditId: audit.auditId
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Failed to request re-inspection' });
  }
});

module.exports = router;
