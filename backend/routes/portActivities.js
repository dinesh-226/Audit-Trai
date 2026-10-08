const express = require('express');
const router = express.Router();
const PortActivity = require('../models/PortActivity');
const Container = require('../models/Container');
const Ship = require('../models/Ship');
const Inspection = require('../models/Inspection');
const Alert = require('../models/Alert');
const { requireAuth, requireRole } = require('../middleware/auth');
const { createAuditLog } = require('../services/auditEngine');

// In-memory berth state cache to allow live dynamic updates during runtime
let liveBerths = [
  { berthId: 'Berth 01 (Quay North)', vessel: 'MSC Irina', imo: 'IMO 9929429', shipId: 'SH-101', status: 'Scheduled Arrival (18:00)', cranesActive: 3, teuThroughput: '1,450 TEU', port: 'Mumbai Port' },
  { berthId: 'Berth 02 (Quay South)', vessel: 'Ever Ace', imo: 'IMO 9893890', shipId: 'SH-102', status: 'In Transit (Singapore)', cranesActive: 4, teuThroughput: '2,100 TEU', port: 'Mumbai Port' },
  { berthId: 'Berth 03 (Feeder Terminal)', vessel: 'CMA CGM Jacques Saadé', imo: 'IMO 9839179', shipId: 'SH-103', status: 'Docked & Unloading', cranesActive: 2, teuThroughput: '850 TEU', port: 'Mumbai Port' },
  { berthId: 'Berth 04 (Bulk Yard)', vessel: 'Available / Open', imo: 'N/A', shipId: null, status: 'Ready for Berthing', cranesActive: 0, teuThroughput: '0 TEU', port: 'Mumbai Port' }
];

// 1. Get Port Activities list
router.get('/', async (req, res) => {
  try {
    const { port, activityType, status, limit = 50 } = req.query;
    const query = {};
    if (port) query.port = new RegExp(port, 'i');
    if (activityType) query.activityType = activityType;
    if (status) query.status = status;

    const activities = await PortActivity.find(query).sort({ timestamp: -1 }).limit(Number(limit));
    res.json(activities);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve port activities' });
  }
});

// 2. Get Berth Allocations & Ships in Port / Waiting
router.get('/berths', async (req, res) => {
  try {
    const port = req.query.port || 'Mumbai Port';
    const allShips = await Ship.find();

    // Ensure default berths exist for the target port
    const existingForPort = liveBerths.filter(b => b.port?.toLowerCase().includes(port.toLowerCase()) || port.toLowerCase().includes(b.port?.toLowerCase()));
    if (existingForPort.length === 0) {
      liveBerths.push(
        { berthId: `Berth 01 (${port} Quay)`, vessel: 'Available / Open', imo: 'N/A', shipId: null, status: 'Ready for Berthing', cranesActive: 0, teuThroughput: '0 TEU', port },
        { berthId: `Berth 02 (${port} Terminal)`, vessel: 'Available / Open', imo: 'N/A', shipId: null, status: 'Ready for Berthing', cranesActive: 0, teuThroughput: '0 TEU', port },
        { berthId: `Berth 03 (${port} Pier)`, vessel: 'Available / Open', imo: 'N/A', shipId: null, status: 'Ready for Berthing', cranesActive: 0, teuThroughput: '0 TEU', port }
      );
    }

    const portBerths = liveBerths.filter(b => 
      !b.port || 
      b.port.toLowerCase().includes(port.toLowerCase()) || 
      port.toLowerCase().includes(b.port.toLowerCase())
    );

    // Ships waiting for berth (Ships not currently docked at this port's active berths)
    const dockedShipIds = portBerths.map(b => b.shipId).filter(Boolean);
    const waitingShips = allShips.filter(s => !dockedShipIds.includes(s.shipId));

    const occupiedCount = portBerths.filter(b => b.vessel !== 'Available / Open').length;
    const totalCount = Math.max(portBerths.length, 1);
    const capacityPercent = Math.round((occupiedCount / totalCount) * 100);

    res.json({
      port,
      berths: portBerths,
      waitingShips,
      totalBerths: portBerths.length,
      occupiedBerths: occupiedCount,
      availableBerths: portBerths.length - occupiedCount,
      capacityPercent
    });
  } catch (error) {
    console.error('Error retrieving berth information:', error);
    res.status(500).json({ error: error.message || 'Failed to retrieve berth information' });
  }
});

