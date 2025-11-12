import Transaction from '../models/Transaction.js';
import Loan from '../models/Loan.js';
import User from '../models/User.js';
import { validationResult } from 'express-validator';

// @desc    Generate random transaction ID
// @return  String
const generateTransactionId = () => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `TXN${timestamp}${random}`;
};

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (req, res) => {
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

    // Add type filter if provided
    if (req.query.type) {
      filter.type = req.query.type;
    }

    // Add payment method filter if provided
    if (req.query.paymentMethod) {
      filter.paymentMethod = req.query.paymentMethod;
    }

    // Add date range filter if provided
    if (req.query.startDate || req.query.endDate) {
      filter.transactionDate = {};
      if (req.query.startDate) {
        filter.transactionDate.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.transactionDate.$lte = new Date(req.query.endDate);
      }
    }

    // Add search filter if provided
    if (req.query.search) {
      filter.$or = [
        { transactionId: { $regex: req.query.search, $options: 'i' } },
        { 'user.name': { $regex: req.query.search, $options: 'i' } },
        { 'loan.loanAccountNumber': { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const transactions = await Transaction.find(filter)
      .populate('user', 'name email phone')
      .populate('loan', 'loanAccountNumber loanType')
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      transactions,
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
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions',
      error: error.message
    });
  }
};

// @desc    Get single transaction
// @route   GET /api/transactions/:id
// @access  Private
export const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('user', 'name email phone address')
      .populate('loan', 'loanAccountNumber loanType loanAmount interestRate');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if user has access to this transaction
    if (req.user.role !== 'admin' && transaction.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this transaction'
      });
    }

    res.json({
      success: true,
      transaction
    });

  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transaction',
      error: error.message
    });
  }
};

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
export const createTransaction = async (req, res) => {
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
      loanId,
      amount,
      type,
      paymentMethod,
      description,
      cashfreePaymentId,
      transactionDate
    } = req.body;

    // Verify loan exists and get details
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Check if loan is active
    if (!['approved', 'active'].includes(loan.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create transaction for inactive loan'
      });
    }

    // For payments, check if amount exceeds remaining balance
    if (type === 'payment' && amount > loan.remainingBalance) {
      return res.status(400).json({
        success: false,
        message: 'Payment amount exceeds remaining loan balance'
      });
    }

    // Determine user for the transaction
    const transactionUser = req.user.role === 'admin' ? (req.body.userId || loan.user) : req.user._id;

    // Verify user exists
    const user = await User.findById(transactionUser);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create transaction
    const transaction = await Transaction.create({
      transactionId: generateTransactionId(),
      loan: loanId,
      user: transactionUser,
      amount,
      type,
      paymentMethod,
      description,
      cashfreePaymentId,
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      status: 'completed'
    });

    // Update loan balance for payments
    if (type === 'payment') {
      loan.remainingBalance -= amount;
      
      // Update loan status if fully paid
      if (loan.remainingBalance <= 0) {
        loan.remainingBalance = 0;
        loan.status = 'completed';
      } else if (loan.status === 'approved') {
        loan.status = 'active';
      }
      
      await loan.save();
    }

    await transaction.populate('user', 'name email phone');
    await transaction.populate('loan', 'loanAccountNumber loanType');

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transaction
    });

  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating transaction',
      error: error.message
    });
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private/Admin
export const updateTransaction = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Only allow updating certain fields
    const allowedUpdates = ['status', 'description', 'paymentMethod'];
    const updateData = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('user', 'name email phone')
    .populate('loan', 'loanAccountNumber loanType');

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      transaction: updatedTransaction
    });

  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating transaction',
      error: error.message
    });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private/Admin
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Reverse loan balance update if this was a payment
    if (transaction.type === 'payment' && transaction.status === 'completed') {
      const loan = await Loan.findById(transaction.loan);
      if (loan) {
        loan.remainingBalance += transaction.amount;
        
        // Revert loan status if needed
        if (loan.status === 'completed') {
          loan.status = 'active';
        }
        
        await loan.save();
      }
    }

    await Transaction.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Transaction deleted successfully'
    });

  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting transaction',
      error: error.message
    });
  }
};

