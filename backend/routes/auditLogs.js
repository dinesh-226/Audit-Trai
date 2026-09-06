const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { authMiddleware } = require('../middleware/auth');

// Public audit summary routes (for landing page)
router.get('/public-recent', auditLogController.getPublicRecentLogs);
router.get('/public-stats', auditLogController.getPublicStats);

// Protected audit trail routes
router.get('/', authMiddleware, auditLogController.getAuditLogs);
router.get('/stats', authMiddleware, auditLogController.getAuditStats);
router.get('/episodes', authMiddleware, auditLogController.getEpisodes);
router.get('/export-csv', authMiddleware, auditLogController.exportCsv);

module.exports = router;
