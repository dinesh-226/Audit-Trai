import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  MapPin,
  Ship,
  Radio,
  Play,
  Pause,
  RotateCw,
  Anchor,
  Box,
  Compass,
  Navigation,
  ExternalLink,
  ShieldCheck,
  CheckCircle
} from 'lucide-react';

export const LiveTrackingPage = ({ onSelectShip }) => {
  const [mapData, setMapData] = useState({ ships: [], ports: [] });
  const [loading, setLoading] = useState(true);
  const [selectedVessel, setSelectedVessel] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  useEffect(() => {
    fetchMapData();
  }, []);

  // Simulation tick loop
  useEffect(() => {
    let interval = null;
    if (isSimulating) {
      interval = setInterval(async () => {
        try {
          await api.tracking.simulateStep();
          await fetchMapData();
        } catch (e) {
          console.error(e);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  const fetchMapData = async () => {
    try {
      const data = await api.tracking.getLiveMap();
      setMapData(data || { ships: [], ports: [] });
      if (!selectedVessel && data?.ships?.length > 0) {
        setSelectedVessel(data.ships[0]);
      } else if (selectedVessel) {
        const updated = data.ships.find(s => s.shipId === selectedVessel.shipId);
        if (updated) setSelectedVessel(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleManualStep = async () => {
    try {
      await api.tracking.simulateStep();
      await fetchMapData();
    } catch (e) {
      console.error(e);
    }
  };

  // Convert lat/lng to SVG map coordinates (Mercator / Equirectangular projection)
  const mapCoordsToSvg = (lat, lng) => {
    const x = ((lng + 180) / 360) * 1000;
    const y = ((90 - lat) / 180) * 500;
    return { x, y };
  };

  return (
    <div className="page-wrapper">
      {/* Header & AIS Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            GLOBAL VESSEL POSITIONING SYSTEM
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Live Maritime AIS Map & Fleet Tracking
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Interactive satellite & coastal AIS telemetry across major international shipping lanes
          </div>
        </div>

        {/* Simulation Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-card)', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', fontWeight: 700, marginRight: '8px' }}>
            <span className="pulse-dot" />
            <span>SIMULATION MODE</span>
          </div>

          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`btn btn-sm ${isSimulating ? 'btn-danger' : 'btn-success'}`}
          >
            {isSimulating ? <Pause size={14} /> : <Play size={14} />}
            <span>{isSimulating ? 'Pause Stream' : 'Auto Stream'}</span>
          </button>

          <button
            onClick={handleManualStep}
            className="btn btn-secondary btn-sm"
          >
            <RotateCw size={14} />
            <span>Advance Tick</span>
          </button>
        </div>
      </div>

      {/* Main Map & Telemetry Panel Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', marginBottom: '28px' }}>
        {/* Left: SVG Maritime AIS Map */}
        <div className="maritime-card-glow" style={{ padding: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Compass size={18} color="var(--cyan)" />
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                World Shipping Corridors & Port Nodes
              </span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Equirectangular Maritime AIS Grid
            </span>
          </div>

          {/* SVG Map Canvas */}
          <div style={{
            background: 'radial-gradient(ellipse at center, #0d1e3d 0%, #081124 100%)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <svg viewBox="0 0 1000 500" style={{ width: '100%', height: 'auto', display: 'block' }}>
              {/* Ocean Grid Lines */}
              <defs>
                <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(34, 59, 110, 0.3)" strokeWidth="0.5" />
                </pattern>
                {/* Glowing Vessel Marker */}
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect width="1000" height="500" fill="url(#grid)" />

              {/* Simplified World Continents Outlines */}
              {/* Eurasia & Africa */}
              <path
                d="M 460 120 Q 520 90 600 110 T 750 140 T 850 160 Q 820 220 780 260 T 680 300 Q 640 280 580 320 T 520 380 Q 480 420 460 380 T 480 280 Q 460 220 440 180 Z"
                fill="rgba(19, 34, 71, 0.85)"
                stroke="#203a70"
                strokeWidth="1.5"
              />
              {/* Americas */}
              <path
                d="M 180 100 Q 240 120 280 160 T 260 260 Q 280 300 320 360 T 300 440 Q 260 460 240 400 T 220 300 Q 180 240 160 180 Z"
                fill="rgba(19, 34, 71, 0.85)"
                stroke="#203a70"
                strokeWidth="1.5"
              />
              {/* Australia */}
              <path
                d="M 760 340 Q 840 330 860 380 T 820 430 Q 760 420 740 380 Z"
                fill="rgba(19, 34, 71, 0.85)"
                stroke="#203a70"
                strokeWidth="1.5"
              />

              {/* Major Maritime Shipping Lanes (Dotted Lines) */}
              {/* Singapore to Mumbai Route */}
              <line x1="788" y1="246" x2="702" y2="197" stroke="rgba(0, 180, 216, 0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
              {/* Shanghai to Rotterdam Route via Suez */}
              <line x1="837" y1="163" x2="590" y2="167" stroke="rgba(0, 180, 216, 0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="590" y1="167" x2="512" y2="105" stroke="rgba(0, 180, 216, 0.4)" strokeWidth="1.5" strokeDasharray="4 4" />
              {/* Transatlantic Route (Rotterdam to NY) */}
              <line x1="512" y1="105" x2="294" y2="136" stroke="rgba(0, 180, 216, 0.3)" strokeWidth="1" strokeDasharray="4 4" />

              {/* Major Port Markers */}
              {(mapData.ports || []).map((port) => {
                const { x, y } = mapCoordsToSvg(port.lat, port.lng);
                return (
                  <g key={port.id} transform={`translate(${x}, ${y})`}>
                    <circle r="4" fill="#0284c7" stroke="#ffffff" strokeWidth="1" />
                    <text
                      x="7"
                      y="3"
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="sans-serif"
                      fontWeight="bold"
                    >
                      {port.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}

              {/* Active Ships Markers */}
              {(mapData.ships || []).map((ship) => {
                const lat = ship.coordinates?.lat || 18.94;
                const lng = ship.coordinates?.lng || 72.83;
                const { x, y } = mapCoordsToSvg(lat, lng);
                const isSelected = selectedVessel?.shipId === ship.shipId;

                return (
                  <g
                    key={ship.shipId}
                    transform={`translate(${x}, ${y})`}
                    onClick={() => setSelectedVessel(ship)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Pulsing Radar Ring */}
                    <circle
                      r={isSelected ? "14" : "8"}
                      fill="rgba(0, 180, 216, 0.2)"
                      stroke="#00b4d8"
                      strokeWidth="1.5"
                    />
                    <circle r="4" fill={isSelected ? "#38bdf8" : "#10b981"} />

                    {/* Ship Label */}
                    <text
                      x="10"
                      y="-6"
                      fill={isSelected ? "#38bdf8" : "#f8fafc"}
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="sans-serif"
                    >
                      🚢 {ship.name}
                    </text>
                    <text
                      x="10"
                      y="6"
                      fill="#10b981"
                      fontSize="8"
                      fontFamily="monospace"
                    >
                      {ship.coordinates?.speedKnots || 0} kts
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Right: Selected Vessel Telemetry & Manifest Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {selectedVessel ? (
            <div className="maritime-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    AIS TARGET TELEMETRY
                  </div>
                  <h3 style={{ margin: '2px 0 0 0', fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                    {selectedVessel.name}
                  </h3>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {selectedVessel.imoNumber} &bull; {selectedVessel.type}
                  </div>
                </div>
                <span className="badge badge-cyan">{selectedVessel.status}</span>
              </div>

              {/* Vessel Telemetry Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>Current AIS Coordinates</span>
                  <div style={{ fontWeight: 700, color: 'var(--cyan)', fontFamily: 'monospace', marginTop: '2px' }}>
                    {selectedVessel.coordinates?.lat?.toFixed(4)}° N, {selectedVessel.coordinates?.lng?.toFixed(4)}° E
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    Speed: <strong>{selectedVessel.coordinates?.speedKnots || 0} Knots</strong> &bull; Heading: <strong>{selectedVessel.coordinates?.heading || 0}°</strong>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>Active Voyage</span>
                  <div style={{ fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                    {selectedVessel.departurePort} ➔ {selectedVessel.arrivalPort}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Destination: {selectedVessel.destination}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>Cargo Load Manifest</span>
                  <div style={{ fontWeight: 700, color: '#10b981', fontSize: '15px', marginTop: '2px' }}>
                    {selectedVessel.containersOnboardCount || 0} Containers
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Capacity: {selectedVessel.capacityTEU} TEU
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <button
                  onClick={() => onSelectShip(selectedVessel)}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  <Ship size={14} />
                  <span>Inspect Cargo Manifest</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="maritime-card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Click any ship icon on the map to inspect its AIS telemetry.
            </div>
          )}

          {/* Quick Major World Ports Reference */}
          <div className="maritime-card" style={{ padding: '20px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Monitored Port Hubs
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              {(mapData.ports || []).slice(0, 5).map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Anchor size={12} color="var(--cyan)" />
                    <span style={{ color: '#0f172a', fontWeight: 600 }}>{p.name}</span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>{p.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