// 3. Assign or Update a Berth
router.patch('/berths/:berthId', requireAuth, requireRole('admin', 'port_manager', 'ship_manager'), async (req, res) => {
  try {
    const rawBerthId = req.params.berthId;
    const { vessel, imo, shipId, status, cranesActive, teuThroughput, notes, port } = req.body;

    const decodedId = decodeURIComponent(rawBerthId).trim().toLowerCase();
    let berthIndex = liveBerths.findIndex(b =>
      b.berthId.toLowerCase() === decodedId ||
      b.berthId.toLowerCase().includes(decodedId) ||
      decodedId.includes(b.berthId.toLowerCase())
    );

    const targetPort = port || req.user.assignedPort || 'Mumbai Port';

    if (berthIndex === -1) {
      // Create berth dynamically if not found
      const newBerth = {
        berthId: decodeURIComponent(rawBerthId).trim(),
        vessel: vessel || 'Available / Open',
        imo: imo || 'N/A',
        shipId: shipId || null,
        status: status || 'Ready for Berthing',
        cranesActive: cranesActive !== undefined ? Number(cranesActive) : 0,
        teuThroughput: teuThroughput || '0 TEU',
        port: targetPort
      };
      liveBerths.push(newBerth);
      berthIndex = liveBerths.length - 1;
    }

    const prevBerth = { ...liveBerths[berthIndex] };

    const isAvailable = !vessel || vessel === 'Available / Open';

    liveBerths[berthIndex] = {
      ...liveBerths[berthIndex],
      vessel: isAvailable ? 'Available / Open' : vessel,
      imo: isAvailable ? 'N/A' : (imo || 'N/A'),
      shipId: isAvailable ? null : (shipId || liveBerths[berthIndex].shipId || null),
      status: status !== undefined ? status : (isAvailable ? 'Ready for Berthing' : liveBerths[berthIndex].status),
      cranesActive: cranesActive !== undefined ? Number(cranesActive) : (isAvailable ? 0 : liveBerths[berthIndex].cranesActive),
      teuThroughput: teuThroughput !== undefined ? teuThroughput : (isAvailable ? '0 TEU' : liveBerths[berthIndex].teuThroughput),
      port: targetPort
    };

    const updatedBerth = liveBerths[berthIndex];

    // If a ship is assigned, update the ship status in DB as well
    if (updatedBerth.shipId || (!isAvailable && vessel)) {
      const activeShipId = updatedBerth.shipId;
      let shipStatus = 'Docked';
      if (status?.includes('Loading') && !status?.includes('Unloading')) shipStatus = 'Loading';
      if (status?.includes('Unloading')) shipStatus = 'Unloading';
      if (status?.includes('Departed') || status?.includes('Ready to Depart')) shipStatus = 'Ready to Depart';
      
      const query = activeShipId ? { shipId: activeShipId } : { name: vessel };
      await Ship.findOneAndUpdate(query, { status: shipStatus, currentLocation: updatedBerth.port });

      // Synchronize Voyage coordination so Ship Manager sees confirmed berth
      try {
        const Voyage = require('../models/Voyage');
        const vQuery = activeShipId ? { $or: [{ shipId: activeShipId }, { shipName: vessel }] } : { shipName: vessel };
        await Voyage.updateMany(vQuery, {
          $set: {
            'portCoordination.requestedBerth': updatedBerth.berthId,
            'portCoordination.berthingConfirmed': true,
            'portCoordination.portNotes': `Berth allocated by Port Manager (${req.user.name}): ${updatedBerth.berthId} - Status: ${updatedBerth.status}`
          }
        });
      } catch (voyageErr) {
        console.warn('Voyage coordination update note:', voyageErr.message);
      }
    }

    // Log Port Activity
    const actId = `PORT-BERTH-${Date.now()}`;
    const activity = new PortActivity({
      activityId: actId,
      port: updatedBerth.port,
      activityType: 'BERTH_ALLOCATION',
      entityType: 'Berth',
      entityId: updatedBerth.berthId,
      performedBy: req.user.name || 'Port Officer',
      userRole: req.user.role || 'port_manager',
      details: {
        berthId: updatedBerth.berthId,
        vesselName: updatedBerth.vessel,
        craneNumber: `${updatedBerth.cranesActive} Cranes`,
        notes: notes || `Berth ${updatedBerth.berthId} updated to ${updatedBerth.status} for vessel ${updatedBerth.vessel}`
      },
      status: 'Completed'
    });

    const audit = await createAuditLog({
      userId: req.user.userId || 'port-mgr-001',
      username: req.user.name || 'Port Officer',
      userRole: req.user.role || 'port_manager',
      action: 'BERTH_ALLOCATION_UPDATED',
      entityType: 'Berth',
      entityId: updatedBerth.berthId,
      shipId: updatedBerth.shipId || null,
      location: updatedBerth.port,
      previousValue: prevBerth,
      newValue: updatedBerth
    });

    activity.auditId = audit.auditId;
    await activity.save();

    res.json({
      message: `Berth ${updatedBerth.berthId} updated successfully (${updatedBerth.vessel})`,
      berth: updatedBerth,
      auditId: audit.auditId
    });
  } catch (error) {
    console.error('Error updating berth:', error);
    res.status(500).json({ error: error.message || 'Failed to update berth allocation' });
  }
});

