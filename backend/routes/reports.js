// routes/reports.js - Compliance Reports Endpoints
const express = require('express');
const router = express.Router();
const { getReports, generateReport, downloadReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getReports);
router.post('/', protect, generateReport);
router.get('/:id/download', protect, downloadReport);

module.exports = router;
