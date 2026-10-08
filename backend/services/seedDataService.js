const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/user');
const Ship = require('../models/Ship');
const Container = require('../models/Container');
const AuditLog = require('../models/AuditLog');
const Inspection = require('../models/Inspection');
const Evidence = require('../models/Evidence');
const Anomaly = require('../models/Anomaly');
const Alert = require('../models/Alert');
const Report = require('../models/Report');
const { computeRecordHash, GENESIS_PREVIOUS_HASH } = require('./auditEngine');

async function seedDatabase(force = false) {
  const existingCount = await Container.countDocuments();
  if (existingCount > 0 && !force) {
    console.log('📦 Database already seeded with maritime data.');
    return;
  }

  console.log('🌊 Seeding authentic 3 Ships, 3 Containers & Indian User dataset...');

  // Clear existing collections completely
  await User.deleteMany({});
  await Ship.deleteMany({});
  await Container.deleteMany({});
  await AuditLog.deleteMany({});
  await Inspection.deleteMany({});
  await Evidence.deleteMany({});
  await Anomaly.deleteMany({});
  await Alert.deleteMany({});
  await Report.deleteMany({});

  const salt = await bcrypt.genSalt(10);
  const defaultPassword = await bcrypt.hash('audit123', salt);

  // 1. Five Indian User Accounts
  const users = await User.insertMany([
    {
      userId: 'USR-001',
      name: 'Capt. Rajesh Menon',
      email: 'admin@auditflow.com',
      password: defaultPassword,
      role: 'admin',
      department: 'Fleet Governance & Cryptographic Security',
      assignedPort: 'Global Central Command',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
    },
    {
      userId: 'USR-002',
      name: 'Sunita Rao',
      email: 'portmanager@auditflow.com',
      password: defaultPassword,
      role: 'port_manager',
      department: 'Mumbai Terminal Operations',
      assignedPort: 'Mumbai Port',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    {
      userId: 'USR-003',
      name: 'Capt. Vikram Sengupta',
      email: 'shipmanager@auditflow.com',
      password: defaultPassword,
      role: 'ship_manager',
      department: 'Marine Vessel Operations',
      assignedPort: 'Singapore Port',
      assignedShipId: 'SH-101',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    {
      userId: 'USR-004',
      name: 'Rahul Sharma',
      email: 'inspector@auditflow.com',
      password: defaultPassword,
      role: 'inspector',
      department: 'Customs & Safety Compliance',
      assignedPort: 'Mumbai Port',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    {
      userId: 'USR-005',
      name: 'Ananya Deshmukh',
      email: 'viewer@auditflow.com',
      password: defaultPassword,
      role: 'viewer',
      department: 'Compliance & Audit Observer',
      assignedPort: 'Nhava Sheva (JNPT) Port',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    }
  ]);

  // 2. Exactly 3 Ships
  const ships = await Ship.insertMany([
    {
      shipId: 'SH-101',
      name: 'MSC Irina',
      imoNumber: 'IMO 9929429',
      type: 'Ultra Large Container Vessel',
      capacityTEU: 24346,
      currentLocation: 'Arabian Sea (18.94°N, 72.83°E)',
      destination: 'Mumbai Port',
      departurePort: 'Singapore Port',
      arrivalPort: 'Mumbai Port',
      status: 'In Transit',
      captain: 'Capt. Vikram Sengupta',
      flag: 'Panama',
      coordinates: {
        lat: 18.9412,
        lng: 72.8347,
        heading: 142,
        speedKnots: 19.4,
        lastUpdated: new Date()
      }
    },
    {
      shipId: 'SH-102',
      name: 'Ever Ace',
      imoNumber: 'IMO 9893890',
      type: 'Second-Generation Triple-E Carrier',
      capacityTEU: 23992,
      currentLocation: 'Malacca Strait (3.13°N, 101.68°E)',
      destination: 'Singapore Port',
      departurePort: 'Shanghai Port',
      arrivalPort: 'Singapore Port',
      status: 'In Transit',
      captain: 'Capt. Suresh Pillai',
      flag: 'Panama',
      coordinates: {
        lat: 3.1390,
        lng: 101.6869,
        heading: 198,
        speedKnots: 18.2,
        lastUpdated: new Date()
      }
    },
    {
      shipId: 'SH-103',
      name: 'CMA CGM Jacques Saadé',
      imoNumber: 'IMO 9839179',
      type: 'LNG Dual-Fuel Megamax Carrier',
      capacityTEU: 23112,
      currentLocation: 'Mumbai Port Berth 4',
      destination: 'Mumbai Port',
      departurePort: 'Dubai Port',
      arrivalPort: 'Mumbai Port',
      status: 'Docked',
      captain: 'Capt. Amitav Ghosh',
      flag: 'France',
      coordinates: {
        lat: 18.9500,
        lng: 72.8500,
        heading: 0,
        speedKnots: 0.0,
        lastUpdated: new Date()
      }
    }
  ]);

  // 3. Cryptographic Audit Trail Builder
  let currentSeq = 1;
  let lastHash = GENESIS_PREVIOUS_HASH;
  const createdAuditLogs = [];

  async function recordBlock(params) {
    const auditId = `AUD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(currentSeq).padStart(4, '0')}`;
    const timestamp = params.timestamp || new Date(Date.now() - (20 - currentSeq) * 3600000);
    const logData = {
      auditId,
      sequenceNumber: currentSeq,
      userId: params.userId || 'USR-001',
      username: params.username || 'Capt. Rajesh Menon',
      userRole: params.userRole || 'admin',
      action: params.action,
      entityType: params.entityType || 'Container',
      entityId: params.entityId,
      containerId: params.containerId || null,
      shipId: params.shipId || null,
      location: params.location || 'Mumbai Port',
      timestamp,
      previousHash: lastHash,
      previousValue: params.previousValue || null,
      newValue: params.newValue || null,
      notes: params.notes || `Cryptographic block #${currentSeq}`
    };

    const computedHash = computeRecordHash({
      previousHash: lastHash,
      sequenceNumber: currentSeq,
      timestamp,
      userId: logData.userId,
      action: logData.action,
      entityType: logData.entityType,
      entityId: logData.entityId,
      previousValue: logData.previousValue,
      newValue: logData.newValue,
      shipId: logData.shipId,
      containerId: logData.containerId,
      location: logData.location
    });
    logData.currentHash = computedHash;
    lastHash = computedHash;
    currentSeq++;

    const doc = await AuditLog.create(logData);
    createdAuditLogs.push(doc);
    return doc;
  }

  // Genesis block
  const block1 = await recordBlock({
    action: 'SYSTEM_LEDGER_INITIALIZED',
    entityType: 'System',
    entityId: 'LEDGER-ROOT-001',
    location: 'Mumbai Central Command',
    newValue: { status: 'INITIALIZED', standard: 'IMO/ISPS SHA-256' },
    notes: 'Cryptographic maritime audit trail initialized'
  });

  // Commissioned vessel block
  const block2 = await recordBlock({
    action: 'VESSEL_FLEET_COMMISSIONED',
    entityType: 'Ship',
    entityId: 'SH-101',
    shipId: 'SH-101',
    location: 'Singapore Port',
    newValue: { name: 'MSC Irina', imo: 'IMO 9929429', captain: 'Capt. Vikram Sengupta' }
  });

  // 4. Exactly 3 Containers

  // Container 1: ONEU-8821094 (In Transit on MSC Irina)
  const c1Book = await recordBlock({
    userId: 'USR-002',
    username: 'Sunita Rao',
    userRole: 'port_manager',
    action: 'CONTAINER_BOOKED',
    entityType: 'Container',
    entityId: 'ONEU-8821094',
    containerId: 'ONEU-8821094',
    location: 'Singapore Port Terminal 1',
    newValue: { status: 'Booked', cargo: 'Automotive Electronics & Microchips', seal: 'SL-884920-SEC' }
  });

  const c1Load = await recordBlock({
    userId: 'USR-003',
    username: 'Capt. Vikram Sengupta',
    userRole: 'ship_manager',
    action: 'CONTAINER_LOADED_ON_SHIP',
    entityType: 'Container',
    entityId: 'ONEU-8821094',
    containerId: 'ONEU-8821094',
    shipId: 'SH-101',
    location: 'Onboard MSC Irina (Singapore)',
    newValue: { status: 'Loaded', ship: 'MSC Irina' }
  });

  const c1Depart = await recordBlock({
    userId: 'USR-003',
    username: 'Capt. Vikram Sengupta',
    userRole: 'ship_manager',
    action: 'CONTAINER_DEPARTED_AT_SEA',
    entityType: 'Container',
    entityId: 'ONEU-8821094',
    containerId: 'ONEU-8821094',
    shipId: 'SH-101',
    location: 'Arabian Sea (18.94°N, 72.83°E)',
    newValue: { status: 'In Transit', speedKnots: 19.4 }
  });

  const container1 = await Container.create({
    containerId: 'ONEU-8821094',
    type: 'Dry 40ft',
    size: '40ft',
    weightKg: 26450,
    cargoDescription: 'Precision Automotive Electronics & Semiconductor Components',
    origin: 'Singapore Port',
    destination: 'Mumbai Port',
    currentLocation: 'Onboard MSC Irina (Arabian Sea)',
    assignedShipId: 'SH-101',
    assignedShipName: 'MSC Irina',
    ownerCompany: 'Ocean Network Express (ONE)',
    status: 'In Transit',
    sealNumber: 'SL-884920-SEC',
    hazardClass: 'Non-Hazardous',
    temperatureCelsius: null,
    riskLevel: 'Low',
    riskScore: 10,
    isDelayed: false,
    journeyMilestones: [
      {
        stage: 'BOOKED',
        status: 'Booked',
        location: 'Singapore Port Terminal 1',
        timestamp: c1Book.timestamp,
        performedBy: 'Sunita Rao',
        userRole: 'port_manager',
        auditId: c1Book.auditId,
        hash: c1Book.currentHash,
        notes: 'Container booked for maritime voyage to Mumbai Port'
      },
      {
        stage: 'LOADED',
        status: 'Loaded',
        location: 'Onboard MSC Irina (Singapore)',
        timestamp: c1Load.timestamp,
        performedBy: 'Capt. Vikram Sengupta',
        userRole: 'ship_manager',
        shipId: 'SH-101',
        shipName: 'MSC Irina',
        auditId: c1Load.auditId,
        hash: c1Load.currentHash,
        notes: 'Container manifested and stowed in Bay 14'
      },
      {
        stage: 'IN TRANSIT',
        status: 'In Transit',
        location: 'Arabian Sea (18.94°N, 72.83°E)',
        timestamp: c1Depart.timestamp,
        performedBy: 'Capt. Vikram Sengupta',
        userRole: 'ship_manager',
        shipId: 'SH-101',
        shipName: 'MSC Irina',
        auditId: c1Depart.auditId,
        hash: c1Depart.currentHash,
        notes: 'Vessel underway at 19.4 knots, ETA Mumbai Port'
      }
    ]
  });

  // Container 2: MSCU-7492014 (Under Inspection at Mumbai Port)
  const c2Book = await recordBlock({
    userId: 'USR-002',
    username: 'Sunita Rao',
    userRole: 'port_manager',
    action: 'CONTAINER_BOOKED',
    entityType: 'Container',
    entityId: 'MSCU-7492014',
    containerId: 'MSCU-7492014',
    location: 'Dubai Port Terminal 2',
    newValue: { status: 'Booked', cargo: 'Cold Chain Vaccines', temp: -20 }
  });

  const c2Arrive = await recordBlock({
    userId: 'USR-002',
    username: 'Sunita Rao',
    userRole: 'port_manager',
    action: 'CONTAINER_ARRIVED_PORT',
    entityType: 'Container',
    entityId: 'MSCU-7492014',
    containerId: 'MSCU-7492014',
    location: 'Mumbai Port Berth 4',
    newValue: { status: 'Arrived' }
  });

  const c2Inspect = await recordBlock({
    userId: 'USR-004',
    username: 'Rahul Sharma',
    userRole: 'inspector',
    action: 'CONTAINER_PHYSICAL_INSPECTION_PASSED',
    entityType: 'Container',
    entityId: 'MSCU-7492014',
    containerId: 'MSCU-7492014',
    location: 'Mumbai Port Customs Area',
    newValue: { status: 'Under Inspection', result: 'Passed', sealIntact: true }
  });

  const container2 = await Container.create({
    containerId: 'MSCU-7492014',
    type: 'Reefer 40ft',
    size: '40ft',
    weightKg: 21800,
    cargoDescription: 'Pharmaceutical Vaccines & Cold Chain Biologics',
    origin: 'Dubai Port',
    destination: 'Mumbai Port',
    currentLocation: 'Mumbai Port Customs Area',
    assignedShipId: 'SH-103',
    assignedShipName: 'CMA CGM Jacques Saadé',
    ownerCompany: 'Mediterranean Shipping Company (MSC)',
    status: 'Under Inspection',
    sealNumber: 'SL-749201-ISO',
    hazardClass: 'Non-Hazardous',
    temperatureCelsius: -20,
    riskLevel: 'Medium',
    riskScore: 35,
    isDelayed: false,
    riskReasons: ['Cold Chain Criticality: Reefer unit requires continuous temperature audit'],
    journeyMilestones: [
      {
        stage: 'BOOKED',
        status: 'Booked',
        location: 'Dubai Port Terminal 2',
        timestamp: c2Book.timestamp,
        performedBy: 'Sunita Rao',
        userRole: 'port_manager',
        auditId: c2Book.auditId,
        hash: c2Book.currentHash,
        notes: 'Temperature-controlled pharmaceutical cargo booked'
      },
      {
        stage: 'ARRIVED AT PORT',
        status: 'Arrived',
        location: 'Mumbai Port Berth 4',
        timestamp: c2Arrive.timestamp,
        performedBy: 'Sunita Rao',
        userRole: 'port_manager',
        auditId: c2Arrive.auditId,
        hash: c2Arrive.currentHash,
        notes: 'Vessel berthed, container moved to reefer inspection bay'
      },
      {
        stage: 'INSPECTED',
        status: 'Under Inspection',
        location: 'Mumbai Port Customs Area',
        timestamp: c2Inspect.timestamp,
        performedBy: 'Rahul Sharma',
        userRole: 'inspector',
        auditId: c2Inspect.auditId,
        hash: c2Inspect.currentHash,
        notes: 'Customs & Reefer integrity verified. Temperature -20°C confirmed intact.'
      }
    ]
  });

  // Container 3: MSKU-9102483 (Delivered at Singapore Depot)
  const c3Book = await recordBlock({
    userId: 'USR-001',
    username: 'Capt. Rajesh Menon',
    userRole: 'admin',
    action: 'CONTAINER_BOOKED',
    entityType: 'Container',
    entityId: 'MSKU-9102483',
    containerId: 'MSKU-9102483',
    location: 'Shanghai Port Terminal 3',
    newValue: { status: 'Booked', cargo: 'Industrial Robotics & Machinery' }
  });

  const c3Delivered = await recordBlock({
    userId: 'USR-002',
    username: 'Sunita Rao',
    userRole: 'port_manager',
    action: 'CONTAINER_DELIVERED',
    entityType: 'Container',
    entityId: 'MSKU-9102483',
    containerId: 'MSKU-9102483',
    location: 'Singapore Freight Depot 7',
    newValue: { status: 'Delivered', gateOut: true }
  });

  const container3 = await Container.create({
    containerId: 'MSKU-9102483',
    type: 'Dry 40ft',
    size: '40ft',
    weightKg: 28900,
    cargoDescription: 'High-Precision Industrial Robotics & CNC Machinery',
    origin: 'Shanghai Port',
    destination: 'Singapore Port',
    currentLocation: 'Singapore Freight Depot 7',
    assignedShipId: 'SH-102',
    assignedShipName: 'Ever Ace',
    ownerCompany: 'Maersk Line Ltd.',
    status: 'Delivered',
    sealNumber: 'SL-910248-VER',
    hazardClass: 'Non-Hazardous',
    temperatureCelsius: null,
    riskLevel: 'Low',
    riskScore: 10,
    isDelayed: false,
    journeyMilestones: [
      {
        stage: 'BOOKED',
        status: 'Booked',
        location: 'Shanghai Port Terminal 3',
        timestamp: c3Book.timestamp,
        performedBy: 'Capt. Rajesh Menon',
        userRole: 'admin',
        auditId: c3Book.auditId,
        hash: c3Book.currentHash,
        notes: 'Container booked for delivery to Singapore'
      },
      {
        stage: 'DELIVERED',
        status: 'Delivered',
        location: 'Singapore Freight Depot 7',
        timestamp: c3Delivered.timestamp,
        performedBy: 'Sunita Rao',
        userRole: 'port_manager',
        auditId: c3Delivered.auditId,
        hash: c3Delivered.currentHash,
        notes: 'Gate out authorization verified. Cargo successfully delivered to consignee.'
      }
    ]
  });

  // Container 4: CMAU-9182341 (Flagged for Quarantine at Mumbai Port Customs)
  const c4Book = await recordBlock({
    userId: 'USR-002',
    username: 'Sunita Rao',
    userRole: 'port_manager',
    action: 'CONTAINER_BOOKED',
    entityType: 'Container',
    entityId: 'CMAU-9182341',
    containerId: 'CMAU-9182341',
    location: 'Dubai Port Terminal 1',
    newValue: { status: 'Booked', cargo: 'Liquid Industrial Solvents & Organics', seal: 'SL-88201-SEC' }
  });

  const c4InspectFail = await recordBlock({
    userId: 'USR-004',
    username: 'Rahul Sharma',
    userRole: 'inspector',
    action: 'CONTAINER_INSPECTION_FAILED',
    entityType: 'Container',
    entityId: 'CMAU-9182341',
    containerId: 'CMAU-9182341',
    location: 'Mumbai Port Customs Bay',
    newValue: {
      status: 'Flagged',
      result: 'Flagged for Quarantine',
      sealMismatch: true,
      expectedSeal: 'SL-88201-SEC',
      observedSeal: 'SL-99102-REV',
      recommendation: 'Quarantine container immediately. Seal mismatch detected.'
    }
  });

  const container4 = await Container.create({
    containerId: 'CMAU-9182341',
    type: 'Tank 20ft',
    size: '20ft',
    weightKg: 24100,
    cargoDescription: 'Chemical Freight & Liquid Organic Solvents',
    origin: 'Dubai Port',
    destination: 'Mumbai Port',
    currentLocation: 'Mumbai Port Customs Bay (Quarantine Grid 3)',
    assignedShipId: 'SH-103',
    assignedShipName: 'CMA CGM Jacques Saadé',
    ownerCompany: 'CMA CGM Group',
    status: 'Flagged',
    sealNumber: 'SL-88201-SEC',
    hazardClass: 'Class 3 (Flammable Liquids)',
    temperatureCelsius: null,
    riskLevel: 'High',
    riskScore: 85,
    isDelayed: true,
    delayReason: 'Quarantine lock active: Bolt seal mismatch against manifest declaration',
    riskReasons: ['Security Bolt Seal Mismatch: Physical seal SL-99102-REV vs Manifest SL-88201-SEC', 'Dangerous Goods Class 3 Compliance review pending'],
    journeyMilestones: [
      {
        stage: 'BOOKED',
        status: 'Booked',
        location: 'Dubai Port Terminal 1',
        timestamp: c4Book.timestamp,
        performedBy: 'Sunita Rao',
        userRole: 'port_manager',
        auditId: c4Book.auditId,
        hash: c4Book.currentHash,
        notes: 'Hazardous cargo manifested with seal SL-88201-SEC'
      },
      {
        stage: 'FLAGGED',
        status: 'Flagged',
        location: 'Mumbai Port Customs Bay',
        timestamp: c4InspectFail.timestamp,
        performedBy: 'Rahul Sharma',
        userRole: 'inspector',
        auditId: c4InspectFail.auditId,
        hash: c4InspectFail.currentHash,
        notes: 'Quarantine hold applied by Inspector Rahul Sharma: Physical seal SL-99102-REV does not match manifest.'
      }
    ]
  });

  // Container 5: MAEU-4401928 (Requires Re-inspection / Repair at Mumbai Port)
  const c5Book = await recordBlock({
    userId: 'USR-001',
    username: 'Capt. Rajesh Menon',
    userRole: 'admin',
    action: 'CONTAINER_BOOKED',
    entityType: 'Container',
    entityId: 'MAEU-4401928',
    containerId: 'MAEU-4401928',
    location: 'Singapore Port Terminal 2',
    newValue: { status: 'Booked', cargo: 'Heavy Industrial Turbines & Castings', seal: 'SL-440192-ISO' }
  });

  const c5Reinsp = await recordBlock({
    userId: 'USR-004',
    username: 'Rahul Sharma',
    userRole: 'inspector',
    action: 'REINSPECTION_REQUESTED',
    entityType: 'Container',
    entityId: 'MAEU-4401928',
    containerId: 'MAEU-4401928',
    location: 'Mumbai Port Maintenance Bay',
    newValue: {
      status: 'Delayed',
      result: 'Requires Re-inspection',
      reason: 'Rear right door gasket seal compression loss and locking cam wear',
      priority: 'High',
      deadlineHours: 24
    }
  });

  const container5 = await Container.create({
    containerId: 'MAEU-4401928',
    type: 'Open Top 40ft',
    size: '40ft',
    weightKg: 31200,
    cargoDescription: 'Heavy Industrial Power Generation Turbines & Iron Castings',
    origin: 'Singapore Port',
    destination: 'Mumbai Port',
    currentLocation: 'Mumbai Port Maintenance Bay',
    assignedShipId: 'SH-101',
    assignedShipName: 'MSC Irina',
    ownerCompany: 'Maersk Line Ltd.',
    status: 'Delayed',
    sealNumber: 'SL-440192-ISO',
    hazardClass: 'Non-Hazardous',
    temperatureCelsius: null,
    riskLevel: 'Medium',
    riskScore: 45,
    isDelayed: true,
    delayReason: 'Maintenance Queue: Door gasket wear requires repair certification before sea loading',
    riskReasons: ['Structural Integrity: Rear door gasket compression below ISO water-tight specification'],
    journeyMilestones: [
      {
        stage: 'BOOKED',
        status: 'Booked',
        location: 'Singapore Port Terminal 2',
        timestamp: c5Book.timestamp,
        performedBy: 'Capt. Rajesh Menon',
        userRole: 'admin',
        auditId: c5Book.auditId,
        hash: c5Book.currentHash,
        notes: 'Heavy machinery manifested for export'
      },
      {
        stage: 'FLAGGED',
        status: 'Delayed',
        location: 'Mumbai Port Maintenance Bay',
        timestamp: c5Reinsp.timestamp,
        performedBy: 'Rahul Sharma',
        userRole: 'inspector',
        auditId: c5Reinsp.auditId,
        hash: c5Reinsp.currentHash,
        notes: 'Re-inspection requested: Door gasket seal repair required prior to sea loading.'
      }
    ]
  });

  // Container 6: COSCO-3382910 (Queued for Inspection at Mumbai Port)
  const c6Book = await recordBlock({
    userId: 'USR-002',
    username: 'Sunita Rao',
    userRole: 'port_manager',
    action: 'CONTAINER_BOOKED',
    entityType: 'Container',
    entityId: 'COSCO-3382910',
    containerId: 'COSCO-3382910',
    location: 'Mumbai Port Gate 3',
    newValue: { status: 'Booked', cargo: 'Solar PV Modules & Inverter Racks', seal: 'SL-338291-SEC' }
  });

  const container6 = await Container.create({
    containerId: 'COSCO-3382910',
    type: 'Dry 40ft',
    size: '40ft',
    weightKg: 22400,
    cargoDescription: 'Commercial Solar PV Modules & Grid Inverter Racks',
    origin: 'Mumbai Port',
    destination: 'Rotterdam Port',
    currentLocation: 'Mumbai Port Gate 3 (Staging Area)',
    assignedShipId: 'SH-103',
    assignedShipName: 'CMA CGM Jacques Saadé',
    ownerCompany: 'COSCO Shipping Lines',
    status: 'Booked',
    sealNumber: 'SL-338291-SEC',
    hazardClass: 'Non-Hazardous',
    temperatureCelsius: null,
    riskLevel: 'Low',
    riskScore: 15,
    isDelayed: false,
    journeyMilestones: [
      {
        stage: 'BOOKED',
        status: 'Booked',
        location: 'Mumbai Port Gate 3',
        timestamp: c6Book.timestamp,
        performedBy: 'Sunita Rao',
        userRole: 'port_manager',
        auditId: c6Book.auditId,
        hash: c6Book.currentHash,
        notes: 'Container gated in and assigned to Customs Safety Queue'
      }
    ]
  });

  // 5. Seed Real Physical Inspection Records across all states
  const inspections = await Inspection.insertMany([
    {
      inspectionId: 'INS-20260925-001',
      containerId: 'MSCU-7492014',
      shipId: 'SH-103',
      inspectorId: 'USR-004',
      inspectorName: 'Rahul Sharma',
      port: 'Mumbai Port',
      inspectionType: 'Reefer Temp & Integrity',
      status: 'Passed',
      result: 'Passed',
      expectedSealNumber: 'SL-749201-ISO',
      physicalSealNumber: 'SL-749201-ISO',
      sealMatch: true,
      sealIntact: true,
      temperatureRecorded: -20.1,
      recommendation: 'Approve for Sea Loading',
      notes: 'Reefer data logger telemetry downloaded: temperature steadily maintained at -20.1°C. High-security bolt seal verified intact.',
      checklist: [
        { item: '1. Doors, Locks, Hinges & Rubber Gaskets', status: 'Pass', passed: true, comments: 'Gaskets airtight, locking bars operational' },
        { item: '2. Left & Right Structural Walls / Panels', status: 'Pass', passed: true, comments: 'No dents or thermal barrier breaches' },
        { item: '3. Ceiling & Roof Sheets (Corrosion check)', status: 'Pass', passed: true, comments: 'Water-tight seal verified' },
        { item: '4. Wooden / Steel Floor & Crossmembers', status: 'Pass', passed: true, comments: 'Clean, dry, no oil contamination' },
        { item: '5. Corner Castings & Twistlock Apertures', status: 'Pass', passed: true, comments: 'ISO 1161 corner castings intact' },
        { item: '6. Dangerous Goods Hazard Labels & IMDG Placards', status: 'N/A', passed: true, comments: 'Pharma medical supplies' },
        { item: '7. Cold-Chain Machinery & Reefer Cables', status: 'Pass', passed: true, comments: '-20.1°C sub-zero cold chain certified' }
      ],
      photographs: [
        {
          photoId: 'PHT-001',
          fileName: 'mscu_reefer_display_temp.jpg',
          fileUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
          fileHashSha256: crypto.createHash('sha256').update('mscu_reefer_display_temp_proof').digest('hex'),
          caption: 'Digital datalogger display reading -20.1°C'
        }
      ],
      gpsLocation: { lat: 18.9438, lng: 72.8354 },
      auditId: c2Inspect.auditId
    },
    {
      inspectionId: 'INS-20260926-002',
      containerId: 'ONEU-8821094',
      shipId: 'SH-101',
      inspectorId: 'USR-004',
      inspectorName: 'Rahul Sharma',
      port: 'Singapore Port',
      inspectionType: 'Safety & Structural',
      status: 'Passed',
      result: 'Passed',
      expectedSealNumber: 'SL-884920-SEC',
      physicalSealNumber: 'SL-884920-SEC',
      sealMatch: true,
      sealIntact: true,
      recommendation: 'Approve for Sea Loading',
      notes: 'Physical 7-point structural inspection passed at Singapore Terminal 1. Seal SL-884920-SEC verified intact.',
      checklist: [
        { item: '1. Doors, Locks, Hinges & Rubber Gaskets', status: 'Pass', passed: true, comments: 'Locking bars and seals intact' },
        { item: '2. Left & Right Structural Walls / Panels', status: 'Pass', passed: true, comments: 'No panel deformation' },
        { item: '3. Ceiling & Roof Sheets (Corrosion check)', status: 'Pass', passed: true, comments: 'No corrosion or holes' },
        { item: '4. Wooden / Steel Floor & Crossmembers', status: 'Pass', passed: true, comments: 'Clean and oil-free' },
        { item: '5. Corner Castings & Twistlock Apertures', status: 'Pass', passed: true, comments: 'ISO compliant castings' },
        { item: '6. Dangerous Goods Hazard Labels & IMDG Placards', status: 'N/A', passed: true, comments: 'Non-hazardous electronic components' },
        { item: '7. Cold-Chain Machinery & Reefer Cables', status: 'N/A', passed: true, comments: 'Ambient cargo' }
      ],
      photographs: [
        {
          photoId: 'PHT-002',
          fileName: 'oneu_singapore_seal_proof.jpg',
          fileUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
          fileHashSha256: crypto.createHash('sha256').update('oneu_singapore_seal_proof_hash').digest('hex'),
          caption: 'ISO 17712 bolt seal SL-884920-SEC verification photo'
        }
      ],
      gpsLocation: { lat: 1.2644, lng: 103.8400 },
      auditId: c1Load.auditId
    },
    {
      inspectionId: 'INS-20260927-003',
      containerId: 'CMAU-9182341',
      shipId: 'SH-103',
      inspectorId: 'USR-004',
      inspectorName: 'Rahul Sharma',
      port: 'Mumbai Port',
      inspectionType: 'Dangerous Goods Compliance',
      status: 'On Hold',
      result: 'Flagged for Quarantine',
      expectedSealNumber: 'SL-88201-SEC',
      physicalSealNumber: 'SL-99102-REV',
      sealMatch: false,
      sealIntact: false,
      recommendation: 'Quarantine for Security Seal Discrepancy',
      notes: 'CRITICAL SECURITY DISCREPANCY: Physical bolt seal number SL-99102-REV does NOT match manifest SL-88201-SEC. Mandatory full customs cargo unsealing and chemical verification required.',
      checklist: [
        { item: '1. Doors, Locks, Hinges & Rubber Gaskets', status: 'Fail', passed: false, comments: 'Unauthorized seal replacement detected' },
        { item: '2. Left & Right Structural Walls / Panels', status: 'Pass', passed: true, comments: 'Tank vessel structure intact' },
        { item: '3. Ceiling & Roof Sheets (Corrosion check)', status: 'Pass', passed: true, comments: 'Top manhole valves inspected' },
        { item: '4. Wooden / Steel Floor & Crossmembers', status: 'Pass', passed: true, comments: 'Frame secure' },
        { item: '5. Corner Castings & Twistlock Apertures', status: 'Pass', passed: true, comments: 'Castings verified' },
        { item: '6. Dangerous Goods Hazard Labels & IMDG Placards', status: 'Pass', passed: true, comments: 'Class 3 Flammable Liquid placard displayed' },
        { item: '7. Cold-Chain Machinery & Reefer Cables', status: 'N/A', passed: true, comments: 'Ambient chemical tank' }
      ],
      defectsDetected: [
        { category: 'Security & Seal', defect: 'Bolt Seal Mismatch (SL-99102-REV vs Manifest SL-88201-SEC)', severity: 'Critical', actionRequired: 'Quarantine & Cargo Search' }
      ],
      photographs: [
        {
          photoId: 'PHT-003',
          fileName: 'cmau_mismatched_seal_photo.jpg',
          fileUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&auto=format&fit=crop&q=80',
          fileHashSha256: crypto.createHash('sha256').update('cmau_mismatched_seal_photo_hash').digest('hex'),
          caption: 'Photographic proof of unmanifested bolt seal SL-99102-REV'
        }
      ],
      gpsLocation: { lat: 18.9438, lng: 72.8354 },
      auditId: c4InspectFail.auditId
    },
    {
      inspectionId: 'INS-20260928-004',
      containerId: 'MAEU-4401928',
      shipId: 'SH-101',
      inspectorId: 'USR-004',
      inspectorName: 'Rahul Sharma',
      port: 'Mumbai Port',
      inspectionType: 'Safety & Structural',
      status: 'Re-inspection Required',
      result: 'Requires Re-inspection',
      expectedSealNumber: 'SL-440192-ISO',
      physicalSealNumber: 'SL-440192-ISO',
      sealMatch: true,
      sealIntact: true,
      recommendation: 'Hold Container & Request Repair',
      notes: 'Structural defect detected: Rear door rubber gasket has severe compression loss. Container Repair Facility work order issued. Re-inspection required within 24h prior to vessel loading.',
      checklist: [
        { item: '1. Doors, Locks, Hinges & Rubber Gaskets', status: 'Fail', passed: false, comments: 'Rubber gasket perished, daylight gap on bottom left hinge' },
        { item: '2. Left & Right Structural Walls / Panels', status: 'Pass', passed: true, comments: 'Side panels straight' },
        { item: '3. Ceiling & Roof Sheets (Corrosion check)', status: 'Pass', passed: true, comments: 'Tarpaulin cover secure' },
        { item: '4. Wooden / Steel Floor & Crossmembers', status: 'Pass', passed: true, comments: 'Floor reinforced for heavy cargo' },
        { item: '5. Corner Castings & Twistlock Apertures', status: 'Pass', passed: true, comments: 'Castings in good order' },
        { item: '6. Dangerous Goods Hazard Labels & IMDG Placards', status: 'N/A', passed: true, comments: 'Non-hazardous industrial cargo' },
        { item: '7. Cold-Chain Machinery & Reefer Cables', status: 'N/A', passed: true, comments: 'Dry Open-Top unit' }
      ],
      defectsDetected: [
        { category: 'Physical / Structural', defect: 'Door gasket seal degradation & latch clearance gap', severity: 'Major', actionRequired: 'Replace gasket & certified re-test' }
      ],
      photographs: [
        {
          photoId: 'PHT-004',
          fileName: 'maeu_gasket_defect_evidence.jpg',
          fileUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
          fileHashSha256: crypto.createHash('sha256').update('maeu_gasket_defect_evidence_hash').digest('hex'),
          caption: 'Defect photograph of perished rear rubber gasket seal'
        }
      ],
      gpsLocation: { lat: 18.9438, lng: 72.8354 },
      auditId: c5Reinsp.auditId
    },
    {
      inspectionId: 'INS-20260929-005',
      containerId: 'MSKU-9102483',
      shipId: 'SH-102',
      inspectorId: 'USR-004',
      inspectorName: 'Rahul Sharma',
      port: 'Singapore Port',
      inspectionType: 'Customs & Border Control',
      status: 'Passed',
      result: 'Passed',
      expectedSealNumber: 'SL-910248-VER',
      physicalSealNumber: 'SL-910248-VER',
      sealMatch: true,
      sealIntact: true,
      recommendation: 'Approve for Consignee Gate-Out',
      notes: 'Final customs inbound gate clearance completed at Singapore Depot 7. Bolt seal intact, zero customs duty discrepancies.',
      checklist: [
        { item: '1. Doors, Locks, Hinges & Rubber Gaskets', status: 'Pass', passed: true, comments: 'All locks intact' },
        { item: '2. Left & Right Structural Walls / Panels', status: 'Pass', passed: true, comments: 'No damage' },
        { item: '3. Ceiling & Roof Sheets (Corrosion check)', status: 'Pass', passed: true, comments: 'Clean' },
        { item: '4. Wooden / Steel Floor & Crossmembers', status: 'Pass', passed: true, comments: 'Inspected' },
        { item: '5. Corner Castings & Twistlock Apertures', status: 'Pass', passed: true, comments: 'Intact' },
        { item: '6. Dangerous Goods Hazard Labels & IMDG Placards', status: 'N/A', passed: true, comments: 'Machinery' },
        { item: '7. Cold-Chain Machinery & Reefer Cables', status: 'N/A', passed: true, comments: 'Ambient' }
      ],
      gpsLocation: { lat: 1.2644, lng: 103.8400 },
      auditId: c3Delivered.auditId
    }
  ]);

  // 6. Seed Real Certified Evidence Documents
  await Evidence.insertMany([
    {
      evidenceId: 'EVD-20260925-0001',
      containerId: 'MSCU-7492014',
      inspectionId: 'INS-20260925-001',
      fileName: 'msc_vaccine_coldchain_datalog.pdf',
      fileType: 'application/pdf',
      fileSize: 420000,
      fileUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80',
      uploadedBy: 'Rahul Sharma',
      uploadedByRole: 'inspector',
      category: 'Inspection Photo',
      description: 'Official Cold Chain Temperature Audit & Inspection Certificate (-20.1°C)',
      fileHashSha256: crypto.createHash('sha256').update('msc_vaccine_coldchain_datalog_cert_2026').digest('hex'),
      auditId: c2Inspect.auditId
    },
    {
      evidenceId: 'EVD-20260925-0002',
      containerId: 'ONEU-8821094',
      fileName: 'one_singapore_bill_of_lading.pdf',
      fileType: 'application/pdf',
      fileSize: 285000,
      fileUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
      uploadedBy: 'Sunita Rao',
      uploadedByRole: 'port_manager',
      category: 'Bill of Lading',
      description: 'Official Ocean Bill of Lading for ONEU-8821094',
      fileHashSha256: crypto.createHash('sha256').update('one_singapore_bill_of_lading_2026').digest('hex'),
      auditId: c1Book.auditId
    },
    {
      evidenceId: 'EVD-20260927-0003',
      containerId: 'CMAU-9182341',
      inspectionId: 'INS-20260927-003',
      fileName: 'cmau_mismatched_seal_proof.jpg',
      fileType: 'image/jpeg',
      fileSize: 312000,
      fileUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&auto=format&fit=crop&q=80',
      uploadedBy: 'Rahul Sharma',
      uploadedByRole: 'inspector',
      category: 'Seal Photo',
      description: 'Photographic evidence of unauthorized bolt seal SL-99102-REV on container CMAU-9182341',
      fileHashSha256: crypto.createHash('sha256').update('cmau_mismatched_seal_proof_sha256').digest('hex'),
      auditId: c4InspectFail.auditId
    },
    {
      evidenceId: 'EVD-20260928-0004',
      containerId: 'MAEU-4401928',
      inspectionId: 'INS-20260928-004',
      fileName: 'maeu_door_gasket_defect.jpg',
      fileType: 'image/jpeg',
      fileSize: 245000,
      fileUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
      uploadedBy: 'Rahul Sharma',
      uploadedByRole: 'inspector',
      category: 'Damage Photo',
      description: 'Macro photograph of perished door rubber gasket seal on container MAEU-4401928',
      fileHashSha256: crypto.createHash('sha256').update('maeu_door_gasket_defect_sha256').digest('hex'),
      auditId: c5Reinsp.auditId
    },
    {
      evidenceId: 'EVD-20260929-0005',
      containerId: 'MSKU-9102483',
      inspectionId: 'INS-20260929-005',
      fileName: 'msku_singapore_customs_clearance.pdf',
      fileType: 'application/pdf',
      fileSize: 198000,
      fileUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
      uploadedBy: 'Capt. Rajesh Menon',
      uploadedByRole: 'admin',
      category: 'Customs Check',
      description: 'Inbound customs clearance stamp and gate release manifest for MSKU-9102483',
      fileHashSha256: crypto.createHash('sha256').update('msku_singapore_customs_clearance_sha256').digest('hex'),
      auditId: c3Delivered.auditId
    },
    {
      evidenceId: 'EVD-20260929-0006',
      containerId: 'ONEU-8821094',
      inspectionId: 'INS-20260926-002',
      fileName: 'oneu_iso17712_bolt_seal_verification.jpg',
      fileType: 'image/jpeg',
      fileSize: 289000,
      fileUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
      uploadedBy: 'Rahul Sharma',
      uploadedByRole: 'inspector',
      category: 'Seal Photo',
      description: 'High-resolution ISO 17712 bolt seal SL-884920-SEC physical verification photo',
      fileHashSha256: crypto.createHash('sha256').update('oneu_iso17712_bolt_seal_verification_sha256').digest('hex'),
      auditId: c1Load.auditId
    }
  ]);

  // 7. Seed Alerts for Inspector Actions
  await Alert.insertMany([
    {
      alertId: 'ALT-INSP-001',
      title: 'Quarantine Lock: Container CMAU-9182341 Security Seal Mismatch',
      message: 'Inspector Rahul Sharma placed CMAU-9182341 on Quarantine Hold at Mumbai Port Customs Bay. Observed seal SL-99102-REV does not match declared manifest seal SL-88201-SEC.',
      severity: 'critical',
      category: 'inspection_failed',
      entityType: 'Container',
      entityId: 'CMAU-9182341',
      metadata: { inspectionId: 'INS-20260927-003', port: 'Mumbai Port', inspector: 'Rahul Sharma' }
    },
    {
      alertId: 'ALT-REINSP-002',
      title: 'Re-inspection Scheduled: MAEU-4401928 Door Gasket Repair',
      message: 'Priority High re-inspection scheduled for MAEU-4401928 at Mumbai Port Maintenance Bay. Rubber gasket repair must be certified within 24h prior to sea loading.',
      severity: 'high',
      category: 'inspection_failed',
      entityType: 'Container',
      entityId: 'MAEU-4401928',
      metadata: { inspectionId: 'INS-20260928-004', deadlineHours: 24, priority: 'High' }
    }
  ]);

  // 8. Seed Initial Report
  await Report.create({
    reportId: 'RPT-20260925-0001',
    title: 'Executive Maritime Audit Trail & Fleet Operations Report',
    reportType: 'Comprehensive Audit Trail',
    dateRange: {
      startDate: new Date(Date.now() - 7 * 86400000),
      endDate: new Date()
    },
    generatedBy: 'Capt. Rajesh Menon',
    generatedByRole: 'admin',
    format: 'PDF',
    metricsSummary: {
      totalAudits: createdAuditLogs.length,
      totalContainers: 6,
      totalShips: 3,
      anomaliesFound: 1,
      highRiskContainers: 1,
      integrityVerified: true
    },
    integrityStatus: 'VERIFIED',
    tamperCheckDetails: 'All cryptographic SHA-256 blocks verified with 0 violations.',
    dataSnapshot: {
      latestBlockHash: lastHash,
      sampleLogCount: createdAuditLogs.length
    }
  });

  console.log('✅ Maritime database successfully populated with 3 Ships, 6 Containers, 5 Inspections, 6 Evidence proofs, and Indian Officers.');
}

module.exports = { seedDatabase };