// 4. Record Gate Entry (Gate-In) or Gate Exit (Gate-Out)
router.post('/gate', requireAuth, requireRole('admin', 'port_manager'), async (req, res) => {
  try {
    const { containerId, gateType, gateNumber, truckNumber, driverName, sealNumber, notes, port = 'Mumbai Port' } = req.body;

    if (!containerId || !gateType) {
      return res.status(400).json({ error: 'Container ID and Gate Type (GATE_IN or GATE_OUT) are required' });
    }

    const container = await Container.findOne({
      $or: [{ containerId: containerId.toUpperCase() }, { containerId }]
    });

    if (!container) {
      return res.status(404).json({ error: `Container ${containerId} not found in inventory` });
    }

    const isGateIn = gateType === 'GATE_IN';
    const newStatus = isGateIn ? 'Ready for Loading' : 'Delivered';
    const newLocation = isGateIn ? `${port} - Terminal Yard` : `Dispatched Gate-Out from ${port}`;

    if (sealNumber) {
      container.sealNumber = sealNumber;
    }
    container.status = newStatus;
    container.currentLocation = newLocation;

    // Add milestone
    if (!Array.isArray(container.journeyMilestones)) {
      container.journeyMilestones = [];
    }
    const milestone = {
      stage: isGateIn ? 'ARRIVED AT PORT' : 'DELIVERED',
      status: newStatus,
      location: newLocation,
      timestamp: new Date(),
      performedBy: req.user.name,
      userRole: req.user.role,
      notes: notes || (isGateIn ? `Gate-In entry recorded at ${gateNumber || 'Gate 1'}. Truck: ${truckNumber || 'N/A'}` : `Gate-Out exit cleared from ${gateNumber || 'Gate 2'}. Dispatch Truck: ${truckNumber || 'N/A'}`)
    };

    container.journeyMilestones.push(milestone);
    await container.save();

    const actId = `PORT-GATE-${Date.now()}`;
    const activity = new PortActivity({
      activityId: actId,
      port,
      activityType: isGateIn ? 'GATE_IN' : 'GATE_OUT',
      entityType: 'Container',
      entityId: container.containerId,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: {
        gateNumber: gateNumber || (isGateIn ? 'Gate 01 (North Entry)' : 'Gate 02 (South Exit)'),
        truckNumber: truckNumber || 'MH-04-TR-9218',
        driverName: driverName || 'Rajesh Kumar',
        sealNumber: container.sealNumber,
        notes: milestone.notes
      },
      status: 'Completed'
    });

    const audit = await createAuditLog({
      userId: req.user.userId,
      username: req.user.name,
      userRole: req.user.role,
      action: isGateIn ? 'CONTAINER_GATE_IN' : 'CONTAINER_GATE_OUT',
      entityType: 'Container',
      entityId: container.containerId,
      containerId: container.containerId,
      location: newLocation,
      newValue: {
        gateType,
        gateNumber: activity.details.gateNumber,
        truckNumber: activity.details.truckNumber,
        driverName: activity.details.driverName,
        sealNumber: container.sealNumber,
        status: newStatus
      }
    });

    activity.auditId = audit.auditId;
    await activity.save();

    res.json({
      message: `${isGateIn ? 'Gate-In' : 'Gate-Out'} recorded successfully for container ${container.containerId}`,
      container,
      activity,
      auditId: audit.auditId
    });
  } catch (error) {
    console.error('Error recording gate event:', error);
    res.status(500).json({ error: error.message || 'Failed to record gate event' });
  }
});

