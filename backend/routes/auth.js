const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const { protect, authorize } = require('../middleware/auth');
const { createAuditLog } = require('../services/auditEngine');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_audit_trail_key_2026';

const ALLOWED_ROLES = [
  'admin',
  'port_manager',
  'ship_manager',
  'inspector',
  'viewer'
];

const createToken = (user) =>
  jwt.sign(
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

const userResponse = (user) => ({
  userId: user.userId,
  name: user.name,
  email: user.email,
  role: user.role,
  department: user.department,
  assignedPort: user.assignedPort,
  assignedShipId: user.assignedShipId,
  avatar: user.avatar,
  approvalStatus: user.approvalStatus || 'approved',
  isActive: user.isActive !== false,
  approvedBy: user.approvedBy,
  approvalDate: user.approvalDate,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt
});

// Helper to generate next unique sequential user ID
async function generateNextUserId() {
  let userNumber = 1;
  while (true) {
    const userId = `USR-${String(userNumber).padStart(3, '0')}`;
    const exists = await User.findOne({ userId }).select('_id');
    if (!exists) return userId;
    userNumber++;
  }
}

// =========================
// 1. LOGIN
// =========================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      user.lastFailedLogin = new Date();
      user.lastFailedIp = req.ip;
      await user.save();

      try {
        await createAuditLog({
          userId: user.userId,
          username: user.name,
          userRole: user.role,
          action: 'FAILED_LOGIN_ATTEMPT',
          entityType: 'Security',
          entityId: user.userId,
          location: user.assignedPort || 'Unknown Terminal',
          ipAddress: req.ip,
          newValue: { failedAttempts: user.failedLoginAttempts }
        });
      } catch (e) {}

      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check Approval Status
    if (user.approvalStatus === 'pending') {
      return res.status(403).json({
        error: 'Your account is pending approval by the System Administrator (Capt. Rajesh Menon). You will be able to log in once approved.'
      });
    }

    if (user.approvalStatus === 'rejected') {
      return res.status(403).json({
        error: 'Your account registration was rejected by the System Administrator. Please contact fleet security.'
      });
    }

    // Check Active Status
    if (user.isActive === false) {
      return res.status(403).json({
        error: 'Your account has been deactivated. Please contact an administrator.'
      });
    }

    // Reset failed login attempts & update last login
    user.failedLoginAttempts = 0;
    user.lastLogin = new Date();
    await user.save();

    const token = createToken(user);

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
        newValue: { lastLogin: user.lastLogin }
      });
    } catch (auditError) {
      console.error('Login audit error:', auditError.message);
    }

    return res.json({
      success: true,
      token,
      user: userResponse(user)
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

// =========================
// 2. REGISTER
// =========================
router.post('/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = 'viewer',
      department,
      assignedPort,
      assignedShipId
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });

    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await generateNextUserId();
    const finalRole = ALLOWED_ROLES.includes(role) ? role : 'viewer';

    // RBAC Policy: Privileged roles (admin, port_manager, ship_manager, inspector) require admin approval
    const requiresApproval = finalRole !== 'viewer';
    const approvalStatus = requiresApproval ? 'pending' : 'approved';
    const isActive = !requiresApproval;

    const user = new User({
      userId,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: finalRole,
      department: department || (finalRole === 'viewer' ? 'Compliance & Audit Observer' : 'Maritime Operations'),
      assignedPort: assignedPort || 'Mumbai Port',
      assignedShipId: assignedShipId || null,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      approvalStatus,
      isActive,
      createdBy: 'Self-Registration'
    });

    await user.save();

    if (requiresApproval) {
      try {
        await createAuditLog({
          userId: user.userId,
          username: user.name,
          userRole: user.role,
          action: 'USER_REGISTRATION_PENDING_APPROVAL',
          entityType: 'User',
          entityId: user.userId,
          location: user.assignedPort,
          ipAddress: req.ip,
          newValue: {
            email: user.email,
            role: user.role,
            approvalStatus: 'pending'
          }
        });
      } catch (auditError) {
        console.error('Pending registration audit error:', auditError.message);
      }

      return res.status(201).json({
        success: true,
        requiresApproval: true,
        message: 'Registration submitted successfully. Officer accounts require one-time approval by System Administrator (Capt. Rajesh Menon).',
        user: userResponse(user)
      });
    }

    // Viewers are instant-access
    const token = createToken(user);
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
      console.error('Registration audit error:', auditError.message);
    }

    return res.status(201).json({
      success: true,
      requiresApproval: false,
      token,
      user: userResponse(user)
    });

  } catch (error) {
    console.error('Registration error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    return res.status(500).json({ error: 'Failed to register new user' });
  }
});

