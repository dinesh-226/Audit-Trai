import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
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
  CheckCircle,
  Thermometer,
  Layers,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Globe
} from 'lucide-react';

const TILE_LAYERS = {
  streets: {
    name: 'Google / OSM Standard',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors'
  },
  esri_streets: {
    name: 'Esri World Navigation & Ports',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, HERE, Garmin'
  },
  satellite: {
    name: 'Satellite Hybrid Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics'
  },
  ocean: {
    name: 'Maritime World Ocean Chart',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, GEBCO, NOAA, National Geographic'
  },
  osm_hot: {
    name: 'Humanitarian Clean Topo',
    url: 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors, Humanitarian OpenStreetMap Team'
  }
};

export const LiveTrackingPage = ({ onSelectShip }) => {
  const [mapData, setMapData] = useState({ ports: [], ships: [], containers: [] });
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [mapError, setMapError] = useState('');
  const [activeTileLayer, setActiveTileLayer] = useState('streets');
  const [containerFilter, setContainerFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('leaflet');

  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const tileLayerInstanceRef = useRef(null);
  const markersLayerGroupRef = useRef(null);
  const recordedPositionCount = [
    ...mapData.ships.map(ship => ship.coordinates),
    ...mapData.containers
  ].filter(position => Number.isFinite(position?.lat) && Number.isFinite(position?.lng)).length;

  useEffect(() => {
    fetchMapData();
  }, []);

  useEffect(() => {
    if (viewMode !== 'leaflet' || !leafletMapRef.current) return;
    const positions = [
      ...mapData.ships.map(ship => ship.coordinates),
      ...mapData.containers
    ].filter(position => Number.isFinite(position?.lat) && Number.isFinite(position?.lng));
    if (!positions.length) return;
    const bounds = L.latLngBounds(positions.map(position => [position.lat, position.lng]));
    if (positions.length === 1) leafletMapRef.current.setView(bounds.getCenter(), 8);
    else leafletMapRef.current.fitBounds(bounds.pad(0.15), { maxZoom: 8 });
  }, [mapData, viewMode]);

  const fetchMapData = async () => {
    setMapError('');
    try {
      const data = await api.tracking.getLiveMap();
      const nextData = {
        ports: Array.isArray(data?.ports) ? data.ports : [],
        ships: Array.isArray(data?.ships) ? data.ships : [],
        containers: Array.isArray(data?.containers) ? data.containers : []
      };
      setMapData(nextData);
      setSelectedItem(previous => {
        if (previous?.type === 'ship') {
          const ship = nextData.ships.find(item => item.shipId === previous.data.shipId);
          if (ship) return { type: 'ship', data: ship };
        }
        if (previous?.type === 'container') {
          const container = nextData.containers.find(item => item.containerId === previous.data.containerId);
          if (container) return { type: 'container', data: container };
        }
        return null;
      });
    } catch (e) {
      console.error('Failed to load recorded map data:', e);
      setMapData({ ports: [], ships: [], containers: [] });
      setSelectedItem(null);
      setMapError(e.message || 'Unable to load map data.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (viewMode !== 'leaflet' || !mapContainerRef.current) return;

    // Remove any leftover map instance on hot reload
    if (leafletMapRef.current) {
      try {
        leafletMapRef.current.remove();
      } catch (e) {}
      leafletMapRef.current = null;
    }

    // Clear any previous _leaflet_id on DOM node
    if (mapContainerRef.current._leaflet_id) {
      mapContainerRef.current._leaflet_id = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
        attributionControl: false
      });

      const layerConfig = TILE_LAYERS[activeTileLayer] || TILE_LAYERS.streets;
      const tileLayer = L.tileLayer(layerConfig.url, {
        maxZoom: 19,
        attribution: layerConfig.attribution
      }).addTo(map);

      tileLayerInstanceRef.current = tileLayer;
      markersLayerGroupRef.current = L.layerGroup().addTo(map);
      leafletMapRef.current = map;

      // Invalidate size on timers to ensure tiles render immediately
      setTimeout(() => { if (leafletMapRef.current) leafletMapRef.current.invalidateSize(); }, 100);
      setTimeout(() => { if (leafletMapRef.current) leafletMapRef.current.invalidateSize(); }, 350);
      setTimeout(() => { if (leafletMapRef.current) leafletMapRef.current.invalidateSize(); }, 700);
    } catch (err) {
      console.error('Error initializing Leaflet map:', err);
    }

    return () => {
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.remove();
        } catch (e) {}
        leafletMapRef.current = null;
      }
    };
  }, [viewMode]);

  // Switch Tile Layer
  useEffect(() => {
    if (viewMode !== 'leaflet' || !leafletMapRef.current || !tileLayerInstanceRef.current) return;

    try {
      const layerConfig = TILE_LAYERS[activeTileLayer] || TILE_LAYERS.streets;
      leafletMapRef.current.removeLayer(tileLayerInstanceRef.current);

      const newTileLayer = L.tileLayer(layerConfig.url, {
        maxZoom: 19,
        attribution: layerConfig.attribution
      }).addTo(leafletMapRef.current);

      tileLayerInstanceRef.current = newTileLayer;
    } catch (e) {
      console.error('Error switching tile layer:', e);
    }
  }, [activeTileLayer, viewMode]);

  // Update Markers on Leaflet Map
  useEffect(() => {
    if (viewMode !== 'leaflet' || !leafletMapRef.current || !markersLayerGroupRef.current) return;

    const group = markersLayerGroupRef.current;
    group.clearLayers();

    // 1. Render Major Ports
    (mapData.ports || []).forEach(port => {
      const portIcon = L.divIcon({
        className: 'custom-port-marker',
        html: `
          <div style="
            background: #0f3460;
            color: #ffffff;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #38bdf8;
            box-shadow: 0 4px 10px rgba(0,0,0,0.35);
            cursor: pointer;
            font-size: 14px;
          ">
            ⚓
          </div>
        `,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const marker = L.marker([port.lat, port.lng], { icon: portIcon });
      marker.bindPopup(`
        <div style="font-family: sans-serif; padding: 4px; min-width: 180px;">
          <div style="font-size: 10px; color: #0284c7; font-weight: 800; text-transform: uppercase;">PORT TERMINAL</div>
          <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 2px 0;">${port.name}</div>
          <div style="font-size: 12px; color: #64748b;">Code: <strong>${port.code}</strong> &bull; ${port.country}</div>
          <div style="font-size: 11px; color: #10b981; font-weight: 700; margin-top: 4px;">Status: ${port.status}</div>
        </div>
      `);

      marker.on('click', () => {
        setSelectedItem({ type: 'port', data: port });
      });

      group.addLayer(marker);
    });

    // 2. Render Ships
    (mapData.ships || []).forEach(ship => {
      const isSelected = selectedItem?.type === 'ship' && selectedItem.data.shipId === ship.shipId;
      const shipIcon = L.divIcon({
        className: 'custom-ship-marker',
        html: `
          <div style="
            background: ${ship.status === 'In Transit' ? 'linear-gradient(135deg, #0284c7 0%, #00b4d8 100%)' : '#0f3460'};
            color: #ffffff;
            padding: 4px 8px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            gap: 5px;
            border: ${isSelected ? '2px solid #facc15' : '2px solid #ffffff'};
            box-shadow: 0 4px 14px rgba(2, 132, 199, 0.45);
            cursor: pointer;
            white-space: nowrap;
            font-size: 11px;
            font-weight: 700;
          ">
            <span>🚢</span>
            <span>${ship.name}</span>
            <span style="background: rgba(255,255,255,0.25); padding: 1px 4px; border-radius: 4px; font-size: 9px;">${ship.coordinates?.speedKnots ?? 'Speed n/a'}</span>
          </div>
        `,
        iconSize: [115, 30],
        iconAnchor: [57, 15]
      });

      if (Number.isFinite(ship.coordinates?.lat) && Number.isFinite(ship.coordinates?.lng)) {
        const marker = L.marker([ship.coordinates.lat, ship.coordinates.lng], { icon: shipIcon });
        marker.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px; min-width: 200px;">
            <div style="font-size: 10px; color: #0284c7; font-weight: 800; text-transform: uppercase;">RECORDED VESSEL POSITION</div>
            <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin: 2px 0;">${ship.name}</div>
            <div style="font-size: 11px; color: #64748b;">${ship.imoNumber || 'IMO not recorded'}${ship.flag ? ` &bull; Flag: ${ship.flag}` : ''}</div>
            <div style="font-size: 12px; color: #0369a1; margin: 6px 0; font-weight: 600;">
              ${ship.departurePort} ➔ ${ship.arrivalPort}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #334155; background: #f0f9ff; padding: 6px 8px; border-radius: 6px;">
              <span>Speed: <strong>${ship.coordinates?.speedKnots != null ? `${ship.coordinates.speedKnots} kts` : 'Not recorded'}</strong></span>
              <span>Heading: <strong>${ship.coordinates?.heading ?? 'Not recorded'}${ship.coordinates?.heading != null ? '°' : ''}</strong></span>
            </div>
          </div>
        `);

        marker.on('click', () => {
          setSelectedItem({ type: 'ship', data: ship });
        });

        group.addLayer(marker);
      }
    });

    // 3. Render Containers with Status & Reefer Gauges
    const filteredContainers = (mapData.containers || []).filter(c => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches = c.containerId?.toLowerCase().includes(q) ||
          c.cargoDescription?.toLowerCase().includes(q) ||
          c.ownerCompany?.toLowerCase().includes(q) ||
          c.currentLocation?.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (containerFilter === 'reefer') return c.isReefer;
      if (containerFilter === 'transit') return c.status === 'In Transit';
      if (containerFilter === 'yard') return c.status !== 'In Transit';
      if (containerFilter === 'warning') return c.reeferStatus === 'Warning' || c.reeferStatus === 'Critical' || c.riskLevel !== 'Low';
      return true;
    });

    filteredContainers.forEach(container => {
      const isSelected = selectedItem?.type === 'container' && selectedItem.data.containerId === container.containerId;
      
      let badgeColor = '#10b981'; // Normal
      if (container.reeferStatus === 'Warning' || container.riskLevel === 'Medium') badgeColor = '#f59e0b';
      if (container.reeferStatus === 'Critical' || container.reeferStatus === 'On Hold' || container.riskLevel === 'High') badgeColor = '#ef4444';
      if (container.isReefer && container.reeferStatus === 'Normal') badgeColor = '#0284c7';

      const iconHtml = `
        <div style="
          background: #ffffff;
          border: 2px solid ${badgeColor};
          padding: ${container.isReefer ? '3px 8px' : '2px 6px'};
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 4px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
          cursor: pointer;
          font-family: monospace;
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
          white-space: nowrap;
          transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
          transition: transform 0.15s ease;
        ">
          <span style="width: 8px; height: 8px; border-radius: 50%; background: ${badgeColor};"></span>
          <span>${container.containerId}</span>
          ${container.isReefer && container.temperatureCelsius != null ? `
            <span style="background: ${container.temperatureCelsius > -10 ? '#fee2e2' : '#e0f2fe'}; color: ${container.temperatureCelsius > -10 ? '#b91c1c' : '#0369a1'}; padding: 1px 5px; border-radius: 4px; font-size: 10px; font-weight: 800;">
              ${container.temperatureCelsius}°C
            </span>
          ` : ''}
        </div>
      `;

      const containerIcon = L.divIcon({
        className: 'custom-container-marker',
        html: iconHtml,
        iconSize: [container.isReefer ? 120 : 95, 26],
        iconAnchor: [55, 13]
      });

      if (Number.isFinite(container.lat) && Number.isFinite(container.lng)) {
        const marker = L.marker([container.lat, container.lng], { icon: containerIcon });
        
        marker.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px; min-width: 220px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 10px; color: ${badgeColor}; font-weight: 800; text-transform: uppercase;">
                ${container.isReefer ? '❄️ REEFER CONTAINER' : '📦 DRY CONTAINER'}
              </span>
              <span style="background: ${badgeColor}20; color: ${badgeColor}; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800;">
                ${container.status}
              </span>
            </div>
            
            <div style="font-size: 15px; font-weight: 800; color: #0f172a; font-family: monospace;">
              ${container.containerId}
            </div>
            
            <div style="font-size: 12px; color: #475569; margin: 4px 0;">
              ${container.cargoDescription}
            </div>

            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; margin: 6px 0; font-size: 11px;">
              <div>📍 <strong>Location:</strong> ${container.currentLocation}</div>
              ${container.assignedShipName ? `<div>🚢 <strong>Vessel:</strong> ${container.assignedShipName}</div>` : ''}
              <div>🔒 <strong>Seal:</strong> <code>${container.sealNumber || 'Not recorded'}</code></div>
              ${container.isReefer ? `
                <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #e2e8f0; color: #0284c7; font-weight: 700;">
                  🌡️ Temp: <strong>${container.temperatureCelsius ?? 'Not recorded'}${container.temperatureCelsius != null ? '°C' : ''}</strong> (Target: ${container.targetTemperature != null ? `${container.targetTemperature}°C` : 'Not recorded'})
                </div>
              ` : ''}
            </div>
          </div>
        `);

        marker.on('click', () => {
          setSelectedItem({ type: 'container', data: container });
        });

        group.addLayer(marker);
      }
    });

  }, [mapData, containerFilter, searchQuery, selectedItem, viewMode]);

  // Handle Fly-To on search or selection
  const handleFlyTo = (lat, lng, zoom = 10) => {
    if (leafletMapRef.current) {
      leafletMapRef.current.flyTo([lat, lng], zoom, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  };

  const handleSelectContainerFromList = (container) => {
    setSelectedItem({ type: 'container', data: container });
    if (Number.isFinite(container.lat) && Number.isFinite(container.lng)) {
      handleFlyTo(container.lat, container.lng, 12);
    }
  };

  // Convert lat/lng to SVG map coordinates (for tactical mode)
  const mapCoordsToSvg = (lat, lng) => {
    const x = ((lng + 180) / 360) * 1000;
    const y = ((90 - lat) / 180) * 500;
    return { x, y };
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '1440px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Page Header */}
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
            <MapPin size={14} />
            <span>GEO-SPATIAL MARITIME & CONTAINER TRACKING</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px 0' }}>
            Fleet & Container Positions
          </h1>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Recorded vessel coordinates and containers assigned to positioned vessels
          </div>
        </div>

          {/* Map mode and refresh controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Mode Switcher */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <button
              onClick={() => setViewMode('leaflet')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'leaflet' ? '#0f3460' : 'transparent',
                color: viewMode === 'leaflet' ? '#ffffff' : '#64748b',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🗺️ Google/OSM Map
            </button>
            <button
              onClick={() => setViewMode('tactical')}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'tactical' ? '#0f3460' : 'transparent',
                color: viewMode === 'tactical' ? '#ffffff' : '#64748b',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              🌐 Tactical Grid
            </button>
          </div>

          <button
            onClick={fetchMapData}
            className="btn btn-secondary"
            disabled={loading}
          >
            <RotateCw size={14} />
            <span>{loading ? 'Refreshing...' : 'Refresh data'}</span>
          </button>
        </div>
      </div>

      {/* Map Filter Strip & Layer Switcher */}
      <div style={{
        background: '#ffffff',
        borderRadius: '14px',
        padding: '12px 18px',
        border: '1px solid #e2e8f0',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        {/* Left: Search input */}
        <div style={{ position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-control"
            placeholder="Search Container (e.g. MSCU-8829104), Ship, Port..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '34px', fontSize: '13px', background: '#f8fafc' }}
          />
        </div>

        {/* Center: Container Status Filter Chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All (${(mapData.containers?.length || 0) + (mapData.ships?.length || 0)})` },
            { id: 'reefer', label: `❄️ Cold-Chain Reefers (${mapData.containers?.filter(c => c.isReefer).length || 0})` },
            { id: 'transit', label: `🚢 In Transit (${mapData.containers?.filter(c => c.status === 'In Transit').length || 0})` },
            { id: 'yard', label: `📍 Port Yard (${mapData.containers?.filter(c => c.status !== 'In Transit').length || 0})` },
            { id: 'warning', label: `⚠️ Alerts (${mapData.containers?.filter(c => c.reeferStatus === 'Warning' || c.reeferStatus === 'Critical').length || 0})` }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setContainerFilter(f.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                border: '1px solid',
                borderColor: containerFilter === f.id ? '#0284c7' : '#e2e8f0',
                background: containerFilter === f.id ? '#e0f2fe' : '#ffffff',
                color: containerFilter === f.id ? '#0369a1' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Right: Map Layer Switcher (for Leaflet mode) */}
        {viewMode === 'leaflet' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={14} color="#64748b" />
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Map Layer:</span>
            <select
              className="select-control"
              value={activeTileLayer}
              onChange={(e) => setActiveTileLayer(e.target.value)}
              style={{ width: 'auto', fontSize: '12px', padding: '4px 10px', fontWeight: 600, background: '#f8fafc' }}
            >
              {Object.entries(TILE_LAYERS).map(([key, cfg]) => (
                <option key={key} value={key}>{cfg.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Interactive Map & Details Sidebar Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '20px', alignItems: 'start' }}>
        {/* Left: Interactive Map Canvas */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Quick jumps to recorded vessel positions */}
          {mapData.ships.some(ship => Number.isFinite(ship.coordinates?.lat) && Number.isFinite(ship.coordinates?.lng)) && <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 999,
            display: 'flex',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(8px)',
            padding: '6px 10px',
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            border: '1px solid #e2e8f0',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#0f3460', alignSelf: 'center', paddingLeft: '2px' }}>Positioned vessels:</span>
            {mapData.ships.filter(ship => Number.isFinite(ship.coordinates?.lat) && Number.isFinite(ship.coordinates?.lng)).map(ship => (
              <button
                key={ship.shipId}
                onClick={() => handleFlyTo(ship.coordinates.lat, ship.coordinates.lng, 8)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  color: '#0f3460',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {ship.name}
              </button>
            ))}
          </div>}

          {/* Leaflet Map Canvas */}
          {viewMode === 'leaflet' ? (
            <div
              ref={mapContainerRef}
              style={{ width: '100%', height: '620px', minHeight: '620px', background: '#0d1e3d', position: 'relative', zIndex: 1 }}
            />
          ) : (
            /* Tactical SVG Sea Corridor Map View */
            <div style={{
              background: 'radial-gradient(ellipse at center, #0f2b48 0%, #081627 100%)',
              height: '620px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <svg viewBox="0 0 1000 500" style={{ width: '100%', height: '100%' }}>
                {/* Ocean Grid Lines */}
                <defs>
                  <pattern id="tacticalGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="1000" height="500" fill="url(#tacticalGrid)" />

                {/* Ports */}
                {(mapData.ports || []).map((port) => {
                  const { x, y } = mapCoordsToSvg(port.lat, port.lng);
                  return (
                    <g key={port.id} transform={`translate(${x}, ${y})`} style={{ cursor: 'pointer' }} onClick={() => setSelectedItem({ type: 'port', data: port })}>
                      <circle r="8" fill="#0f3460" stroke="#38bdf8" strokeWidth="2" />
                      <circle r="3" fill="#38bdf8" />
                      <text x="12" y="4" fill="#f8fafc" fontSize="11" fontWeight="700" fontFamily="sans-serif">{port.name}</text>
                    </g>
                  );
                })}

                {/* Ships */}
                {(mapData.ships || []).map((ship) => {
                  if (!Number.isFinite(ship.coordinates?.lat) || !Number.isFinite(ship.coordinates?.lng)) return null;
                  const { x, y } = mapCoordsToSvg(ship.coordinates.lat, ship.coordinates.lng);
                  return (
                    <g key={ship.shipId} transform={`translate(${x}, ${y})`} style={{ cursor: 'pointer' }} onClick={() => setSelectedItem({ type: 'ship', data: ship })}>
                      <circle r="14" fill="rgba(2, 132, 199, 0.3)" />
                      <circle r="6" fill="#38bdf8" />
                      <text x="10" y="-8" fill="#38bdf8" fontSize="11" fontWeight="800" fontFamily="sans-serif">🚢 {ship.name}</text>
                    </g>
                  );
                })}

                {/* Containers */}
                {(mapData.containers || []).map((c) => {
                  if (!Number.isFinite(c.lat) || !Number.isFinite(c.lng)) return null;
                  const { x, y } = mapCoordsToSvg(c.lat, c.lng);
                  const color = c.isReefer ? '#38bdf8' : '#10b981';
                  return (
                    <g key={c.containerId} transform={`translate(${x}, ${y})`} style={{ cursor: 'pointer' }} onClick={() => setSelectedItem({ type: 'container', data: c })}>
                      <rect x="-6" y="-6" width="12" height="12" rx="3" fill="#ffffff" stroke={color} strokeWidth="2" />
                      <text x="8" y="4" fill="#f8fafc" fontSize="10" fontFamily="monospace" fontWeight="700">{c.containerId}</text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {(mapError || (!loading && recordedPositionCount === 0)) && (
            <div
              role={mapError ? 'alert' : 'status'}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 500,
                width: 'min(440px, calc(100% - 32px))',
                padding: '18px 20px',
                textAlign: 'center',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                boxShadow: '0 4px 18px rgba(15, 23, 42, 0.14)',
                color: '#475569'
              }}
            >
              <div style={{ fontWeight: 800, color: mapError ? '#991b1b' : '#0f172a', marginBottom: '4px' }}>
                {mapError ? 'Map data unavailable' : mapData.ships.length + mapData.containers.length === 0 ? 'No vessel or container records' : 'No coordinates recorded'}
              </div>
              <div style={{ fontSize: '12px' }}>
                {mapError || (mapData.ships.length + mapData.containers.length === 0
                  ? 'Add vessels or containers to see them here.'
                  : 'The stored records do not include any vessel GPS positions yet.')}
              </div>
              {mapError && <button onClick={fetchMapData} className="btn btn-secondary btn-sm" style={{ marginTop: '10px' }}>Retry</button>}
            </div>
          )}

          {/* Map Legend Footer */}
          <div style={{
            padding: '12px 18px',
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: '#64748b',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} /> Normal Container
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} /> ❄️ Cold-Chain Reefer
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} /> Warning
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} /> Critical / On Hold
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '13px' }}>🚢</span> Positioned vessel
              </span>
            </div>

            <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>
              {mapData.ships.filter(ship => ship.coordinates).length} positioned vessels; {mapData.containers.filter(container => Number.isFinite(container.lat) && Number.isFinite(container.lng)).length} positioned containers
            </div>
          </div>
        </div>

        {/* Right: Selected Entity Telemetry Inspector Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {selectedItem?.type === 'container' && selectedItem.data ? (
            /* Container Details Card */
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '22px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: selectedItem.data.isReefer ? '#0284c7' : '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {selectedItem.data.isReefer ? '❄️ REFRIGERATED CONTAINER' : '📦 DRY CONTAINER'}
                  </span>
                  <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                    {selectedItem.data.containerId}
                  </h3>
                </div>

                <span style={{
                  background: selectedItem.data.status === 'In Transit' ? '#e0f2fe' : selectedItem.data.status === 'Quarantine Hold' ? '#fee2e2' : '#f0fdf4',
                  color: selectedItem.data.status === 'In Transit' ? '#0369a1' : selectedItem.data.status === 'Quarantine Hold' ? '#991b1b' : '#15803d',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 800
                }}>
                  {selectedItem.data.status}
                </span>
              </div>

              {/* Reefer Temperature Banner if Reefer */}
              {selectedItem.data.isReefer && (
                <div style={{
                  background: selectedItem.data.temperatureCelsius > -10 ? '#fef2f2' : '#f0f9ff',
                  border: `1px solid ${selectedItem.data.temperatureCelsius > -10 ? '#fecaca' : '#bae6fd'}`,
                  borderRadius: '12px',
                  padding: '14px',
                  marginBottom: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Recorded Reefer Reading</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: selectedItem.data.temperatureCelsius > -10 ? '#b91c1c' : '#0369a1' }}>
                      {selectedItem.data.temperatureCelsius ?? 'Not recorded'}{selectedItem.data.temperatureCelsius != null ? '°C' : ''}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      Target: <strong>{selectedItem.data.targetTemperature ?? 'Not recorded'}{selectedItem.data.targetTemperature != null ? '°C' : ''}</strong>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{
                      background: selectedItem.data.reeferStatus === 'Normal' ? '#dcfce7' : '#fee2e2',
                      color: selectedItem.data.reeferStatus === 'Normal' ? '#15803d' : '#991b1b',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 800
                    }}>
                      {selectedItem.data.reeferStatus || 'Not recorded'}
                    </span>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      Power: {selectedItem.data.powerStatus || 'Not recorded'}
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata Grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Cargo:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedItem.data.cargoDescription}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Type & Size:</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>{selectedItem.data.type} ({selectedItem.data.size})</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Current Location:</span>
                  <span style={{ color: '#0284c7', fontWeight: 700 }}>{selectedItem.data.currentLocation}</span>
                </div>

                {selectedItem.data.assignedShipName && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b' }}>Assigned Vessel:</span>
                    <strong style={{ color: '#0f172a' }}>🚢 {selectedItem.data.assignedShipName}</strong>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Security Bolt Seal:</span>
                  <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                    {selectedItem.data.sealNumber || 'Not recorded'}
                  </code>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Risk Evaluation:</span>
                  <span className={`badge ${selectedItem.data.riskLevel === 'Low' ? 'badge-green' : selectedItem.data.riskLevel === 'High' ? 'badge-red' : 'badge-amber'}`}>
                    {selectedItem.data.riskLevel} ({selectedItem.data.riskScore}/100)
                  </span>
                </div>
              </div>

              {/* Quick Jump Action */}
              <div style={{ marginTop: '18px', display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleFlyTo(selectedItem.data.lat, selectedItem.data.lng, 14)}
                  disabled={!Number.isFinite(selectedItem.data.lat) || !Number.isFinite(selectedItem.data.lng)}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <ZoomIn size={14} /> Focus on Map
                </button>
              </div>
            </div>
          ) : selectedItem?.type === 'ship' && selectedItem.data ? (
            /* Vessel Details Card */
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '22px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    RECORDED VESSEL POSITION
                  </span>
                  <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                    {selectedItem.data.name}
                  </h3>
                </div>

                <span style={{
                  background: selectedItem.data.status === 'In Transit' ? '#dcfce7' : '#f1f5f9',
                  color: selectedItem.data.status === 'In Transit' ? '#15803d' : '#475569',
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 800
                }}>
                  {selectedItem.data.status}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>IMO Number:</span>
                  <code>{selectedItem.data.imoNumber}</code>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Master:</span>
                  <strong>{selectedItem.data.captain}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Voyage Route:</span>
                  <span style={{ color: '#0369a1', fontWeight: 700 }}>
                    {selectedItem.data.departurePort} ➔ {selectedItem.data.arrivalPort}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Speed & Heading:</span>
                  <strong>
                    {selectedItem.data.coordinates?.speedKnots ?? 'Speed not recorded'}
                    {selectedItem.data.coordinates?.speedKnots != null ? ' kts' : ''}
                    {selectedItem.data.coordinates?.heading != null ? ` (${selectedItem.data.coordinates.heading}°)` : ''}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Onboard Containers:</span>
                  <strong style={{ color: '#0284c7' }}>{selectedItem.data.containersOnboardCount || 0} Units</strong>
                </div>
              </div>

              <div style={{ marginTop: '18px' }}>
                <button
                  onClick={() => handleFlyTo(selectedItem.data.coordinates?.lat, selectedItem.data.coordinates?.lng, 10)}
                  disabled={!Number.isFinite(selectedItem.data.coordinates?.lat) || !Number.isFinite(selectedItem.data.coordinates?.lng)}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <ZoomIn size={14} /> Center Vessel on Map
                </button>
              </div>
            </div>
          ) : (
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #e2e8f0',
              textAlign: 'center',
              color: '#64748b'
            }}>
              <MapPin size={32} color="#0284c7" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 700, color: '#0f172a' }}>Select any entity on the map</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Click on any container, vessel, or port terminal marker to inspect live coordinates and telemetry.
              </div>
            </div>
          )}

          {/* Quick Container List for Instant Navigation */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '18px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
            maxHeight: '280px',
            overflowY: 'auto'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '10px' }}>
              Quick Container Telemetry List ({mapData.containers?.length || 0})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(mapData.containers || []).slice(0, 8).map(c => (
                <div
                  key={c.containerId}
                  onClick={() => handleSelectContainerFromList(c)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: selectedItem?.data?.containerId === c.containerId ? '#e0f2fe' : '#f8fafc',
                    border: '1px solid',
                    borderColor: selectedItem?.data?.containerId === c.containerId ? '#bae6fd' : '#e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '12px', fontFamily: 'monospace', color: '#0f172a' }}>{c.containerId}</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{c.cargoDescription}</div>
                  </div>
                  {c.isReefer && c.temperatureCelsius != null ? (
                    <span style={{ fontSize: '11px', fontWeight: 800, color: c.temperatureCelsius > -10 ? '#b91c1c' : '#0369a1' }}>
                      {c.temperatureCelsius}°C
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#64748b' }}>{c.status}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingPage;
