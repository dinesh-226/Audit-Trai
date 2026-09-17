const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// GET /api/projects - List all projects
router.get('/', authMiddleware, projectController.getAllProjects);

// GET /api/projects/:projectId - Get single project details
router.get('/:projectId', authMiddleware, projectController.getProjectById);

// POST /api/projects - Create new project (Admin & Manager)
router.post('/', authMiddleware, requireRole('admin', 'manager'), projectController.createProject);

// PUT /api/projects/:projectId - Update project metadata
router.put('/:projectId', authMiddleware, projectController.updateProject);

// PUT /api/projects/:projectId/budget - Update budget with audit log (Admin & Manager)
router.put('/:projectId/budget', authMiddleware, requireRole('admin', 'manager'), projectController.updateBudget);

// POST /api/projects/:projectId/members - Add member with audit (Admin & Manager)
router.post('/:projectId/members', authMiddleware, requireRole('admin', 'manager'), projectController.addMember);

// DELETE /api/projects/:projectId - Delete project (Admin only)
router.delete('/:projectId', authMiddleware, requireRole('admin'), projectController.deleteProject);

module.exports = router;
