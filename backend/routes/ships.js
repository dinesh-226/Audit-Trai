const express = require('express');
const router = express.Router();
const Ship = require('../models/Ship');
const Container = require('../models/Container');
const AuditLog = require('../models/AuditLog');
const { requireAuth, requireRole } = require('../middleware/auth');
const { createAuditLog } = require('../services/auditEngine');
const { resolveGeoCoordinates } = require('../utils/geoCoordinates');

// List Ships with search & filter
router.get('/', async (req, res) => {
  try {
    const { status, port, search } = req.query;
    const query = {};

    if (status && status.trim() && status !== 'undefined' && status !== 'null' && status !== 'All Operational Statuses' && status !== 'All') {
      query.status = status.trim();
    }
    if (port && port.trim() && port !== 'undefined' && port !== 'null' && port !== 'All Ports') {
      const cleanPort = port.trim();
      query.$or = [{ departurePort: cleanPort }, { arrivalPort: cleanPort }, { destination: cleanPort }];
    }
    if (search && search.trim() && search !== 'undefined' && search !== 'null') {
      const cleanSearch = search.trim();
      query.$or = [
        { name: new RegExp(cleanSearch, 'i') },
        { shipId: new RegExp(cleanSearch, 'i') },
        { imoNumber: new RegExp(cleanSearch, 'i') },
        { captain: new RegExp(cleanSearch, 'i') }
      ];
    }

    const ships = await Ship.find(query).sort({ updatedAt: -1 });

    // Attach real-time onboard container count to each ship
    const enhancedShips = await Promise.all(ships.map(async (ship) => {
      const containerCount = await Container.countDocuments({
        assignedShipId: ship.shipId,
        status: { $in: ['Loaded', 'In Transit'] }
      });
      const sObj = ship.toObject();
      sObj.containersOnboardCount = containerCount;
      return sObj;
    }));

    res.json(enhancedShips);
  } catch (error) {
    console.error('Error fetching ships:', error);
    res.status(500).json({ error: 'Failed to retrieve ships' });
  }
});

