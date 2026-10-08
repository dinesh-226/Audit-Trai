const express = require('express');
const router = express.Router();
const Voyage = require('../models/Voyage');
const Ship = require('../models/Ship');
const Container = require('../models/Container');
const Alert = require('../models/Alert');
const { requireAuth, requireRole } = require('../middleware/auth');
const { createAuditLog } = require('../services/auditEngine');

// Helper to build authentic fleet voyages
const getFleetVoyages = (ships = []) => {
  const s1 = ships.find(s => s.shipId === 'SH-101') || { shipId: 'SH-101', name: 'MSC Irina', imoNumber: 'IMO 9929429' };
  const s2 = ships.find(s => s.shipId === 'SH-102') || { shipId: 'SH-102', name: 'Ever Ace', imoNumber: 'IMO 9893890' };
  const s3 = ships.find(s => s.shipId === 'SH-103') || { shipId: 'SH-103', name: 'CMA CGM Jacques Saadé', imoNumber: 'IMO 9839179' };

  return [
    {
      voyageId: 'VOY-2026-101',
      shipId: s1.shipId,
      shipName: s1.name,
      imoNumber: s1.imoNumber,
      departurePort: 'Singapore Port',
      arrivalPort: 'Mumbai Port',
      status: 'In Transit',
      plannedDepartureDate: new Date(Date.now() - 4 * 24 * 3600 * 1000),
      actualDepartureDate: new Date(Date.now() - 4 * 24 * 3600 * 1000),
      estimatedArrivalTime: new Date(Date.now() + 18 * 3600 * 1000),
      speedKnots: 19.4,
      headingDegrees: 142,
      currentCoordinates: { lat: 18.9412, lng: 72.8347 },
      cargoContainersCount: 2450,
      totalCargoWeightKg: 48200000,
      waypoints: [
        { name: 'Singapore Keppel Fairway', lat: 1.25, lng: 103.82, passed: true, passedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000) },
        { name: 'Malacca Strait Traffic Separation', lat: 3.12, lng: 100.55, passed: true, passedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000) },
        { name: 'Andaman Sea Deep Water Route', lat: 7.50, lng: 94.20, passed: true, passedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000) },
        { name: 'Arabian Sea Corridor (Laccadive)', lat: 14.82, lng: 74.15, passed: true, passedAt: new Date(Date.now() - 12 * 3600 * 1000) },
        { name: 'Mumbai Harbour Pilot Station', lat: 18.94, lng: 72.83, passed: false }
      ],
      delays: [],
      seaConditions: { waveMeters: 1.8, windKnots: 14, condition: 'Fair Seas' },
      portCoordination: {
        requestedBerth: 'Berth 01 (Quay North)',
        berthingConfirmed: true,
        portNotes: 'Berth 01 prepared by Mumbai Port Manager with 3 quay cranes assigned.'
      },
      voyageNotes: 'Carrying high-priority dry cargo and reefer units from East Asia to Mumbai Port.'
    },
    {
      voyageId: 'VOY-2026-102',
      shipId: s2.shipId,
      shipName: s2.name,
      imoNumber: s2.imoNumber,
      departurePort: 'Shanghai Port',
      arrivalPort: 'Singapore Port',
      status: 'In Transit',
      plannedDepartureDate: new Date(Date.now() - 6 * 24 * 3600 * 1000),
      actualDepartureDate: new Date(Date.now() - 6 * 24 * 3600 * 1000),
      estimatedArrivalTime: new Date(Date.now() + 32 * 3600 * 1000),
      speedKnots: 18.2,
      headingDegrees: 198,
      currentCoordinates: { lat: 3.1390, lng: 101.6869 },
      cargoContainersCount: 3180,
      totalCargoWeightKg: 61500000,
      waypoints: [
        { name: 'Shanghai Yangshan Deepwater Terminal', lat: 30.62, lng: 122.06, passed: true, passedAt: new Date(Date.now() - 6 * 24 * 3600 * 1000) },
        { name: 'Taiwan Strait Passage', lat: 24.50, lng: 119.80, passed: true, passedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000) },
        { name: 'South China Sea Corridor', lat: 14.20, lng: 113.50, passed: true, passedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000) },
        { name: 'Malacca Strait Traffic Separation (One Fathom Bank)', lat: 3.139, lng: 101.686, passed: true, passedAt: new Date(Date.now() - 6 * 3600 * 1000) },
        { name: 'Singapore Port Jurong Gateway', lat: 1.28, lng: 103.75, passed: false }
      ],
      delays: [
        {
          reason: 'Monsoon sea swell reduced average speed in South China Sea',
          delayHours: 3,
          mitigation: 'Adjusted speed to 18.2 knots for container stability',
          reportedBy: 'Capt. Suresh Pillai'
        }
      ],
      seaConditions: { waveMeters: 2.1, windKnots: 18, condition: 'Moderate Swell' },
      portCoordination: {
        requestedBerth: 'Berth 02 (Jurong Quay)',
        berthingConfirmed: true,
        portNotes: 'Scheduled arrival confirmed with Singapore Port Master. 4 high-speed gantry cranes allocated.'
      },
      voyageNotes: 'Megamax container carrier transporting pharmaceutical reefers, auto components, and electronics.'
    },
    {
      voyageId: 'VOY-2026-103',
      shipId: s3.shipId,
      shipName: s3.name,
      imoNumber: s3.imoNumber,
      departurePort: 'Dubai Port',
      arrivalPort: 'Mumbai Port',
      status: 'Docked',
      plannedDepartureDate: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      actualDepartureDate: new Date(Date.now() - 5 * 24 * 3600 * 1000),
      estimatedArrivalTime: new Date(Date.now() - 4 * 3600 * 1000),
      actualArrivalTime: new Date(Date.now() - 4 * 3600 * 1000),
      speedKnots: 0.0,
      headingDegrees: 0,
      currentCoordinates: { lat: 18.9500, lng: 72.8500 },
      cargoContainersCount: 1890,
      totalCargoWeightKg: 36800000,
      waypoints: [
        { name: 'Dubai Jebel Ali Port Terminal 2', lat: 25.01, lng: 55.06, passed: true, passedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000) },
        { name: 'Strait of Hormuz Inbound Channel', lat: 26.56, lng: 56.45, passed: true, passedAt: new Date(Date.now() - 4 * 24 * 3600 * 1000) },
        { name: 'Gulf of Oman Deep Route', lat: 24.30, lng: 58.60, passed: true, passedAt: new Date(Date.now() - 3 * 24 * 3600 * 1000) },
        { name: 'Arabian Sea East Crossing', lat: 20.10, lng: 67.40, passed: true, passedAt: new Date(Date.now() - 1 * 24 * 3600 * 1000) },
        { name: 'Mumbai Port Berth 04', lat: 18.950, lng: 72.850, passed: true, passedAt: new Date(Date.now() - 4 * 3600 * 1000) }
      ],
      delays: [],
      seaConditions: { waveMeters: 0.8, windKnots: 8, condition: 'Calm Waters (Docked)' },
      portCoordination: {
        requestedBerth: 'Berth 04 (JNPT Terminal)',
        berthingConfirmed: true,
        portNotes: 'Vessel safely docked at Berth 04. Unloading and customs clearance in progress.'
      },
      voyageNotes: 'LNG dual-fuel carrier delivering industrial chemicals and perishable agricultural produce.'
    }
  ];
};

