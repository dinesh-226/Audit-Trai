// middleware/auth.js - Authentication & Role Authorization Middleware
const jwt = require('jsonwebtoken');
const User = require('../models/user');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_audit_trail_key_2026';

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route. Missing authentication token.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = decoded.userId
      ? await User.findOne({ userId: decoded.userId })
      : await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact an administrator.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized. Invalid or expired token.',
      error: err.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
    });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user ? req.user.role : 'guest'}' is not authorized to access this resource.`
      });
    }
    next();
  };
};

// Check if user is verified
const requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({
      success: false,
      isVerified: false,
      message: 'Please verify your email address to access this feature.'
    });
  }
  next();
};

module.exports = {
  JWT_SECRET,
  requireAuth: protect,
  authMiddleware: protect,
  requireRole: authorize,
  protect,
  authorize,
  requireVerified
};
