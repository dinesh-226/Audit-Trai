const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { requireAuth, requireRole, JWT_SECRET } = require('../middleware/auth');
const { createAuditLog } = require('../services/auditEngine');

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      { userId: user.userId, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Create login audit log
    await createAuditLog({
      userId: user.userId,
      username: user.name,
      userRole: user.role,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user.userId,
      location: user.assignedPort || 'Maritime Command Center',
      ipAddress: req.ip,
      newValue: { lastLogin: user.lastLogin }
    });

    res.json({
      token,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        assignedPort: user.assignedPort,
        assignedShipId: user.assignedShipId,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'viewer', department, assignedPort } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const count = await User.countDocuments();
    const userId = `USR-${String(count + 1).padStart(3, '0')}`;

    const user = new User({
      userId,
      name,
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: ['admin', 'port_manager', 'ship_manager', 'inspector', 'viewer'].includes(role) ? role : 'viewer',
      department: department || 'Maritime Operations',
      assignedPort: assignedPort || 'Mumbai Port',
      avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`
    });

    await user.save();

    const token = jwt.sign(
      { userId: user.userId, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await createAuditLog({
      userId: user.userId,
      username: user.name,
      userRole: user.role,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: user.userId,
      location: user.assignedPort,
      newValue: { email: user.email, role: user.role }
    });

    res.status(201).json({
      token,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        assignedPort: user.assignedPort,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register new user' });
  }
});

// Get Current User Profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId }).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve user profile' });
  }
});

// List all Demo Users for Quick-Switcher
router.get('/demo-users', async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select('userId name email role department assignedPort assignedShipId avatar');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch demo users' });
  }
});

// Update User Role (Admin only)
router.patch('/users/:userId/role', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    const targetUser = await User.findOne({ userId: req.params.userId });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const prevRole = targetUser.role;
    targetUser.role = role;
    await targetUser.save();

    await createAuditLog({
      userId: req.user.userId,
      username: req.user.name,
      userRole: req.user.role,
      action: 'USER_ROLE_MODIFIED',
      entityType: 'User',
      entityId: targetUser.userId,
      previousValue: { role: prevRole },
      newValue: { role }
    });

    res.json({ message: 'User role updated successfully', user: targetUser });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

module.exports = router;