// @desc    Get transaction statistics
// @route   GET /api/transactions/stats
// @access  Private
export const getTransactionStats = async (req, res) => {
  try {
    let matchStage = {};

    if (req.user.role !== 'admin') {
      matchStage.user = req.user._id;
    }

    // Overall statistics
    const overallStats = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgTransactionAmount: { $avg: '$amount' }
        }
      }
    ]);

    // Type-wise statistics
    const typeStats = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      }
    ]);

    // Payment method statistics
    const methodStats = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Status statistics
    const statusStats = await Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Monthly transaction stats (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Transaction.aggregate([
      {
        $match: {
          ...matchStage,
          transactionDate: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$transactionDate' },
            month: { $month: '$transactionDate' }
          },
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
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
          totalTransactions: 0,
          totalAmount: 0,
          avgTransactionAmount: 0
        },
        byType: typeStats,
        byMethod: methodStats,
        byStatus: statusStats,
        monthly: monthlyStats
      }
    });

  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transaction statistics',
      error: error.message
    });
  }
};

// @desc    Get loan's transactions
// @route   GET /api/transactions/loan/:loanId
// @access  Private
export const getLoanTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const loan = await Loan.findById(req.params.loanId);
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
        message: 'Access denied to this loan\'s transactions'
      });
    }

    const transactions = await Transaction.find({ loan: req.params.loanId })
      .populate('user', 'name email phone')
      .populate('loan', 'loanAccountNumber loanType')
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Transaction.countDocuments({ loan: req.params.loanId });
    const totalPages = Math.ceil(total / limit);

    // Calculate loan summary
    const paymentSummary = await Transaction.aggregate([
      { $match: { loan: loan._id, type: 'payment', status: 'completed' } },
      {
        $group: {
          _id: null,
          totalPaid: { $sum: '$amount' },
          paymentCount: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      transactions,
      loan: {
        id: loan._id,
        loanAccountNumber: loan.loanAccountNumber,
        loanAmount: loan.loanAmount,
        remainingBalance: loan.remainingBalance,
        totalPaid: paymentSummary[0]?.totalPaid || 0,
        paymentCount: paymentSummary[0]?.paymentCount || 0
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
    console.error('Get loan transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching loan transactions',
      error: error.message
    });
  }
};

// @desc    Process Cashfree payment webhook
// @route   POST /api/transactions/cashfree/webhook
// @access  Public (secured with signature)
export const processCashfreeWebhook = async (req, res) => {
  try {
    const { 
      orderId, 
      referenceId, 
      txStatus, 
      txMsg, 
      txTime, 
      paymentMethod,
      amount 
    } = req.body;

    // Verify webhook signature (implement based on Cashfree documentation)
    // const isValidSignature = verifyCashfreeSignature(req);
    // if (!isValidSignature) {
    //   return res.status(401).json({ success: false, message: 'Invalid signature' });
    // }

    // Find transaction by cashfreePaymentId
    const transaction = await Transaction.findOne({ cashfreePaymentId: orderId })
      .populate('loan');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Update transaction status based on Cashfree response
    let newStatus = 'pending';
    switch (txStatus) {
      case 'SUCCESS':
        newStatus = 'completed';
        break;
      case 'FAILED':
        newStatus = 'failed';
        break;
      case 'USER_DROPPED':
      case 'CANCELLED':
        newStatus = 'cancelled';
        break;
      default:
        newStatus = 'pending';
    }

    transaction.status = newStatus;
    transaction.description = txMsg || `Payment ${txStatus.toLowerCase()}`;
    await transaction.save();

    // Update loan balance if payment was successful
    if (newStatus === 'completed' && transaction.type === 'payment') {
      const loan = transaction.loan;
      loan.remainingBalance -= transaction.amount;
      
      if (loan.remainingBalance <= 0) {
        loan.remainingBalance = 0;
        loan.status = 'completed';
      } else if (loan.status === 'approved') {
        loan.status = 'active';
      }
      
      await loan.save();
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Cashfree webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing webhook',
      error: error.message
    });
  }
};