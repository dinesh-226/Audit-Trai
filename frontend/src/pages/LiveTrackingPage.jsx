import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  MapPin,
  Ship,
  Radio,
  Play,
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

const CLIENT_PORT_REGISTRY = [
  { id: 'PRT-MUM', name: 'Mumbai Port (JNPT)', code: 'INBOM', country: 'India', lat: 18.9438, lng: 72.8354, status: 'Active Terminal' },
  { id: 'PRT-SIN', name: 'Singapore Port', code: 'SGSIN', country: 'Singapore', lat: 1.2644, lng: 103.8400, status: 'Active Hub' },
  { id: 'PRT-DXB', name: 'Dubai Port (Jebel Ali)', code: 'AEDXB', country: 'UAE', lat: 25.0064, lng: 55.0600, status: 'Active Gateway' },
  { id: 'PRT-SHA', name: 'Shanghai Port', code: 'CNSHA', country: 'China', lat: 31.2304, lng: 121.4737, status: 'Active Port' },
  { id: 'PRT-RTM', name: 'Rotterdam Port', code: 'NLRTM', country: 'Netherlands', lat: 51.9244, lng: 4.4777, status: 'Active Gateway' },
  { id: 'PRT-NYC', name: 'New York Port', code: 'USNYC', country: 'USA', lat: 40.6892, lng: -74.0445, status: 'Active Hub' }
];

function resolveClientCoordinates(locationStr = '', fallback = '', seed = '') {
  const text = `${locationStr || ''} ${fallback || ''}`.toLowerCase();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash) + seed.charCodeAt(i);
  const offsetLat = (((Math.abs(hash) % 100) / 100) - 0.5) * 0.015;
  const offsetLng = ((((Math.abs(hash >> 4)) % 100) / 100) - 0.5) * 0.015;

  if (text.includes('mumbai') || text.includes('nhava') || text.includes('jnpt') || text.includes('bombay')) {
    return { lat: 18.9438 + offsetLat, lng: 72.8354 + offsetLng };
  }
  if (text.includes('singapore')) {
    return { lat: 1.2644 + offsetLat, lng: 103.8400 + offsetLng };
  }
  if (text.includes('dubai') || text.includes('jebel')) {
    return { lat: 25.0064 + offsetLat, lng: 55.0600 + offsetLng };
  }
  if (text.includes('shanghai')) {
    return { lat: 31.2304 + offsetLat, lng: 121.4737 + offsetLng };
  }
  if (text.includes('rotterdam')) {
    return { lat: 51.9244 + offsetLat, lng: 4.4777 + offsetLng };
  }
  if (text.includes('new york') || text.includes('newark')) {
    return { lat: 40.6892 + offsetLat, lng: -74.0445 + offsetLng };
  }
  if (text.includes('arabian sea')) {
    return { lat: 18.9412 + offsetLat, lng: 72.8347 + offsetLng };
  }
  if (text.includes('malacca')) {
    return { lat: 3.1390 + offsetLat, lng: 101.6869 + offsetLng };
  }
  
  const base = ((seed.charCodeAt(0) || 0) % 2 === 0) ? { lat: 18.9438, lng: 72.8354 } : { lat: 1.2644, lng: 103.8400 };
  return { lat: base.lat + offsetLat, lng: base.lng + offsetLng };
}