// 1. List Voyages
router.get('/', async (req, res) => {
  try {
    const { shipId, status, port } = req.query;
    const query = {};
    if (shipId) {
      query.$or = [
        { shipId },
        { imoNumber: shipId },
        { shipName: new RegExp(shipId, 'i') }
      ];
    }
    if (status) query.status = status;
    if (port) {
      query.$or = [{ departurePort: new RegExp(port, 'i') }, { arrivalPort: new RegExp(port, 'i') }];
    }

    let voyages = await Voyage.find(query).sort({ updatedAt: -1 });

    // Auto-populate fleet voyages if none exist in the database
    if (voyages.length === 0 && (!shipId && !status && !port)) {
      const ships = await Ship.find();
      const demoVoyages = getFleetVoyages(ships);
      voyages = await Voyage.insertMany(demoVoyages);
    }

    res.json(voyages);
  } catch (error) {
    console.error('Error fetching voyages:', error);
    res.status(500).json({ error: 'Failed to retrieve voyages' });
  }
});

// 2. Get Single Voyage
router.get('/:voyageId', async (req, res) => {
  try {
    const voyage = await Voyage.findOne({
      $or: [{ voyageId: req.params.voyageId }, { voyageId: req.params.voyageId.toUpperCase() }]
    });

    if (!voyage) {
      return res.status(404).json({ error: 'Voyage record not found' });
    }

    const ship = await Ship.findOne({ shipId: voyage.shipId });
    const containers = await Container.find({
      $or: [{ assignedShipId: voyage.shipId }, { assignedShipName: voyage.shipName }]
    });

    res.json({ voyage, ship, containers });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve voyage profile' });
  }
});