// Get Ship by ID
router.get('/:shipId', async (req, res) => {
  try {
    const ship = await Ship.findOne({ shipId: req.params.shipId });
    if (!ship) {
      return res.status(404).json({ error: 'Ship not found' });
    }

    const containers = await Container.find({ assignedShipId: ship.shipId });
    const activityLogs = await AuditLog.find({
      $or: [{ shipId: ship.shipId }, { entityId: ship.shipId }]
    }).sort({ sequenceNumber: -1 }).limit(15);

    res.json({
      ship,
      containers,
      activityLogs
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve ship details' });
  }
});

// Create Ship (Admin or Ship Manager)
router.post('/', requireAuth, requireRole('admin', 'ship_manager'), async (req, res) => {
  try {
    const { name, imoNumber, type, capacityTEU, currentLocation, destination, departurePort, arrivalPort, captain, flag, coordinates } = req.body;
    
    if (!name || !imoNumber || !capacityTEU) {
      return res.status(400).json({ error: 'Ship name, IMO number, and TEU capacity are required' });
    }

    if (coordinates && (!Number.isFinite(Number(coordinates.lat)) || Number(coordinates.lat) < -90 || Number(coordinates.lat) > 90 ||
      !Number.isFinite(Number(coordinates.lng)) || Number(coordinates.lng) < -180 || Number(coordinates.lng) > 180)) {
      return res.status(400).json({ error: 'Valid latitude and longitude are required for a vessel GPS position' });
    }

    const count = await Ship.countDocuments();
    const shipId = `SH-${String(count + 101)}`;

    const hasValidCoords = coordinates &&
      Number.isFinite(Number(coordinates.lat)) &&
      Number.isFinite(Number(coordinates.lng)) &&
      !(Number(coordinates.lat) === 0 && Number(coordinates.lng) === 0);

    const resolvedCoords = hasValidCoords ? {
      lat: Number(coordinates.lat),
      lng: Number(coordinates.lng),
      lastUpdated: new Date()
    } : resolveGeoCoordinates(currentLocation || departurePort, `${departurePort || ''} ${arrivalPort || ''}`, shipId);

    const ship = new Ship({
      shipId,
      name,
      imoNumber,
      type: type || 'Container Carrier',
      capacityTEU: Number(capacityTEU),
      currentLocation: currentLocation || `${departurePort || 'Port'} Berth 1`,
      destination: destination || arrivalPort || 'Mumbai Port',
      departurePort: departurePort || 'Singapore Port',
      arrivalPort: arrivalPort || destination || 'Mumbai Port',
      captain: captain || 'Capt. Unassigned',
      flag: flag || 'Panama',
      coordinates: resolvedCoords,
      status: 'Docked'
    });

    await ship.save();

    await createAuditLog({
      userId: req.user.userId,
      username: req.user.name,
      userRole: req.user.role,
      action: 'SHIP_CREATED',
      entityType: 'Ship',
      entityId: ship.shipId,
      shipId: ship.shipId,
      location: ship.currentLocation,
      newValue: { name: ship.name, imo: ship.imoNumber, capacity: ship.capacityTEU }
    });

    res.status(201).json(ship);
  } catch (error) {
    console.error('Error creating ship:', error);
    res.status(500).json({ error: 'Failed to create ship record' });
  }
});

// Update Ship
router.put('/:shipId', requireAuth, requireRole('admin', 'ship_manager', 'port_manager'), async (req, res) => {
  try {
    const ship = await Ship.findOne({ shipId: req.params.shipId });
    if (!ship) {
      return res.status(404).json({ error: 'Ship not found' });
    }

    const previousData = {
      name: ship.name,
      status: ship.status,
      currentLocation: ship.currentLocation,
      destination: ship.destination,
      captain: ship.captain
    };

    const updateData = { ...req.body };
    if (updateData.coordinates) {
      const { lat, lng } = updateData.coordinates;
      if (!Number.isFinite(Number(lat)) || Number(lat) < -90 || Number(lat) > 90 ||
        !Number.isFinite(Number(lng)) || Number(lng) < -180 || Number(lng) > 180) {
        return res.status(400).json({ error: 'Valid latitude and longitude are required for a vessel GPS position' });
      }
      updateData.coordinates = { ...updateData.coordinates, lat: Number(lat), lng: Number(lng), lastUpdated: new Date() };
    }
    Object.assign(ship, updateData);
    await ship.save();

    await createAuditLog({
      userId: req.user.userId,
      username: req.user.name,
      userRole: req.user.role,
      action: 'SHIP_UPDATED',
      entityType: 'Ship',
      entityId: ship.shipId,
      shipId: ship.shipId,
      location: ship.currentLocation,
      previousValue: previousData,
      newValue: {
        name: ship.name,
        status: ship.status,
        currentLocation: ship.currentLocation,
        destination: ship.destination,
        captain: ship.captain
      }
    });

    res.json(ship);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update ship details' });
  }
});

// Update Ship Status
router.patch('/:shipId/status', requireAuth, requireRole('admin', 'ship_manager', 'port_manager'), async (req, res) => {
  try {
    const { status, currentLocation } = req.body;
    const ship = await Ship.findOne({ shipId: req.params.shipId });
    if (!ship) {
      return res.status(404).json({ error: 'Ship not found' });
    }

    const prevStatus = ship.status;
    const prevLocation = ship.currentLocation;

    ship.status = status;
    if (currentLocation) ship.currentLocation = currentLocation;
    await ship.save();

    let actionName = 'SHIP_STATUS_CHANGED';
    if (status === 'In Transit') actionName = 'SHIP_VOYAGE_DEPARTED';
    if (status === 'Arrived') actionName = 'SHIP_PORT_ARRIVED';
    if (status === 'Docked') actionName = 'SHIP_DOCKED';

    await createAuditLog({
      userId: req.user.userId,
      username: req.user.name,
      userRole: req.user.role,
      action: actionName,
      entityType: 'Ship',
      entityId: ship.shipId,
      shipId: ship.shipId,
      location: ship.currentLocation,
      previousValue: { status: prevStatus, location: prevLocation },
      newValue: { status: ship.status, location: ship.currentLocation }
    });

    res.json({ message: `Ship status updated to ${status}`, ship });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change ship status' });
  }
});

module.exports = router;
