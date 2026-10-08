require('dotenv').config();

// Safe DNS Resolution (only for local Node, never break Vercel / AWS Lambda)
if (process.env.VERCEL !== '1' && !process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.VERCEL_ENV) {
  try {
    const dns = require('dns');
    if (dns.setDefaultResultOrder) {
      dns.setDefaultResultOrder('ipv4first');
    }
  } catch (e) {}
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Route Modules
const authRoutes = require('./routes/auth');
const shipRoutes = require('./routes/ships');
const containerRoutes = require('./routes/containers');
const auditLogRoutes = require('./routes/auditLogs');
const inspectionRoutes = require('./routes/inspections');
const evidenceRoutes = require('./routes/evidence');
const anomalyRoutes = require('./routes/anomalies');
const alertRoutes = require('./routes/alerts');
const aiRoutes = require('./routes/ai');
const reportRoutes = require('./routes/reports');
const trackingRoutes = require('./routes/tracking');
const portActivityRoutes = require('./routes/portActivities');
const voyageRoutes = require('./routes/voyages');
const analyticsRoutes = require('./routes/analytics');
const temperatureRoutes = require('./routes/temperature');

const { requireAuth, requireRole } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS - allow all frontend origins & handle OPTIONS immediately
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-demo-user',
    'x-demo-role',
    'x-auth-token',
    'x-requested-with',
    'Accept'
  ]
}));

// Express parsers
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// MongoDB Connection with global connection cache (Optimized for Vercel Serverless)
const MONGO_FALLBACK = 'mongodb+srv://dinesh:paurdinesh@dineshcluster.qvm5csd.mongodb.net/Audit_Trail?retryWrites=true&w=majority';
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectMongoDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    const mongoUri = process.env.MONGO_URI || MONGO_FALLBACK;
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 10000,
      maxPoolSize: 10
    };

    cached.promise = mongoose.connect(mongoUri, opts).then((mongooseInstance) => {
      console.log(`✅ Connected to MongoDB Atlas: "${mongooseInstance.connection.name}"`);
      return mongooseInstance;
    }).catch((err) => {
      cached.promise = null;
      console.error('❌ MongoDB Atlas Connection Error:', err.message);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

// Request logger for non-production debugging
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production' && req.path.startsWith('/api')) {
    console.log(`[${new Date().toISOString().substring(11, 19)}] ${req.method} ${req.path}`);
  }
  next();
});

// Root API Health & Diagnostic Info (Fast non-blocking)
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    system: 'AI-Powered Container Ship Audit Trail & Maritime Monitoring System',
    version: '2.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'standby',
    databaseName: mongoose.connection.name || 'Audit_Trail',
    backendUrl: 'https://audit-trai.vercel.app',
    frontendUrl: 'https://audit-trai-3ks9.vercel.app',
    health: 'https://audit-trai.vercel.app/api/health',
    timestamp: new Date().toISOString()
  });
});

// System Health Check
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    if (mongoose.connection.readyState === 1) {
      dbStatus = 'connected';
    } else {
      await connectMongoDB();
      dbStatus = 'connected';
    }
  } catch (e) {
    dbStatus = `connection_error: ${e.message}`;
  }

  res.json({
    status: 'online',
    system: 'AI-Powered Container Ship Audit Trail & Monitoring System',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    databaseName: mongoose.connection.name || 'Audit_Trail',
    databaseHost: mongoose.connection.host || 'Atlas Cluster'
  });
});

// Serverless MongoDB Auto-Connect Middleware for API Routes
app.use('/api', async (req, res, next) => {
  if (req.method === 'OPTIONS') return next();
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectMongoDB();
    }
    next();
  } catch (err) {
    console.error('Database middleware failed to connect:', err.message);
    return res.status(503).json({
      success: false,
      error: 'Database connection currently unavailable. Please verify MongoDB Atlas IP Whitelist (0.0.0.0/0).',
      details: err.message
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ships', shipRoutes);
app.use('/api/containers', containerRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/inspections', inspectionRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/anomalies', anomalyRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/port-activities', portActivityRoutes);
app.use('/api/voyages', voyageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/temperature', temperatureRoutes);

// Database Re-seed endpoint (Admin demo convenience)
app.post('/api/system/reseed', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    delete require.cache[require.resolve('./services/seedDataService')];
    const { seedDatabase } = require('./services/seedDataService');
    await seedDatabase(true);
    res.json({ message: 'Maritime database re-seeded successfully with fresh demo dataset' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to re-seed database', details: error.message });
  }
});

// 404 Catch-all handler for unmatched routes (Express 5 safe)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global Error Handler:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

// Connect to MongoDB on direct server start
if (process.env.VERCEL !== '1' && !process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.VERCEL_ENV) {
  connectMongoDB().catch(err => console.error('Initial DB connect error:', err.message));
  
  if (require.main === module) {
    app.listen(PORT, () => {
      console.log(`🚀 ContainerShip Audit Trail Server running on http://localhost:${PORT}`);
      console.log(`📊 API endpoints live at http://localhost:${PORT}/api/`);
    });
  }
}

module.exports = app;
