import User from '../models/User.js';
import Loan from '../models/Loan.js';
import Transaction from '../models/Transaction.js';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};

    // Role filter
    if (req.query.role) {
      filter.role = req.query.role;
    }

    // Status filter
    if (req.query.status) {
      if (req.query.status === 'active') {
        filter.isActive = true;
      } else if (req.query.status === 'inactive') {
        filter.isActive = false;
      }
    }

    // Search filter
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { phone: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users',
      error: error.message
    });
  }
};

// @desc    Get user by ID (Admin only)
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user statistics
    const loanStats = await Loan.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          totalLoanAmount: { $sum: '$loanAmount' },
          activeLoans: {
            $sum: {
              $cond: [{ $in: ['$status', ['approved', 'active']] }, 1, 0]
            }
          }
        }
      }
    ]);

    const transactionStats = await Transaction.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    const userWithStats = {
      ...user.toObject(),
      stats: {
        loans: loanStats[0] || { totalLoans: 0, totalLoanAmount: 0, activeLoans: 0 },
        transactions: transactionStats[0] || { totalTransactions: 0, totalAmount: 0 }
      }
    };

    res.json({
      success: true,
      user: userWithStats
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user',
      error: error.message
    });
  }
};

// @desc    Create new user (Admin only)
// @route   POST /api/users
// @access  Private/Admin
export const createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, phone, address, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phone: phone }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      phone,
      address,
      role: role || 'user'
    });

    // Remove password from response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      address: user.address,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating user',
      error: error.message
    });
  }
};

// @desc    Update user (Admin only)
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, phone, address, isActive } = req.body;

    // Check if email or phone already exists (excluding current user)
    const existingUser = await User.findOne({
      $and: [
        { _id: { $ne: req.params.id } },
        {
          $or: [
            { email: email?.toLowerCase() },
            { phone: phone }
          ]
        }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Another user with this email or phone already exists'
      });
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (email) updateData.email = email.toLowerCase();
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user',
      error: error.message
    });
  }
};

// @desc    Update user role (Admin only)
// @route   PUT /api/users/:id/role
// @access  Private/Admin
export const updateUserRole = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { role } = req.body;

    // Prevent admin from changing their own role
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      user
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating user role',
      error: error.message
    });
  }
};

// @desc    Delete user (Admin only)
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Check if user has existing loans
    const userLoans = await Loan.countDocuments({ user: req.params.id });
    if (userLoans > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete user with existing loans. Deactivate instead.'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting user',
      error: error.message
    });
  }
};

// @desc    Deactivate user (Admin only)
// @route   PATCH /api/users/:id/deactivate
// @access  Private/Admin
export const deactivateUser = async (req, res) => {
  try {
    // Prevent admin from deactivating themselves
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate your own account'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deactivated successfully',
      user
    });

  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deactivating user',
      error: error.message
    });
  }
};

// @desc    Activate user (Admin only)
// @route   PATCH /api/users/:id/activate
// @access  Private/Admin
export const activateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User activated successfully',
      user
    });

  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while activating user',
      error: error.message
    });
  }
};

// @desc    Get current user's profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user profile',
      error: error.message
    });
  }
};

// @desc    Update current user's profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, phone, address } = req.body;

    // Check if phone already exists (excluding current user)
    if (phone) {
      const existingUser = await User.findOne({
        _id: { $ne: req.user._id },
        phone: phone
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Another user with this phone number already exists'
        });
      }
    }

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    console.error('Update user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile',
      error: error.message
    });
  }
};

// @desc    Change current user's password
// @route   PUT /api/users/change-password
// @access  Private
export const changeUserPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Find user with password
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isCurrentPasswordCorrect = await user.correctPassword(currentPassword, user.password);
    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change user password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while changing password',
      error: error.message
    });
  }
};

// @desc    Get user statistics (Admin only)
// @route   GET /api/users/stats
// @access  Private/Admin
export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalRegularUsers = await User.countDocuments({ role: 'user' });
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    // Users created in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsersLast30Days = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Monthly user registration stats for the last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    // Users with loans statistics
    const usersWithLoans = await Loan.aggregate([
      {
        $group: {
          _id: '$user',
          loanCount: { $sum: 1 },
          totalLoanAmount: { $sum: '$loanAmount' }
        }
      },
      {
        $group: {
          _id: null,
          userCount: { $sum: 1 },
          avgLoansPerUser: { $avg: '$loanCount' },
          avgLoanAmountPerUser: { $avg: '$totalLoanAmount' }
        }
      }
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalAdmins,
        totalRegularUsers,
        activeUsers,
        inactiveUsers,
        newUsersLast30Days,
        monthlyStats,
        usersWithLoans: usersWithLoans[0] || {
          userCount: 0,
          avgLoansPerUser: 0,
          avgLoanAmountPerUser: 0
        }
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user statistics',
      error: error.message
    });
  }
};

// @desc    Get user's loans
// @route   GET /api/users/my-loans & /api/users/:id/loans
// @access  Private (for own loans) & Private/Admin (for any user)
export const getUserLoans = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Determine user ID - for admin accessing specific user or user accessing their own
    const userId = req.params.id || req.user._id;

    // If admin is accessing another user's loans, verify the user exists
    if (req.params.id && req.params.id !== req.user._id.toString()) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    }

    const loans = await Loan.find({ user: userId })
      .populate('user', 'name email phone')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Loan.countDocuments({ user: userId });
    const totalPages = Math.ceil(total / limit);

    // Get loan statistics for this user
    const loanStats = await Loan.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          totalLoanAmount: { $sum: '$loanAmount' },
          totalRemainingBalance: { $sum: '$remainingBalance' },
          activeLoans: {
            $sum: {
              $cond: [{ $in: ['$status', ['approved', 'active']] }, 1, 0]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      loans,
      stats: loanStats[0] || {
        totalLoans: 0,
        totalLoanAmount: 0,
        totalRemainingBalance: 0,
        activeLoans: 0
      },
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get user loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user loans',
      error: error.message
    });
  }
};

// @desc    Get user's transactions
// @route   GET /api/users/my-transactions & /api/users/:id/transactions
// @access  Private (for own transactions) & Private/Admin (for any user)
export const getUserTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Determine user ID - for admin accessing specific user or user accessing their own
    const userId = req.params.id || req.user._id;

    // If admin is accessing another user's transactions, verify the user exists
    if (req.params.id && req.params.id !== req.user._id.toString()) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    }

    const transactions = await Transaction.find({ user: userId })
      .populate('user', 'name email phone')
      .populate('loan', 'loanAccountNumber loanType')
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({ user: userId });
    const totalPages = Math.ceil(total / limit);

    // Get transaction statistics for this user
    const transactionStats = await Transaction.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          paymentCount: {
            $sum: {
              $cond: [{ $eq: ['$type', 'payment'] }, 1, 0]
            }
          },
          totalPayments: {
            $sum: {
              $cond: [{ $eq: ['$type', 'payment'] }, '$amount', 0]
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      transactions,
      stats: transactionStats[0] || {
        totalTransactions: 0,
        totalAmount: 0,
        paymentCount: 0,
        totalPayments: 0
      },
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching user transactions',
      error: error.message
    });
  }
};