// =========================
// 3. CURRENT USER PROFILE
// =========================
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId }).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }
    return res.json(userResponse(user));
  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ error: 'Failed to retrieve user profile' });
  }
});

// Update Profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, department, assignedPort, assignedShipId, avatar } = req.body;
    const user = await User.findOne({ userId: req.user.userId });
    if (!user) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    if (name) user.name = name.trim();
    if (department) user.department = department.trim();
    if (assignedPort) user.assignedPort = assignedPort.trim();
    if (assignedShipId !== undefined) user.assignedShipId = assignedShipId;
    if (avatar) user.avatar = avatar;

    await user.save();
    return res.json(userResponse(user));
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Failed to update user profile' });
  }
});

// =========================
// 4. DEMO USERS (Public listing for quick demo login)
// =========================
router.get('/demo-users', async (req, res) => {
  try {
    const users = await User.find({
      isActive: true,
      approvalStatus: { $ne: 'rejected' }
    }).select('userId name email role department assignedPort assignedShipId avatar approvalStatus isActive');

    return res.json(users);
  } catch (error) {
    console.error('Demo users error:', error);
    return res.status(500).json({ error: 'Failed to fetch demo users' });
  }
});

// =========================
// 5. PENDING USERS (Admin Only)
// =========================
router.get('/pending-users', protect, authorize('admin'), async (req, res) => {
  try {
    const pendingUsers = await User.find({ approvalStatus: 'pending' })
      .sort({ createdAt: -1 })
      .select('userId name email role department assignedPort assignedShipId avatar approvalStatus isActive createdAt');

    return res.json(pendingUsers);
  } catch (error) {
    console.error('Get pending users error:', error);
    return res.status(500).json({ error: 'Failed to fetch pending users' });
  }
});

// =========================
// 6. UPDATE USER APPROVAL (Admin Only - Approve / Reject)
// =========================
router.patch('/users/:userId/approval', protect, authorize('admin'), async (req, res) => {
  try {
    const { action, status } = req.body;
    const targetUserId = req.params.userId;

    const normalizedAction = (action || status || '').toLowerCase();
    const isApprove = normalizedAction === 'approve' || normalizedAction === 'approved';
    const isReject = normalizedAction === 'reject' || normalizedAction === 'rejected';

    if (!isApprove && !isReject) {
      return res.status(400).json({ error: "Invalid approval action. Must be 'approve' or 'reject'." });
    }

    const targetUser = await User.findOne({
      $or: [
        { userId: targetUserId },
        { _id: targetUserId.match(/^[0-9a-fA-F]{24}$/) ? targetUserId : null }
      ]
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const previousStatus = targetUser.approvalStatus;
    const previousActive = targetUser.isActive;

    if (isApprove) {
      targetUser.approvalStatus = 'approved';
      targetUser.isActive = true;
      targetUser.approvedBy = req.user.name || req.user.userId;
      targetUser.approvalDate = new Date();
    } else {
      targetUser.approvalStatus = 'rejected';
      targetUser.isActive = false;
      targetUser.approvedBy = req.user.name || req.user.userId;
      targetUser.approvalDate = new Date();
    }

    await targetUser.save();

    try {
      await createAuditLog({
        userId: req.user.userId,
        username: req.user.name,
        userRole: req.user.role,
        action: isApprove ? 'USER_APPROVAL_GRANTED' : 'USER_APPROVAL_REJECTED',
        entityType: 'User',
        entityId: targetUser.userId,
        location: req.user.assignedPort || 'Central Command',
        previousValue: {
          approvalStatus: previousStatus,
          isActive: previousActive
        },
        newValue: {
          approvalStatus: targetUser.approvalStatus,
          isActive: targetUser.isActive,
          approvedBy: targetUser.approvedBy,
          approvalDate: targetUser.approvalDate
        }
      });
    } catch (auditError) {
      console.error('Approval audit error:', auditError.message);
    }

    return res.json({
      success: true,
      message: `Officer ${targetUser.name} has been ${isApprove ? 'APPROVED & ACTIVATED' : 'REJECTED'}.`,
      user: userResponse(targetUser)
    });

  } catch (error) {
    console.error('Update approval error:', error);
    return res.status(500).json({ error: 'Failed to process officer approval' });
  }
});

// =========================
// 7. GET ALL USERS (Admin / Protected)
// =========================
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { role, status, search } = req.query;
    const filter = {};

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (status === 'pending') {
      filter.approvalStatus = 'pending';
    } else if (status === 'active') {
      filter.isActive = true;
      filter.approvalStatus = 'approved';
    } else if (status === 'inactive') {
      filter.isActive = false;
    } else if (status === 'rejected') {
      filter.approvalStatus = 'rejected';
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });
    return res.json(users.map(userResponse));
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Failed to fetch users list' });
  }
});

