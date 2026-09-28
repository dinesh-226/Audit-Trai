const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const { protect, authorize } = require('../middleware/auth');
const { createAuditLog } = require('../services/auditEngine');

const JWT_SECRET =
  process.env.JWT_SECRET || 'fallback_secret_audit_trail_key_2026';

// =========================
// LOGIN
// =========================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Email and password are required'
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim()
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        error: 'Your account has been deactivated'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        userId: user.userId,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    // Audit login - failure should NOT stop login
    try {
      await createAuditLog({
        userId: user.userId,
        username: user.name,
        userRole: user.role,
        action: 'USER_LOGIN',
        entityType: 'User',
        entityId: user.userId,
        location: user.assignedPort || 'Maritime Command Center',
        ipAddress: req.ip,
        newValue: {
          lastLogin: user.lastLogin
        }
      });
    } catch (auditError) {
      console.error('Login audit error:', auditError.message);
    }

    return res.json({
      success: true,
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

    return res.status(500).json({
      error: 'Internal server error during authentication'
    });
  }
});


// =========================
// REGISTER
// =========================
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'viewer',
      department,
      assignedPort
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: 'Name, email, and password are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Password must be at least 6 characters long'
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    const existing = await User.findOne({
      email: cleanEmail
    });

    if (existing) {
      return res.status(409).json({
        error: 'An account with this email already exists'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const count = await User.countDocuments();

    const userId = `USR-${String(count + 1).padStart(3, '0')}`;

    const allowedRoles = [
      'admin',
      'port_manager',
      'ship_manager',
      'inspector',
      'viewer'
    ];

    const finalRole = allowedRoles.includes(role)
      ? role
      : 'viewer';

    const user = new User({
      userId,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: finalRole,
      department: department || 'Maritime Operations',
      assignedPort: assignedPort || 'Mumbai Port',
      avatar:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
    });

    await user.save();

    const token = jwt.sign(
      {
        id: user._id,
        userId: user.userId,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      {
        expiresIn: '7d'
      }
    );

    // Audit registration - failure should NOT stop registration
    try {
      await createAuditLog({
        userId: user.userId,
        username: user.name,
        userRole: user.role,
        action: 'USER_REGISTERED',
        entityType: 'User',
        entityId: user.userId,
        location: user.assignedPort,
        ipAddress: req.ip,
        newValue: {
          email: user.email,
          role: user.role
        }
      });
    } catch (auditError) {
      console.error(
        'Registration audit error:',
        auditError.message
      );
    }

    return res.status(201).json({
      success: true,
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
    console.error('Registration error:', error);

    return res.status(500).json({
      error: 'Failed to register new user',
      details: process.env.NODE_ENV !== 'production'
        ? error.message
        : undefined
    });
  }
});


// =========================
// CURRENT USER PROFILE
// =========================
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findOne({
      userId: req.user.userId
    }).select('-password');

    if (!user) {
      return res.status(404).json({
        error: 'User profile not found'
      });
    }

    return res.json(user);

  } catch (error) {
    console.error('Profile error:', error);

    return res.status(500).json({
      error: 'Failed to retrieve user profile'
    });
  }
});


// =========================
// DEMO USERS
// =========================
router.get('/demo-users', async (req, res) => {
  try {
    const users = await User.find({
      isActive: true
    }).select(
      'userId name email role department assignedPort assignedShipId avatar'
    );

    return res.json(users);

  } catch (error) {
    console.error('Demo users error:', error);

    return res.status(500).json({
      error: 'Failed to fetch demo users'
    });
  }
});


// =========================
// UPDATE USER ROLE
// ADMIN ONLY
// =========================
router.patch(
  '/users/:userId/role',
  protect,
  authorize('admin'),
  async (req, res) => {
    try {
      const { role } = req.body;

      const allowedRoles = [
        'admin',
        'port_manager',
        'ship_manager',
        'inspector',
        'viewer'
      ];

      if (!allowedRoles.includes(role)) {
        return res.status(400).json({
          error: 'Invalid role'
        });
      }

      const targetUser = await User.findOne({
        userId: req.params.userId
      });

      if (!targetUser) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      const previousRole = targetUser.role;

      targetUser.role = role;

      await targetUser.save();

      try {
        await createAuditLog({
          userId: req.user.userId,
          username: req.user.name,
          userRole: req.user.role,
          action: 'USER_ROLE_MODIFIED',
          entityType: 'User',
          entityId: targetUser.userId,
          previousValue: {
            role: previousRole
          },
          newValue: {
            role
          }
        });
      } catch (auditError) {
        console.error(
          'Role audit error:',
          auditError.message
        );
      }

      return res.json({
        message: 'User role updated successfully',
        user: targetUser
      });

    } catch (error) {
      console.error('Update role error:', error);

      return res.status(500).json({
        error: 'Failed to update user role'
      });
    }
  }
);


module.exports = router;