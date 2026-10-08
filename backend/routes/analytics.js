const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Container = require('../models/Container');
const Ship = require('../models/Ship');
const Inspection = require('../models/Inspection');
const AuditLog = require('../models/AuditLog');
const Evidence = require('../models/Evidence');
const Anomaly = require('../models/Anomaly');
const User = require('../models/user');
const PortActivity = require('../models/PortActivity');
const Voyage = require('../models/Voyage');
const Alert = require('../models/Alert');
const { requireAuth } = require('../middleware/auth');
const { createAuditLog, verifyAuditChain } = require('../services/auditEngine');

/**
 * Helper: Parse date range from query params
 */
const getDateRangeFilter = (query) => {
  const { dateRange = '30d', startDate, endDate } = query;
  const now = new Date();
  let start = new Date();

  if (startDate && endDate) {
    return {
      $gte: new Date(startDate),
      $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
    };
  }

  switch (dateRange) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case '7d':
      start.setDate(now.getDate() - 7);
      break;
    case '30d':
      start.setDate(now.getDate() - 30);
      break;
    case 'month':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start.setDate(now.getDate() - 30);
  }

  return { $gte: start, $lte: now };
};

// 1. Overall System Summary Cards (All authenticated roles)
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const { port, shipId } = req.query;
    const containerQuery = {};
    const shipQuery = {};
    const inspectionQuery = {};
    const portActivityQuery = {};

    if (port && port !== 'ALL') {
      containerQuery.currentLocation = new RegExp(port, 'i');
      shipQuery.$or = [
        { currentLocation: new RegExp(port, 'i') },
        { arrivalPort: new RegExp(port, 'i') },
        { departurePort: new RegExp(port, 'i') }
      ];
      inspectionQuery.port = new RegExp(port, 'i');
      portActivityQuery.port = new RegExp(port, 'i');
    }

    if (shipId && shipId !== 'ALL') {
      containerQuery.assignedShipId = shipId;
      shipQuery.shipId = shipId;
      inspectionQuery.shipId = shipId;
    }

    const [
      containers,
      ships,
      inspections,
      auditLogsCount,
      voyages,
      portActivities,
      integrity,
      availableShips,
      activityPorts,
      inspectionPorts,
      containerLocations,
      shipArrivalPorts,
      shipDeparturePorts
    ] = await Promise.all([
      Container.find(containerQuery),
      Ship.find(shipQuery),
      Inspection.find(inspectionQuery),
      AuditLog.countDocuments(),
      Voyage.find(shipId && shipId !== 'ALL' ? { shipId } : {}),
      PortActivity.find(portActivityQuery),
      verifyAuditChain(),
      Ship.find({}, { shipId: 1, name: 1 }).sort({ name: 1 }),
      PortActivity.distinct('port'),
      Inspection.distinct('port'),
      Container.distinct('currentLocation'),
      Ship.distinct('arrivalPort'),
      Ship.distinct('departurePort')
    ]);

    const totalContainers = containers.length;
    const containersInPort = containers.filter(c => c.status === 'Arrived' || c.status === 'Ready for Loading' || c.status === 'Under Inspection' || c.status === 'Booked').length;
    const containersLoaded = containers.filter(c => c.status === 'Loaded' || c.status === 'In Transit').length;
    const containersUnloaded = containers.filter(c => c.status === 'Delivered' || c.status === 'Unloading').length;
    const containersOnHold = containers.filter(c => c.status === 'Flagged' || c.riskLevel === 'High' || c.riskLevel === 'Critical').length;

    const totalShips = ships.length;
    const shipsInPort = ships.filter(s => ['Docked', 'In Port', 'Berthed', 'Unloading', 'Loading'].includes(s.status)).length;
    const activeVoyages = voyages.filter(v => v.status === 'In Transit' || v.status === 'Planned').length;
    const delayedVoyages = voyages.filter(v => v.status === 'Delayed' || v.delays?.length > 0).length;

    const totalInspections = inspections.length;
    const pendingInspections = inspections.filter(i => i.status === 'Assigned' || i.status === 'In Progress').length;
    const passedInspections = inspections.filter(i => i.result === 'Passed').length;
    const failedInspections = inspections.filter(i => i.result === 'Failed' || i.result === 'Flagged for Quarantine' || i.status === 'On Hold' || i.status === 'Repair Required').length;

    // Security stats for admin / general
    const failedLogins = await AuditLog.countDocuments({
      timestamp: getDateRangeFilter(req.query),
      action: { $in: ['FAILED_LOGIN', 'USER_LOGIN_FAILED'] }
    });

    // Audit log analytics view event
    await createAuditLog({
      userId: req.user.userId,
      username: req.user.name,
      userRole: req.user.role,
      action: 'ANALYTICS_DASHBOARD_VIEWED',
      entityType: 'Analytics',
      entityId: 'ANALYTICS-SUMMARY',
      location: port || 'HQ Dashboard',
      newValue: { role: req.user.role, filterPort: port, filterShip: shipId }
    }).catch(() => {});

    res.json({
      success: true,
      lastUpdated: new Date().toISOString(),
      summary: {
        totalContainers: { title: 'Total Containers', value: totalContainers, status: 'neutral', icon: 'Box', route: 'containers' },
        containersInPort: { title: 'Containers in Port', value: containersInPort, status: 'info', icon: 'Layers', route: 'containers' },
        containersLoaded: { title: 'Containers Loaded', value: containersLoaded, status: 'success', icon: 'Ship', route: 'containers' },
        containersUnloaded: { title: 'Containers Unloaded', value: containersUnloaded, status: 'success', icon: 'CheckCircle', route: 'containers' },
        containersOnHold: { title: 'Containers on Hold', value: containersOnHold, status: containersOnHold > 0 ? 'warning' : 'success', icon: 'AlertTriangle', route: 'containers' },

        totalShips: { title: 'Total Fleet Ships', value: totalShips, status: 'neutral', icon: 'Ship', route: 'ships' },
        shipsInPort: { title: 'Ships in Port', value: shipsInPort, status: 'info', icon: 'Anchor', route: 'ships' },
        activeVoyages: { title: 'Active Voyages', value: activeVoyages, status: 'info', icon: 'Navigation', route: 'voyages' },
        delayedVoyages: { title: 'Delayed Voyages', value: delayedVoyages, status: delayedVoyages > 0 ? 'warning' : 'success', icon: 'Clock', route: 'voyages' },

        pendingInspections: { title: 'Pending Inspections', value: pendingInspections, status: 'info', icon: 'Clock', route: 'inspections' },
        passedInspections: { title: 'Passed Inspections', value: passedInspections, status: 'success', icon: 'CheckCircle2', route: 'inspections' },
        failedInspections: { title: 'Failed Inspections', value: failedInspections, status: failedInspections > 0 ? 'danger' : 'success', icon: 'XCircle', route: 'inspections' },

        totalAuditEvents: { title: 'Total Audit Events', value: auditLogsCount, status: 'neutral', icon: 'ShieldCheck', route: 'audit' },
        failedLogins: { title: 'Failed Login Events', value: failedLogins, status: failedLogins > 0 ? 'warning' : 'success', icon: 'Lock', route: 'audit' },
        auditIntegrity: {
          title: 'Audit Integrity',
          value: integrity.totalRecords === 0 ? 'No records' : integrity.verified ? 'Verified' : 'Warning',
          subtitle: `${integrity.totalRecords || 0} records`,
          status: integrity.verified ? 'success' : 'danger',
          icon: 'Shield',
          route: 'audit'
        }
      },
      filters: {
        ships: availableShips.map(({ shipId: id, name }) => ({ shipId: id, name })),
        ports: [...new Set([
          ...activityPorts,
          ...inspectionPorts,
          ...containerLocations,
          ...shipArrivalPorts,
          ...shipDeparturePorts
        ].filter(Boolean))].sort()
      }
    });
  } catch (error) {
    console.error('Error fetching summary analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve analytics summary' });
  }
});

