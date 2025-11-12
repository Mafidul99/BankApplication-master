import Loan from '../models/Loan.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import { validationResult } from 'express-validator';

// @desc    Generate random loan account number
// @return  String
const generateLoanAccountNumber = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `LN${timestamp}${random}`;
};

// @desc    Calculate monthly payment using amortization formula
// @param   loanAmount, annualInterestRate, loanTermInMonths
// @return  Number
const calculateMonthlyPayment = (loanAmount, annualInterestRate, loanTermInMonths) => {
  const monthlyRate = annualInterestRate / 100 / 12;
  const payment = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanTermInMonths) / 
                  (Math.pow(1 + monthlyRate, loanTermInMonths) - 1);
  return Math.round(payment * 100) / 100;
};

// @desc    Get all loans
// @route   GET /api/loans
// @access  Private
export const getLoans = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter based on user role
    let filter = {};
    if (req.user.role !== 'admin') {
      filter.user = req.user._id;
    }

    // Add status filter if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Add loan type filter if provided
    if (req.query.loanType) {
      filter.loanType = req.query.loanType;
    }

    // Add search filter if provided
    if (req.query.search) {
      filter.$or = [
        { loanAccountNumber: { $regex: req.query.search, $options: 'i' } },
        { 'user.name': { $regex: req.query.search, $options: 'i' } },
        { 'user.email': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const loans = await Loan.find(filter)
      .populate('user', 'name email phone')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Loan.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      loans,
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
    console.error('Get loans error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching loans',
      error: error.message
    });
  }
};

// @desc    Get single loan
// @route   GET /api/loans/:id
// @access  Private
export const getLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id)
      .populate('user', 'name email phone address')
      .populate('createdBy', 'name email');

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Check if user has access to this loan
    if (req.user.role !== 'admin' && loan.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this loan'
      });
    }

    // Get related transactions
    const transactions = await Transaction.find({ loan: loan._id })
      .sort({ transactionDate: -1 })
      .limit(10);

    res.json({
      success: true,
      loan: {
        ...loan.toObject(),
        transactions
      }
    });

  } catch (error) {
    console.error('Get loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching loan',
      error: error.message
    });
  }
};

// @desc    Create new loan
// @route   POST /api/loans
// @access  Private
export const createLoan = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      userId,
      loanType,
      loanAmount,
      interestRate,
      loanTerm,
      startDate,
      endDate,
      purpose,
      description
    } = req.body;

    // Determine user for the loan
    const loanUser = req.user.role === 'admin' ? userId : req.user._id;

    // Verify user exists
    const user = await User.findById(loanUser);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate monthly payment
    const monthlyPayment = calculateMonthlyPayment(loanAmount, interestRate, loanTerm);

    // Create loan
    const loan = await Loan.create({
      loanAccountNumber: generateLoanAccountNumber(),
      user: loanUser,
      loanType,
      loanAmount,
      interestRate,
      loanTerm,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      monthlyPayment,
      remainingBalance: loanAmount,
      purpose,
      description,
      createdBy: req.user._id,
      status: req.user.role === 'admin' ? 'approved' : 'pending'
    });

    await loan.populate('user', 'name email phone');
    await loan.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Loan created successfully',
      loan
    });

  } catch (error) {
    console.error('Create loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating loan',
      error: error.message
    });
  }
};

// @desc    Update loan
// @route   PUT /api/loans/:id
// @access  Private
export const updateLoan = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && loan.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to update this loan'
      });
    }

    const updateData = { ...req.body };

    // Recalculate monthly payment if loan amount, interest rate, or term changes
    if (updateData.loanAmount || updateData.interestRate || updateData.loanTerm) {
      const finalLoanAmount = updateData.loanAmount || loan.loanAmount;
      const finalInterestRate = updateData.interestRate || loan.interestRate;
      const finalLoanTerm = updateData.loanTerm || loan.loanTerm;

      updateData.monthlyPayment = calculateMonthlyPayment(
        finalLoanAmount,
        finalInterestRate,
        finalLoanTerm
      );

      // Update remaining balance proportionally if loan amount changes
      if (updateData.loanAmount && updateData.loanAmount !== loan.loanAmount) {
        const ratio = updateData.loanAmount / loan.loanAmount;
        updateData.remainingBalance = Math.round(loan.remainingBalance * ratio * 100) / 100;
      }
    }

    // Only admin can change certain fields
    if (req.user.role !== 'admin') {
      delete updateData.status;
      delete updateData.userId;
    }

    const updatedLoan = await Loan.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('user', 'name email phone')
    .populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Loan updated successfully',
      loan: updatedLoan
    });

  } catch (error) {
    console.error('Update loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating loan',
      error: error.message
    });
  }
};

