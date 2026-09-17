const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');
const logAudit = require('../utils/auditLogger');

// GET /api/tasks?projectId=...&assignedTo=...
exports.getAllTasks = async (req, res) => {
  try {
    const { projectId, assignedTo } = req.query;
    const filter = {};
    if (projectId && projectId !== 'all') filter.projectId = projectId;
    if (assignedTo === 'me') {
      filter.assignedTo = req.user._id;
    } else if (assignedTo && assignedTo !== 'all') {
      filter.assignedTo = assignedTo;
    }

    const tasks = await Task.find(filter)
      .populate('projectId', 'name code')
      .populate('assignedTo', 'name email role avatar department')
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error('Fetch tasks error:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// POST /api/tasks - Create new task with audit log
exports.createTask = async (req, res) => {
  try {
    const { title, description, status = 'Todo', priority = 'Medium', projectId, assignedTo, dueDate, reason } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ error: 'Task title and projectId are required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Associated project not found' });
    }

    const task = await Task.create({
      title,
      description: description || '',
      status,
      priority,
      projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      dueDate: dueDate || null
    });

    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'CREATE',
      entityType: 'Task',
      entityId: task._id.toString(),
      entityName: task.title,
      projectId: project._id,
      projectName: project.name,
      fieldName: 'status',
      oldValue: null,
      newValue: task.status,
      reason: reason || 'Task created in project backlog',
      source: 'web',
      req
    });

    const populated = await Task.findById(task._id)
      .populate('assignedTo', 'name email role avatar')
      .populate('createdBy', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

// PUT /api/tasks/:taskId - Update task status / priority / assignee
exports.updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, assignedTo, dueDate, reason } = req.body;

    const task = await Task.findById(taskId).populate('assignedTo', 'name email');
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const project = await Project.findById(task.projectId);
    const oldStatus = task.status;
    const oldPriority = task.priority;
    const oldAssignedToName = task.assignedTo?.name || 'Unassigned';

    let fieldChanged = 'details';
    let oldValue = {};
    let newValue = {};

    if (status && status !== task.status) {
      fieldChanged = 'status';
      oldValue.status = oldStatus;
      newValue.status = status;
      task.status = status;
    }

    if (priority && priority !== task.priority) {
      fieldChanged = fieldChanged === 'details' ? 'priority' : `${fieldChanged} & priority`;
      oldValue.priority = oldPriority;
      newValue.priority = priority;
      task.priority = priority;
    }

    if (assignedTo !== undefined) {
      const currentAssigneeId = String(task.assignedTo?._id || task.assignedTo || '');
      const newAssigneeId = String(assignedTo || '');
      if (currentAssigneeId !== newAssigneeId) {
        fieldChanged = fieldChanged === 'details' ? 'assignedTo' : `${fieldChanged} & assignedTo`;
        const newAssigneeUser = assignedTo ? await User.findById(assignedTo).select('name') : null;
        oldValue.assignedTo = oldAssignedToName;
        newValue.assignedTo = newAssigneeUser ? newAssigneeUser.name : 'Unassigned';
      }
      task.assignedTo = assignedTo || null;
    }

    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (dueDate !== undefined) task.dueDate = dueDate || null;

    await task.save();

    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'UPDATE',
      entityType: 'Task',
      entityId: task._id.toString(),
      entityName: task.title,
      projectId: project?._id || task.projectId,
      projectName: project?.name || 'Project',
      fieldName: fieldChanged,
      oldValue: oldValue,
      newValue: newValue,
      reason: reason || `Updated task ${fieldChanged}`,
      source: 'web',
      req
    });

    const updated = await Task.findById(task._id)
      .populate('assignedTo', 'name email role avatar')
      .populate('createdBy', 'name email');

    res.json(updated);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

// DELETE /api/tasks/:taskId - Delete task with audit log
exports.deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { reason } = req.body || {};

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    const project = await Project.findById(task.projectId);
    const taskName = task.title;

    await Task.findByIdAndDelete(taskId);

    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'DELETE',
      entityType: 'Task',
      entityId: taskId,
      entityName: taskName,
      projectId: task.projectId,
      projectName: project?.name || '',
      fieldName: null,
      oldValue: { title: task.title, status: task.status },
      newValue: null,
      reason: reason || 'Task removed from project',
      source: 'web',
      req
    });

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
};
