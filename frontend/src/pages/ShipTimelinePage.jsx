import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import {
  Ship,
  Clock,
  MapPin,
  Anchor,
  Box,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Filter,
  Search,
  Calendar,
  Layers,
  Sparkles,
  RotateCw,
  Sliders,
  ExternalLink,
  ChevronRight,
  Waves,
  Gauge,
  Radio,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Compass,
  Activity,
  CheckCircle,
  Eye,
  Info
} from 'lucide-react';

export const ShipTimelinePage = ({ initialShipId, onNavigate }) => {
  const [ships, setShips] = useState([]);
  const [selectedShipId, setSelectedShipId] = useState(initialShipId || 'SH-101');
  const [voyages, setVoyages] = useState([]);
  const [currentVoyage, setCurrentVoyage] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStageFilter, setSelectedStageFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive Time-Scrubber State
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef(null);

  useEffect(() => {
    loadShipTimelineData();
  }, [selectedShipId]);

  const loadShipTimelineData = async () => {
    setLoading(true);
    try {
      const [allShips, allVoyages, allAudits, allContainers] = await Promise.all([
        api.ships.getAll(),
        api.voyages.getAll(),
        api.auditLogs.getAll({ limit: 100 }),
        api.containers.getAll()
      ]);

      setShips(allShips || []);
      setVoyages(allVoyages || []);
      setContainers(allContainers || []);

      // Selected Ship
      const currentShip = (allShips || []).find(s => s.shipId === selectedShipId) || allShips?.[0];
      if (currentShip && !selectedShipId) {
        setSelectedShipId(currentShip.shipId);
      }

      // Active or related voyage
      const matchedVoyage = (allVoyages || []).find(v => v.shipId === selectedShipId) || allVoyages?.[0] || null;
      setCurrentVoyage(matchedVoyage);

      // Filter relevant audit logs for this ship
      const shipAudits = (allAudits?.logs || allAudits || []).filter(a =>
        a.shipId === selectedShipId ||
        a.entityId === selectedShipId ||
        (currentShip && (a.location?.includes(currentShip.name) || a.entityId?.includes(currentShip.name)))
      );
      setAuditLogs(shipAudits);
    } catch (e) {
      console.error('Failed to load ship timeline data:', e);
    } finally {
      setLoading(false);
    }
  };

  const activeShip = ships.find(s => s.shipId === selectedShipId) || ships[0] || {
    shipId: 'SH-101',
    name: 'MSC Irina',
    imoNumber: 'IMO 9805467',
    flag: 'Panama',
    captain: 'Capt. Jonathan Vance',
    capacityTEU: 24346,
    status: 'In Transit',
    departurePort: 'Singapore Port',
    arrivalPort: 'Mumbai Port',
    currentLocation: 'Onboard MSC Irina (Arabian Sea)',
    coordinates: { lat: 14.82, lng: 74.15, speedKnots: 19.8, heading: 312 }
  };

  const onboardContainers = containers.filter(c =>
    c.assignedShipId === selectedShipId ||
    c.assignedShipName === activeShip.name ||
    (c.status === 'In Transit' && c.assignedShipName?.includes(activeShip.name))
  );

  // Generate Chronological Timeline Milestones
  const buildTimelineEvents = () => {
    const events = [];

    // 1. Vessel Commissioning & Registration
    events.push({
      id: 'EVT-REG',
      category: 'REGISTRATION',
      stage: 'Created & Commissioned',
      stepNumber: 1,
      timeLabel: '14 Days Ago',
      statusAtTime: 'Registered / Commissioned',
      speedAtTime: '0.0 kts (In Shipyard)',
      locationAtTime: 'Panama Maritime Registry & Global Command',
      coordinatesAtTime: { lat: 8.98, lng: -79.52 },
      title: `Vessel Registration & IMO Charter Verification`,
      timestamp: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
      location: 'Panama Maritime Registry / Global Central Command',
      icon: Ship,
      color: '#0f3460',
      badge: 'Charter Commissioned',
      performedBy: 'Flag State Administration',
      userRole: 'Administrator',
      auditId: 'AUD-REG-9805467',
      hash: '9f82a1b4c3d2e1f0a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5',
      cargoState: 'Empty / Pre-Charter Inspection Passed',
      details: `Vessel ${activeShip.name} (${activeShip.imoNumber}) officially registered under ${activeShip.flag} flag with capacity of ${activeShip.capacityTEU?.toLocaleString()} TEU. Master ${activeShip.captain} appointed by fleet management.`
    });

    // 2. Voyage Initialization & Plan
    events.push({
      id: 'EVT-VOY-INIT',
      category: 'VOYAGE',
      stage: 'Voyage Initialized',
      stepNumber: 2,
      timeLabel: '5 Days Ago',
      statusAtTime: 'Scheduled / Route Chartered',
      speedAtTime: '0.0 kts (At Anchorage)',
      locationAtTime: `${activeShip.departurePort || 'Singapore Port'} Operations Command`,
      coordinatesAtTime: { lat: 1.29, lng: 103.85 },
      title: `Voyage ${currentVoyage?.voyageId || 'V-101'} Scheduled: ${activeShip.departurePort || 'Singapore'} ➔ ${activeShip.arrivalPort || 'Mumbai'}`,
      timestamp: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      location: `${activeShip.departurePort || 'Singapore Port'} Operations Command`,
      icon: Navigation,
      color: '#0284c7',
      badge: 'Voyage Scheduled',
      performedBy: activeShip.captain,
      userRole: 'Ship Manager',
      auditId: `AUD-VOY-${currentVoyage?.voyageId || '101'}`,
      hash: 'e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3',
      cargoState: 'Manifest Lodged & Verified (Customs Pre-cleared)',
      details: `Voyage chartered from ${activeShip.departurePort || 'Singapore Port'} to ${activeShip.arrivalPort || 'Mumbai Port'}. Distance: 2,410 NM. ETA calculated with weather-routing corridor.`
    });

    // 3. Port Berth Allocation & Arrival
    events.push({
      id: 'EVT-BERTH-ARR',
      category: 'PORT_OPS',
      stage: 'Berth Allocation & Arrival',
      stepNumber: 3,
      timeLabel: '4 Days Ago (08:00)',
      statusAtTime: 'Docked & Berthed (All-Fast)',
      speedAtTime: '0.0 kts (Moorings Secured)',
      locationAtTime: `${activeShip.departurePort || 'Singapore Port'} - Quay North Berth #01`,
      coordinatesAtTime: { lat: 1.28, lng: 103.84 },
      title: `Vessel Arrived & Berthed at ${activeShip.departurePort || 'Singapore Port'}`,
      timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000 - 6 * 3600 * 1000).toISOString(),
      location: `${activeShip.departurePort || 'Singapore Port'} - Quay Berth #01`,
      icon: Anchor,
      color: '#0f3460',
      badge: 'Berthed All-Fast',
      performedBy: 'Port Master Control',
      userRole: 'Port Manager',
      auditId: 'AUD-BRT-88019',
      hash: 'c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7',
      cargoState: 'Quay Cranes Assigned / Gangs Onboard',
      details: `Harbor pilot boarded at Outer Anchorage. Vessel assisted by 2 harbor tugs and secured all-fast at Quay North for container loading.`
    });

    // 4. Cargo Loading & Security Seals
    events.push({
      id: 'EVT-CARGO-LOAD',
      category: 'CARGO',
      stage: 'Cargo Loading & Sealing',
      stepNumber: 4,
      timeLabel: '4 Days Ago (16:30)',
      statusAtTime: 'Loading Completed & Sealed',
      speedAtTime: '0.0 kts (Gantry Cranes Disengaged)',
      locationAtTime: `${activeShip.departurePort || 'Singapore Port'} - Gantry Crane Bay #04`,
      coordinatesAtTime: { lat: 1.28, lng: 103.84 },
      title: `Container Manifest Loaded (${onboardContainers.length || 24} Units Stacked & Sealed)`,
      timestamp: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      location: `${activeShip.departurePort || 'Singapore Port'} - Gantry Crane Bay #04`,
      icon: Box,
      color: '#0284c7',
      badge: 'Loading Completed',
      performedBy: 'Lead Stevedore Superintendent',
      userRole: 'Inspector',
      auditId: 'AUD-LOAD-77291',
      hash: 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2',
      cargoState: 'All ISO 17712 Bolt Seals Verified & Reefer Grids Connected (-18.2°C)',
      details: `Discharge and load operations completed. All ISO 17712 bolt seals verified intact. Cold-chain reefers connected to ship auxiliary power grid with temperatures locked.`
    });

    // 5. Departure from Origin Port
    events.push({
      id: 'EVT-DEP-ORIG',
      category: 'VOYAGE',
      stage: 'Departed Origin Port',
      stepNumber: 5,
      timeLabel: '3 Days Ago',
      statusAtTime: 'In Transit / Sea Passage Commenced',
      speedAtTime: '19.8 kts (Cruising Throttle)',
      locationAtTime: `${activeShip.departurePort || 'Singapore Port'} - Outer Pilot Station`,
      coordinatesAtTime: { lat: 1.22, lng: 103.95 },
      title: `Vessel Cleared Port & Commenced Sea Passage`,
      timestamp: new Date(Date.now() - 3 * 24 * 3600 * 1000 - 18 * 3600 * 1000).toISOString(),
      location: `${activeShip.departurePort || 'Singapore Port'} - Outer Pilot Station`,
      icon: Navigation,
      color: '#10b981',
      badge: 'Underway at Sea',
      performedBy: activeShip.captain,
      userRole: 'Ship Manager',
      auditId: 'AUD-DEP-00281',
      hash: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
      cargoState: 'Underway at Sea / Active Cargo Hold Ventilation',
      details: `Harbor pilot disembarked at fairway buoy. Main propulsion engaged to cruising speed (19.8 knots). Track heading set on great circle shipping corridor.`
    });

    // 6. Waypoints Progression
    events.push({
      id: 'EVT-WP-MALACCA',
      category: 'NAVIGATION',
      stage: 'Waypoint Passage',
      stepNumber: 6,
      timeLabel: '2 Days Ago',
      statusAtTime: 'In Transit / Passing Malacca Strait Corridor',
      speedAtTime: '19.5 kts (Heading 295°)',
      locationAtTime: 'Malacca Strait Traffic Separation Scheme (04.21°N, 99.85°E)',
      coordinatesAtTime: { lat: 4.21, lng: 99.85 },
      title: `Passed Corridor Waypoint: Malacca TSS`,
      timestamp: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      location: '04.21°N, 99.85°E (International Shipping Lane)',
      icon: MapPin,
      color: '#0284c7',
      badge: 'Waypoint Verified',
      performedBy: 'Automated AIS & Bridge Officer',
      userRole: 'Ship Manager',
      auditId: 'AUD-WP-01',
      hash: 'f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6',
      cargoState: 'Reefer Telemetry Constant (-18.0°C) / Zero Discrepancies',
      details: `Vessel logged passage past Malacca TSS corridor at speed 19.5 knots. Heading: 295°. Sea state: Moderate swell (1.2m).`
    });

    // 7. En-route Exception / Weather Swell
    events.push({
      id: 'EVT-DLY-WEATHER',
      category: 'EXCEPTION',
      stage: 'En-route Exception',
      stepNumber: 7,
      timeLabel: '1 Day Ago',
      statusAtTime: 'In Transit (Speed Adjusted for Heavy Swell)',
      speedAtTime: '16.2 kts (Throttle Reduced)',
      locationAtTime: 'Arabian Sea Corridor (10.45°N, 85.12°E)',
      coordinatesAtTime: { lat: 10.45, lng: 85.12 },
      title: `Monsoon Swell Exception Logged: +3.5 Hours`,
      timestamp: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
      location: 'Arabian Sea Corridor (Deep Sea Passage)',
      icon: AlertTriangle,
      color: '#b45309',
      badge: 'Delay Recorded',
      performedBy: activeShip.captain,
      userRole: 'Ship Manager',
      auditId: 'AUD-DLY-01',
      hash: 'd4c3b2a1f0e9d8c7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3',
      cargoState: 'Lashing Check Completed / Container Stacks Secure',
      details: `Reason: "Heavy monsoon swell encountered". Mitigation: "Master reduced throttle to 16.2 knots to maintain lashing stability. Destination port terminal updated."`
    });

    // 8. Live Current Telemetry Milestone
    events.push({
      id: 'EVT-LIVE-POS',
      category: 'NAVIGATION',
      stage: 'Live Satellite AIS Fix',
      stepNumber: 8,
      timeLabel: 'LIVE NOW (Realtime)',
      statusAtTime: `In Transit (Cruising at ${activeShip.coordinates?.speedKnots || 19.8} kts)`,
      speedAtTime: `${activeShip.coordinates?.speedKnots || 19.8} kts (Heading ${activeShip.coordinates?.heading || 312}°)`,
      locationAtTime: `${activeShip.currentLocation || 'Arabian Sea Passage'}`,
      coordinatesAtTime: { lat: activeShip.coordinates?.lat || 14.82, lng: activeShip.coordinates?.lng || 74.15 },
      title: `Live AIS Fix: ${activeShip.coordinates?.lat?.toFixed(2) || 14.82}°N, ${activeShip.coordinates?.lng?.toFixed(2) || 74.15}°E`,
      timestamp: new Date().toISOString(),
      location: `${activeShip.currentLocation} (${activeShip.coordinates?.speedKnots || 19.8} kts, ${activeShip.coordinates?.heading || 312}°)`,
      icon: Radio,
      color: '#0284c7',
      badge: 'Live Telemetry Stream',
      performedBy: 'AIS Satellite Transponder',
      userRole: 'Automated Sensor Link',
      auditId: 'AUD-LIVE-AIS-2026',
      hash: '3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f',
      cargoState: 'All Containers Stable & Monitored in Cryptographic Ledger',
      details: `Continuous satellite AIS fix received. Cruising speed: ${activeShip.coordinates?.speedKnots || 19.8} knots. Distance to destination ${activeShip.arrivalPort || 'Mumbai Port'}: approx 240 nautical miles. ETA: ${new Date(currentVoyage?.estimatedArrivalTime || Date.now() + 2 * 24 * 3600 * 1000).toLocaleString()}.`
    });

    // 9. Upcoming Milestone: Destination Berth
    events.push({
      id: 'EVT-UPCOMING-DEST',
      category: 'UPCOMING',
      stage: 'Upcoming Arrival & Discharge',
      stepNumber: 9,
      timeLabel: 'In ~2 Days (ETA)',
      statusAtTime: `Scheduled Arrival at ${activeShip.arrivalPort || 'Mumbai Port'}`,
      speedAtTime: 'Approaching Pilot Station (0.0 kts at Berth)',
      locationAtTime: `${activeShip.arrivalPort || 'Mumbai Port'} - Quay Berth #01`,
      coordinatesAtTime: { lat: 18.95, lng: 72.84 },
      title: `Scheduled Pilot Station Boarding & Discharge at ${activeShip.arrivalPort || 'Mumbai Port'}`,
      timestamp: new Date(currentVoyage?.estimatedArrivalTime || Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
      location: `${activeShip.arrivalPort || 'Mumbai Port'} - ${currentVoyage?.portCoordination?.requestedBerth || 'Berth 01'}`,
      icon: Anchor,
      color: '#64748b',
      badge: 'Scheduled ETA',
      performedBy: 'Port Master & Ship Manager',
      userRole: 'Port Manager',
      auditId: 'AUD-SCHED-BERTH',
      hash: 'Pending Execution upon All-Fast Docking',
      cargoState: 'Stevedore Gangs & Automated Gantry Cranes Reserved',
      details: `Scheduled outer anchorage pilot station arrival. Quay cranes and stevedore gangs scheduled for container discharge upon all-fast clearance.`
    });

    return events;
  };

  const allEvents = buildTimelineEvents();

  // Set default selected index to the active live position (index 7) if not set
  useEffect(() => {
    if (allEvents.length > 0 && selectedEventIndex === 0) {
      const liveIdx = allEvents.findIndex(e => e.id === 'EVT-LIVE-POS');
      if (liveIdx !== -1) setSelectedEventIndex(liveIdx);
    }
  }, [allEvents.length]);

  // Autoplay handler
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setSelectedEventIndex(prev => {
          if (prev >= allEvents.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 2500);
    } else {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, allEvents.length]);

  const activeEvent = allEvents[selectedEventIndex] || allEvents[0];

  // Filter events for the vertical list
  const filteredEvents = allEvents.filter(evt => {
    if (selectedStageFilter !== 'ALL') {
      if (selectedStageFilter === 'PORT' && evt.category !== 'PORT_OPS' && evt.category !== 'REGISTRATION') return false;
      if (selectedStageFilter === 'CARGO' && evt.category !== 'CARGO') return false;
      if (selectedStageFilter === 'VOYAGE' && evt.category !== 'VOYAGE' && evt.category !== 'NAVIGATION') return false;
      if (selectedStageFilter === 'EXCEPTION' && evt.category !== 'EXCEPTION') return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return evt.title.toLowerCase().includes(q) ||
        evt.details.toLowerCase().includes(q) ||
        evt.location.toLowerCase().includes(q) ||
        evt.auditId.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="page-wrapper" style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Top Header & Ship Picker */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '20px 24px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={14} />
            <span>DIRECT VESSEL STATUS TIMELINE & LIFE-CYCLE INSPECTOR</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px 0' }}>
            {activeShip.name} Historical Life-Cycle Timeline
          </h1>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Click any point on the timeline below to instantly check ship status, position, cargo load, and audit seal at that exact time
          </div>
        </div>

        {/* Vessel Switcher Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>Select Vessel:</span>
          <select
            className="select-control"
            value={selectedShipId}
            onChange={(e) => {
              setSelectedShipId(e.target.value);
              setSelectedEventIndex(0);
            }}
            style={{
              width: 'auto',
              minWidth: '220px',
              fontSize: '13px',
              padding: '6px 14px',
              fontWeight: 700,
              background: '#f8fafc',
              borderRadius: '8px'
            }}
          >
            {ships.map(s => (
              <option key={s.shipId} value={s.shipId}>
                🚢 {s.name} ({s.imoNumber}) &bull; {s.status}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. INTERACTIVE TIME SCRUBBER LINE & DIRECT STATUS INSPECTOR */}
      {/* ========================================================================= */}
      <div style={{
        background: 'linear-gradient(135deg, #0f3460 0%, #0a2540 100%)',
        borderRadius: '16px',
        padding: '24px 26px',
        color: '#ffffff',
        marginBottom: '24px',
        boxShadow: '0 8px 24px -4px rgba(15, 52, 96, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {/* Scrubber Controls Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              background: 'rgba(56, 189, 248, 0.2)',
              padding: '4px 10px',
              borderRadius: '8px',
              fontSize: '11px',
              fontWeight: 800,
              color: '#38bdf8',
              letterSpacing: '0.5px'
            }}>
              TIMELINE SCRUBBER
            </div>
            <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
              Milestone <strong>{selectedEventIndex + 1}</strong> of <strong>{allEvents.length}</strong>
            </span>
          </div>

          {/* Player controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => {
                setIsPlaying(false);
                setSelectedEventIndex(prev => Math.max(0, prev - 1));
              }}
              disabled={selectedEventIndex === 0}
              className="btn btn-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '6px 10px',
                opacity: selectedEventIndex === 0 ? 0.4 : 1
              }}
              title="Previous Milestone"
            >
              <SkipBack size={14} />
              <span>Prev</span>
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="btn btn-sm"
              style={{
                background: isPlaying ? '#ef4444' : '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title={isPlaying ? 'Pause Auto-Progression' : 'Play Timeline Progression'}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlaying ? 'Pause' : 'Play Journey'}</span>
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setSelectedEventIndex(prev => Math.min(allEvents.length - 1, prev + 1));
              }}
              disabled={selectedEventIndex === allEvents.length - 1}
              className="btn btn-sm"
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '6px 10px',
                opacity: selectedEventIndex === allEvents.length - 1 ? 0.4 : 1
              }}
              title="Next Milestone"
            >
              <span>Next</span>
              <SkipForward size={14} />
            </button>
          </div>
        </div>

        {/* Horizontal Timeline Track with Clickable Nodes */}
        <div style={{ position: 'relative', padding: '24px 10px 10px 10px', overflowX: 'auto', marginBottom: '16px' }}>
          {/* Base Horizontal Track Line */}
          <div style={{
            position: 'absolute',
            top: '38px',
            left: '30px',
            right: '30px',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.15)',
            borderRadius: '2px',
            zIndex: 0
          }} />

          {/* Active Highlight Line */}
          <div style={{
            position: 'absolute',
            top: '38px',
            left: '30px',
            width: `${(selectedEventIndex / (allEvents.length - 1)) * 100}%`,
            maxWidth: 'calc(100% - 60px)',
            height: '4px',
            background: 'linear-gradient(90deg, #38bdf8 0%, #10b981 100%)',
            borderRadius: '2px',
            zIndex: 1,
            transition: 'width 0.3s ease'
          }} />

          {/* Clickable Nodes along the Line */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            position: 'relative',
            zIndex: 2,
            minWidth: '780px'
          }}>
            {allEvents.map((evt, idx) => {
              const isSelected = selectedEventIndex === idx;
              const isPassed = idx <= selectedEventIndex;
              const IconComponent = evt.icon || Ship;

              return (
                <div
                  key={evt.id}
                  onClick={() => {
                    setIsPlaying(false);
                    setSelectedEventIndex(idx);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    width: '74px',
                    textAlign: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Node Circle */}
                  <div style={{
                    width: isSelected ? '34px' : '26px',
                    height: isSelected ? '34px' : '26px',
                    borderRadius: '50%',
                    background: isSelected ? '#38bdf8' : isPassed ? '#10b981' : '#1e293b',
                    color: isSelected ? '#0f172a' : '#ffffff',
                    border: `3px solid ${isSelected ? '#ffffff' : isPassed ? '#34d399' : '#475569'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 800,
                    boxShadow: isSelected ? '0 0 16px rgba(56, 189, 248, 0.8)' : 'none',
                    transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                    transition: 'all 0.2s ease',
                    marginBottom: '8px'
                  }}>
                    {isSelected ? '★' : isPassed ? '✓' : idx + 1}
                  </div>

                  {/* Time Badge */}
                  <div style={{
                    fontSize: '10px',
                    fontWeight: isSelected ? 800 : 600,
                    color: isSelected ? '#38bdf8' : isPassed ? '#94a3b8' : '#64748b',
                    whiteSpace: 'nowrap'
                  }}>
                    {evt.timeLabel}
                  </div>

                  {/* Stage Name */}
                  <div style={{
                    fontSize: '11px',
                    fontWeight: isSelected ? 800 : 500,
                    color: isSelected ? '#ffffff' : '#94a3b8',
                    marginTop: '2px',
                    lineHeight: '1.2'
                  }}>
                    {evt.stage}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Range Slider for Smooth Scrubbing */}
        <div style={{ padding: '0 10px 10px 10px' }}>
          <input
            type="range"
            min="0"
            max={allEvents.length - 1}
            value={selectedEventIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setSelectedEventIndex(parseInt(e.target.value));
            }}
            style={{
              width: '100%',
              cursor: 'pointer',
              accentColor: '#38bdf8',
              height: '6px'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
            <span>🏁 Commissioning ({allEvents[0]?.timeLabel})</span>
            <span>📍 Live Position</span>
            <span>🏁 Destination Arrival ({allEvents[allEvents.length - 1]?.timeLabel})</span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. INSTANT SHIP STATUS INSPECTION CARD FOR SELECTED TIME */}
        {/* ========================================================================= */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(12px)',
          borderRadius: '14px',
          padding: '20px 22px',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          marginTop: '10px'
        }}>
          {/* Card Top: Stage Banner, Time, and Status Badge */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{
                  background: activeEvent.category === 'EXCEPTION' ? 'rgba(245, 158, 11, 0.25)' : 'rgba(56, 189, 248, 0.25)',
                  color: activeEvent.category === 'EXCEPTION' ? '#fde68a' : '#7dd3fc',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  border: `1px solid ${activeEvent.category === 'EXCEPTION' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`
                }}>
                  {activeEvent.stage.toUpperCase()} &bull; STEP {activeEvent.stepNumber}
                </span>

                <span style={{
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#34d399',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  border: '1px solid rgba(52, 211, 153, 0.3)'
                }}>
                  ● {activeEvent.statusAtTime}
                </span>
              </div>

              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff' }}>
                {activeEvent.title}
              </h3>
            </div>

            {/* Time badge */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Clock size={14} color="#38bdf8" />
                <span>{new Date(activeEvent.timestamp).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} {new Date(activeEvent.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                Relative: <strong>{activeEvent.timeLabel}</strong>
              </div>
            </div>
          </div>

          {/* Telemetry / Status Parameters Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '14px'
          }}>
            {/* Speed & Heading */}
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Gauge size={12} color="#38bdf8" /> Speed & Propulsion
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#38bdf8', marginTop: '3px' }}>
                {activeEvent.speedAtTime}
              </div>
            </div>

            {/* Location & GPS Fix */}
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={12} color="#f87171" /> Where Reached / Position
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginTop: '3px' }}>
                {activeEvent.locationAtTime}
              </div>
            </div>

            {/* Cargo / Load Status */}
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Box size={12} color="#34d399" /> Cargo State & Power
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#34d399', marginTop: '3px' }}>
                {activeEvent.cargoState}
              </div>
            </div>

            {/* Officer in Charge */}
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Ship size={12} color="#a78bfa" /> Logged By / Role
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', marginTop: '3px' }}>
                {activeEvent.performedBy} <span style={{ fontSize: '11px', color: '#94a3b8' }}>({activeEvent.userRole})</span>
              </div>
            </div>
          </div>

          {/* Detailed Narrative */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            padding: '12px 16px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.06)',
            fontSize: '13px',
            color: '#e2e8f0',
            lineHeight: '1.5',
            marginBottom: '12px'
          }}>
            {activeEvent.details}
          </div>

          {/* Cryptographic SHA-256 Ledger Seal */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '11px',
            color: '#94a3b8',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Audit Block ID:</span>
              <code style={{ background: 'rgba(255,255,255,0.1)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                {activeEvent.auditId}
              </code>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: 'monospace', color: '#64748b' }}>
                Hash: {activeEvent.hash.substring(0, 24)}...
              </span>
              <span style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <ShieldCheck size={12} /> CRYPTOGRAPHICALLY SEALED
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CHRONOLOGICAL MILESTONE LIST WITH SEARCH & FILTERS */}
      {/* ========================================================================= */}
      {/* Filter & Search Bar */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        padding: '12px 18px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-control"
            placeholder="Search milestone, action, location, audit ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '34px', fontSize: '13px', background: '#f8fafc' }}
          />
        </div>

        {/* Category Filters */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `All Events (${allEvents.length})` },
            { id: 'VOYAGE', label: 'Voyage & Navigation' },
            { id: 'PORT', label: 'Port & Berthing' },
            { id: 'CARGO', label: 'Cargo Loading' },
            { id: 'EXCEPTION', label: 'Exceptions & Delays' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedStageFilter(f.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                border: '1px solid',
                borderColor: selectedStageFilter === f.id ? '#0284c7' : '#e2e8f0',
                background: selectedStageFilter === f.id ? '#e0f2fe' : '#ffffff',
                color: selectedStageFilter === f.id ? '#0369a1' : '#64748b',
                cursor: 'pointer'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chronological Vertical Timeline Feed */}
      <div style={{
        background: '#ffffff',
        borderRadius: '16px',
        padding: '28px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
            Complete Chronological Time-Stamped Ledger ({filteredEvents.length} Events)
          </h3>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            Click any card below to focus in the top time scrubber
          </span>
        </div>

        {filteredEvents.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            No milestone records found matching your filters.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', position: 'relative' }}>
            {/* Connecting Vertical Line */}
            <div style={{
              position: 'absolute',
              left: '22px',
              top: '12px',
              bottom: '12px',
              width: '2px',
              background: '#e2e8f0',
              zIndex: 0
            }} />

            {filteredEvents.map((evt, idx) => {
              const Icon = evt.icon || Ship;
              const isSelected = allEvents[selectedEventIndex]?.id === evt.id;

              return (
                <div
                  key={evt.id}
                  onClick={() => {
                    const originalIdx = allEvents.findIndex(e => e.id === evt.id);
                    if (originalIdx !== -1) setSelectedEventIndex(originalIdx);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '18px',
                    position: 'relative',
                    zIndex: 1,
                    cursor: 'pointer'
                  }}
                >
                  {/* Icon Node */}
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: isSelected ? '#0284c7' : evt.category === 'EXCEPTION' ? '#fffbeb' : evt.category === 'UPCOMING' ? '#f8fafc' : '#ffffff',
                    border: `2px solid ${isSelected ? '#0284c7' : evt.color || '#0284c7'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: isSelected ? '0 0 14px rgba(2, 132, 199, 0.4)' : '0 2px 6px rgba(0,0,0,0.06)',
                    transform: isSelected ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.2s ease'
                  }}>
                    <Icon size={20} color={isSelected ? '#ffffff' : evt.color || '#0284c7'} />
                  </div>

                  {/* Milestone Card */}
                  <div style={{
                    flex: 1,
                    background: isSelected ? '#f0f9ff' : evt.category === 'EXCEPTION' ? '#fffbeb' : '#f8fafc',
                    borderRadius: '14px',
                    padding: '18px 22px',
                    border: `1.5px solid ${isSelected ? '#0284c7' : evt.category === 'EXCEPTION' ? '#fde68a' : '#e2e8f0'}`,
                    boxShadow: isSelected ? '0 4px 14px rgba(2, 132, 199, 0.12)' : '0 1px 3px rgba(15, 23, 42, 0.03)',
                    transition: 'all 0.2s ease'
                  }}>
                    {/* Header: Stage badge, Title, and Timestamp */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                          <span style={{
                            background: evt.category === 'EXCEPTION' ? '#fef3c7' : '#e0f2fe',
                            color: evt.category === 'EXCEPTION' ? '#92400e' : '#0369a1',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 800
                          }}>
                            {evt.stage.toUpperCase()} &bull; STEP {evt.stepNumber}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                            {evt.badge}
                          </span>
                          {isSelected && (
                            <span style={{
                              background: '#0284c7',
                              color: '#ffffff',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: 800
                            }}>
                              SELECTED IN SCRUBBER
                            </span>
                          )}
                        </div>
                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                          {evt.title}
                        </h4>
                      </div>

                      {/* Timestamp */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} color="#0284c7" />
                          <span>{new Date(evt.timestamp).toLocaleDateString()} {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          📍 {evt.location}
                        </div>
                      </div>
                    </div>

                    {/* Operational Details Text */}
                    <p style={{ margin: '8px 0', fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
                      {evt.details}
                    </p>

                    {/* Footer: Operator Role & Cryptographic Audit Pill */}
                    <div style={{
                      marginTop: '12px',
                      paddingTop: '10px',
                      borderTop: `1px solid ${evt.category === 'EXCEPTION' ? '#fde68a' : '#e2e8f0'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '11px',
                      color: '#64748b',
                      flexWrap: 'wrap',
                      gap: '8px'
                    }}>
                      <div>
                        Logged by: <strong>{evt.performedBy}</strong> ({evt.userRole})
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 700 }}>Audit ID:</span>
                        <code style={{ background: '#ffffff', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px', color: '#0284c7', fontWeight: 700 }}>
                          {evt.auditId}
                        </code>
                        <span style={{
                          background: '#dcfce7',
                          color: '#15803d',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px'
                        }}>
                          <ShieldCheck size={11} /> SHA-256 SEALED
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipTimelinePage;