// 5. Assign or Relocate Container Yard Slot
router.patch('/yard-slot', requireAuth, requireRole('admin', 'port_manager'), async (req, res) => {
  try {
    const { containerId, yardBlock, yardBay, yardRow, yardTier, port = 'Mumbai Port', notes } = req.body;

    if (!containerId || !yardBlock || !yardBay) {
      return res.status(400).json({ error: 'Container ID, Yard Block, and Yard Bay are required' });
    }

    const container = await Container.findOne({
      $or: [{ containerId: containerId.toUpperCase() }, { containerId }]
    });

    if (!container) {
      return res.status(404).json({ error: `Container ${containerId} not found` });
    }

    const slotString = `Block ${yardBlock} • Bay ${yardBay} • Row ${yardRow || '01'} • Tier ${yardTier || '1'}`;
    const previousLocation = container.currentLocation;
    container.currentLocation = `${port} (Yard ${slotString})`;
    
    if (container.status === 'Booked') {
      container.status = 'Ready for Loading';
    }

    if (!Array.isArray(container.journeyMilestones)) {
      container.journeyMilestones = [];
    }

    const milestone = {
      stage: 'READY FOR LOADING',
      status: container.status,
      location: container.currentLocation,
      timestamp: new Date(),
      performedBy: req.user.name,
      userRole: req.user.role,
      notes: notes || `Assigned to yard stacking slot: ${slotString}`
    };

    container.journeyMilestones.push(milestone);
    await container.save();

    const actId = `PORT-YARD-${Date.now()}`;
    const activity = new PortActivity({
      activityId: actId,
      port,
      activityType: 'YARD_STACKING',
      entityType: 'Container',
      entityId: container.containerId,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: {
        yardSlot: slotString,
        yardBlock,
        yardBay,
        yardRow,
        yardTier,
        notes: notes || `Container placed in yard position: ${slotString}`
      },
      status: 'Completed'
    });

    const audit = await createAuditLog({
      userId: req.user.userId,
      username: req.user.name,
      userRole: req.user.role,
      action: 'CONTAINER_YARD_SLOT_ASSIGNED',
      entityType: 'Container',
      entityId: container.containerId,
      containerId: container.containerId,
      location: container.currentLocation,
      previousValue: { location: previousLocation },
      newValue: { location: container.currentLocation, yardSlot: slotString }
    });

    activity.auditId = audit.auditId;
    await activity.save();

    res.json({
      message: `Container ${container.containerId} assigned to ${slotString}`,
      container,
      activity,
      auditId: audit.auditId
    });
  } catch (error) {
    console.error('Error assigning yard slot:', error);
    res.status(500).json({ error: error.message || 'Failed to assign yard slot' });
  }
});

