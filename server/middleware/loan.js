import Loan from '../models/Loan.js';

// @desc    Check if user can access loan
// @access  Private
export const canAccessLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Admin can access all loans
    if (req.user.role === 'admin') {
      req.loan = loan;
      return next();
    }

    // User can only access their own loans
    if (loan.user.toString() === req.user._id.toString()) {
      req.loan = loan;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied to this loan'
    });

  } catch (error) {
    console.error('Loan access middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in loan access check'
    });
  }
};

// @desc    Check if loan can be modified
// @access  Private
export const canModifyLoan = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Admin can modify any loan
    if (req.user.role === 'admin') {
      req.loan = loan;
      return next();
    }

    // User can only modify their own pending loans
    if (loan.user.toString() === req.user._id.toString() && loan.status === 'pending') {
      req.loan = loan;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Cannot modify this loan. Only pending loans can be modified by users.'
    });

  } catch (error) {
    console.error('Loan modify middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in loan modification check'
    });
  }
};

// @desc    Check if loan has active status for transactions
// @access  Private
export const isLoanActive = async (req, res, next) => {
  try {
    const loan = await Loan.findById(req.params.loanId || req.body.loanId);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    if (!['approved', 'active'].includes(loan.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot perform transaction on inactive loan'
      });
    }

    req.loan = loan;
    next();

  } catch (error) {
    console.error('Loan active check middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error in loan status check'
    });
  }
};

// @desc    Validate loan ownership for user
// @access  Private
export const validateLoanOwnership = (paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const loanId = req.params[paramName];
      const loan = await Loan.findById(loanId);

      if (!loan) {
        return res.status(404).json({
          success: false,
          message: 'Loan not found'
        });
      }

      if (req.user.role !== 'admin' && loan.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied to this loan'
        });
      }

      req.loan = loan;
      next();

    } catch (error) {
      console.error('Loan ownership validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error in loan ownership validation'
      });
    }
  };
};