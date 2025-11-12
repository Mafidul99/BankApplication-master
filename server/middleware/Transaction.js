import Transaction from '../models/Transaction.js';
import Loan from '../models/Loan.js';

// @desc    Check if user can access transaction
// @access  Private
export const canAccessTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Admin can access all transactions
    if (req.user.role === 'admin') {
      req.transaction = transaction;
      return next();
    }

    // User can only access their own transactions
    if (transaction.user.toString() === req.user._id.toString()) {
      req.transaction = transaction;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied to this transaction'
    });

  } catch (error) {
    console.error('Transaction access middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in transaction access check'
    });
  }
};

// @desc    Check if transaction can be modified
// @access  Private
export const canModifyTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Only admin can modify transactions
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can modify transactions'
      });
    }

    // Cannot modify completed transactions
    if (transaction.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify completed transactions'
      });
    }

    req.transaction = transaction;
    next();

  } catch (error) {
    console.error('Transaction modify middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in transaction modification check'
    });
  }
};

// @desc    Validate transaction ownership for user
// @access  Private
export const validateTransactionOwnership = (paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const transactionId = req.params[paramName];
      const transaction = await Transaction.findById(transactionId);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      if (req.user.role !== 'admin' && transaction.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this transaction'
        });
      }

      req.transaction = transaction;
      next();

    } catch (error) {
      console.error('Transaction ownership validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error in transaction ownership validation'
      });
    }
  };
};

// @desc    Check if loan exists and user has access
// @access  Private
export const validateLoanForTransaction = async (req, res, next) => {
  try {
    const { loanId } = req.body;

    if (!loanId) {
      return res.status(400).json({
        success: false,
        message: 'Loan ID is required'
      });
    }

    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Check if user has access to this loan
    if (req.user.role !== 'admin' && loan.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this loan'
      });
    }

    req.loan = loan;
    next();

  } catch (error) {
    console.error('Loan validation for transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in loan validation'
    });
  }
};