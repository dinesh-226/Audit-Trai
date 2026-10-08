import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Ship,
  Radio,
  Box,
  Compass,
  Wind,
  Navigation,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Sparkles,
  Plus,
  MapPin,
  Anchor,
  Send,
  CheckCircle2,
  X,
  Search,
  Calendar,
  Layers,
  ArrowRight,
  Sliders,
  AlertCircle,
  Thermometer,
  Gauge,
  Waves,
  ChevronRight,
  Filter,
  Copy,
  ExternalLink
} from 'lucide-react';

export const ShipManagerDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [ships, setShips] = useState([]);
  const [selectedShipId, setSelectedShipId] = useState(user?.assignedShipId || 'SH-101');
  const [voyages, setVoyages] = useState([]);
  const [currentVoyage, setCurrentVoyage] = useState(null);
  const [containers, setContainers] = useState([]);
  const [performance, setPerformance] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('voyage'); // 'voyage', 'cargo', 'port', 'delays', 'performance'
  const [searchQuery, setSearchQuery] = useState('');
  const [cargoFilter, setCargoFilter] = useState('all'); // 'all', 'reefer', 'hazmat', 'dry'

  // Modals
  const [createVoyageOpen, setCreateVoyageOpen] = useState(false);
  const [updateEtaOpen, setUpdateEtaOpen] = useState(false);
  const [telemetryModalOpen, setTelemetryModalOpen] = useState(false);
  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const [portCoordModalOpen, setPortCoordModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  // Forms
  const [createVoyageForm, setCreateVoyageForm] = useState({
    departurePort: 'Singapore Port',
    arrivalPort: 'Mumbai Port',
    plannedDepartureDate: new Date().toISOString().substring(0, 16),
    estimatedArrivalTime: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().substring(0, 16),
    requestedBerth: 'Berth 01 (Quay North)',
    voyageNotes: 'Scheduled international cargo voyage'
  });

  const [etaForm, setEtaForm] = useState({
    estimatedArrivalTime: '',
    reason: 'Monsoon sea swell reduced average speed',
    notes: 'Master notified engine room to adjust throttle upon passing Laccadive Sea.'
  });

  const [telemetryForm, setTelemetryForm] = useState({
    speedKnots: 19.8,
    headingDegrees: 312,
    lat: 14.82,
    lng: 74.15,
    waveMeters: 1.8,
    windKnots: 14,
    condition: 'Fair Seas'
  });

  const [delayForm, setDelayForm] = useState({
    reason: 'Heavy monsoon weather and swell in Arabian Sea',
    delayHours: 4,
    mitigation: 'Adjusted speed to 17 knots for container stability',
    isDiversion: false,
    portOfDiversion: ''
  });

  const [portCoordForm, setPortCoordForm] = useState({
    requestedBerth: 'Berth 01 (Quay North)',
    pilotStationETA: '',
    notes: 'Vessel on schedule for pilot boarding at outer anchorage.'
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadShipAndVoyageData();
  }, [selectedShipId]);

  const showNotice = (msg, isError = false) => {
    setNotification({ msg, isError });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadShipAndVoyageData = async () => {
    setLoading(true);
    try {
      const [allShips, allContainers, allVoyages] = await Promise.all([
        api.ships.getAll().catch(() => []),
        api.containers.getAll().catch(() => []),
        api.voyages.getAll().catch(() => [])
      ]);

      const shipsList = Array.isArray(allShips) ? allShips : [];
      const containersList = Array.isArray(allContainers) ? allContainers : [];
      const voyagesList = Array.isArray(allVoyages) ? allVoyages : [];

      setShips(shipsList);
      setContainers(containersList);
      setVoyages(voyagesList);

      // Determine active ship
      let currentShip = shipsList.find(s => s.shipId === selectedShipId);
      if (!currentShip && shipsList.length > 0) {
        currentShip = shipsList[0];
        setSelectedShipId(currentShip.shipId);
      }

      // Robust matching of voyage by shipId, imoNumber, or shipName
      const shipVoyage = voyagesList.find(v =>
        v.shipId === selectedShipId ||
        (currentShip && (
          v.shipId === currentShip.shipId ||
          v.imoNumber === currentShip.imoNumber ||
          (v.shipName && currentShip.name && v.shipName.trim().toLowerCase() === currentShip.name.trim().toLowerCase())
        ))
      ) || null;

      setCurrentVoyage(shipVoyage);

      if (shipVoyage) {
        setEtaForm({
          estimatedArrivalTime: shipVoyage.estimatedArrivalTime ? new Date(shipVoyage.estimatedArrivalTime).toISOString().substring(0, 16) : '',
          reason: 'Schedule optimization',
          notes: ''
        });
        setTelemetryForm({
          speedKnots: shipVoyage.speedKnots ?? (currentShip?.coordinates?.speedKnots || 18.5),
          headingDegrees: shipVoyage.headingDegrees ?? (currentShip?.coordinates?.heading || 180),
          lat: shipVoyage.currentCoordinates?.lat ?? (currentShip?.coordinates?.lat || 18.94),
          lng: shipVoyage.currentCoordinates?.lng ?? (currentShip?.coordinates?.lng || 72.83),
          waveMeters: shipVoyage.seaConditions?.waveMeters || 1.8,
          windKnots: shipVoyage.seaConditions?.windKnots || 14,
          condition: shipVoyage.seaConditions?.condition || 'Fair Seas'
        });
        try {
          const perf = await api.voyages.getPerformance(shipVoyage.voyageId);
          setPerformance(perf);
        } catch (e) {
          console.log('No performance profile yet');
        }
      } else {
        setPerformance(null);
      }
    } catch (e) {
      console.error('Failed to load ship manager data:', e);
    } finally {
      setLoading(false);
    }
  };

  const activeShip = ships.find(s => s.shipId === selectedShipId) || ships[0] || {
    shipId: 'SH-101',
    name: 'MSC Irina',
    imoNumber: 'IMO 9929429',
    flag: 'Panama',
    captain: 'Capt. Vikram Sengupta',
    capacityTEU: 24346,
    status: 'In Transit'
  };

  const onboardContainers = containers.filter(c =>
    c.assignedShipId === selectedShipId ||
    (activeShip && (
      c.assignedShipId === activeShip.shipId ||
      (c.assignedShipName && activeShip.name && c.assignedShipName.trim().toLowerCase() === activeShip.name.trim().toLowerCase())
    ))
  );

  // Filtered Cargo
  const filteredContainers = onboardContainers.filter(c => {
    const matchesSearch = !searchQuery || 
      c.containerId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cargoDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ownerCompany?.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (cargoFilter === 'reefer') {
      return c.type?.toLowerCase().includes('reefer') || c.temperatureCelsius !== null && c.temperatureCelsius !== undefined;
    }
    if (cargoFilter === 'hazmat') {
      return c.hazardClass && c.hazardClass !== 'Non-Hazardous';
    }
    if (cargoFilter === 'dry') {
      return !c.type?.toLowerCase().includes('reefer') && (!c.hazardClass || c.hazardClass === 'Non-Hazardous');
    }
    return true;
  });

  // Handlers
  const handleCreateVoyage = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.voyages.create({
        shipId: activeShip.shipId,
        ...createVoyageForm
      });
      showNotice(`Voyage ${res.voyageId} created successfully`);
      setCreateVoyageOpen(false);
      await loadShipAndVoyageData();
    } catch (err) {
      showNotice(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateEta = async (e) => {
    e.preventDefault();
    if (!currentVoyage) return;
    setActionLoading(true);
    try {
      const res = await api.voyages.updateEta(currentVoyage.voyageId, etaForm);
      showNotice(res.message || 'ETA updated and alert sent to Port Manager');
      setUpdateEtaOpen(false);
      await loadShipAndVoyageData();
    } catch (err) {
      showNotice(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTelemetry = async (e) => {
    e.preventDefault();
    if (!currentVoyage) return;
    setActionLoading(true);
    try {
      await api.voyages.updateTelemetry(currentVoyage.voyageId, {
        speedKnots: telemetryForm.speedKnots,
        headingDegrees: telemetryForm.headingDegrees,
        coordinates: { lat: Number(telemetryForm.lat), lng: Number(telemetryForm.lng) },
        seaConditions: {
          waveMeters: Number(telemetryForm.waveMeters),
          windKnots: Number(telemetryForm.windKnots),
          condition: telemetryForm.condition
        }
      });
      showNotice('Ship telemetry, speed, and heading updated');
      setTelemetryModalOpen(false);
      await loadShipAndVoyageData();
    } catch (err) {
      showNotice(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordDelay = async (e) => {
    e.preventDefault();
    if (!currentVoyage) return;
    setActionLoading(true);
    try {
      const res = await api.voyages.recordDelay(currentVoyage.voyageId, delayForm);
      showNotice(res.message || 'Voyage delay recorded in audit trail');
      setDelayModalOpen(false);
      await loadShipAndVoyageData();
    } catch (err) {
      showNotice(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCoordinatePort = async (e) => {
    e.preventDefault();
    if (!currentVoyage) return;
    setActionLoading(true);
    try {
      const res = await api.voyages.coordinatePort(currentVoyage.voyageId, portCoordForm);
      showNotice(res.message || 'Arrival notice transmitted to Port Manager');
      setPortCoordModalOpen(false);
      await loadShipAndVoyageData();
    } catch (err) {
      showNotice(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkWaypointPassed = async (index) => {
    if (!currentVoyage) return;
    try {
      await api.voyages.updateTelemetry(currentVoyage.voyageId, { waypointIndex: index });
      showNotice(`Waypoint "${currentVoyage.waypoints[index]?.name}" logged as passed`);
      await loadShipAndVoyageData();
    } catch (err) {
      showNotice(err.message, true);
    }
  };

  const handleUpdateVoyageStatus = async (status) => {
    if (!currentVoyage) return;
    try {
      const res = await api.voyages.updateStatus(currentVoyage.voyageId, { status });
      showNotice(res.message || `Voyage status updated to ${status}`);
      setStatusModalOpen(false);
      await loadShipAndVoyageData();
    } catch (err) {
      showNotice(err.message, true);
    }
  };

  // Calculate waypoint percentage
  const totalWaypoints = currentVoyage?.waypoints?.length || 5;
  const passedWaypoints = currentVoyage?.waypoints?.filter(w => w.passed)?.length || 3;
  const routePercentage = Math.round((passedWaypoints / totalWaypoints) * 100);

  return (
    <div className="page-wrapper" style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* Toast Alert */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          background: notification.isError ? '#ef4444' : '#0f3460',
          color: '#ffffff',
          padding: '14px 22px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '13px',
          fontWeight: 600,
          border: '1px solid rgba(255,255,255,0.15)'
        }}>
          {notification.isError ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} color="#38bdf8" />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* =========================================================
          1. TOP COMMAND BAR & VESSEL SELECTOR
         ========================================================= */}
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
        {/* Left: Role tag and Vessel title */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Ship size={14} /> FLEET & VOYAGE COMMAND BRIDGE
            </span>
            <span style={{ background: '#e0f2fe', color: '#0369a1', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>
              SHIP MANAGER
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.3px' }}>
              {activeShip.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#334155', fontSize: '12px', fontWeight: 600, padding: '3px 8px', borderRadius: '6px' }}>
                {activeShip.imoNumber}
              </span>
              <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', padding: '3px 8px', borderRadius: '6px' }}>
                Flag: <strong>{activeShip.flag || 'Panama'}</strong>
              </span>
              <span style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '12px', padding: '3px 8px', borderRadius: '6px' }}>
                Master: <strong>{activeShip.captain}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Vessel Selector & Quick Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Switch Vessel:</span>
            <select
              className="select-control"
              value={selectedShipId}
              onChange={(e) => setSelectedShipId(e.target.value)}
              style={{
                width: 'auto',
                fontSize: '13px',
                padding: '6px 14px',
                fontWeight: 700,
                borderRadius: '8px',
                borderColor: '#cbd5e1',
                background: '#f8fafc',
                cursor: 'pointer'
              }}
            >
              {ships.map(s => (
                <option key={s.shipId} value={s.shipId}>
                  🚢 {s.name} ({s.imoNumber}) — {s.status}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setCreateVoyageOpen(true)}
            className="btn btn-primary"
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#0f3460'
            }}
          >
            <Plus size={15} />
            <span>New Voyage</span>
          </button>
        </div>
      </div>

      {/* =========================================================
          2. LIVE BRIDGE TELEMETRY & ROUTE HUD CARD
         ========================================================= */}
      {currentVoyage ? (
        <div style={{
          background: 'linear-gradient(135deg, #0f3460 0%, #0a2540 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: '#ffffff',
          marginBottom: '22px',
          boxShadow: '0 8px 24px -4px rgba(15, 52, 96, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          {/* Header row with Voyage Corridor & Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(56, 189, 248, 0.3)'
              }}>
                <Radio size={20} color="#38bdf8" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.2px' }}>
                    Voyage {currentVoyage.voyageId}: {currentVoyage.departurePort} ➔ {currentVoyage.arrivalPort}
                  </h3>
                  <span style={{
                    fontSize: '11px',
                    background: currentVoyage.status === 'In Transit' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                    color: currentVoyage.status === 'In Transit' ? '#34d399' : '#38bdf8',
                    padding: '3px 10px',
                    borderRadius: '999px',
                    fontWeight: 800,
                    border: '1px solid rgba(56, 189, 248, 0.3)',
                    letterSpacing: '0.5px'
                  }}>
                    ● {currentVoyage.status.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                  AIS Satellite Link Active &bull; Destination Berth: <strong>{currentVoyage.portCoordination?.requestedBerth || 'Berth 01'}</strong>
                </div>
              </div>
            </div>

            {/* Quick Action Pills inside HUD */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setUpdateEtaOpen(true)}
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  color: '#38bdf8',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Clock size={13} />
                <span>Update ETA</span>
              </button>

              <button
                onClick={() => setTelemetryModalOpen(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#f8fafc',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Sliders size={13} />
                <span>Telemetry</span>
              </button>

              <button
                onClick={() => setDelayModalOpen(true)}
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  color: '#fbbf24',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <AlertTriangle size={13} />
                <span>Report Delay</span>
              </button>

              <button
                onClick={() => setPortCoordModalOpen(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#f8fafc',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Anchor size={13} />
                <span>Berth Notice</span>
              </button>

              <button
                onClick={() => setStatusModalOpen(true)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#cbd5e1',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Status
              </button>
            </div>
          </div>

          {/* Route Progress Visual Bar */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '20px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#cbd5e1', marginBottom: '8px', fontWeight: 600 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={13} color="#38bdf8" /> Origin: <strong>{currentVoyage.departurePort}</strong> ({new Date(currentVoyage.plannedDepartureDate).toLocaleDateString()})
              </span>
              <span style={{ color: '#38bdf8', fontWeight: 700 }}>
                {passedWaypoints} of {totalWaypoints} Waypoints ({routePercentage}% Completed)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Anchor size={13} color="#34d399" /> Destination: <strong>{currentVoyage.arrivalPort}</strong> (ETA: {new Date(currentVoyage.estimatedArrivalTime).toLocaleDateString()})
              </span>
            </div>

            <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.12)', borderRadius: '999px', overflow: 'hidden', position: 'relative' }}>
              <div style={{
                width: `${routePercentage}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
                borderRadius: '999px',
                transition: 'width 0.5s ease'
              }} />
            </div>
          </div>

          {/* 5 Clean HUD Telemetry Gauges */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {/* Speed */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.06)',
              padding: '14px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Sea Speed</span>
                <Gauge size={14} color="#38bdf8" />
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#38bdf8' }}>
                {currentVoyage.speedKnots} <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>kts</span>
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>Throttle: 85% Cruising</div>
            </div>

            {/* Course Heading */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.06)',
              padding: '14px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Course Heading</span>
                <Compass size={14} color="#e0f2fe" />
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>
                {currentVoyage.headingDegrees}° <span style={{ fontSize: '13px', fontWeight: 600, color: '#38bdf8' }}>NW</span>
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '2px' }}>Great Circle Track</div>
            </div>

            {/* Coordinates */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.06)',
              padding: '14px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>GPS Position</span>
                <MapPin size={14} color="#38bdf8" />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', paddingTop: '4px' }}>
                {currentVoyage.currentCoordinates?.lat?.toFixed(2)}°N, {currentVoyage.currentCoordinates?.lng?.toFixed(2)}°E
              </div>
              <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} /> Satellite Lock
              </div>
            </div>

            {/* ETA */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.06)',
              padding: '14px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Arrival ETA</span>
                <Clock size={14} color="#38bdf8" />
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#38bdf8', paddingTop: '3px' }}>
                {new Date(currentVoyage.estimatedArrivalTime).toLocaleDateString()} {new Date(currentVoyage.estimatedArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>
                {currentVoyage.portCoordination?.requestedBerth}
              </div>
            </div>

            {/* Sea & Wind */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.06)',
              padding: '14px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700 }}>Sea & Swell</span>
                <Waves size={14} color="#34d399" />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#34d399', paddingTop: '3px' }}>
                {currentVoyage.seaConditions?.condition || 'Fair Seas'}
              </div>
              <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>
                Wind: {currentVoyage.seaConditions?.windKnots || 14} kts &bull; Swell: {currentVoyage.seaConditions?.waveMeters || 1.8}m
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="maritime-card" style={{ padding: '30px', textAlign: 'center', marginBottom: '22px' }}>
          <Ship size={36} color="#64748b" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ margin: 0, color: '#0f172a' }}>No Active Voyage Registered</h3>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>
            Initialize a new voyage to start logging waypoints, cargo manifests, and port coordination.
          </p>
          <button onClick={() => setCreateVoyageOpen(true)} className="btn btn-primary" style={{ marginTop: '12px' }}>
            <Plus size={14} /> Create Voyage
          </button>
        </div>
      )}

      {/* =========================================================
          3. EXECUTIVE VESSEL METRIC CARDS (4 KPIs)
         ========================================================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {/* Onboard Containers */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Containers Onboard
              </span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {onboardContainers.length} <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Units</span>
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f0f5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box size={20} color="#0f3460" />
            </div>
          </div>
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
            <span>Capacity: <strong>{activeShip.capacityTEU?.toLocaleString()} TEU</strong></span>
            <span style={{ color: '#0284c7', fontWeight: 700 }}>
              {onboardContainers.filter(c => c.type?.toLowerCase().includes('reefer')).length} Reefers
            </span>
          </div>
        </div>

        {/* Waypoints Progress */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Route Corridor
              </span>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {passedWaypoints} / {totalWaypoints} <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Waypoints</span>
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Navigation size={20} color="#0284c7" />
            </div>
          </div>
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '12px', color: '#0284c7', fontWeight: 600 }}>
            Next: <strong>{currentVoyage?.waypoints?.find(w => !w.passed)?.name || 'Destination Port Approach'}</strong>
          </div>
        </div>

        {/* Port Berth Coordination */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Berth Allocation
              </span>
              <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                {currentVoyage?.portCoordination?.requestedBerth || 'Berth 01 (Quay North)'}
              </div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#f0f5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Anchor size={20} color="#0f3460" />
            </div>
          </div>
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', fontSize: '12px', fontWeight: 700 }}>
            {currentVoyage?.portCoordination?.berthingConfirmed ? (
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={14} /> Confirmed by Port Master
              </span>
            ) : (
              <span style={{ color: '#b45309', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} /> Awaiting Port Master Clearance
              </span>
            )}
          </div>
        </div>

        {/* Schedule Variance */}
        <div style={{
          background: '#ffffff',
          borderRadius: '14px',
          padding: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Schedule Variance
              </span>
              <div style={{
                fontSize: '24px',
                fontWeight: 800,
                color: performance?.varianceHours > 0 ? '#b45309' : '#10b981',
                marginTop: '4px'
              }}>
                {performance?.varianceHours > 0 ? `+${performance.varianceHours}h Delayed` : 'On Schedule (0h)'}
              </div>
            </div>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: performance?.varianceHours > 0 ? '#fffbeb' : '#f0fdf4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Clock size={20} color={performance?.varianceHours > 0 ? '#b45309' : '#10b981'} />
            </div>
          </div>
          <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b' }}>
            <span>Exceptions Logged: <strong>{currentVoyage?.delays?.length || 0}</strong></span>
            <span style={{ color: '#0284c7', fontWeight: 600 }}>Planned: {performance?.plannedDurationHours || 120}h</span>
          </div>
        </div>
      </div>

      {/* =========================================================
          4. SEGMENTED NAVIGATION TABS STRIP
         ========================================================= */}
      <div style={{
        display: 'flex',
        gap: '8px',
        background: '#ffffff',
        padding: '6px',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        marginBottom: '20px',
        overflowX: 'auto'
      }}>
        {[
          { id: 'voyage', label: 'Route & Waypoints', icon: Navigation, count: `${passedWaypoints}/${totalWaypoints}` },
          { id: 'cargo', label: 'Cargo Manifest', icon: Box, count: onboardContainers.length },
          { id: 'port', label: 'Port Arrival & Berth', icon: Anchor },
          { id: 'delays', label: 'Delays & Exceptions', icon: AlertTriangle, count: currentVoyage?.delays?.length || 0 },
          { id: 'performance', label: 'Voyage Performance', icon: Clock }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 18px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? '#0f3460' : 'transparent',
                color: isActive ? '#ffffff' : '#64748b',
                fontWeight: isActive ? 700 : 600,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={15} color={isActive ? '#38bdf8' : '#64748b'} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span style={{
                  background: isActive ? 'rgba(56, 189, 248, 0.25)' : '#f1f5f9',
                  color: isActive ? '#e0f2fe' : '#475569',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '999px'
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* =========================================================
          TAB 1: WAYPOINT TRACK & ROUTE
         ========================================================= */}
      {activeTab === 'voyage' && currentVoyage && (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Voyage Waypoints Progression & Sea Corridors
              </h3>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                Real-time tracking through international traffic separation schemes, straits, and deep-water corridors
              </div>
            </div>
            <button
              onClick={() => setTelemetryModalOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Sliders size={14} color="#0284c7" />
              <span>Adjust Telemetry</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {currentVoyage.waypoints?.map((w, idx) => (
              <div
                key={idx}
                style={{
                  padding: '16px 20px',
                  borderRadius: '12px',
                  background: w.passed ? '#f0fdf4' : '#f8fafc',
                  border: `1px solid ${w.passed ? '#bbf7d0' : '#e2e8f0'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '14px',
                  transition: 'transform 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: w.passed ? '#10b981' : '#e2e8f0',
                    color: w.passed ? '#ffffff' : '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 800,
                    flexShrink: 0
                  }}>
                    {w.passed ? <CheckCircle2 size={18} /> : idx + 1}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <strong style={{ fontSize: '14px', color: '#0f172a' }}>{w.name}</strong>
                      {w.passed ? (
                        <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>
                          Passed & Verified
                        </span>
                      ) : (
                        <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px' }}>
                          Upcoming
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      Coordinates: <code>{w.lat}°N, {w.lng}°E</code>
                      {w.passedAt && (
                        <span style={{ color: '#059669', marginLeft: '8px' }}>
                          &bull; Logged at {new Date(w.passedAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  {w.passed ? (
                    <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 700 }}>
                      ✅ Audit Record Created
                    </span>
                  ) : (
                    <button
                      onClick={() => handleMarkWaypointPassed(idx)}
                      className="btn btn-primary btn-sm"
                      style={{
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: '#0284c7'
                      }}
                    >
                      <CheckCircle size={13} />
                      <span>Log Waypoint Passed</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: ONBOARD CONTAINERS MANIFEST
         ========================================================= */}
      {activeTab === 'cargo' && (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
        }}>
          {/* Header & Filter Strip */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Onboard Cargo Manifest ({onboardContainers.length} Containers)
              </h3>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                Refrigerated cold-chain monitoring, gross weight checks, and tamper-proof security seals
              </div>
            </div>

            <button onClick={() => onNavigate('containers')} className="btn btn-outline btn-sm">
              <span>View Full Inventory</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          {/* Search Bar & Category Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
              <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="input-control"
                placeholder="Search Container ID, Cargo, Owner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', fontSize: '13px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'all', label: `All (${onboardContainers.length})` },
                { id: 'reefer', label: `Reefers (${onboardContainers.filter(c => c.type?.toLowerCase().includes('reefer') || c.temperatureCelsius !== null && c.temperatureCelsius !== undefined).length})` },
                { id: 'hazmat', label: `Hazmat (${onboardContainers.filter(c => c.hazardClass && c.hazardClass !== 'Non-Hazardous').length})` },
                { id: 'dry', label: 'Dry Cargo' }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setCargoFilter(f.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: '1px solid',
                    borderColor: cargoFilter === f.id ? '#0284c7' : '#e2e8f0',
                    background: cargoFilter === f.id ? '#e0f2fe' : '#ffffff',
                    color: cargoFilter === f.id ? '#0369a1' : '#64748b',
                    cursor: 'pointer'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Manifest Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="maritime-table" style={{ width: '100%', fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>Container ID</th>
                  <th>Type & Cargo Description</th>
                  <th>Owner Company</th>
                  <th>Gross Weight</th>
                  <th>Cold Chain Temp</th>
                  <th>Security Seal</th>
                  <th>Risk Rating</th>
                </tr>
              </thead>
              <tbody>
                {filteredContainers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                      No containers match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredContainers.map((c) => (
                    <tr key={c.containerId}>
                      <td>
                        <strong style={{ color: '#0f172a', fontFamily: 'var(--font-mono)' }}>{c.containerId}</strong>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.cargoDescription || 'Commercial Cargo'}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{c.type || 'Standard Dry'} ({c.size || '40ft'})</div>
                        {c.hazardClass && c.hazardClass !== 'Non-Hazardous' && (
                          <span style={{ color: '#b91c1c', fontSize: '10px', fontWeight: 700, background: '#fee2e2', padding: '1px 6px', borderRadius: '4px', display: 'inline-block', marginTop: '2px' }}>
                            ⚠️ {c.hazardClass}
                          </span>
                        )}
                      </td>
                      <td style={{ color: '#334155' }}>{c.ownerCompany || 'Global Freight Line'}</td>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{c.weightKg?.toLocaleString() || '24,500'} kg</td>
                      <td>
                        {c.temperatureCelsius !== null && c.temperatureCelsius !== undefined ? (
                          <span style={{
                            color: c.temperatureCelsius > -10 ? '#b91c1c' : '#0369a1',
                            background: c.temperatureCelsius > -10 ? '#fee2e2' : '#e0f2fe',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Thermometer size={12} /> {c.temperatureCelsius}°C
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>Ambient</span>
                        )}
                      </td>
                      <td>
                        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: '#334155' }}>
                          {c.sealNumber || 'SEAL-99812'}
                        </code>
                      </td>
                      <td>
                        <span className={`badge ${c.riskLevel === 'Low' ? 'badge-green' : c.riskLevel === 'Medium' ? 'badge-amber' : 'badge-red'}`}>
                          {c.riskLevel || 'Low'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 3: PORT ARRIVAL & BERTH COORDINATION
         ========================================================= */}
      {activeTab === 'port' && currentVoyage && (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Destination Port Coordination & Berth Clearance
              </h3>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                Direct communication with {currentVoyage.arrivalPort} Port Manager for quay assignment & pilot boarding
              </div>
            </div>
            <button
              onClick={() => setPortCoordModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{ background: '#0f3460', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Send size={14} />
              <span>Transmit Arrival Notice</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Target Berth */}
            <div style={{ padding: '18px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Requested Berth</span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {currentVoyage.portCoordination?.requestedBerth || 'Berth 01 (Quay North)'}
              </div>
              <div style={{ fontSize: '12px', color: currentVoyage.portCoordination?.berthingConfirmed ? '#15803d' : '#b45309', marginTop: '6px', fontWeight: 700 }}>
                {currentVoyage.portCoordination?.berthingConfirmed ? '✅ Confirmed with Port Master' : '⏳ Awaiting Port Clearance'}
              </div>
            </div>

            {/* Estimated Arrival */}
            <div style={{ padding: '18px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Pilot Station ETA</span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
                {new Date(currentVoyage.estimatedArrivalTime).toLocaleDateString()} {new Date(currentVoyage.estimatedArrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                Outer Anchorage Pilot Boarding: 2 Hours Prior to Berth
              </div>
            </div>

            {/* Port Manager Operational Notes */}
            <div style={{ padding: '18px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Port Master Advisory</span>
              <div style={{ fontSize: '13px', color: '#334155', marginTop: '6px', lineHeight: '1.5' }}>
                {currentVoyage.portCoordination?.portNotes || 'Quay cranes #03 & #04 scheduled for container discharge upon all-fast.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 4: DELAYS & ROUTE DIVERSIONS
         ========================================================= */}
      {activeTab === 'delays' && currentVoyage && (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Voyage Exceptions, Delays & Diversions
              </h3>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                Log weather slowdowns, heavy sea swells, technical diversions, and schedule variances
              </div>
            </div>
            <button
              onClick={() => setDelayModalOpen(true)}
              className="btn btn-primary btn-sm"
              style={{ background: '#b45309', borderColor: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Plus size={14} />
              <span>Report Delay / Diversion</span>
            </button>
          </div>

          {!currentVoyage.delays || currentVoyage.delays.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px', color: '#64748b', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
              <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 700, color: '#0f172a' }}>Zero Delays Recorded</div>
              <div style={{ fontSize: '13px', marginTop: '2px' }}>Ship is operating exactly on planned schedule.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {currentVoyage.delays.map((d, i) => (
                <div
                  key={i}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '12px',
                    background: '#fffbeb',
                    border: '1px solid #fde68a',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <AlertTriangle size={16} color="#b45309" />
                      <strong style={{ color: '#92400e', fontSize: '14px' }}>{d.reason}</strong>
                      <span className="badge badge-amber">+{d.delayHours} Hours</span>
                      {d.isDiversion && <span className="badge badge-red">Diversion</span>}
                    </div>
                    <div style={{ fontSize: '12px', color: '#78350f', marginTop: '4px' }}>
                      <strong>Mitigation Plan:</strong> {d.mitigation || 'Speed adjusted to optimize route and container safety.'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#92400e', marginTop: '2px' }}>
                      Reported by {d.reportedBy} &bull; {new Date(d.reportedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          TAB 5: VOYAGE PERFORMANCE ANALYSIS
         ========================================================= */}
      {activeTab === 'performance' && currentVoyage && (
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)'
        }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a', marginBottom: '2px' }}>
            Voyage Schedule & Performance Comparison
          </h3>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
            Comparison of Planned Departure/Arrival vs. Actual Voyage Progress
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '18px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Planned Transit Time</span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                {performance?.plannedDurationHours || 120} <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Hours</span>
              </div>
            </div>

            <div style={{ padding: '18px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Actual Sea Transit</span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#0284c7', marginTop: '4px' }}>
                {performance?.actualDurationHours || 96} <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Hours</span>
              </div>
            </div>

            <div style={{ padding: '18px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Average Sea Speed</span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
                {currentVoyage.speedKnots} <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748b' }}>Knots</span>
              </div>
            </div>

            <div style={{ padding: '18px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Overall Variance</span>
              <div style={{ fontSize: '22px', fontWeight: 800, color: performance?.varianceHours > 0 ? '#b45309' : '#10b981', marginTop: '4px' }}>
                {performance?.varianceHours > 0 ? `+${performance.varianceHours}h Variance` : '0h (On Schedule)'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODALS
         ========================================================= */}
      {/* 1. Create Voyage Modal */}
      {createVoyageOpen && (
        <div className="modal-overlay" onClick={() => setCreateVoyageOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Create New Voyage for {activeShip.name}</h3>
              <button onClick={() => setCreateVoyageOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCreateVoyage} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Departure Port:</label>
                  <input
                    type="text"
                    className="input-control"
                    value={createVoyageForm.departurePort}
                    onChange={(e) => setCreateVoyageForm({ ...createVoyageForm, departurePort: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Arrival Port:</label>
                  <input
                    type="text"
                    className="input-control"
                    value={createVoyageForm.arrivalPort}
                    onChange={(e) => setCreateVoyageForm({ ...createVoyageForm, arrivalPort: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Departure Time:</label>
                  <input
                    type="datetime-local"
                    className="input-control"
                    value={createVoyageForm.plannedDepartureDate}
                    onChange={(e) => setCreateVoyageForm({ ...createVoyageForm, plannedDepartureDate: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Estimated Arrival (ETA):</label>
                  <input
                    type="datetime-local"
                    className="input-control"
                    value={createVoyageForm.estimatedArrivalTime}
                    onChange={(e) => setCreateVoyageForm({ ...createVoyageForm, estimatedArrivalTime: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Requested Destination Berth:</label>
                <input
                  type="text"
                  className="input-control"
                  value={createVoyageForm.requestedBerth}
                  onChange={(e) => setCreateVoyageForm({ ...createVoyageForm, requestedBerth: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Voyage Notes / Cargo Manifest:</label>
                <input
                  type="text"
                  className="input-control"
                  value={createVoyageForm.voyageNotes}
                  onChange={(e) => setCreateVoyageForm({ ...createVoyageForm, voyageNotes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setCreateVoyageOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ background: '#0f3460' }}>
                  {actionLoading ? 'Creating...' : 'Initialize Voyage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Update ETA Modal */}
      {updateEtaOpen && (
        <div className="modal-overlay" onClick={() => setUpdateEtaOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Update Estimated Arrival Time (ETA)</h3>
              <button onClick={() => setUpdateEtaOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleUpdateEta} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>New Estimated Arrival Time:</label>
                <input
                  type="datetime-local"
                  className="input-control"
                  value={etaForm.estimatedArrivalTime}
                  onChange={(e) => setEtaForm({ ...etaForm, estimatedArrivalTime: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Adjustment Reason:</label>
                <select
                  className="select-control"
                  value={etaForm.reason}
                  onChange={(e) => setEtaForm({ ...etaForm, reason: e.target.value })}
                >
                  <option value="Monsoon sea swell reduced average speed">Monsoon sea swell reduced average speed</option>
                  <option value="Traffic congestion in navigation channel">Traffic congestion in navigation channel</option>
                  <option value="Favorable tailwinds increased vessel speed">Favorable tailwinds increased vessel speed (Early)</option>
                  <option value="Engine throttle optimization for fuel efficiency">Engine throttle optimization for fuel efficiency</option>
                  <option value="Anchorage pilot queue advisory from destination port">Anchorage pilot queue advisory from destination port</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Master Instructions / Port Notification Notes:</label>
                <textarea
                  className="input-control"
                  rows={3}
                  value={etaForm.notes}
                  onChange={(e) => setEtaForm({ ...etaForm, notes: e.target.value })}
                />
              </div>

              <div style={{ fontSize: '12px', color: '#64748b', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px' }}>
                Updating ETA will automatically notify the Port Manager at {currentVoyage?.arrivalPort} to prepare berth allocation and record an immutable audit trail entry.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setUpdateEtaOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ background: '#0284c7' }}>
                  {actionLoading ? 'Updating...' : 'Save & Notify Port Manager'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Telemetry Modal */}
      {telemetryModalOpen && (
        <div className="modal-overlay" onClick={() => setTelemetryModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Adjust AIS Telemetry & Sea Conditions</h3>
              <button onClick={() => setTelemetryModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleUpdateTelemetry} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Speed (Knots):</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-control"
                    value={telemetryForm.speedKnots}
                    onChange={(e) => setTelemetryForm({ ...telemetryForm, speedKnots: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Heading (Degrees):</label>
                  <input
                    type="number"
                    min="0"
                    max="360"
                    className="input-control"
                    value={telemetryForm.headingDegrees}
                    onChange={(e) => setTelemetryForm({ ...telemetryForm, headingDegrees: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Latitude (°N):</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-control"
                    value={telemetryForm.lat}
                    onChange={(e) => setTelemetryForm({ ...telemetryForm, lat: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Longitude (°E):</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input-control"
                    value={telemetryForm.lng}
                    onChange={(e) => setTelemetryForm({ ...telemetryForm, lng: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Wind Speed (Knots):</label>
                  <input
                    type="number"
                    className="input-control"
                    value={telemetryForm.windKnots}
                    onChange={(e) => setTelemetryForm({ ...telemetryForm, windKnots: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Sea Condition:</label>
                  <input
                    type="text"
                    className="input-control"
                    value={telemetryForm.condition}
                    onChange={(e) => setTelemetryForm({ ...telemetryForm, condition: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setTelemetryModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ background: '#0284c7' }}>
                  {actionLoading ? 'Saving...' : 'Update Telemetry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Delay Modal */}
      {delayModalOpen && (
        <div className="modal-overlay" onClick={() => setDelayModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Report Voyage Delay / Exception</h3>
              <button onClick={() => setDelayModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleRecordDelay} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Delay Reason:</label>
                <input
                  type="text"
                  className="input-control"
                  value={delayForm.reason}
                  onChange={(e) => setDelayForm({ ...delayForm, reason: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Estimated Delay (Hours):</label>
                <input
                  type="number"
                  min="1"
                  className="input-control"
                  value={delayForm.delayHours}
                  onChange={(e) => setDelayForm({ ...delayForm, delayHours: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Mitigation Plan:</label>
                <textarea
                  className="input-control"
                  rows={3}
                  value={delayForm.mitigation}
                  onChange={(e) => setDelayForm({ ...delayForm, mitigation: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setDelayModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ background: '#b45309', borderColor: '#b45309' }}>
                  {actionLoading ? 'Recording...' : 'Record Delay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Port Coordination Modal */}
      {portCoordModalOpen && (
        <div className="modal-overlay" onClick={() => setPortCoordModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Coordinate Berth with Port Manager</h3>
              <button onClick={() => setPortCoordModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleCoordinatePort} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Requested Berth:</label>
                <select
                  className="select-control"
                  value={portCoordForm.requestedBerth}
                  onChange={(e) => setPortCoordForm({ ...portCoordForm, requestedBerth: e.target.value })}
                >
                  <option value="Berth 01 (Quay North)">Berth 01 (Quay North)</option>
                  <option value="Berth 02 (Quay South)">Berth 02 (Quay South)</option>
                  <option value="Berth 03 (Feeder Terminal)">Berth 03 (Feeder Terminal)</option>
                  <option value="Berth 04 (Bulk Yard)">Berth 04 (Bulk Yard)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Pilot Station Boarding Time:</label>
                <input
                  type="datetime-local"
                  className="input-control"
                  value={portCoordForm.pilotStationETA}
                  onChange={(e) => setPortCoordForm({ ...portCoordForm, pilotStationETA: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Advisory Notes to Port Master:</label>
                <textarea
                  className="input-control"
                  rows={3}
                  value={portCoordForm.notes}
                  onChange={(e) => setPortCoordForm({ ...portCoordForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setPortCoordModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ background: '#0f3460' }}>
                  {actionLoading ? 'Transmitting...' : 'Send Notice to Port Manager'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Change Voyage Status Modal */}
      {statusModalOpen && (
        <div className="modal-overlay" onClick={() => setStatusModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px', borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Update Voyage Status</h3>
              <button onClick={() => setStatusModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Planned', 'In Transit', 'Delayed', 'Diverted', 'Arrived', 'Completed'].map(st => (
                <button
                  key={st}
                  onClick={() => handleUpdateVoyageStatus(st)}
                  className="btn btn-secondary"
                  style={{ justifyContent: 'space-between', fontWeight: 700, padding: '10px 16px', borderRadius: '8px' }}
                >
                  <span>{st}</span>
                  <ChevronRight size={15} color="#0284c7" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipManagerDashboard;