// 2. Admin Analytics (Admin only)
router.get('/admin', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied: Admin role required' });
    }

    const dateFilter = getDateRangeFilter(req.query);

    // 1. User Distribution by Role
    const users = await User.find();
    const roleCounts = {
      admin: users.filter(u => u.role === 'admin').length,
      port_manager: users.filter(u => u.role === 'port_manager').length,
      ship_manager: users.filter(u => u.role === 'ship_manager').length,
      inspector: users.filter(u => u.role === 'inspector').length,
      viewer: users.filter(u => u.role === 'viewer').length
    };

    const userDistribution = {
      labels: ['Admin', 'Port Manager', 'Ship Manager', 'Inspector', 'Viewer'],
      datasets: [{
        label: 'Users by Role',
        data: [
          roleCounts.admin,
          roleCounts.port_manager,
          roleCounts.ship_manager,
          roleCounts.inspector,
          roleCounts.viewer
        ],
        backgroundColor: ['#0f3460', '#0284c7', '#0369a1', '#0ea5e9', '#38bdf8']
      }]
    };

    // 2. User Activity Over Time (Last 7 intervals)
    const logs = await AuditLog.find({ timestamp: dateFilter }).sort({ timestamp: 1 });
    const dateMap = {};
    const actionTypesMap = {};
    const roleActivityMap = { admin: 0, port_manager: 0, ship_manager: 0, inspector: 0, viewer: 0 };
    const userLegitimateCount = {};

    logs.forEach(log => {
      const dStr = new Date(log.timestamp).toISOString().slice(5, 10);
      dateMap[dStr] = (dateMap[dStr] || 0) + 1;

      const act = log.action || 'OTHER';
      actionTypesMap[act] = (actionTypesMap[act] || 0) + 1;

      if (log.userRole && roleActivityMap[log.userRole] !== undefined) {
        roleActivityMap[log.userRole]++;
      }

      if (log.username) {
        userLegitimateCount[log.username] = (userLegitimateCount[log.username] || 0) + 1;
      }
    });

    const activityTimelineLabels = Object.keys(dateMap).slice(-10);
    const userActivityOverTime = {
      labels: activityTimelineLabels,
      datasets: [{
        label: 'System Actions',
        data: activityTimelineLabels.map(label => dateMap[label] || 0),
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        fill: true,
        tension: 0.3
      }]
    };

    // 3. Audit Events by Action Type
    const topActions = Object.entries(actionTypesMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
    const auditEventsByAction = {
      labels: topActions.map(action => action[0].replace(/_/g, ' ')),
      datasets: [{
        label: 'Action Frequency',
        data: topActions.map(action => action[1]),
        backgroundColor: '#0f3460'
      }]
    };

    // 4. Audit Events by User Role
    const auditEventsByRole = {
      labels: ['Admin', 'Port Manager', 'Ship Manager', 'Inspector', 'Viewer'],
      datasets: [{
        label: 'Audit Events by Role',
        data: [
          roleActivityMap.admin,
          roleActivityMap.port_manager,
          roleActivityMap.ship_manager,
          roleActivityMap.inspector,
          roleActivityMap.viewer
        ],
        backgroundColor: ['#0f3460', '#0284c7', '#0369a1', '#0ea5e9', '#38bdf8']
      }]
    };

    // 5. Audit Integrity Status
    const integrityCheck = await verifyAuditChain();
    const auditIntegrityStatus = {
      labels: ['Verified Intact Blocks', 'Suspicious / Flagged', 'Pending Review'],
      datasets: [{
        data: integrityCheck.verified
          ? [integrityCheck.totalRecords, 0, 0]
          : [integrityCheck.verifiedCount, 1, 0],
        backgroundColor: ['#16a34a', '#dc2626', '#f59e0b']
      }]
    };

    // 6. Failed Logins & Security Events
    const [failedLoginsCount, securityAlertsCount, anomaliesCount] = await Promise.all([
      AuditLog.countDocuments({ timestamp: dateFilter, action: { $in: ['FAILED_LOGIN', 'USER_LOGIN_FAILED'] } }),
      Alert.countDocuments({ createdAt: dateFilter }),
      Anomaly.countDocuments({ detectedAt: dateFilter })
    ]);
    const securityEventsOverTime = {
      labels: ['Other Audit Events', 'Failed Logins', 'Alerts', 'Anomalies'],
      datasets: [{
        label: 'Count',
        data: [Math.max(logs.length - failedLoginsCount, 0), failedLoginsCount, securityAlertsCount, anomaliesCount],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
      }]
    };

    // 7. Record Changes Over Time
    const containersCount = await Container.countDocuments();
    const shipsCount = await Ship.countDocuments();
    const inspectionsCount = await Inspection.countDocuments();
    const voyagesCount = await Voyage.countDocuments();
    const recordChangesOverTime = {
      labels: ['Containers', 'Ships', 'Voyages', 'Inspections', 'Port Operations'],
      datasets: [{
        label: 'Active Records',
        data: [containersCount, shipsCount, voyagesCount, inspectionsCount, logs.length],
        backgroundColor: ['#0f3460', '#0284c7', '#0369a1', '#0ea5e9', '#64748b']
      }]
    };

    // 8. Top Active Users
    const topUsers = Object.entries(userLegitimateCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topActiveUsers = {
      labels: topUsers.map(user => user[0]),
      datasets: [{
        label: 'Verified Actions',
        data: topUsers.map(user => user[1]),
        backgroundColor: '#0284c7'
      }]
    };

    res.json({
      success: true,
      lastUpdated: new Date().toISOString(),
      charts: {
        userDistribution,
        userActivityOverTime,
        auditEventsByAction,
        auditEventsByRole,
        auditIntegrityStatus,
        securityEventsOverTime,
        recordChangesOverTime,
        topActiveUsers
      }
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve admin analytics' });
  }
});

// 3. Port Manager Analytics (Admin, Port Manager, Viewer)
router.get('/port-manager', requireAuth, async (req, res) => {
  try {
    const { port } = req.query;
    const containerQuery = port && port !== 'ALL' ? { currentLocation: new RegExp(port, 'i') } : {};
    const activityQuery = port && port !== 'ALL' ? { port: new RegExp(port, 'i') } : {};

    const [containers, activities, ships] = await Promise.all([
      Container.find(containerQuery),
      PortActivity.find(activityQuery).sort({ createdAt: -1 }),
      Ship.find()
    ]);

    // 1. Container Movement Status (Doughnut)
    const statusCounts = {
      'Gate In': containers.filter(c => c.status === 'Booked').length,
      'Yard Stored': containers.filter(c => c.status === 'Ready for Loading' || c.status === 'Under Inspection').length,
      'Loading / Quay': containers.filter(c => c.status === 'Loaded').length,
      'In Transit': containers.filter(c => c.status === 'In Transit').length,
      'Unloading / Arrived': containers.filter(c => c.status === 'Arrived' || c.status === 'Unloading').length,
      'Dispatched / Delivered': containers.filter(c => c.status === 'Delivered').length,
      'On Hold / Flagged': containers.filter(c => c.status === 'Flagged' || c.riskLevel === 'High' || c.riskLevel === 'Critical').length
    };

    const containerMovementStatus = {
      labels: Object.keys(statusCounts),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: ['#0f3460', '#0284c7', '#0369a1', '#0ea5e9', '#38bdf8', '#10b981', '#ef4444']
      }]
    };

    // 2. Daily Gate Entry & Exit (Grouped Bar)
    const gateStart = new Date();
    gateStart.setHours(0, 0, 0, 0);
    gateStart.setDate(gateStart.getDate() - 6);
    const gateDates = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(gateStart);
      date.setDate(gateStart.getDate() + index);
      return date.toISOString().slice(0, 10);
    });
    const gateActivitiesByDate = activities.reduce((counts, activity) => {
      const activityDate = new Date(activity.timestamp).toISOString().slice(0, 10);
      if (gateDates.includes(activityDate) && ['GATE_IN', 'GATE_OUT'].includes(activity.activityType)) {
        counts[`${activityDate}:${activity.activityType}`] = (counts[`${activityDate}:${activity.activityType}`] || 0) + 1;
      }
      return counts;
    }, {});
    const dailyGateEntryExit = {
      labels: gateDates,
      datasets: [
        {
          label: 'Gate In events',
          data: gateDates.map(date => gateActivitiesByDate[`${date}:GATE_IN`] || 0),
          backgroundColor: '#0f3460'
        },
        {
          label: 'Gate Out events',
          data: gateDates.map(date => gateActivitiesByDate[`${date}:GATE_OUT`] || 0),
          backgroundColor: '#0284c7'
        }
      ]
    };

    // 3. Recorded loading and unloading operations by time of day
    const handlingActivities = activities.filter(activity =>
      ['LOADING_CONFIRMED', 'UNLOADING_CONFIRMED'].includes(activity.activityType)
    );
    const timeLabels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00'];
    const handlingByTime = (activityType) => timeLabels.map((_, index) =>
      handlingActivities.filter(activity =>
        activity.activityType === activityType && Math.floor(new Date(activity.timestamp).getHours() / 4) === index
      ).length
    );
    const loadingUnloadingTrends = {
      labels: timeLabels,
      datasets: [
        {
          label: 'Loading events',
          data: handlingByTime('LOADING_CONFIRMED'),
          borderColor: '#0f3460',
          backgroundColor: 'rgba(15, 52, 96, 0.1)',
          fill: true
        },
        {
          label: 'Unloading events',
          data: handlingByTime('UNLOADING_CONFIRMED'),
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.1)',
          fill: true
        }
      ]
    };

    // 4. Containers by recorded current location
    const containersByLocation = containers.reduce((counts, container) => {
      const location = container.currentLocation?.trim();
      if (location) counts[location] = (counts[location] || 0) + 1;
      return counts;
    }, {});
    const yardLocations = Object.entries(containersByLocation).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const yardOccupancy = {
      labels: yardLocations.map(([location]) => location),
      datasets: [
        {
          label: 'Containers',
          data: yardLocations.map(([, count]) => count),
          backgroundColor: ['#0f3460', '#0284c7', '#0369a1', '#0ea5e9']
        }
      ]
    };

    // 5. Recorded berth allocations
    const berthCounts = activities
      .filter(activity => activity.activityType === 'BERTH_ALLOCATION' && activity.details?.berthId)
      .reduce((counts, activity) => {
        counts[activity.details.berthId] = (counts[activity.details.berthId] || 0) + 1;
        return counts;
      }, {});
    const berthEntries = Object.entries(berthCounts).sort((a, b) => b[1] - a[1]);
    const berthOccupancy = {
      labels: berthEntries.map(([berthId]) => berthId),
      datasets: [
        {
          label: 'Recorded allocations',
          data: berthEntries.map(([, count]) => count),
          backgroundColor: ['#0f3460', '#0284c7', '#0369a1', '#64748b']
        }
      ]
    };

    // 6. Port Activity by Operation Type (Bar)
    const activityTypes = {
      'Gate Operations': activities.filter(a => a.activityType?.startsWith('GATE')).length,
      'Yard Stacking': activities.filter(a => a.activityType === 'YARD_STACKING').length,
      'Berth Operations': activities.filter(a => a.activityType?.startsWith('BERTH')).length,
      'Crane Loading': activities.filter(a => a.activityType === 'LOADING_CONFIRMED').length,
      'Quay Unloading': activities.filter(a => a.activityType === 'UNLOADING_CONFIRMED').length,
      'Safety Holds': activities.filter(a => a.activityType === 'CONTAINER_HOLD').length
    };

    const portActivityByType = {
      labels: Object.keys(activityTypes),
      datasets: [{
        label: 'Logged Port Operations',
        data: Object.values(activityTypes),
        backgroundColor: '#0f3460'
      }]
    };

    // 7. Operational delays grouped by their recorded reason
    const delayCounts = activities
      .filter(activity => activity.activityType === 'OPERATIONAL_DELAY')
      .reduce((counts, activity) => {
        const reason = activity.details?.delayReason?.trim() || 'Unspecified';
        counts[reason] = (counts[reason] || 0) + 1;
        return counts;
      }, {});
    const delayEntries = Object.entries(delayCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const operationalDelays = {
      labels: delayEntries.map(([reason]) => reason),
      datasets: [{
        label: 'Delay events',
        data: delayEntries.map(([, count]) => count),
        backgroundColor: ['#ef4444', '#f59e0b', '#0284c7', '#64748b', '#dc2626']
      }]
    };

    // 8. Average time between recorded container milestones
    const milestonePairs = [
      { from: 'BOOKED', to: 'READY FOR LOADING', label: 'Booked to ready' },
      { from: 'READY FOR LOADING', to: 'LOADED', label: 'Ready to loaded' },
      { from: 'ARRIVED AT PORT', to: 'UNLOADED', label: 'Arrived to unloaded' },
      { from: 'UNLOADED', to: 'DELIVERED', label: 'Unloaded to delivered' }
    ];
    const processingTimes = milestonePairs.map(pair => {
      const durations = containers.map(container => {
        const milestones = container.journeyMilestones || [];
        const startIndex = milestones.findIndex(milestone => milestone.stage === pair.from);
        if (startIndex < 0) return null;
        const startTime = new Date(milestones[startIndex].timestamp).getTime();
        const endMilestone = milestones.slice(startIndex + 1).find(milestone => milestone.stage === pair.to);
        if (!endMilestone) return null;
        const duration = (new Date(endMilestone.timestamp).getTime() - startTime) / 3600000;
        return Number.isFinite(duration) && duration >= 0 ? duration : null;
      }).filter(duration => duration !== null);
      return durations.length
        ? { label: pair.label, averageHours: durations.reduce((sum, duration) => sum + duration, 0) / durations.length }
        : null;
    }).filter(Boolean);
    const containerProcessingTime = {
      labels: processingTimes.map(item => item.label),
      datasets: [{
        label: 'Average elapsed hours',
        data: processingTimes.map(item => Number(item.averageHours.toFixed(2))),
        backgroundColor: '#0284c7'
      }]
    };

    res.json({
      success: true,
      lastUpdated: new Date().toISOString(),
      charts: {
        containerMovementStatus,
        dailyGateEntryExit,
        loadingUnloadingTrends,
        yardOccupancy,
        berthOccupancy,
        portActivityByType,
        operationalDelays,
        containerProcessingTime
      }
    });
  } catch (error) {
    console.error('Error fetching port manager analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve port operations analytics' });
  }
});

