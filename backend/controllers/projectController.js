const Project = require('../models/Project');
const Task = require('../models/Task');
const logAudit = require('../utils/auditLogger');

// GET /api/projects - List all projects
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('members', 'name email role department avatar')
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });

    // Attach task count and metrics
    const projectList = await Promise.all(
      projects.map(async (p) => {
        const totalTasks = await Task.countDocuments({ projectId: p._id });
        const completedTasks = await Task.countDocuments({ projectId: p._id, status: 'Done' });
        return {
          ...p.toObject(),
          totalTasks,
          completedTasks
        };
      })
    );

    res.json(projectList);
  } catch (error) {
    console.error('Fetch projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

// GET /api/projects/:projectId - Get single project details
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('members', 'name email role department avatar')
      .populate('createdBy', 'name email');

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const totalTasks = await Task.countDocuments({ projectId: project._id });
    const completedTasks = await Task.countDocuments({ projectId: project._id, status: 'Done' });

    res.json({
      ...project.toObject(),
      totalTasks,
      completedTasks
    });
  } catch (error) {
    console.error('Fetch project detail error:', error);
    res.status(500).json({ error: 'Failed to fetch project details' });
  }
};

// POST /api/projects - Create new project with audit logging
exports.createProject = async (req, res) => {
  try {
    const { name, code, description, budget, category, members = [], reason } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const project = await Project.create({
      name,
      code: code || undefined,
      description: description || '',
      budget: Number(budget) || 0,
      category: category || 'Software Development',
      members: members.length > 0 ? members : [req.user._id],
      createdBy: req.user._id
    });

    // Write Audit Log
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'CREATE',
      entityType: 'Project',
      entityId: project._id.toString(),
      entityName: project.name,
      projectId: project._id,
      projectName: project.name,
      fieldName: null,
      oldValue: null,
      newValue: {
        name: project.name,
        code: project.code,
        budget: project.budget,
        category: project.category
      },
      reason: reason || 'Project creation in workspace',
      source: 'web',
      req
    });

    const populated = await Project.findById(project._id)
      .populate('members', 'name email role department avatar')
      .populate('createdBy', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

// PUT /api/projects/:projectId - Update project metadata
exports.updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description, category, status, reason } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const oldData = {
      name: project.name,
      description: project.description,
      status: project.status,
      category: project.category
    };

    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (category) project.category = category;
    if (status) project.status = status;

    await project.save();

    const newData = {
      name: project.name,
      description: project.description,
      status: project.status,
      category: project.category
    };

    // Audit Log for project update
    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'UPDATE',
      entityType: 'Project',
      entityId: project._id.toString(),
      entityName: project.name,
      projectId: project._id,
      projectName: project.name,
      fieldName: 'general_info',
      oldValue: oldData,
      newValue: newData,
      reason: reason || 'Project metadata modified',
      source: 'web',
      req
    });

    const updated = await Project.findById(project._id)
      .populate('members', 'name email role department avatar')
      .populate('createdBy', 'name email');

    res.json(updated);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

// PUT /api/projects/:projectId/budget - Update budget with audit log
exports.updateBudget = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { amount, reason } = req.body;
    const user = req.user;

    if (amount === undefined || isNaN(Number(amount))) {
      return res.status(400).json({ error: 'Valid numeric budget amount is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const oldAmount = project.budget;
    const newAmount = Number(amount);

    project.budget = newAmount;
    await project.save();

    // Log Audit Entry
    await logAudit({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      userRole: user.role,
      action: 'UPDATE',
      entityType: 'Budget',
      entityId: projectId,
      entityName: `${project.name} Budget`,
      projectId: project._id,
      projectName: project.name,
      fieldName: 'amount',
      oldValue: oldAmount,
      newValue: newAmount,
      reason: reason || 'Budget allocation adjustment',
      source: 'web',
      req
    });

    res.json({
      success: true,
      message: 'Budget updated and audit log recorded successfully',
      project: {
        _id: project._id,
        name: project.name,
        budget: project.budget
      }
    });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ error: 'Failed to update budget' });
  }
};

// POST /api/projects/:projectId/members - Add member with audit
exports.addMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, reason } = req.body;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (project.members.includes(userId)) {
      return res.status(400).json({ error: 'User is already a member of this project' });
    }

    project.members.push(userId);
    await project.save();

    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'UPDATE',
      entityType: 'Member',
      entityId: userId,
      entityName: 'Project Team Member',
      projectId: project._id,
      projectName: project.name,
      fieldName: 'members',
      oldValue: 'Non-member',
      newValue: 'Added as Member',
      reason: reason || 'Assigned to project team',
      source: 'web',
      req
    });

    const updated = await Project.findById(projectId).populate('members', 'name email role department avatar');
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add member' });
  }
};

// DELETE /api/projects/:projectId - Delete project with audit log
exports.deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { reason } = req.body || {};

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const deletedProjectData = {
      name: project.name,
      code: project.code,
      budget: project.budget
    };

    await Project.findByIdAndDelete(projectId);
    await Task.deleteMany({ projectId });

    await logAudit({
      userId: req.user._id,
      userEmail: req.user.email,
      userName: req.user.name,
      userRole: req.user.role,
      action: 'DELETE',
      entityType: 'Project',
      entityId: projectId,
      entityName: project.name,
      projectId: null,
      projectName: project.name,
      fieldName: null,
      oldValue: deletedProjectData,
      newValue: null,
      reason: reason || 'Project decommissioned/deleted by user',
      source: 'web',
      isRisky: true,
      riskLevel: 'high',
      req
    });

    res.json({ success: true, message: 'Project removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
};
