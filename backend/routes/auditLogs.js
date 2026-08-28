// routes/auditLogs.js - Audit Trail Endpoints
const express = require('express');
const router = express.Router();
const {
  getLogs,
  getLogById,
  createManualLog,
  getStats,
  exportLogs,
  verifyChain,
  simulateTamper,
  repairChain,
  reviewLog,
  getTimeline
} = require('../controllers/auditController');
const { getAiInsights } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getLogs);
router.post('/', protect, createManualLog);
router.get('/stats', protect, getStats);
router.post('/export', protect, exportLogs);
router.post('/verify', protect, verifyChain);
router.post('/simulate-tamper', protect, simulateTamper);
router.post('/repair-chain', protect, repairChain);
router.get('/timeline', protect, getTimeline);
router.get('/ai-insights', protect, getAiInsights);
router.get('/:id', protect, getLogById);
router.post('/:id/review', protect, reviewLog);

module.exports = router;