// @desc    Delete loan
// @route   DELETE /api/loans/:id
// @access  Private/Admin
export const deleteLoan = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Check if loan has transactions
    const transactionCount = await Transaction.countDocuments({ loan: loan._id });
    if (transactionCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete loan with existing transactions'
      });
    }

    await Loan.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Loan deleted successfully'
    });

  } catch (error) {
    console.error('Delete loan error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting loan',
      error: error.message
    });
  }
};

// @desc    Update loan status
// @route   PATCH /api/loans/:id/status
// @access  Private/Admin
export const updateLoanStatus = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { status, remarks } = req.body;

    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Update loan status
    loan.status = status;
    if (remarks) {
      loan.remarks = remarks;
    }

    await loan.save();
    await loan.populate('user', 'name email phone');
    await loan.populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Loan status updated successfully',
      loan
    });

  } catch (error) {
    console.error('Update loan status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating loan status',
      error: error.message
    });
  }
};

// @desc    Get loan statistics
// @route   GET /api/loans/stats
// @access  Private
export const getLoanStats = async (req, res) => {
  try {
    let matchStage = {};

    if (req.user.role !== 'admin') {
      matchStage.user = req.user._id;
    }

    // Overall statistics
    const overallStats = await Loan.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalLoans: { $sum: 1 },
          totalLoanAmount: { $sum: '$loanAmount' },
          totalRemainingBalance: { $sum: '$remainingBalance' },
          totalMonthlyPayment: { $sum: '$monthlyPayment' },
          avgInterestRate: { $avg: '$interestRate' }
        }
      }
    ]);

    // Status-wise statistics
    const statusStats = await Loan.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$loanAmount' },
          avgAmount: { $avg: '$loanAmount' }
        }
      }
    ]);

    // Loan type statistics
    const typeStats = await Loan.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$loanType',
          count: { $sum: 1 },
          totalAmount: { $sum: '$loanAmount' }
        }
      }
    ]);

    // Monthly loan creation stats (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Loan.aggregate([
      {
        $match: {
          ...matchStage,
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          amount: { $sum: '$loanAmount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      success: true,
      stats: {
        overall: overallStats[0] || {
          totalLoans: 0,
          totalLoanAmount: 0,
          totalRemainingBalance: 0,
          totalMonthlyPayment: 0,
          avgInterestRate: 0
        },
        byStatus: statusStats,
        byType: typeStats,
        monthly: monthlyStats
      }
    });

  } catch (error) {
    console.error('Get loan stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching loan statistics',
      error: error.message
    });
  }
};

// @desc    Get user's loans
// @route   GET /api/loans/user/:userId
// @access  Private/Admin
export const getUserLoans = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const loans = await Loan.find({ user: req.params.userId })
      .populate('user', 'name email phone')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Loan.countDocuments({ user: req.params.userId });
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      loans,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
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

// @desc    Calculate loan amortization schedule
// @route   GET /api/loans/:id/amortization
// @access  Private
export const getAmortizationSchedule = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && loan.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this loan'
      });
    }

    const monthlyRate = loan.interestRate / 100 / 12;
    let balance = loan.loanAmount;
    const schedule = [];

    for (let month = 1; month <= loan.loanTerm; month++) {
      const interest = balance * monthlyRate;
      const principal = loan.monthlyPayment - interest;
      const endingBalance = balance - principal;

      schedule.push({
        month,
        paymentDate: new Date(loan.startDate.getTime() + (month * 30 * 24 * 60 * 60 * 1000)),
        beginningBalance: Math.round(balance * 100) / 100,
        monthlyPayment: loan.monthlyPayment,
        principal: Math.round(principal * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        endingBalance: Math.round(endingBalance * 100) / 100
      });

      balance = endingBalance;
    }

    res.json({
      success: true,
      schedule
    });

  } catch (error) {
    console.error('Get amortization schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while calculating amortization schedule',
      error: error.message
    });
  }
};