// 4. Ship Manager Analytics (Admin, Ship Manager, Viewer)
router.get('/ship-manager', requireAuth, async (req, res) => {
  try {
    const { shipId } = req.query;
    const shipQuery = shipId && shipId !== 'ALL' ? { shipId } : {};
    const [ships, voyages, containers] = await Promise.all([
      Ship.find(shipQuery),
      Voyage.find(shipQuery),
      Container.find(shipId && shipId !== 'ALL' ? { assignedShipId: shipId } : {})
    ]);

    // 1. Ship Status Distribution (Doughnut)
    const shipStatusCounts = ships.reduce((counts, ship) => {
      if (ship.status) counts[ship.status] = (counts[ship.status] || 0) + 1;
      return counts;
    }, {});

    const shipStatusDistribution = {
      labels: Object.keys(shipStatusCounts),
      datasets: [{
        data: Object.values(shipStatusCounts),
        backgroundColor: ['#0284c7', '#0f3460', '#f59e0b', '#64748b']
      }]
    };

    // 2. Voyage progress based on recorded waypoints
    const activeVoyagesList = voyages.map(voyage => {
      const waypoints = voyage.waypoints || [];
      const passedWaypoints = waypoints.filter(waypoint => waypoint.passed).length;
      const progress = waypoints.length
        ? (passedWaypoints / waypoints.length) * 100
        : ['Completed', 'Arrived'].includes(voyage.status) ? 100 : null;
      return { voyage, progress };
    }).filter(item => item.progress !== null).slice(0, 10);
    const activeVoyagesChart = {
      labels: activeVoyagesList.map(({ voyage }) => `${voyage.shipName} (${voyage.arrivalPort})`),
      datasets: [{
        label: 'Recorded waypoint progress (%)',
        data: activeVoyagesList.map(item => Number(item.progress.toFixed(1))),
        backgroundColor: '#0f3460'
      }]
    };

    // 3. Estimated vs actual elapsed days for arrived voyages
    const arrivedVoyages = voyages.filter(voyage => voyage.actualArrivalTime);
    const arrivalDurations = arrivedVoyages.map(voyage => {
      const departure = new Date(voyage.actualDepartureDate || voyage.plannedDepartureDate).getTime();
      const estimatedArrival = new Date(voyage.estimatedArrivalTime).getTime();
      const actualArrival = new Date(voyage.actualArrivalTime).getTime();
      return {
        voyage,
        estimatedDays: (estimatedArrival - departure) / 86400000,
        actualDays: (actualArrival - departure) / 86400000
      };
    }).filter(item => Number.isFinite(item.estimatedDays) && Number.isFinite(item.actualDays));
    const arrivalComparison = {
      labels: arrivalDurations.map(item => item.voyage.voyageId),
      datasets: [
        {
          label: 'Estimated Days',
          data: arrivalDurations.map(item => Number(item.estimatedDays.toFixed(1))),
          backgroundColor: '#0f3460'
        },
        {
          label: 'Actual Days',
          data: arrivalDurations.map(item => Number(item.actualDays.toFixed(1))),
          backgroundColor: '#0284c7'
        }
      ]
    };

    // 4. Recorded delay hours grouped by reason
    const delayHoursByReason = voyages.flatMap(voyage => voyage.delays || []).reduce((totals, delay) => {
      const reason = delay.reason || 'Unspecified';
      totals[reason] = (totals[reason] || 0) + (Number(delay.delayHours) || 0);
      return totals;
    }, {});
    const voyageDelayEntries = Object.entries(delayHoursByReason).sort((a, b) => b[1] - a[1]);
    const voyageDelays = {
      labels: voyageDelayEntries.map(([reason]) => reason),
      datasets: [{
        label: 'Recorded delay hours',
        data: voyageDelayEntries.map(([, hours]) => Number(hours.toFixed(1))),
        backgroundColor: ['#0284c7', '#f59e0b', '#10b981', '#ef4444']
      }]
    };

    // 5. Current ship speed snapshots
    const shipsWithSpeed = ships.filter(ship => Number.isFinite(ship.coordinates?.speedKnots));
    const shipSpeedTrend = {
      labels: shipsWithSpeed.map(ship => ship.name),
      datasets: [{
        label: 'Recorded speed (knots)',
        data: shipsWithSpeed.map(ship => ship.coordinates.speedKnots),
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        fill: true,
        tension: 0.3
      }]
    };

    // 6. Container counts by assigned ship and status
    const topShips = ships.slice(0, 10);
    const containersByShip = {
      labels: topShips.map(s => s.name),
      datasets: [
        {
          label: 'Loaded containers',
          data: topShips.map(ship => containers.filter(container => container.assignedShipId === ship.shipId && container.status === 'Loaded').length),
          backgroundColor: '#0f3460'
        },
        {
          label: 'Ready for loading',
          data: topShips.map(ship => containers.filter(container => container.assignedShipId === ship.shipId && container.status === 'Ready for Loading').length),
          backgroundColor: '#0284c7'
        }
      ]
    };

    // 7. Voyage Performance Summary
    const completedVoyages = voyages.filter(voyage => ['Completed', 'Arrived'].includes(voyage.status));
    const onTimeArrivals = completedVoyages.filter(voyage => voyage.actualArrivalTime &&
      new Date(voyage.actualArrivalTime) <= new Date(voyage.estimatedArrivalTime));
    const recordedSpeeds = voyages.map(voyage => Number(voyage.speedKnots)).filter(Number.isFinite);
    const voyagePerformance = {
      totalVoyages: voyages.length,
      completedVoyages: completedVoyages.length,
      delayedVoyages: voyages.filter(voyage => voyage.status === 'Delayed' || voyage.delays?.length > 0).length,
      avgSpeedKnots: recordedSpeeds.length
        ? Number((recordedSpeeds.reduce((sum, speed) => sum + speed, 0) / recordedSpeeds.length).toFixed(1))
        : null,
      onTimeArrivalRate: completedVoyages.length
        ? `${((onTimeArrivals.length / completedVoyages.length) * 100).toFixed(1)}%`
        : null
    };

    res.json({
      success: true,
      lastUpdated: new Date().toISOString(),
      charts: {
        shipStatusDistribution,
        activeVoyagesChart,
        arrivalComparison,
        voyageDelays,
        shipSpeedTrend,
        containersByShip,
        voyagePerformance
      }
    });
  } catch (error) {
    console.error('Error fetching ship manager analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve ship analytics' });
  }
});