export const LiveTrackingPage = ({ onSelectShip, onOpenShipModal, onOpenContainerModal, refreshKey }) => {
  const { hasRole } = useAuth();
  const [mapData, setMapData] = useState({ ports: CLIENT_PORT_REGISTRY, ships: [], containers: [] });
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [mapError, setMapError] = useState('');
  const [activeTileLayer, setActiveTileLayer] = useState('streets');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'ships' | 'containers' | 'reefer' | 'ports' | 'alerts'
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('leaflet');
  const [sidebarTab, setSidebarTab] = useState('ships'); // 'ships' | 'containers'

  const mapContainerRef = useRef(null);
  const leafletMapRef = useRef(null);
  const tileLayerInstanceRef = useRef(null);
  const markersLayerGroupRef = useRef(null);

  useEffect(() => {
    fetchMapData();
  }, [refreshKey]);

  useEffect(() => {
    if (viewMode !== 'leaflet' || !leafletMapRef.current) return;
    const positions = [
      ...mapData.ships.map(s => s.coordinates).filter(c => c && !isNaN(Number(c.lat)) && !isNaN(Number(c.lng))),
      ...mapData.containers.map(c => ({ lat: Number(c.lat), lng: Number(c.lng) })).filter(c => !isNaN(c.lat) && !isNaN(c.lng)),
      ...mapData.ports.map(p => ({ lat: Number(p.lat), lng: Number(p.lng) }))
    ];
    if (!positions.length) return;
    const bounds = L.latLngBounds(positions.map(p => [Number(p.lat), Number(p.lng)]));
    if (positions.length === 1) leafletMapRef.current.setView(bounds.getCenter(), 8);
    else leafletMapRef.current.fitBounds(bounds.pad(0.15), { maxZoom: 8 });
  }, [mapData, viewMode]);

  const fetchMapData = async () => {
    setMapError('');
    try {
      const data = await api.tracking.getLiveMap();
      const rawPorts = Array.isArray(data?.ports) && data.ports.length > 0 ? data.ports : CLIENT_PORT_REGISTRY;

      const rawShips = (Array.isArray(data?.ships) ? data.ships : []).map(s => {
        let coords = s.coordinates;
        const valid = coords &&
          !isNaN(Number(coords.lat)) &&
          !isNaN(Number(coords.lng)) &&
          !(Number(coords.lat) === 0 && Number(coords.lng) === 0);

        if (!valid) {
          coords = resolveClientCoordinates(s.currentLocation, `${s.departurePort || ''} ${s.arrivalPort || ''}`, s.shipId || s.name);
        } else {
          coords = {
            lat: Number(coords.lat),
            lng: Number(coords.lng),
            heading: coords.heading ?? (s.status === 'In Transit' ? 142 : 0),
            speedKnots: coords.speedKnots ?? (s.status === 'In Transit' ? 18.5 : 0.0),
            lastUpdated: coords.lastUpdated || new Date()
          };
        }
        return {
          ...s,
          coordinates: coords
        };
      });

      const rawContainers = (Array.isArray(data?.containers) ? data.containers : []).map((c, idx) => {
        let lat = Number(c.lat);
        let lng = Number(c.lng);
        const valid = !isNaN(lat) && !isNaN(lng) && !(lat === 0 && lng === 0);

        if (!valid) {
          const assignedShip = rawShips.find(s => s.shipId === c.assignedShipId);
          if (assignedShip && assignedShip.coordinates && (c.status === 'Loaded' || c.status === 'In Transit')) {
            const hash = (c.containerId || '').charCodeAt(0) || idx;
            lat = Number((Number(assignedShip.coordinates.lat) + ((hash % 5) - 2) * 0.005).toFixed(6));
            lng = Number((Number(assignedShip.coordinates.lng) + (((hash >> 2) % 5) - 2) * 0.005).toFixed(6));
          } else {
            const resolved = resolveClientCoordinates(c.currentLocation, `${c.origin || ''} ${c.destination || ''}`, c.containerId || `C-${idx}`);
            lat = resolved.lat;
            lng = resolved.lng;
          }
        }

        return {
          ...c,
          lat,
          lng
        };
      });

      const nextData = {
        ports: rawPorts,
        ships: rawShips,
        containers: rawContainers
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
      setMapData({ ports: CLIENT_PORT_REGISTRY, ships: [], containers: [] });
      setSelectedItem(null);
      setMapError(e.message || 'Unable to load map data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateStep = async () => {
    setSimulating(true);
    try {
      await api.tracking.simulateStep();
      await fetchMapData();
    } catch (err) {
      console.warn('Simulation error:', err.message);
      // Client-side nudge in-transit vessels
      setMapData(prev => ({
        ...prev,
        ships: prev.ships.map(s => {
          if (s.status === 'In Transit' && s.coordinates) {
            const headingRad = ((s.coordinates.heading || 140) * Math.PI) / 180;
            return {
              ...s,
              coordinates: {
                ...s.coordinates,
                lat: Number((Number(s.coordinates.lat) + Math.cos(headingRad) * 0.08).toFixed(6)),
                lng: Number((Number(s.coordinates.lng) + Math.sin(headingRad) * 0.08).toFixed(6)),
                speedKnots: Number((18.0 + Math.random() * 2).toFixed(1))
              }
            };
          }
          return s;
        })
      }));
    } finally {
      setSimulating(false);
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (viewMode !== 'leaflet' || !mapContainerRef.current) return;

    if (leafletMapRef.current) {
      try {
        leafletMapRef.current.remove();
      } catch (e) {}
      leafletMapRef.current = null;
    }

    if (mapContainerRef.current._leaflet_id) {
      mapContainerRef.current._leaflet_id = null;
    }

    try {
      const map = L.map(mapContainerRef.current, {
        center: [20, 75],
        zoom: 3,
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

    const showPorts = activeFilter === 'all' || activeFilter === 'ports';
    const showShips = activeFilter === 'all' || activeFilter === 'ships' || activeFilter === 'transit';
    const showContainers = activeFilter === 'all' || activeFilter === 'containers' || activeFilter === 'reefer' || activeFilter === 'yard' || activeFilter === 'alerts';

    // 1. Render Major Ports
    if (showPorts) {
      (mapData.ports || []).forEach(port => {
        const pLat = Number(port.lat);
        const pLng = Number(port.lng);
        if (isNaN(pLat) || isNaN(pLng)) return;

        const portIcon = L.divIcon({
          className: 'custom-port-marker',
          html: `
            <div style="
              background: #0f3460;
              color: #ffffff;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2px solid #38bdf8;
              box-shadow: 0 4px 12px rgba(0,0,0,0.4);
              cursor: pointer;
              font-size: 15px;
            ">
              ⚓
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([pLat, pLng], { icon: portIcon, zIndexOffset: 200 });
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
    }

    // 2. Render Ships (High Visibility, Glowing, High zIndex)
    if (showShips) {
      const filteredShips = (mapData.ships || []).filter(ship => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const match = ship.name?.toLowerCase().includes(q) ||
            ship.imoNumber?.toLowerCase().includes(q) ||
            ship.captain?.toLowerCase().includes(q) ||
            ship.currentLocation?.toLowerCase().includes(q);
          if (!match) return false;
        }
        return true;
      });

      filteredShips.forEach(ship => {
        const sLat = Number(ship.coordinates?.lat);
        const sLng = Number(ship.coordinates?.lng);
        if (isNaN(sLat) || isNaN(sLng)) return;

        const isSelected = selectedItem?.type === 'ship' && selectedItem.data.shipId === ship.shipId;
        const isInTransit = ship.status === 'In Transit';

        const shipIcon = L.divIcon({
          className: 'custom-ship-marker',
          html: `
            <div style="
              background: ${isInTransit ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : '#0f3460'};
              color: #ffffff;
              padding: 6px 12px;
              border-radius: 20px;
              display: flex;
              align-items: center;
              gap: 7px;
              border: ${isSelected ? '3px solid #facc15' : '2px solid #ffffff'};
              box-shadow: 0 4px 20px ${isInTransit ? 'rgba(2, 132, 199, 0.6)' : 'rgba(15, 52, 96, 0.5)'};
              cursor: pointer;
              white-space: nowrap;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              font-size: 12px;
              font-weight: 800;
              letter-spacing: 0.3px;
              transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
              transition: transform 0.15s ease;
            ">
              <span style="font-size: 14px;">🚢</span>
              <span>${ship.name}</span>
              <span style="
                background: ${isInTransit ? '#10b981' : 'rgba(255,255,255,0.25)'};
                color: #ffffff;
                padding: 1px 6px;
                border-radius: 10px;
                font-size: 10px;
                font-weight: 700;
              ">
                ${isInTransit ? `${ship.coordinates?.speedKnots || 18.5} kts` : ship.status}
              </span>
            </div>
          `,
          iconSize: [160, 36],
          iconAnchor: [80, 18]
        });

        const marker = L.marker([sLat, sLng], { icon: shipIcon, zIndexOffset: 2000 });
        marker.bindPopup(`
          <div style="font-family: sans-serif; padding: 6px; min-width: 220px;">
            <div style="font-size: 10px; color: #0284c7; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">ACTIVE VESSEL AIS RECORD</div>
            <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin: 3px 0;">🚢 ${ship.name}</div>
            <div style="font-size: 11px; color: #64748b;">${ship.imoNumber || 'IMO not recorded'}${ship.flag ? ` &bull; Flag: ${ship.flag}` : ''}</div>
            <div style="font-size: 13px; color: #0369a1; margin: 8px 0; font-weight: 700;">
              ${ship.departurePort} ➔ ${ship.arrivalPort}
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 11px; color: #334155; background: #f0f9ff; padding: 6px 10px; border-radius: 6px;">
              <span>Speed: <strong>${ship.coordinates?.speedKnots != null ? `${ship.coordinates.speedKnots} kts` : '18.5 kts'}</strong></span>
              <span>Status: <strong style="color: ${isInTransit ? '#16a34a' : '#0369a1'};">${ship.status}</strong></span>
            </div>
          </div>
        `);

        marker.on('click', () => {
          setSelectedItem({ type: 'ship', data: ship });
        });

        group.addLayer(marker);
      });
    }

    // 3. Render Containers with Status & Reefer Gauges
    if (showContainers) {
      const filteredContainers = (mapData.containers || []).filter(c => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matches = c.containerId?.toLowerCase().includes(q) ||
            c.cargoDescription?.toLowerCase().includes(q) ||
            c.ownerCompany?.toLowerCase().includes(q) ||
            c.currentLocation?.toLowerCase().includes(q);
          if (!matches) return false;
        }

        if (activeFilter === 'reefer') return c.isReefer;
        if (activeFilter === 'yard') return c.status !== 'In Transit';
        if (activeFilter === 'alerts') return c.reeferStatus === 'Warning' || c.reeferStatus === 'Critical' || c.riskLevel !== 'Low';
        return true;
      });

      filteredContainers.forEach(container => {
        const cLat = Number(container.lat);
        const cLng = Number(container.lng);
        if (isNaN(cLat) || isNaN(cLng)) return;

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
          iconSize: [container.isReefer ? 130 : 100, 28],
          iconAnchor: [60, 14]
        });

        const marker = L.marker([cLat, cLng], { icon: containerIcon, zIndexOffset: 800 });
        
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
      });
    }

  }, [mapData, activeFilter, searchQuery, selectedItem, viewMode]);

  // Handle Fly-To on search or selection
  const handleFlyTo = (lat, lng, zoom = 10) => {
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (!isNaN(numLat) && !isNaN(numLng) && leafletMapRef.current) {
      leafletMapRef.current.flyTo([numLat, numLng], zoom, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  };

  const handleSelectShipFromList = (ship) => {
    setSelectedItem({ type: 'ship', data: ship });
    if (ship.coordinates && !isNaN(Number(ship.coordinates.lat)) && !isNaN(Number(ship.coordinates.lng))) {
      handleFlyTo(Number(ship.coordinates.lat), Number(ship.coordinates.lng), 10);
    }
  };

  const handleSelectContainerFromList = (container) => {
    setSelectedItem({ type: 'container', data: container });
    if (!isNaN(Number(container.lat)) && !isNaN(Number(container.lng))) {
      handleFlyTo(Number(container.lat), Number(container.lng), 12);
    }
  };

  // Convert lat/lng to SVG map coordinates (for tactical mode)
  const mapCoordsToSvg = (lat, lng) => {
    const numLat = Number(lat);
    const numLng = Number(lng);
    const x = ((numLng + 180) / 360) * 1000;
    const y = ((90 - numLat) / 180) * 500;
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
            <span>GEO-SPATIAL MARITIME & VESSEL TRACKING</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '4px 0 2px 0' }}>
            Live Vessel & Container Fleet Map
          </h1>
          <div style={{ fontSize: '13px', color: '#64748b' }}>
            Real-time AIS vessel locations, ocean corridors, and container telemetry
          </div>
        </div>

        {/* Map mode and simulation controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleSimulateStep}
            className="btn btn-primary"
            disabled={simulating || loading}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '7px 14px', background: 'linear-gradient(135deg, #0284c7 0%, #0f3460 100%)' }}
          >
            <Play size={14} />
            <span>{simulating ? 'Simulating AIS Step...' : '⚡ Simulate Vessel Movement'}</span>
          </button>

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
            <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
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
        <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
          <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="input-control"
            placeholder="Search Ship (Ocean), Container (HLCU-001)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '34px', fontSize: '13px', background: '#f8fafc' }}
          />
        </div>

        {/* Center: Category Filter Chips */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All (${(mapData.ships?.length || 0) + (mapData.containers?.length || 0) + (mapData.ports?.length || 0)})` },
            { id: 'ships', label: `🚢 Ships & Vessels (${mapData.ships?.length || 0})` },
            { id: 'containers', label: `📦 Containers (${mapData.containers?.length || 0})` },
            { id: 'reefer', label: `❄️ Cold-Chain Reefers (${mapData.containers?.filter(c => c.isReefer).length || 0})` },
            { id: 'ports', label: `⚓ Ports (${mapData.ports?.length || 0})` },
            { id: 'alerts', label: `⚠️ Alerts (${mapData.containers?.filter(c => c.reeferStatus === 'Warning' || c.reeferStatus === 'Critical').length || 0})` }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
                border: '1px solid',
                borderColor: activeFilter === f.id ? '#0284c7' : '#e2e8f0',
                background: activeFilter === f.id ? '#e0f2fe' : '#ffffff',
                color: activeFilter === f.id ? '#0369a1' : '#475569',
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 390px', gap: '20px', alignItems: 'start' }}>
        {/* Left: Interactive Map Canvas */}
        <div style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
          overflow: 'hidden',
          position: 'relative'
        }}>
          {/* Quick jump pill bar for vessels */}
          {mapData.ships.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              zIndex: 999,
              display: 'flex',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(8px)',
              padding: '6px 12px',
              borderRadius: '10px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
              border: '1px solid #e2e8f0',
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#0f3460' }}>Focus Vessel:</span>
              {mapData.ships.map(ship => (
                <button
                  key={ship.shipId}
                  onClick={() => handleSelectShipFromList(ship)}
                  style={{
                    background: selectedItem?.data?.shipId === ship.shipId ? '#0284c7' : '#ffffff',
                    border: '1px solid #cbd5e1',
                    color: selectedItem?.data?.shipId === ship.shipId ? '#ffffff' : '#0f3460',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  🚢 {ship.name}
                </button>
              ))}
            </div>
          )}

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
                      <text x="12" y="4" fill="#f8fafc" fontSize="11" fontWeight="700" fontFamily="sans-serif">⚓ {port.name}</text>
                    </g>
                  );
                })}

                {/* Ships */}
                {(mapData.ships || []).map((ship) => {
                  const sLat = Number(ship.coordinates?.lat);
                  const sLng = Number(ship.coordinates?.lng);
                  if (isNaN(sLat) || isNaN(sLng)) return null;
                  const { x, y } = mapCoordsToSvg(sLat, sLng);
                  return (
                    <g key={ship.shipId} transform={`translate(${x}, ${y})`} style={{ cursor: 'pointer' }} onClick={() => setSelectedItem({ type: 'ship', data: ship })}>
                      <circle r="16" fill="rgba(2, 132, 199, 0.35)" />
                      <circle r="7" fill="#38bdf8" />
                      <text x="12" y="-8" fill="#38bdf8" fontSize="12" fontWeight="800" fontFamily="sans-serif">🚢 {ship.name}</text>
                    </g>
                  );
                })}

                {/* Containers */}
                {(mapData.containers || []).map((c) => {
                  const cLat = Number(c.lat);
                  const cLng = Number(c.lng);
                  if (isNaN(cLat) || isNaN(cLng)) return null;
                  const { x, y } = mapCoordsToSvg(cLat, cLng);
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
                <span style={{ fontSize: '14px' }}>🚢</span> <strong>Vessels ({mapData.ships.length})</strong>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#10b981' }} /> Normal Containers
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#0284c7' }} /> ❄️ Cold-Chain Reefers
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#ef4444' }} /> Alerts / On Hold
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '13px' }}>⚓</span> Ports ({mapData.ports.length})
              </span>
            </div>

            <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700 }}>
              Live AIS & GPS Position Stream Active
            </div>
          </div>
        </div>

        {/* Right: Selected Entity Telemetry Inspector Panel + Fleet List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {selectedItem?.type === 'ship' && selectedItem.data ? (
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
                    CARGO VESSEL POSITION
                  </span>
                  <h3 style={{ margin: '2px 0 0 0', fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>
                    🚢 {selectedItem.data.name}
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
                  <span style={{ color: '#64748b' }}>Captain:</span>
                  <strong>{selectedItem.data.captain}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Route:</span>
                  <span style={{ color: '#0369a1', fontWeight: 700 }}>
                    {selectedItem.data.departurePort} ➔ {selectedItem.data.arrivalPort}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>GPS Coordinates:</span>
                  <code style={{ color: '#0f172a', fontWeight: 600 }}>
                    {selectedItem.data.coordinates?.lat?.toFixed?.(4) ?? selectedItem.data.coordinates?.lat}°N, {selectedItem.data.coordinates?.lng?.toFixed?.(4) ?? selectedItem.data.coordinates?.lng}°E
                  </code>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Speed & Heading:</span>
                  <strong>
                    {selectedItem.data.coordinates?.speedKnots ?? '18.5'} kts ({selectedItem.data.coordinates?.heading ?? '142'}°)
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#64748b' }}>Onboard Containers:</span>
                  <strong style={{ color: '#0284c7' }}>{selectedItem.data.containersOnboardCount || 0} Units</strong>
                </div>
              </div>

              <div style={{ marginTop: '18px', display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleFlyTo(selectedItem.data.coordinates?.lat, selectedItem.data.coordinates?.lng, 10)}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <ZoomIn size={14} /> Center Vessel
                </button>
                {onSelectShip && (
                  <button
                    onClick={() => onSelectShip(selectedItem.data)}
                    className="btn btn-secondary btn-sm"
                  >
                    View Details
                  </button>
                )}
              </div>
            </div>
          ) : selectedItem?.type === 'container' && selectedItem.data ? (
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
                      {selectedItem.data.reeferStatus || 'Normal'}
                    </span>
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
                    {selectedItem.data.sealNumber || 'Verified'}
                  </code>
                </div>
              </div>

              {/* Quick Jump Action */}
              <div style={{ marginTop: '18px', display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleFlyTo(selectedItem.data.lat, selectedItem.data.lng, 14)}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <ZoomIn size={14} /> Focus on Map
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
              <Ship size={36} color="#0284c7" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 700, color: '#0f172a' }}>Select a Vessel or Container</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>
                Click any ship marker, container box, or list item below to view live telemetry.
              </div>
            </div>
          )}

          {/* Interactive Sidebar Navigation Tabs */}
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc'
            }}>
              <button
                onClick={() => setSidebarTab('ships')}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: 'none',
                  background: sidebarTab === 'ships' ? '#ffffff' : 'transparent',
                  color: sidebarTab === 'ships' ? '#0f3460' : '#64748b',
                  fontWeight: 800,
                  fontSize: '12px',
                  borderBottom: sidebarTab === 'ships' ? '2px solid #0284c7' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>🚢 Fleet Vessels ({mapData.ships?.length || 0})</span>
              </button>
              <button
                onClick={() => setSidebarTab('containers')}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: 'none',
                  background: sidebarTab === 'containers' ? '#ffffff' : 'transparent',
                  color: sidebarTab === 'containers' ? '#0f3460' : '#64748b',
                  fontWeight: 800,
                  fontSize: '12px',
                  borderBottom: sidebarTab === 'containers' ? '2px solid #0284c7' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>📦 Containers ({mapData.containers?.length || 0})</span>
              </button>
            </div>

            {/* List Body */}
            <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '12px' }}>
              {sidebarTab === 'ships' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(mapData.ships || []).map(ship => (
                    <div
                      key={ship.shipId}
                      onClick={() => handleSelectShipFromList(ship)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: selectedItem?.data?.shipId === ship.shipId ? '#e0f2fe' : '#f8fafc',
                        border: '1px solid',
                        borderColor: selectedItem?.data?.shipId === ship.shipId ? '#0284c7' : '#e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '15px' }}>🚢</span>
                          <strong style={{ fontSize: '13px', color: '#0f172a' }}>{ship.name}</strong>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>({ship.imoNumber || ship.shipId})</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#0369a1', marginTop: '2px', fontWeight: 600 }}>
                          {ship.departurePort} ➔ {ship.arrivalPort}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          background: ship.status === 'In Transit' ? '#dcfce7' : '#f1f5f9',
                          color: ship.status === 'In Transit' ? '#15803d' : '#475569',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: 800
                        }}>
                          {ship.status}
                        </span>
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '3px' }}>
                          {ship.coordinates?.speedKnots != null ? `${ship.coordinates.speedKnots} kts` : '18.5 kts'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(mapData.containers || []).map(c => (
                    <div
                      key={c.containerId}
                      onClick={() => handleSelectContainerFromList(c)}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        background: selectedItem?.data?.containerId === c.containerId ? '#e0f2fe' : '#f8fafc',
                        border: '1px solid',
                        borderColor: selectedItem?.data?.containerId === c.containerId ? '#0284c7' : '#e2e8f0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '12px', fontFamily: 'monospace', color: '#0f172a' }}>{c.containerId}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          {c.cargoDescription && !['none', 'null', 'n/a'].includes(String(c.cargoDescription).trim().toLowerCase())
                            ? c.cargoDescription
                            : c.currentLocation || 'In Transit'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {c.isReefer && c.temperatureCelsius != null ? (
                          <span style={{ fontSize: '11px', fontWeight: 800, color: c.temperatureCelsius > -10 ? '#b91c1c' : '#0369a1' }}>
                            {c.temperatureCelsius}°C
                          </span>
                        ) : (
                          <span style={{
                            background: c.status === 'In Transit' ? '#e0f2fe' : '#f1f5f9',
                            color: c.status === 'In Transit' ? '#0369a1' : '#475569',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700
                          }}>
                            {c.status}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTrackingPage;