// 3. Create New Voyage
router.post('/', requireAuth, requireRole('admin', 'ship_manager'), async (req, res) => {
  try {
    const { shipId, departurePort, arrivalPort, plannedDepartureDate, estimatedArrivalTime, waypoints, requestedBerth, voyageNotes } = req.body;

    if (!shipId || !departurePort || !arrivalPort || !estimatedArrivalTime) {
      return res.status(400).json({ error: 'Ship, origin port, destination port, and ETA are required' });
    }

    const ship = await Ship.findOne({ shipId });
    if (!ship) {
      return res.status(404).json({ error: 'Ship not found' });
    }

    const voyageCount = await Voyage.countDocuments();
    const voyageId = `VOY-2026-${String(voyageCount + 101).padStart(3, '0')}`;

    const voyage = new Voyage({
      voyageId,
      shipId: ship.shipId,
      shipName: ship.name,
      imoNumber: ship.imoNumber,
      departurePort,
      arrivalPort,
      status: 'In Transit',
      plannedDepartureDate: plannedDepartureDate ? new Date(plannedDepartureDate) : new Date(),
      actualDepartureDate: new Date(),
      estimatedArrivalTime: new Date(estimatedArrivalTime),
      speedKnots: ship.coordinates?.speedKnots || 18.5,
      headingDegrees: ship.coordinates?.heading || 90,
      currentCoordinates: { lat: ship.coordinates?.lat || 18.94, lng: ship.coordinates?.lng || 72.83 },
      waypoints: waypoints || [
        { name: `${departurePort} Departure Channel`, lat: ship.coordinates?.lat || 18.9, lng: ship.coordinates?.lng || 72.8, passed: true, passedAt: new Date() },
        { name: `${arrivalPort} Outer Anchorage`, lat: 18.94, lng: 72.83, passed: false }
      ],
      portCoordination: {
        requestedBerth: requestedBerth || 'Berth 01 (Quay North)',
        berthingConfirmed: false,
        portNotes: `Voyage initialized for ${ship.name}`
      },
      voyageNotes: voyageNotes || `Scheduled voyage from ${departurePort} to ${arrivalPort}`
    });

    await voyage.save();

    // Update ship status and route
    ship.status = 'In Transit';
    ship.departurePort = departurePort;
    ship.arrivalPort = arrivalPort;
    ship.destination = arrivalPort;
    ship.eta = new Date(estimatedArrivalTime);
    await ship.save();

    const audit = await createAuditLog({
      userId: req.user.userId,
      username: req.user.name,
      userRole: req.user.role,
      action: 'VOYAGE_CREATED',
      entityType: 'Ship',
      entityId: voyage.voyageId,
      shipId: ship.shipId,
      location: departurePort,
      newValue: {
        voyageId: voyage.voyageId,
        vessel: ship.name,
        route: `${departurePort} ➔ ${arrivalPort}`,
        eta: voyage.estimatedArrivalTime
      }
    });

    voyage.auditId = audit.auditId;
    await voyage.save();

    res.status(201).json(voyage);
  } catch (error) {
    console.error('Error creating voyage:', error);
    res.status(500).json({ error: 'Failed to create voyage record' });
  }
});