// 5. Inspector Analytics (Admin, Inspector, Port Manager, Viewer)
router.get('/inspector', requireAuth, async (req, res) => {
  try {
    const { port, shipId } = req.query;
    const inspectionQuery = port && port !== 'ALL' ? { port: new RegExp(port, 'i') } : {};
    if (shipId && shipId !== 'ALL') inspectionQuery.shipId = shipId;

    const [inspections, evidenceList] = await Promise.all([
      Inspection.find(inspectionQuery),
      Evidence.find()
    ]);

    // 1. Inspection Result Distribution (8-status flow) (Doughnut)
    const resultCounts = {
      'Passed': inspections.filter(i => i.result === 'Passed').length,
      'Failed': inspections.filter(i => i.result === 'Failed').length,
      'On Hold': inspections.filter(i => i.status === 'On Hold' || i.result === 'On Hold').length,
      'Repair Required': inspections.filter(i => i.status === 'Repair Required').length,
      'Re-inspection Required': inspections.filter(i => i.status === 'Re-inspection Required').length,
      'In Progress / Assigned': inspections.filter(i => i.status === 'In Progress' || i.status === 'Assigned').length
    };

    const inspectionResultDistribution = {
      labels: Object.keys(resultCounts),
      datasets: [{
        data: Object.values(resultCounts),
        backgroundColor: ['#16a34a', '#dc2626', '#ef4444', '#f59e0b', '#0284c7', '#64748b']
      }]
    };

    // 2. Inspections created on each of the last seven dates
    const inspectionStart = new Date();
    inspectionStart.setHours(0, 0, 0, 0);
    inspectionStart.setDate(inspectionStart.getDate() - 6);
    const inspectionDates = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(inspectionStart);
      date.setDate(inspectionStart.getDate() + index);
      return date.toISOString().slice(0, 10);
    });
    const inspectionsByDate = inspections.reduce((counts, inspection) => {
      const date = new Date(inspection.createdAt).toISOString().slice(0, 10);
      if (inspectionDates.includes(date)) counts[date] = (counts[date] || 0) + 1;
      return counts;
    }, {});
    const inspectionsOverTime = {
      labels: inspectionDates,
      datasets: [{
        label: 'Inspection records created',
        data: inspectionDates.map(date => inspectionsByDate[date] || 0),
        borderColor: '#0f3460',
        backgroundColor: 'rgba(15, 52, 96, 0.1)',
        fill: true,
        tension: 0.3
      }]
    };

    // 3. Inspection results by calendar week over the last four weeks
    const weekStarts = Array.from({ length: 4 }, (_, index) => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - start.getDay() - (3 - index) * 7);
      return start;
    });
    const inspectionsByWeek = weekStarts.map((start, index) => {
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      const records = inspections.filter(inspection => {
        const createdAt = new Date(inspection.createdAt);
        return createdAt >= start && (index === weekStarts.length - 1 ? createdAt <= new Date() : createdAt < end);
      });
      return {
        label: start.toISOString().slice(0, 10),
        passed: records.filter(inspection => inspection.result === 'Passed').length,
        failed: records.filter(inspection => ['Failed', 'On Hold', 'Repair Required', 'Flagged for Quarantine'].includes(inspection.result)).length
      };
    });
    const passFailTrends = {
      labels: inspectionsByWeek.map(week => week.label),
      datasets: [
        {
          label: 'Passed Inspections',
          data: inspectionsByWeek.map(week => week.passed),
          backgroundColor: '#16a34a'
        },
        {
          label: 'Failed / Held Inspections',
          data: inspectionsByWeek.map(week => week.failed),
          backgroundColor: '#dc2626'
        }
      ]
    };

    // 4. Recorded inspection defects by category
    const defectsByCategory = inspections.flatMap(inspection => inspection.defectsDetected || []).reduce((counts, defect) => {
      const category = defect.category || defect.defect || 'Uncategorized';
      counts[category] = (counts[category] || 0) + 1;
      return counts;
    }, {});
    const defectEntries = Object.entries(defectsByCategory).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const commonInspectionFailures = {
      labels: defectEntries.map(([category]) => category),
      datasets: [{
        label: 'Recorded defects',
        data: defectEntries.map(([, count]) => count),
        backgroundColor: ['#dc2626', '#ef4444', '#f59e0b', '#0284c7', '#0f3460']
      }]
    };

    // 5. Workload by recorded inspector and status
    const inspectorNames = [...new Set(inspections.map(inspection => inspection.inspectorName).filter(Boolean))];
    const inspectorWorkload = {
      labels: inspectorNames,
      datasets: [
        {
          label: 'Completed Inspections',
          data: inspectorNames.map(name => inspections.filter(inspection => inspection.inspectorName === name && ['Passed', 'Failed', 'Submitted'].includes(inspection.status)).length),
          backgroundColor: '#0f3460'
        },
        {
          label: 'Pending Queue',
          data: inspectorNames.map(name => inspections.filter(inspection => inspection.inspectorName === name && ['Assigned', 'In Progress'].includes(inspection.status)).length),
          backgroundColor: '#0284c7'
        }
      ]
    };

    // 6. Elapsed inspection record time for records with a later update
    const inspectionDurationsByType = inspections.reduce((groups, inspection) => {
      const durationHours = (new Date(inspection.updatedAt).getTime() - new Date(inspection.createdAt).getTime()) / 3600000;
      if (Number.isFinite(durationHours) && durationHours > 0) {
        const type = inspection.inspectionType || 'Unspecified';
        groups[type] ||= [];
        groups[type].push(durationHours);
      }
      return groups;
    }, {});
    const inspectionDurationEntries = Object.entries(inspectionDurationsByType);
    const inspectionCompletionTime = {
      labels: inspectionDurationEntries.map(([type]) => type),
      datasets: [{
        label: 'Average record elapsed time (hours)',
        data: inspectionDurationEntries.map(([, durations]) => Number((durations.reduce((sum, duration) => sum + duration, 0) / durations.length).toFixed(2))),
        backgroundColor: '#0284c7'
      }]
    };

    // 7. Evidence Statistics
    const evidenceStats = {
      totalEvidence: evidenceList.length,
      recordsWithSha256: evidenceList.filter(evidence => Boolean(evidence.fileHashSha256)).length,
      sealPhotographs: evidenceList.filter(evidence => evidence.category === 'Seal Verification Photo').length,
      customsDocuments: evidenceList.filter(evidence => evidence.category === 'Customs Clearance').length
    };

    res.json({
      success: true,
      lastUpdated: new Date().toISOString(),
      charts: {
        inspectionResultDistribution,
        inspectionsOverTime,
        passFailTrends,
        commonInspectionFailures,
        inspectorWorkload,
        inspectionCompletionTime,
        evidenceStats
      }
    });
  } catch (error) {
    console.error('Error fetching inspector analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve inspector analytics' });
  }
});