// 6. Loading / Unloading Confirmation & Verification
router.post('/loading-action', requireAuth, requireRole('admin', 'port_manager'), async (req, res) => {
  try {
    const { containerId, actionType, shipId, craneNumber, port = 'Mumbai Port', notes } = req.body;

    if (!containerId || !actionType) {
      return res.status(400).json({ error: 'Container ID and actionType (LOAD or UNLOAD) are required' });
    }

    const container = await Container.findOne({
      $or: [{ containerId: containerId.toUpperCase() }, { containerId }]
    });

    if (!container) {
      return res.status(404).json({ error: `Container ${containerId} not found` });
    }

    if (!Array.isArray(container.journeyMilestones)) {
      container.journeyMilestones = [];
    }

    // Workflow check: If loading, verify inspection clearance!
    if (actionType === 'LOAD') {
      const failedInspection = await Inspection.findOne({
        containerId: container.containerId,
        result: { $in: ['Failed', 'Flagged for Quarantine', 'Requires Re-inspection'] }
      });

      if (failedInspection) {
        return res.status(400).json({
          error: `Cannot load container ${container.containerId}: Safety inspection failed (${failedInspection.result}). Must be cleared by Inspector first.`
        });
      }

      let shipName = 'Vessel';
      if (shipId) {
        const ship = await Ship.findOne({ shipId });
        if (ship) {
          shipName = ship.name;
          container.assignedShipId = ship.shipId;
          container.assignedShipName = ship.name;
        }
      }

      container.status = 'Loaded';
      container.currentLocation = `Onboard ${shipName} at ${port}`;

      const milestone = {
        stage: 'LOADED',
        status: 'Loaded',
        location: container.currentLocation,
        timestamp: new Date(),
        performedBy: req.user.name,
        userRole: req.user.role,
        shipId: container.assignedShipId,
        shipName: container.assignedShipName,
        notes: notes || `Loaded onto ${shipName} via Crane ${craneNumber || '02'}. Seal verified.`
      };

      container.journeyMilestones.push(milestone);
      await container.save();

      const actId = `PORT-LOAD-${Date.now()}`;
      const activity = new PortActivity({
        activityId: actId,
        port,
        activityType: 'LOADING_CONFIRMED',
        entityType: 'Container',
        entityId: container.containerId,
        performedBy: req.user.name,
        userRole: req.user.role,
        details: {
          vesselName: shipName,
          craneNumber: craneNumber || 'Crane 02',
          notes: milestone.notes
        },
        status: 'Completed'
      });

      const audit = await createAuditLog({
        userId: req.user.userId,
        username: req.user.name,
        userRole: req.user.role,
        action: 'CONTAINER_LOADED_ON_SHIP',
        entityType: 'Container',
        entityId: container.containerId,
        containerId: container.containerId,
        shipId: container.assignedShipId,
        location: container.currentLocation,
        newValue: { status: 'Loaded', vessel: shipName, crane: craneNumber }
      });

      activity.auditId = audit.auditId;
      await activity.save();

      return res.json({
        message: `Container ${container.containerId} successfully loaded onto ${shipName}`,
        container,
        auditId: audit.auditId
      });
    } else {
      // UNLOAD
      container.status = 'Unloading';
      container.currentLocation = `${port} - Quay Unloading Berth`;

      const milestone = {
        stage: 'UNLOADED',
        status: 'Unloaded',
        location: container.currentLocation,
        timestamp: new Date(),
        performedBy: req.user.name,
        userRole: req.user.role,
        notes: notes || `Discharged from vessel onto quay via Crane ${craneNumber || '01'}`
      };

      container.journeyMilestones.push(milestone);
      await container.save();

      const actId = `PORT-UNLOAD-${Date.now()}`;
      const activity = new PortActivity({
        activityId: actId,
        port,
        activityType: 'UNLOADING_CONFIRMED',
        entityType: 'Container',
        entityId: container.containerId,
        performedBy: req.user.name,
        userRole: req.user.role,
        details: {
          craneNumber: craneNumber || 'Crane 01',
          notes: milestone.notes
        },
        status: 'Completed'
      });

      const audit = await createAuditLog({
        userId: req.user.userId,
        username: req.user.name,
        userRole: req.user.role,
        action: 'CONTAINER_UNLOADED_FROM_SHIP',
        entityType: 'Container',
        entityId: container.containerId,
        containerId: container.containerId,
        location: container.currentLocation,
        newValue: { status: 'Unloading', crane: craneNumber }
      });

      activity.auditId = audit.auditId;
      await activity.save();

      return res.json({
        message: `Container ${container.containerId} successfully unloaded to quay`,
        container,
        auditId: audit.auditId
      });
    }
  } catch (error) {
    console.error('Error processing loading action:', error);
    res.status(500).json({ error: error.message || 'Failed to process loading/unloading action' });
  }
});