// 4. Update ETA (with reason and notification to Port Manager)
router.patch('/:voyageId/eta', requireAuth, requireRole('admin', 'ship_manager'), async (req, res) => {
  try {
    const { estimatedArrivalTime, reason, notes } = req.body;
    const voyage = await Voyage.findOne({ voyageId: req.params.voyageId });

    if (!voyage) {
      return res.status(404).json({ error: 'Voyage record not found' });
    }

    const previousEta = voyage.estimatedArrivalTime;
    voyage.estimatedArrivalTime = new Date(estimatedArrivalTime);

    if (reason) {
      voyage.delays.push({
        reason,
        delayHours: Math.max(1, Math.round((new Date(estimatedArrivalTime) - new Date(previousEta)) / (1000 * 3600))),
        reportedAt: new Date(),
        mitigation: notes || 'Speed optimization adjusted to recover schedule',
        reportedBy: req.user.name
      });
    }

    await voyage.save();

    // Update Ship model ETA
    await Ship.findOneAndUpdate({ shipId: voyage.shipId }, { eta: voyage.estimatedArrivalTime });

    // Send Alert to Port Manager
    const alertId = `ALT-ETA-${Date.now()}`;
    await Alert.create({
      alertId,
      title: `ETA Updated: ${voyage.shipName} (${voyage.voyageId})`,
      message: `Ship Manager ${req.user.name} updated ETA to ${new Date(estimatedArrivalTime).toLocaleString()}. Reason: ${reason || 'Schedule adjustment'}. Port Manager please prepare berth.`,
      severity: 'medium',
      category: 'delay',
      entityType: 'Ship',
      entityId: voyage.shipId,
      metadata: { voyageId: voyage.voyageId, port: voyage.arrivalPort, previousEta, newEta: voyage.estimatedArrivalTime }
    });

    // Write to Audit Trail
    const audit = await createAuditLog({
      userId: req.user.userId,
      username: req.user.name,
      userRole: req.user.role,
      action: 'VOYAGE_ETA_UPDATED',
      entityType: 'Ship',
      entityId: voyage.voyageId,
      shipId: voyage.shipId,
      location: `${voyage.shipName} en route to ${voyage.arrivalPort}`,
      previousValue: { eta: previousEta },
      newValue: { eta: voyage.estimatedArrivalTime, reason, notes }
    });

    res.json({
      message: `ETA for ${voyage.shipName} updated to ${new Date(estimatedArrivalTime).toLocaleString()}`,
      voyage,
      auditId: audit.auditId
    });
  } catch (error) {
    console.error('Error updating ETA:', error);
    res.status(500).json({ error: 'Failed to update voyage ETA' });
  }
});

// 5. Update Telemetry (Speed, Heading, Sea Condition, Waypoint progress)
router.patch('/:voyageId/telemetry', requireAuth, requireRole('admin', 'ship_manager'), async (req, res) => {
  try {
    const { speedKnots, headingDegrees, coordinates, seaConditions, waypointIndex } = req.body;
    const voyage = await Voyage.findOne({ voyageId: req.params.voyageId });

    if (!voyage) {
      return res.status(404).json({ error: 'Voyage record not found' });
    }

    if (speedKnots !== undefined) voyage.speedKnots = Number(speedKnots);
    if (headingDegrees !== undefined) voyage.headingDegrees = Number(headingDegrees);
    if (coordinates && Number.isFinite(Number(coordinates.lat)) && Number.isFinite(Number(coordinates.lng))) {
      voyage.currentCoordinates = { lat: Number(coordinates.lat), lng: Number(coordinates.lng) };
    }
    if (seaConditions) voyage.seaConditions = seaConditions;

    if (waypointIndex !== undefined && voyage.waypoints[waypointIndex]) {
      voyage.waypoints[waypointIndex].passed = true;
      voyage.waypoints[waypointIndex].passedAt = new Date();
    }

    await voyage.save();

    const shipTelemetry = {};
    if (coordinates && voyage.currentCoordinates) {
      shipTelemetry['coordinates.lat'] = voyage.currentCoordinates.lat;
      shipTelemetry['coordinates.lng'] = voyage.currentCoordinates.lng;
      shipTelemetry['coordinates.lastUpdated'] = new Date();
    }
    if (speedKnots !== undefined) shipTelemetry['coordinates.speedKnots'] = voyage.speedKnots;
    if (headingDegrees !== undefined) shipTelemetry['coordinates.heading'] = voyage.headingDegrees;
    if (Object.keys(shipTelemetry).length > 0) {
      await Ship.findOneAndUpdate({ shipId: voyage.shipId }, { $set: shipTelemetry });
    }

    res.json({ message: 'Live voyage telemetry updated', voyage });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update voyage telemetry' });
  }
});

