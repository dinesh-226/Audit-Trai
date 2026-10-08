/**
 * Maritime Geographic Coordinates & Port Registry
 */

const PORT_REGISTRY = [
  {
    id: 'PRT-MUM',
    name: 'Mumbai Port (JNPT / Nhava Sheva)',
    code: 'INBOM',
    country: 'India',
    lat: 18.9438,
    lng: 72.8354,
    status: 'Operational & Active',
    berths: 14,
    type: 'Major Container Terminal'
  },
  {
    id: 'PRT-SIN',
    name: 'Singapore Port (PSA Terminal)',
    code: 'SGSIN',
    country: 'Singapore',
    lat: 1.2644,
    lng: 103.8400,
    status: 'Operational & Active',
    berths: 32,
    type: 'Global Transshipment Hub'
  },
  {
    id: 'PRT-DXB',
    name: 'Dubai Port (Jebel Ali Terminal)',
    code: 'AEDXB',
    country: 'UAE',
    lat: 25.0064,
    lng: 55.0600,
    status: 'Operational & Active',
    berths: 22,
    type: 'Middle East Gateway'
  },
  {
    id: 'PRT-SHA',
    name: 'Shanghai Port (Yangshan Deepwater)',
    code: 'CNSHA',
    country: 'China',
    lat: 31.2304,
    lng: 121.4737,
    status: 'Operational & Active',
    berths: 40,
    type: 'Megamax Container Port'
  },
  {
    id: 'PRT-RTM',
    name: 'Rotterdam Port (Europoort Gateway)',
    code: 'NLRTM',
    country: 'Netherlands',
    lat: 51.9244,
    lng: 4.4777,
    status: 'Operational & Active',
    berths: 28,
    type: 'European Gateway'
  },
  {
    id: 'PRT-NYC',
    name: 'Port of New York & New Jersey',
    code: 'USNYC',
    country: 'USA',
    lat: 40.6892,
    lng: -74.0445,
    status: 'Operational & Active',
    berths: 18,
    type: 'North American Hub'
  }
];

const LOCATION_LOOKUP = [
  { match: /mumbai|nhava sheva|jnpt|bombay/i, lat: 18.9438, lng: 72.8354, name: 'Mumbai Port' },
  { match: /singapore/i, lat: 1.2644, lng: 103.8400, name: 'Singapore Port' },
  { match: /dubai|jebel ali|uae/i, lat: 25.0064, lng: 55.0600, name: 'Dubai Port' },
  { match: /shanghai|yangshan/i, lat: 31.2304, lng: 121.4737, name: 'Shanghai Port' },
  { match: /rotterdam|europoort/i, lat: 51.9244, lng: 4.4777, name: 'Rotterdam Port' },
  { match: /new york|nj port|newark/i, lat: 40.6892, lng: -74.0445, name: 'New York Port' },
  { match: /arabian sea/i, lat: 18.9412, lng: 72.8347, name: 'Arabian Sea Corridor' },
  { match: /malacca strait|malacca/i, lat: 3.1390, lng: 101.6869, name: 'Malacca Strait' },
  { match: /suez canal|suez/i, lat: 29.9753, lng: 32.5599, name: 'Suez Canal' },
  { match: /red sea/i, lat: 20.0000, lng: 38.5000, name: 'Red Sea' },
  { match: /bay of bengal/i, lat: 14.5000, lng: 86.5000, name: 'Bay of Bengal' },
  { match: /south china sea/i, lat: 12.0000, lng: 113.0000, name: 'South China Sea' },
  { match: /indian ocean/i, lat: 5.0000, lng: 80.0000, name: 'Indian Ocean' }
];

/**
 * Deterministic hash-based scatter offset to avoid exact stacking
 */
function getOffset(seedStr = '', multiplier = 0.008) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = ((hash << 5) - hash) + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const latOffset = (((Math.abs(hash) % 100) / 100) - 0.5) * multiplier;
  const lngOffset = ((((Math.abs(hash >> 4)) % 100) / 100) - 0.5) * multiplier;
  return { latOffset, lngOffset };
}

/**
 * Resolves latitude and longitude for a given location string or fallback
 */
function resolveGeoCoordinates(locationStr = '', fallbackStr = '', seed = '') {
  const text = `${locationStr || ''} ${fallbackStr || ''}`.trim();
  
  for (const item of LOCATION_LOOKUP) {
    if (item.match.test(text)) {
      const { latOffset, lngOffset } = getOffset(seed || locationStr, 0.015);
      return {
        lat: Number((item.lat + latOffset).toFixed(6)),
        lng: Number((item.lng + lngOffset).toFixed(6)),
        lastUpdated: new Date()
      };
    }
  }

  // Default fallback to Singapore / Mumbai maritime corridor
  const defaultBase = seed.charCodeAt(0) % 2 === 0 ? { lat: 18.9438, lng: 72.8354 } : { lat: 1.2644, lng: 103.8400 };
  const { latOffset, lngOffset } = getOffset(seed, 0.02);
  return {
    lat: Number((defaultBase.lat + latOffset).toFixed(6)),
    lng: Number((defaultBase.lng + lngOffset).toFixed(6)),
    lastUpdated: new Date()
  };
}

module.exports = {
  PORT_REGISTRY,
  LOCATION_LOOKUP,
  resolveGeoCoordinates,
  getOffset
};