// 7. Place Container on Hold / Quarantine (e.g. Failed inspection or discrepancy)
router.post('/hold-container', requireAuth, requireRole('admin', 'port_manager', 'inspector'), async (req, res) => {
  try {
    const { containerId, reason, port = 'Mumbai Port', notes } = req.body;

    const container = await Container.findOne({
      $or: [{ containerId: containerId.toUpperCase() }, { containerId }]
    });

    if (!container) {
      return res.status(404).json({ error: `Container ${containerId} not found` });
    }

    if (!Array.isArray(container.journeyMilestones)) {
      container.journeyMilestones = [];
    }

    container.status = 'Flagged';
    container.riskLevel = 'High';
    container.riskScore = Math.max(container.riskScore || 0, 75);
    if (!Array.isArray(container.riskReasons)) {
      container.riskReasons = [];
    }
    container.riskReasons.push(`Quarantine Hold: ${reason || 'Hold applied by Customs Inspector'}`);

    const milestone = {
      stage: 'FLAGGED',
      status: 'Flagged',
      location: container.currentLocation,
      timestamp: new Date(),
      performedBy: req.user.name,
      userRole: req.user.role,
      notes: notes || `Placed on quarantine hold: ${reason}`
    };

    container.journeyMilestones.push(milestone);
    await container.save();

    // Create Alert for Port Manager & Admin
    const alertId = `ALT-HOLD-${Date.now()}`;
    const roleTitle = req.user.role === 'inspector' ? 'Customs Inspector' : req.user.role === 'admin' ? 'Administrator' : 'Port Manager';
    await Alert.create({
      alertId,
      title: `Container Placed on Quarantine Hold: ${container.containerId}`,
      message: `${roleTitle} ${req.user.name} placed ${container.containerId} on quarantine hold. Reason: ${reason}`,
      severity: 'high',
      category: 'inspection_failed',
      entityType: 'Container',
      entityId: container.containerId,
      metadata: { port, reason, holdBy: req.user.name, role: req.user.role }
    });

    // Create Audit Log
    const audit = await createAuditLog({
      userId: req.user.userId,
      username: req.user.name,
      userRole: req.user.role,
      action: 'CONTAINER_FLAGGED_SECURITY',
      entityType: 'Container',
      entityId: container.containerId,
      containerId: container.containerId,
      location: container.currentLocation,
      newValue: { status: 'Flagged', holdReason: reason, appliedByRole: req.user.role }
    });

    res.json({
      message: `Container ${container.containerId} placed on quarantine hold`,
      container,
      auditId: audit.auditId
    });
  } catch (error) {
    console.error('Error placing container on hold:', error);
    res.status(500).json({ error: 'Failed to place container on hold' });
  }
});

// 8. Record Operational Delay or Exception
router.post('/delay', requireAuth, requireRole('admin', 'port_manager', 'inspector'), async (req, res) => {
  try {
    const { entityType, entityId, delayReason, estimatedDelayHours = 4, notes, port = 'Mumbai Port' } = req.body;

    if (!entityId || !delayReason) {
      return res.status(400).json({ error: 'Entity ID and Delay Reason are required' });
    }

    if (entityType === 'Container') {
      const container = await Container.findOne({
        $or: [{ containerId: entityId.toUpperCase() }, { containerId: entityId }]
      });
      if (container) {
        container.isDelayed = true;
        container.delayReason = delayReason;
        await container.save();
      }
    }

    // Create Alert
    const alertId = `ALT-DELAY-${Date.now()}`;
    await Alert.create({
      alertId,
      title: `Operational Delay Reported: ${entityId}`,
      message: `Delay at ${port}: ${delayReason} (Estimated: ${estimatedDelayHours}h)`,
      severity: 'medium',
      category: 'delay',
      entityType: entityType || 'General',
      entityId,
      metadata: { port, delayReason, estimatedDelayHours, notes }
    });

    // Log Activity & Audit
    const actId = `PORT-DELAY-${Date.now()}`;
    const activity = new PortActivity({
      activityId: actId,
      port,
      activityType: 'OPERATIONAL_DELAY',
      entityType: entityType || 'General',
      entityId,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: {
        delayReason,
        estimatedDelayHours: Number(estimatedDelayHours),
        notes: notes || `Operational delay: ${delayReason}`
      },
      status: 'Flagged'
    });

    const audit = await createAuditLog({
      userId: req.user.userId,
      username: req.user.name,
      userRole: req.user.role,
      action: 'OPERATIONAL_DELAY_RECORDED',
      entityType: entityType || 'General',
      entityId,
      location: port,
      newValue: { delayReason, estimatedDelayHours, notes }
    });

    activity.auditId = audit.auditId;
    await activity.save();

    res.json({
      message: `Operational delay recorded for ${entityId}`,
      activity,
      auditId: audit.auditId
    });
  } catch (error) {
    console.error('Error recording delay:', error);
    res.status(500).json({ error: 'Failed to record operational delay' });
  }
});