// 6. Record Voyage Delay / Route Diversion
router.post('/:voyageId/delay', requireAuth, requireRole('admin', 'ship_manager'), async (req, res) => {
  try {
    const { reason, delayHours = 4, mitigation, isDiversion, portOfDiversion } = req.body;
    const voyage = await Voyage.findOne({ voyageId: req.params.voyageId });

    if (!voyage) {
      return res.status(404).json({ error: 'Voyage record not found' });
    }

    voyage.status = isDiversion ? 'Diverted' : 'Delayed';
    voyage.delays.push({
      reason,
      delayHours: Number(delayHours),
      reportedAt: new Date(),
      mitigation: mitigation || 'Course adjusted with safety margin',
      reportedBy: req.user.name
    });

    if (isDiversion && portOfDiversion) {
      voyage.arrivalPort = portOfDiversion;
    }

    await voyage.save();

    // Create Alert
    const alertId = `ALT-VOYDELAY-${Date.now()}`;
    await Alert.create({
      alertId,
      title: `${isDiversion ? 'Voyage Diverted' : 'Voyage Delay Reported'}: ${voyage.shipName}`,
      message: `${voyage.shipName} reported ${delayHours}h delay en route to ${voyage.arrivalPort}. Reason: ${reason}`,
      severity: 'high',
      category: 'delay',
      entityType: 'Ship',
      entityId: voyage.shipId,
      metadata: { voyageId: voyage.voyageId, reason, delayHours, mitigation }
    });

    // Write to Audit Trail
    const audit = await createAuditLog({
      userId: req.user.userId,
      username: req.user.name,
      userRole: req.user.role,
      action: isDiversion ? 'VOYAGE_ROUTE_DIVERTED' : 'VOYAGE_DELAY_RECORDED',
      entityType: 'Ship',
      entityId: voyage.voyageId,
      shipId: voyage.shipId,
      location: `${voyage.shipName} Sea Route`,
      newValue: { reason, delayHours, mitigation, status: voyage.status }
    });

    res.json({
      message: `Delay recorded for ${voyage.shipName}`,
      voyage,
      auditId: audit.auditId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to record voyage delay' });
  }
});

// 7. Coordinate with Port Manager (Berthing Schedule)
router.post('/:voyageId/coordinate-port', requireAuth, requireRole('admin', 'ship_manager'), async (req, res) => {
  try {
    const { requestedBerth, pilotStationETA, notes } = req.body;
    const voyage = await Voyage.findOne({ voyageId: req.params.voyageId });

    if (!voyage) {
      return res.status(404).json({ error: 'Voyage record not found' });
    }

    voyage.portCoordination.requestedBerth = requestedBerth || voyage.portCoordination.requestedBerth;
    if (pilotStationETA) voyage.portCoordination.pilotBoardingTime = new Date(pilotStationETA);
    voyage.portCoordination.portNotes = notes || 'Arrival coordination transmitted to Port Manager.';
    await voyage.save();

    // Create notification alert for Port Manager
    const alertId = `ALT-PORTCOORD-${Date.now()}`;
    await Alert.create({
      alertId,
      title: `Berth Coordination Request: ${voyage.shipName}`,
      message: `Ship Manager ${req.user.name} requested ${voyage.portCoordination.requestedBerth} at ${voyage.arrivalPort}. Expected arrival: ${new Date(voyage.estimatedArrivalTime).toLocaleTimeString()}`,
      severity: 'info',
      category: 'status_change',
      entityType: 'Ship',
      entityId: voyage.shipId,
      metadata: { port: voyage.arrivalPort, berth: voyage.portCoordination.requestedBerth }
    });

    const audit = await createAuditLog({
      userId: req.user.userId,
      username: req.user.name,
      userRole: req.user.role,
      action: 'PORT_BERTH_COORDINATED',
      entityType: 'Ship',
      entityId: voyage.voyageId,
      shipId: voyage.shipId,
      location: voyage.arrivalPort,
      newValue: { requestedBerth: voyage.portCoordination.requestedBerth, eta: voyage.estimatedArrivalTime }
    });

    res.json({
      message: `Arrival notice & berth request sent to ${voyage.arrivalPort} Manager`,
      voyage,
      auditId: audit.auditId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to coordinate with port' });
  }
});

// 8. Record Departure or Arrival
router.patch('/:voyageId/status', requireAuth, requireRole('admin', 'ship_manager'), async (req, res) => {
  try {
    const { status, actualArrivalTime } = req.body;
    const voyage = await Voyage.findOne({ voyageId: req.params.voyageId });

    if (!voyage) {
      return res.status(404).json({ error: 'Voyage record not found' });
    }

    voyage.status = status;
    if (status === 'Arrived' || status === 'Completed') {
      voyage.actualArrivalTime = actualArrivalTime ? new Date(actualArrivalTime) : new Date();
    }

    await voyage.save();

    // Update ship
    let shipStatus = status === 'Arrived' ? 'Arrived' : status === 'In Transit' ? 'In Transit' : 'Docked';
    await Ship.findOneAndUpdate({ shipId: voyage.shipId }, { status: shipStatus });

    const audit = await createAuditLog({
      userId: req.user.userId,
      username: req.user.name,
      userRole: req.user.role,
      action: status === 'Arrived' ? 'SHIP_PORT_ARRIVED' : 'SHIP_VOYAGE_DEPARTED',
      entityType: 'Ship',
      entityId: voyage.voyageId,
      shipId: voyage.shipId,
      location: status === 'Arrived' ? voyage.arrivalPort : voyage.departurePort,
      newValue: { status, actualArrivalTime: voyage.actualArrivalTime }
    });

    res.json({
      message: `Voyage status updated to ${status}`,
      voyage,
      auditId: audit.auditId
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update voyage status' });
  }
});

// 9. Voyage Performance Comparison (Planned vs Actual)
router.get('/:voyageId/performance', requireAuth, async (req, res) => {
  try {
    const voyage = await Voyage.findOne({ voyageId: req.params.voyageId });
    if (!voyage) {
      return res.status(404).json({ error: 'Voyage not found' });
    }

    const plannedDurationHours = Math.round((new Date(voyage.estimatedArrivalTime) - new Date(voyage.plannedDepartureDate)) / (1000 * 3600));
    const arrivalTime = voyage.actualArrivalTime || new Date();
    const actualDurationHours = Math.round((new Date(arrivalTime) - new Date(voyage.actualDepartureDate)) / (1000 * 3600));
    const varianceHours = actualDurationHours - plannedDurationHours;

    res.json({
      voyageId: voyage.voyageId,
      shipName: voyage.shipName,
      route: `${voyage.departurePort} ➔ ${voyage.arrivalPort}`,
      plannedDurationHours,
      actualDurationHours,
      varianceHours,
      onSchedule: varianceHours <= 0,
      averageSpeedKnots: voyage.speedKnots,
      delaysCount: voyage.delays.length,
      delays: voyage.delays
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate voyage performance' });
  }
});

module.exports = router;
