const express = require('express');
const router = express.Router();
const Ship = require('../models/Ship');
const Container = require('../models/Container');
const ReeferTemperature = require('../models/ReeferTemperature');
const { PORT_REGISTRY, resolveGeoCoordinates, getOffset } = require('../utils/geoCoordinates');

// Get Live AIS Map Overview (Ships, Coordinates, Ports, Containers, Reefer Telemetry)
router.get('/live-map', async (req, res) => {
  try {
    const [ships, containers, reefers] = await Promise.all([
      Ship.find().lean(),
      Container.find().lean(),
      ReeferTemperature.find().lean()
    ]);

    const reeferMap = {};
    reefers.forEach(r => {
      reeferMap[r.containerId] = r;
    });

    const shipMap = {};
    const shipFleet = ships.map((s) => {
      let shipCoords = s.coordinates;
      const hasDirectCoords = shipCoords &&
        Number.isFinite(Number(shipCoords.lat)) &&
        Number.isFinite(Number(shipCoords.lng)) &&
        !(Number(shipCoords.lat) === 0 && Number(shipCoords.lng) === 0);

      if (!hasDirectCoords) {
        shipCoords = resolveGeoCoordinates(s.currentLocation, `${s.departurePort || ''} ${s.arrivalPort || ''}`, s.shipId || s.name);
      } else {
        shipCoords = {
          lat: Number(shipCoords.lat),
          lng: Number(shipCoords.lng),
          heading: shipCoords.heading ?? (s.status === 'In Transit' ? 142 : 0),
          speedKnots: shipCoords.speedKnots ?? (s.status === 'In Transit' ? 18.5 : 0.0),
          lastUpdated: shipCoords.lastUpdated || new Date()
        };
      }

      const ship = {
        ...s,
        coordinates: shipCoords,
        positionSource: hasDirectCoords ? 'recorded' : 'resolved-port'
      };

      shipMap[s.shipId] = ship;
      const count = containers.filter(c => c.assignedShipId === s.shipId).length;
      return {
        ...ship,
        containersOnboardCount: count
      };
    });

    // Map Containers with Real Coordinates & Telemetry
    const mapContainers = containers.map((c, index) => {
      const assignedShip = shipMap[c.assignedShipId];
      const reeferInfo = reeferMap[c.containerId] || null;

      let lat = null;
      let lng = null;
      let locationType = 'Port Yard / Terminal';
      let positionSource = 'resolved-location';

      const hasDirectCoords = c.coordinates &&
        Number.isFinite(Number(c.coordinates.lat)) &&
        Number.isFinite(Number(c.coordinates.lng)) &&
        !(Number(c.coordinates.lat) === 0 && Number(c.coordinates.lng) === 0);

      if (hasDirectCoords) {
        lat = Number(c.coordinates.lat);
        lng = Number(c.coordinates.lng);
        locationType = 'Custom GPS Reading';
        positionSource = 'recorded-container';
      } else if (assignedShip && assignedShip.coordinates && (c.status === 'Loaded' || c.status === 'In Transit')) {
        const { latOffset, lngOffset } = getOffset(c.containerId, 0.005);
        lat = Number((assignedShip.coordinates.lat + latOffset).toFixed(6));
        lng = Number((assignedShip.coordinates.lng + lngOffset).toFixed(6));
        locationType = `Onboard ${assignedShip.name}`;
        positionSource = 'assigned-vessel';
      } else {
        const resolved = resolveGeoCoordinates(c.currentLocation, `${c.origin || ''} ${c.destination || ''}`, c.containerId || `C-${index}`);
        lat = resolved.lat;
        lng = resolved.lng;
        locationType = c.currentLocation || 'Port Container Terminal';
        positionSource = 'resolved-terminal';
      }

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
        lat,
        lng,
        locationType,
        vesselName: assignedShip?.name || null,
        positionSource,
        isReefer: !!reeferInfo || c.type?.toLowerCase().includes('reefer'),
        temperatureCelsius: reeferInfo ? reeferInfo.currentTemperature : c.temperatureCelsius,
        targetTemperature: reeferInfo?.targetTemperature ?? (c.type?.toLowerCase().includes('reefer') ? -18 : null),
        reeferStatus: reeferInfo?.sensorStatus || (c.type?.toLowerCase().includes('reefer') ? (c.temperatureCelsius > -10 ? 'Warning' : 'Normal') : null),
        powerStatus: reeferInfo?.powerStatus || (c.type?.toLowerCase().includes('reefer') ? 'Active (Main Power)' : null),
        hasIncidents: reeferInfo?.incidents?.some(i => i.status !== 'Closed') || false
      };
    });

    res.json({
      timestamp: new Date().toISOString(),
      ports: PORT_REGISTRY,
      ships: shipFleet,
      containers: mapContainers,
      totalActiveVessels: shipFleet.length,
      totalContainers: mapContainers.length,
      totalReefers: mapContainers.filter(c => c.isReefer).length,
      mode: 'ACTIVE_TELEMETRY'
    });
  } catch (error) {
    console.error('Error fetching live map telemetry:', error);
    res.status(500).json({ error: 'Failed to retrieve live map telemetry' });
  }
});

// Step AIS Simulation for In-Transit Vessels
router.post('/simulate-step', async (req, res) => {
  try {
    const transitShips = await Ship.find({ status: 'In Transit' });
    const updated = [];

    for (const ship of transitShips) {
      if (!ship.coordinates || !Number.isFinite(ship.coordinates.lat)) {
        ship.coordinates = resolveGeoCoordinates(ship.currentLocation, `${ship.departurePort} ${ship.arrivalPort}`, ship.shipId);
      }

      // Nudge coordinates along heading
      const headingRad = ((ship.coordinates.heading || 140) * Math.PI) / 180;
      const stepDist = 0.05; // ~3 nautical miles
      const dLat = Math.cos(headingRad) * stepDist;
      const dLng = Math.sin(headingRad) * stepDist;

      ship.coordinates.lat = Number((ship.coordinates.lat + dLat).toFixed(6));
      ship.coordinates.lng = Number((ship.coordinates.lng + dLng).toFixed(6));
      ship.coordinates.lastUpdated = new Date();
      ship.coordinates.speedKnots = Number((18.0 + Math.random() * 2.5).toFixed(1));

      await ship.save();
      updated.push({
        shipId: ship.shipId,
        name: ship.name,
        coordinates: ship.coordinates
      });
    }

    res.json({
      success: true,
      message: `Simulated AIS movement step for ${updated.length} in-transit vessel(s)`,
      updatedShips: updated
    });
  } catch (error) {
    console.error('Error in simulate step:', error);
    res.status(500).json({ error: 'Failed to simulate vessel movement' });
  }
});

module.exports = router;
