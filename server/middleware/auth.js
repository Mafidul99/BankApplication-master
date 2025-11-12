import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// @desc    Authentication middleware
// @access  Private
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-here');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

// @desc    Admin authorization middleware
// @access  Private/Admin
const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-here');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token is not valid'
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    });
  }
};

// @desc    Optional authentication middleware (doesn't throw error if no token)
// @access  Optional
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-here');
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
};

// @desc    Check if user is the owner of resource or admin
// @access  Private
const ownerOrAdmin = (resourceUserIdField = 'user') => {
  return (req, res, next) => {
    try {
      const resourceUserId = req[resourceUserIdField]?._id || req[resourceUserIdField];
      
      if (req.user.role === 'admin' || req.user._id.toString() === resourceUserId?.toString()) {
        return next();
      }

      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    } catch (error) {
      console.error('Owner or admin middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error in authorization'
      });
    }
  };
};

export { auth, adminAuth, optionalAuth, ownerOrAdmin };
export default auth;