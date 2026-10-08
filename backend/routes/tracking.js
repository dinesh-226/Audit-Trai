const express = require('express');
const router = express.Router();
const Ship = require('../models/Ship');
const Container = require('../models/Container');
const ReeferTemperature = require('../models/ReeferTemperature');

// Get Live AIS Map Overview (Ships, Coordinates, Ports, Containers, Reefer Telemetry)
router.get('/live-map', async (req, res) => {
  try {
    const [ships, containers, reefers] = await Promise.all([
      Ship.find().select('shipId name imoNumber type capacityTEU status currentLocation departurePort arrivalPort captain flag coordinates eta routeWaypoints speedKnots headingDegrees seaConditions').lean(),
      Container.find().lean(),
      ReeferTemperature.find().lean()
    ]);

    const shipMap = {};
    const shipFleet = ships.map((s) => {
      const hasRecordedPosition = Number.isFinite(s.coordinates?.lat) &&
        Number.isFinite(s.coordinates?.lng) && s.coordinates?.lastUpdated;
      const ship = {
        ...s,
        coordinates: hasRecordedPosition ? s.coordinates : null,
        positionSource: hasRecordedPosition ? 'recorded' : null
      };
      shipMap[s.shipId] = ship;
      const count = containers.filter(c => c.assignedShipId === s.shipId).length;
      return {
        ...ship,
        containersOnboardCount: count
      };
    });

    const reeferMap = {};
    reefers.forEach(r => {
      reeferMap[r.containerId] = r;
    });

    // Map Containers with Real Coordinates & Telemetry
    const mapContainers = containers.map(c => {
      const assignedShip = shipMap[c.assignedShipId];
      const reeferInfo = reeferMap[c.containerId] || null;
      const shipCoordinates = assignedShip?.coordinates;

      return {
        containerId: c.containerId,
        type: c.type,
        size: c.size,
        status: c.status,
        weightKg: c.weightKg,
        cargoDescription: c.cargoDescription,
        ownerCompany: c.ownerCompany,
        sealNumber: c.sealNumber,
        riskLevel: c.riskLevel,
        riskScore: c.riskScore,
        assignedShipId: c.assignedShipId,
        assignedShipName: c.assignedShipName || assignedShip?.name || null,
        currentLocation: c.currentLocation,
        lat: shipCoordinates?.lat ?? null,
        lng: shipCoordinates?.lng ?? null,
        locationType: shipCoordinates ? 'Onboard Vessel' : null,
        vesselName: shipCoordinates ? assignedShip.name : null,
        isReefer: !!reeferInfo || c.type?.toLowerCase().includes('reefer'),
        temperatureCelsius: reeferInfo ? reeferInfo.currentTemperature : c.temperatureCelsius,
        targetTemperature: reeferInfo?.targetTemperature ?? null,
        reeferStatus: reeferInfo?.sensorStatus || null,
        powerStatus: reeferInfo?.powerStatus || null,
        hasIncidents: reeferInfo?.incidents?.some(i => i.status !== 'Closed') || false
      };
    });

    res.json({
      timestamp: new Date().toISOString(),
      ports: [],
      ships: shipFleet,
      containers: mapContainers,
      totalActiveVessels: ships.length,
      totalContainers: containers.length,
      totalReefers: reefers.length,
      mode: 'DATABASE_RECORDED_POSITIONS'
    });
  } catch (error) {
    console.error('Error fetching live map telemetry:', error);
    res.status(500).json({ error: 'Failed to retrieve live map telemetry' });
  }
});

module.exports = router;