// 6. Drill-Down Filtered Record Explorer (RBAC Protected)
router.get('/drilldown', requireAuth, async (req, res) => {
  try {
    const { type, filterKey, filterValue, page = 1, limit = 20 } = req.query;
    let results = [];
    let total = 0;

    if (type === 'containers') {
      const q = {};
      if (filterKey && filterValue) q[filterKey] = filterValue;
      total = await Container.countDocuments(q);
      results = await Container.find(q).skip((Number(page) - 1) * Number(limit)).limit(Number(limit));
    } else if (type === 'ships') {
      const q = {};
      if (filterKey && filterValue) q[filterKey] = filterValue;
      total = await Ship.countDocuments(q);
      results = await Ship.find(q).skip((Number(page) - 1) * Number(limit)).limit(Number(limit));
    } else if (type === 'inspections') {
      const q = {};
      if (filterKey && filterValue) q[filterKey] = filterValue;
      total = await Inspection.countDocuments(q);
      results = await Inspection.find(q).skip((Number(page) - 1) * Number(limit)).limit(Number(limit));
    } else if (type === 'audit-logs') {
      if (req.user.role !== 'admin' && req.user.role !== 'viewer') {
        return res.status(403).json({ error: 'Audit log drilldown restricted to Admin and Auditor' });
      }
      const q = {};
      if (filterKey && filterValue) q[filterKey] = filterValue;
      total = await AuditLog.countDocuments(q);
      results = await AuditLog.find(q).sort({ timestamp: -1 }).skip((Number(page) - 1) * Number(limit)).limit(Number(limit));
    }

    res.json({
      success: true,
      type,
      total,
      page: Number(page),
      limit: Number(limit),
      records: results
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Drilldown query failed' });
  }
});

// 7. Log Export Activity
router.post('/log-export', requireAuth, async (req, res) => {
  try {
    const { exportType, format, filterParams } = req.body;

    const audit = await createAuditLog({
      userId: req.user.userId,
      username: req.user.name,
      userRole: req.user.role,
      action: 'ANALYTICS_REPORT_EXPORTED',
      entityType: 'Analytics',
      entityId: `EXP-${Date.now()}`,
      location: req.user.assignedPort || 'HQ',
      newValue: { exportType, format, filterParams }
    });

    res.json({ success: true, auditId: audit.auditId });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to record export audit log' });
  }
});

module.exports = router;