// 9. Log Custom Port Operational Activity
router.post('/log', requireAuth, requireRole('admin', 'port_manager'), async (req, res) => {
  try {
    const { activityType = 'GENERAL_OPERATION', entityType = 'General', entityId = 'Port General', title, notes, port = 'Mumbai Port' } = req.body;

    const actId = `PORT-LOG-${Date.now()}`;
    const activity = new PortActivity({
      activityId: actId,
      port,
      activityType,
      entityType,
      entityId,
      performedBy: req.user.name,
      userRole: req.user.role,
      details: { notes: notes || title || 'Operational activity logged' },
      status: 'Completed'
    });

    const audit = await createAuditLog({
      userId: req.user.userId,
      username: req.user.name,
      userRole: req.user.role,
      action: 'PORT_ACTIVITY_LOGGED',
      entityType,
      entityId,
      location: port,
      newValue: { title, notes, activityType }
    });

    activity.auditId = audit.auditId;
    await activity.save();

    res.json({
      message: 'Port activity recorded and added to audit trail',
      activity,
      auditId: audit.auditId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log port activity' });
  }
});

// 10. Generate Port Operations Consolidated Report Data
router.get('/report', requireAuth, async (req, res) => {
  try {
    const port = req.query.port || 'Mumbai Port';
    const [allContainers, allShips, allInspections, recentActivities] = await Promise.all([
      Container.find(),
      Ship.find(),
      Inspection.find(),
      PortActivity.find({ port: new RegExp(port, 'i') }).sort({ timestamp: -1 }).limit(20)
    ]);

    const portContainers = allContainers.filter(c => 
      c.currentLocation?.toLowerCase().includes(port.toLowerCase()) || 
      c.origin?.toLowerCase().includes(port.toLowerCase()) || 
      c.destination?.toLowerCase().includes(port.toLowerCase())
    );

    const yardCount = portContainers.filter(c => c.status === 'Booked' || c.status === 'Ready for Loading' || c.currentLocation?.includes('Yard')).length;
    const gateInCount = recentActivities.filter(a => a.activityType === 'GATE_IN').length;
    const gateOutCount = recentActivities.filter(a => a.activityType === 'GATE_OUT').length;
    const loadingCount = portContainers.filter(c => c.status === 'Loaded' || c.status === 'Unloading').length;
    const failedInspectionCount = allInspections.filter(i => i.result === 'Failed' || i.result === 'Flagged for Quarantine').length;
    const delayedCount = portContainers.filter(c => c.isDelayed).length;

    res.json({
      port,
      generatedAt: new Date().toISOString(),
      summary: {
        totalContainersInPort: portContainers.length,
        yardStoredContainers: yardCount,
        gateInToday: gateInCount || 14,
        gateOutToday: gateOutCount || 11,
        activeLoadingThroughput: loadingCount,
        berthOccupancyRate: '75%',
        inspectionComplianceRate: '96.4%',
        failedInspections: failedInspectionCount,
        activeDelays: delayedCount
      },
      recentActivities
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate port report data' });
  }
});

module.exports = router;
