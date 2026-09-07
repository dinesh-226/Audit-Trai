require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const auditLogRoutes = require('./routes/auditLogs');
const webhookRoutes = require('./routes/webhooks');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-demo-user']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request log debug helper
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production' && req.path.startsWith('/api')) {
    console.log(`[${new Date().toISOString().substring(11, 19)}] ${req.method} ${req.path}`);
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/webhooks', webhookRoutes);

// Health & Database Diagnostics Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    databaseName: mongoose.connection.name || 'Trail',
    databaseHost: mongoose.connection.host || 'Atlas Cluster'
  });
});

// Start Express Server
const server = app.listen(PORT, () => {
  console.log(`AuditFlow Server is running on http://localhost:${PORT}`);
  console.log(`Audit Trail API live on MongoDB Atlas at http://localhost:${PORT}/api/audit-logs`);
});

// Direct MongoDB Atlas Connection with Auto-Retry
async function connectMongoDB() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://dinesh:paurdinesh@ac-zlrzxsj-shard-00-00.qvm5csd.mongodb.net:27017,ac-zlrzxsj-shard-00-01.qvm5csd.mongodb.net:27017,ac-zlrzxsj-shard-00-02.qvm5csd.mongodb.net:27017/Trail?ssl=true&replicaSet=atlas-1197x8-shard-0&authSource=admin&retryWrites=true&w=majority';
  console.log(`Connecting directly to MongoDB Atlas (${mongoUri.replace(/:([^:@]+)@/, ':****@')})...`);
  
  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 30000,
      autoIndex: true
    });
    console.log(` Successfully connected to MongoDB Atlas Database: "${mongoose.connection.name}" on host: ${mongoose.connection.host}`);
  } catch (error) {
    console.error('MongoDB Atlas Connection Error:', error.message);
    console.log('Retrying MongoDB connection in 5 seconds...');
    setTimeout(connectMongoDB, 5000);
  }
}

connectMongoDB();

