const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// GET /api/tasks?projectId=...&assignedTo=...
router.get('/', authMiddleware, taskController.getAllTasks);

// POST /api/tasks - Create new task with audit log (Admin, Manager, Member)
router.post('/', authMiddleware, requireRole('admin', 'manager', 'member'), taskController.createTask);

// PUT /api/tasks/:taskId - Update task status / priority / assignee (Admin, Manager, Member)
router.put('/:taskId', authMiddleware, requireRole('admin', 'manager', 'member'), taskController.updateTask);

// DELETE /api/tasks/:taskId - Delete task with audit log (Admin & Manager)
router.delete('/:taskId', authMiddleware, requireRole('admin', 'manager'), taskController.deleteTask);

module.exports = router;
