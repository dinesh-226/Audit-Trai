const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authMiddleware } = require('../middleware/auth');

// GET /api/reports - List all compliance reports
router.get('/', authMiddleware, reportController.getReports);

// POST /api/reports - Generate a new compliance report
router.post('/', authMiddleware, reportController.generateReport);

// GET /api/reports/:id - Get specific report metadata
router.get('/:id', authMiddleware, reportController.getReportById);

// GET /api/reports/:id/download - Render & download printable HTML/PDF report
router.get('/:id/download', reportController.downloadReport);

// DELETE /api/reports/:id - Delete a report
router.delete('/:id', authMiddleware, reportController.deleteReport);

module.exports = router;