// =========================
// 8. CREATE USER BY ADMIN
// =========================
router.post('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, email, password, role, department, assignedPort, assignedShipId } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: cleanEmail });
    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await generateNextUserId();
    const finalRole = ALLOWED_ROLES.includes(role) ? role : 'viewer';

    const user = new User({
      userId,
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
      role: finalRole,
      department: department || 'Maritime Operations',
      assignedPort: assignedPort || 'Mumbai Port',
      assignedShipId: assignedShipId || null,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      approvalStatus: 'approved',
      isActive: true,
      approvedBy: req.user.name,
      approvalDate: new Date(),
      createdBy: `Admin (${req.user.name})`
    });

    await user.save();

    try {
      await createAuditLog({
        userId: req.user.userId,
        username: req.user.name,
        userRole: req.user.role,
        action: 'USER_CREATED_BY_ADMIN',
        entityType: 'User',
        entityId: user.userId,
        location: req.user.assignedPort,
        newValue: {
          userId: user.userId,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (e) {}

    return res.status(201).json({
      success: true,
      message: 'Officer account created successfully',
      user: userResponse(user)
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ error: 'Failed to create user' });
  }
});

// =========================
// 9. TOGGLE USER STATUS (Activate / Deactivate)
// =========================
router.patch('/users/:userId/status', protect, authorize('admin'), async (req, res) => {
  try {
    const { isActive } = req.body;
    const targetUserId = req.params.userId;

    const targetUser = await User.findOne({
      $or: [
        { userId: targetUserId },
        { _id: targetUserId.match(/^[0-9a-fA-F]{24}$/) ? targetUserId : null }
      ]
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.userId === req.user.userId) {
      return res.status(400).json({ error: 'You cannot deactivate your own administrative account.' });
    }

    const previousStatus = targetUser.isActive;
    targetUser.isActive = Boolean(isActive);
    await targetUser.save();

    try {
      await createAuditLog({
        userId: req.user.userId,
        username: req.user.name,
        userRole: req.user.role,
        action: 'USER_STATUS_TOGGLED',
        entityType: 'User',
        entityId: targetUser.userId,
        previousValue: { isActive: previousStatus },
        newValue: { isActive: targetUser.isActive }
      });
    } catch (e) {}

    return res.json({
      success: true,
      message: `User ${targetUser.name} has been ${targetUser.isActive ? 'ACTIVATED' : 'DEACTIVATED'}.`,
      user: userResponse(targetUser)
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    return res.status(500).json({ error: 'Failed to update user status' });
  }
});

// =========================
// 10. UPDATE USER ROLE (Admin Only)
// =========================
router.patch('/users/:userId/role', protect, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const targetUser = await User.findOne({
      $or: [
        { userId: req.params.userId },
        { _id: req.params.userId.match(/^[0-9a-fA-F]{24}$/) ? req.params.userId : null }
      ]
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
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
        previousValue: { role: previousRole },
        newValue: { role }
      });
    } catch (e) {}

    return res.json({
      message: 'User role updated successfully',
      user: userResponse(targetUser)
    });
  } catch (error) {
    console.error('Update role error:', error);
    return res.status(500).json({ error: 'Failed to update user role' });
  }
});

// =========================
// 11. ADMIN RESET USER PASSWORD
// =========================
router.post('/users/:userId/reset-password', protect, authorize('admin'), async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const targetUser = await User.findOne({
      $or: [
        { userId: req.params.userId },
        { _id: req.params.userId.match(/^[0-9a-fA-F]{24}$/) ? req.params.userId : null }
      ]
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    targetUser.password = await bcrypt.hash(newPassword, 10);
    await targetUser.save();

    try {
      await createAuditLog({
        userId: req.user.userId,
        username: req.user.name,
        userRole: req.user.role,
        action: 'USER_PASSWORD_RESET_BY_ADMIN',
        entityType: 'User',
        entityId: targetUser.userId
      });
    } catch (e) {}

    return res.json({ success: true, message: `Password reset successfully for ${targetUser.name}` });
  } catch (error) {
    console.error('Admin reset password error:', error);
    return res.status(500).json({ error: 'Failed to reset user password' });
  }
});

// =========================
// 12. DELETE USER (Admin Only)
// =========================
router.delete('/users/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const targetUser = await User.findOne({
      $or: [
        { userId: targetUserId },
        { _id: targetUserId.match(/^[0-9a-fA-F]{24}$/) ? targetUserId : null }
      ]
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.userId === req.user.userId) {
      return res.status(400).json({ error: 'You cannot delete your own administrative account.' });
    }

    await User.deleteOne({ _id: targetUser._id });

    try {
      await createAuditLog({
        userId: req.user.userId,
        username: req.user.name,
        userRole: req.user.role,
        action: 'USER_DELETED',
        entityType: 'User',
        entityId: targetUser.userId,
        previousValue: {
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role
        }
      });
    } catch (e) {}

    return res.json({ success: true, message: `User ${targetUser.name} (${targetUser.userId}) deleted successfully.` });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

// =========================
// 13. SECURITY STATS (Admin Only)
// =========================
router.get('/security-stats', protect, authorize('admin'), async (req, res) => {
  try {
    const [totalUsers, activeUsers, inactiveUsers, pendingUsers, suspicious] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isActive: true, approvalStatus: 'approved' }),
      User.countDocuments({ $or: [{ isActive: false }, { approvalStatus: 'rejected' }] }),
      User.countDocuments({ approvalStatus: 'pending' }),
      User.find({ failedLoginAttempts: { $gt: 0 } }).select('userId name email failedLoginAttempts lastFailedLogin lastFailedIp')
    ]);

    return res.json({
      totalUsers,
      activeUsers,
      inactiveUsers,
      pendingUsers,
      suspiciousAccountsCount: suspicious.length,
      suspiciousAccounts: suspicious
    });
  } catch (error) {
    console.error('Security stats error:', error);
    return res.status(500).json({ error: 'Failed to fetch security stats' });
  }
});

// =========================
// 14. FORGOT PASSWORD (Mock Code Delivery)
// =========================
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ error: 'No account registered with this email' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.resetPasswordCode = code;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();

    return res.json({
      success: true,
      message: `Reset verification code sent to ${user.email}. (Demo Code: ${code})`,
      demoCode: code
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Failed to initiate password reset' });
  }
});

// =========================
// 15. RESET PASSWORD WITH CODE
// =========================
router.post('/reset-password', async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, verification code, and new password are required' });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordCode = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({ success: true, message: 'Password reset successfully. You may now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;