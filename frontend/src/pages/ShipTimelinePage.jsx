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
  const [selectedShipId, setSelectedShipId] = useState(initialShipId || '');
  const [voyages, setVoyages] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [containers, setContainers] = useState([]);
  const [portActivities, setPortActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timelineError, setTimelineError] = useState('');
  const [selectedStageFilter, setSelectedStageFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive Time-Scrubber State
  const [selectedEventIndex, setSelectedEventIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimerRef = useRef(null);

  useEffect(() => {
    loadShipTimelineData();
  }, [selectedShipId]);

  useEffect(() => {
    if (initialShipId) setSelectedShipId(initialShipId);
  }, [initialShipId]);

  const loadShipTimelineData = async () => {
    setLoading(true);
    setTimelineError('');
    try {
      const [allShips, allVoyages, allAudits, allContainers, allPortActivities] = await Promise.all([
        api.ships.getAll(),
        api.voyages.getAll(),
        api.auditLogs.getAll({ limit: 500 }),
        api.containers.getAll(),
        api.portActivities.getAll({ limit: 500 })
      ]);

      setShips(allShips || []);
      setVoyages(allVoyages || []);
      setContainers(allContainers || []);
      setPortActivities(allPortActivities || []);

      const currentShip = (allShips || []).find(ship => ship.shipId === selectedShipId) || allShips?.[0] || null;
      const resolvedShipId = currentShip?.shipId || '';
      if (resolvedShipId !== selectedShipId) setSelectedShipId(resolvedShipId);

      const relatedContainers = (allContainers || []).filter(container =>
        container.assignedShipId === resolvedShipId || container.assignedShipName === currentShip?.name
      );
      const relatedContainerIds = new Set(relatedContainers.map(container => container.containerId));
      const shipAudits = (allAudits?.logs || allAudits || []).filter(audit =>
        audit.shipId === resolvedShipId ||
        audit.entityId === resolvedShipId ||
        relatedContainerIds.has(audit.containerId) ||
        relatedContainerIds.has(audit.entityId)
      );
      setAuditLogs(shipAudits);
    } catch (e) {
      console.error('Failed to load ship timeline data:', e);
      setTimelineError(e.message || 'Failed to load ship timeline data.');
    } finally {
      setLoading(false);
    }
  };

  const activeShip = ships.find(ship => ship.shipId === selectedShipId) || ships[0] || null;

  const onboardContainers = containers.filter(c =>
    activeShip && (c.assignedShipId === activeShip.shipId || c.assignedShipName === activeShip.name)
  );

  // Build the timeline exclusively from persisted records.
  const buildTimelineEvents = () => {
    if (!activeShip) return [];
    const events = [];
    const addEvent = (event) => {
      const timestamp = new Date(event.timestamp);
      if (!event.timestamp || Number.isNaN(timestamp.getTime())) return;
      events.push({
        statusAtTime: 'Not recorded',
        speedAtTime: 'Not recorded',
        locationAtTime: event.location || 'Not recorded',
        location: event.location || 'Not recorded',
        performedBy: 'Not recorded',
        userRole: 'Not recorded',
        auditId: null,
        hash: null,
        cargoState: 'Not recorded',
        details: '',
        color: '#0284c7',
        ...event,
        timestamp: timestamp.toISOString(),
        timeLabel: timestamp.toLocaleString()
      });
    };

    if (activeShip.createdAt) {
      addEvent({
        id: `SHIP-${activeShip.shipId}-CREATED`,
        category: 'SHIP',
        stage: 'Ship Record Created',
        title: `Ship record created: ${activeShip.name}`,
        timestamp: activeShip.createdAt,
        location: activeShip.currentLocation,
        icon: Ship,
        badge: 'Ship record',
        statusAtTime: activeShip.status,
        details: `Ship ID: ${activeShip.shipId}; IMO: ${activeShip.imoNumber}.`
      });
    }

    voyages.filter(voyage => voyage.shipId === activeShip.shipId).forEach(voyage => {
      if (voyage.createdAt) {
        addEvent({
          id: `${voyage.voyageId}-CREATED`,
          category: 'VOYAGE',
          stage: 'Voyage Record Created',
          title: `Voyage record created: ${voyage.voyageId}`,
          timestamp: voyage.createdAt,
          location: `${voyage.departurePort} to ${voyage.arrivalPort}`,
          icon: Navigation,
          badge: voyage.status,
          statusAtTime: voyage.status,
          auditId: voyage.auditId,
          details: `Voyage ${voyage.voyageId} recorded for ${voyage.shipName}.`
        });
      }

      (voyage.waypoints || []).forEach((waypoint, index) => {
        if (!waypoint.passed || !waypoint.passedAt) return;
        addEvent({
          id: `${voyage.voyageId}-WAYPOINT-${index}`,
          category: 'NAVIGATION',
          stage: 'Waypoint Passed',
          title: waypoint.name,
          timestamp: waypoint.passedAt,
          location: `${waypoint.lat}, ${waypoint.lng}`,
          icon: MapPin,
          badge: 'Passed',
          statusAtTime: voyage.status,
          auditId: voyage.auditId,
          details: `Waypoint passage recorded for voyage ${voyage.voyageId}.`
        });
      });

      (voyage.delays || []).forEach((delay, index) => {
        addEvent({
          id: `${voyage.voyageId}-DELAY-${index}`,
          category: 'EXCEPTION',
          stage: 'Voyage Delay',
          title: delay.reason,
          timestamp: delay.reportedAt,
          location: `${voyage.departurePort} to ${voyage.arrivalPort}`,
          icon: AlertTriangle,
          color: '#b45309',
          badge: `${delay.delayHours} hours`,
          performedBy: delay.reportedBy,
          statusAtTime: voyage.status,
          auditId: voyage.auditId,
          details: delay.mitigation || delay.reason
        });
      });

      if (voyage.actualArrivalTime) {
        addEvent({
          id: `${voyage.voyageId}-ARRIVAL`,
          category: 'VOYAGE',
          stage: 'Arrival Recorded',
          title: `Arrival recorded at ${voyage.arrivalPort}`,
          timestamp: voyage.actualArrivalTime,
          location: voyage.arrivalPort,
          icon: Anchor,
          badge: voyage.status,
          statusAtTime: voyage.status,
          auditId: voyage.auditId,
          details: `Actual arrival recorded for voyage ${voyage.voyageId}.`
        });
      }
    });

    onboardContainers.forEach(container => {
      (container.journeyMilestones || []).forEach((milestone, index) => {
        const linkedToShip = milestone.shipId === activeShip.shipId ||
          (!milestone.shipId && container.assignedShipId === activeShip.shipId);
        if (!linkedToShip) return;
        addEvent({
          id: `${container.containerId}-MILESTONE-${milestone.milestoneId || index}`,
          category: 'CARGO',
          stage: milestone.stage,
          title: `${container.containerId}: ${milestone.stage}`,
          timestamp: milestone.timestamp,
          location: milestone.location,
          icon: Box,
          badge: milestone.status,
          statusAtTime: milestone.status,
          performedBy: milestone.performedBy,
          userRole: milestone.userRole,
          auditId: milestone.auditId,
          hash: milestone.hash,
          cargoState: `${container.containerId}: ${container.cargoDescription}`,
          details: milestone.notes || `Recorded container milestone for ${container.containerId}.`
        });
      });
    });

    portActivities.filter(activity =>
      activity.entityId === activeShip.shipId ||
      activity.details?.vesselName === activeShip.name ||
      onboardContainers.some(container => container.containerId === activity.entityId)
    ).forEach(activity => {
      addEvent({
        id: activity.activityId,
        category: activity.activityType === 'OPERATIONAL_DELAY' ? 'EXCEPTION' : 'PORT_OPS',
        stage: activity.activityType.replace(/_/g, ' '),
        title: activity.details?.notes || `${activity.activityType.replace(/_/g, ' ')}: ${activity.entityId}`,
        timestamp: activity.timestamp,
        location: activity.port,
        icon: Anchor,
        color: activity.activityType === 'OPERATIONAL_DELAY' ? '#b45309' : '#0f3460',
        badge: activity.status,
        performedBy: activity.performedBy,
        userRole: activity.userRole,
        auditId: activity.auditId,
        details: activity.details?.notes || activity.details?.delayReason || `Recorded port activity for ${activity.entityId}.`
      });
    });

    auditLogs.forEach(audit => {
      const action = audit.action || 'Audit event';
      const isException = /fail|delay|anomal|tamper|hold/i.test(action);
      const newValue = audit.newValue == null
        ? ''
        : typeof audit.newValue === 'string' ? audit.newValue : JSON.stringify(audit.newValue);
      addEvent({
        id: audit.auditId,
        category: isException ? 'EXCEPTION' : audit.entityType === 'Container' ? 'CARGO' : 'AUDIT',
        stage: action.replace(/_/g, ' '),
        title: `${action.replace(/_/g, ' ')}: ${audit.entityType} ${audit.entityId}`,
        timestamp: audit.timestamp,
        location: audit.location,
        icon: isException ? AlertTriangle : ShieldCheck,
        color: isException ? '#b45309' : '#0284c7',
        badge: audit.entityType,
        statusAtTime: newValue || action,
        performedBy: audit.username,
        userRole: audit.userRole,
        auditId: audit.auditId,
        hash: audit.currentHash,
        cargoState: audit.containerId || 'Not linked to a container',
        details: newValue || `${action} recorded for ${audit.entityType} ${audit.entityId}.`
      });
    });

    return events
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
      .map((event, index) => ({ ...event, stepNumber: index + 1 }));
  };

  const allEvents = buildTimelineEvents();

  useEffect(() => {
    setSelectedEventIndex(index => Math.min(index, Math.max(allEvents.length - 1, 0)));
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

  const activeEvent = allEvents[selectedEventIndex] || allEvents[0] || null;

  // Filter events for the vertical list
  const filteredEvents = allEvents.filter(evt => {
    if (selectedStageFilter !== 'ALL') {
      if (selectedStageFilter === 'PORT' && evt.category !== 'PORT_OPS' && evt.category !== 'SHIP') return false;
      if (selectedStageFilter === 'CARGO' && evt.category !== 'CARGO') return false;
      if (selectedStageFilter === 'VOYAGE' && evt.category !== 'VOYAGE' && evt.category !== 'NAVIGATION') return false;
      if (selectedStageFilter === 'EXCEPTION' && evt.category !== 'EXCEPTION') return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return evt.title.toLowerCase().includes(q) ||
        evt.details.toLowerCase().includes(q) ||
        evt.location.toLowerCase().includes(q) ||
        String(evt.auditId || '').toLowerCase().includes(q);
    }
    return true;
  });

  if (loading) {
    return <div className="page-wrapper" style={{ padding: '40px', color: '#64748b' }}>Loading ship timeline...</div>;
  }

  if (timelineError) {
    return (
      <div className="page-wrapper">
        <div role="alert" className="maritime-card" style={{ padding: '24px', color: '#991b1b' }}>
          <div>Unable to load ship timeline: {timelineError}</div>
          <button onClick={loadShipTimelineData} className="btn btn-secondary" style={{ marginTop: '12px' }}>
            <RotateCw size={15} /> Retry
          </button>
        </div>
      </div>
    );
  }

  if (!activeShip) {
    return (
      <div className="page-wrapper">
        <div className="maritime-card" style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
          <Ship size={28} style={{ marginBottom: '8px' }} />
          <h2 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '18px' }}>No ship records</h2>
          <div>No ship timeline is available until a ship is added.</div>
        </div>
      </div>
    );
  }

  if (!activeEvent) {
    return (
      <div className="page-wrapper" style={{ maxWidth: '1440px', margin: '0 auto' }}>
        <div className="maritime-card" style={{ padding: '22px', marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ color: '#0284c7', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Ship Timeline</div>
            <h1 style={{ margin: '4px 0', color: '#0f172a', fontSize: '22px' }}>{activeShip.name}</h1>
            <div style={{ color: '#64748b', fontSize: '13px' }}>{activeShip.shipId} · {activeShip.status}</div>
          </div>
          <select
            className="select-control"
            value={activeShip.shipId}
            onChange={event => {
              setSelectedShipId(event.target.value);
              setSelectedEventIndex(0);
            }}
            aria-label="Select vessel"
          >
            {ships.map(ship => <option key={ship.shipId} value={ship.shipId}>{ship.name} ({ship.shipId})</option>)}
          </select>
        </div>
        <div className="maritime-card" style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b' }}>
          <Clock size={28} style={{ marginBottom: '8px' }} />
          <h2 style={{ margin: '0 0 6px', color: '#0f172a', fontSize: '18px' }}>No timeline events recorded</h2>
          <div>Voyages, port activity, container milestones, or audit events linked to this ship will appear here.</div>
        </div>
      </div>
    );
  }

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
            width: `${(selectedEventIndex / Math.max(allEvents.length - 1, 1)) * 100}%`,
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
            <span>First recorded event: {allEvents[0]?.timeLabel}</span>
            <span>{activeEvent.timeLabel}</span>
            <span>Latest recorded event: {allEvents[allEvents.length - 1]?.timeLabel}</span>
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
                Recorded: <strong>{activeEvent.timeLabel}</strong>
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
                Hash: {activeEvent.hash ? `${activeEvent.hash.substring(0, 24)}...` : 'Not recorded'}
              </span>
              {activeEvent.hash && (
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
                  <ShieldCheck size={12} /> HASH RECORDED
                </span>
              )}
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
                          {evt.hash ? <><ShieldCheck size={11} /> HASH RECORDED</> : 'No linked hash'}
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
