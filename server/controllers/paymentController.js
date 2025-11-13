import Payment from '../models/Payment.js';
import Loan from '../models/Loan.js';
import Transaction from '../models/Transaction.js';
import cashfreeService from '../services/cashfreeService.js';
import { validationResult } from 'express-validator';

// Generate unique IDs
const generatePaymentId = () => `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;
const generateOrderId = () => `ORDER${Date.now()}${Math.floor(Math.random() * 1000)}`;
const generateRefundId = () => `REFUND${Date.now()}${Math.floor(Math.random() * 1000)}`;

// @desc    Create payment order
// @route   POST /api/payments/create-order
// @access  Private
export const createPaymentOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { loanId, amount, description } = req.body;

    // Verify loan exists and belongs to user
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
        message: 'Access denied'
      });
    }

    // Check if amount is valid
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    const paymentId = generatePaymentId();
    const orderId = generateOrderId();

    // Create payment record
    const payment = await Payment.create({
      paymentId,
      orderId,
      user: req.user._id,
      loan: loanId,
      amount,
      description: description || `Payment for loan ${loan.loanAccountNumber}`,
      customerDetails: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone
      }
    });

    // Create order in Cashfree
    const cashfreeResult = await cashfreeService.createOrder({
      orderId,
      amount,
      currency: 'INR',
      description: payment.description,
      customerId: req.user._id.toString(),
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: req.user.phone
    });

    if (!cashfreeResult.success) {
      // Update payment status to failed
      await Payment.findByIdAndUpdate(payment._id, {
        status: 'failed'
      });

      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
        error: cashfreeResult.error
      });
    }

    // Update payment with Cashfree order ID
    await Payment.findByIdAndUpdate(payment._id, {
      cashfreeOrderId: cashfreeResult.data.cf_order_id
    });

    res.json({
      success: true,
      message: 'Payment order created successfully',
      payment: {
        paymentId: payment.paymentId,
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency
      },
      paymentSession: {
        orderId: cashfreeResult.data.cf_order_id,
        paymentSessionId: cashfreeResult.data.payment_session_id
      }
    });

  } catch (error) {
    console.error('Create payment order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating payment order',
      error: error.message
    });
  }
};

// @desc    Verify payment
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    // Find payment record
    const payment = await Payment.findOne({ orderId })
      .populate('user', 'name email')
      .populate('loan', 'loanAccountNumber remainingBalance');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if user owns this payment or is admin
    if (req.user.role !== 'admin' && payment.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get payment status from Cashfree
    const paymentResult = await cashfreeService.getPayment(orderId);

    if (!paymentResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to verify payment',
        error: paymentResult.error
      });
    }

    const cashfreePayment = paymentResult.data;

    if (cashfreePayment) {
      let paymentStatus = 'pending';
      let transactionCreated = false;

      switch (cashfreePayment.payment_status) {
        case 'SUCCESS':
          paymentStatus = 'success';
          
          // Only create transaction if not already created
          if (payment.status !== 'success') {
            // Create transaction record
            await Transaction.create({
              transactionId: generatePaymentId(),
              loan: payment.loan._id,
              user: payment.user._id,
              amount: payment.amount,
              type: 'payment',
              paymentMethod: cashfreePayment.payment_method || 'card',
              status: 'completed',
              description: `Loan payment via ${cashfreePayment.payment_method || 'card'}`,
              cashfreePaymentId: cashfreePayment.cf_payment_id
            });

            // Update loan balance
            await Loan.findByIdAndUpdate(payment.loan._id, {
              $inc: { remainingBalance: -payment.amount }
            });

            transactionCreated = true;
          }
          break;

        case 'FAILED':
          paymentStatus = 'failed';
          break;

        case 'CANCELLED':
          paymentStatus = 'cancelled';
          break;

        default:
          paymentStatus = 'pending';
      }

      // Update payment record
      const updatedPayment = await Payment.findByIdAndUpdate(
        payment._id,
        {
          status: paymentStatus,
          cashfreePaymentId: cashfreePayment.cf_payment_id,
          cashfreeReferenceId: cashfreePayment.payment_reference_id,
          paymentMethod: cashfreePayment.payment_method,
          paymentDate: cashfreePayment.payment_completion_time || new Date(),
          ...(paymentStatus === 'success' && { updatedAt: new Date() })
        },
        { new: true }
      ).populate('user', 'name email')
       .populate('loan', 'loanAccountNumber');

      res.json({
        success: true,
        message: 'Payment verification completed',
        payment: updatedPayment,
        transactionCreated,
        cashfreeStatus: cashfreePayment.payment_status
      });

    } else {
      res.json({
        success: true,
        message: 'Payment status is still pending',
        payment,
        cashfreeStatus: 'PENDING'
      });
    }

  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying payment',
      error: error.message
    });
  }
};

// @desc    Get payment details
// @route   GET /api/payments/:paymentId
// @access  Private
export const getPaymentDetails = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findOne({ paymentId })
      .populate('user', 'name email phone')
      .populate('loan', 'loanAccountNumber loanType');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if user owns this payment or is admin
    if (req.user.role !== 'admin' && payment.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      payment
    });

  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment details',
      error: error.message
    });
  }
};

// @desc    Get user payments
// @route   GET /api/payments/user/:userId?
// @access  Private
export const getUserPayments = async (req, res) => {
  try {
    const user = req.params.userId || req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Check if admin is accessing other user's payments
    if (user !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const filter = { user: user };
    
    // Add status filter if provided
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Add date range filter if provided
    if (req.query.startDate && req.query.endDate) {
      filter.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    const payments = await Payment.find(filter)
      .populate('loan', 'loanAccountNumber loanType')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      payments,
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
    console.error('Get user payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payments',
      error: error.message
    });
  }
};

// @desc    Get all payments (Admin only)
// @route   GET /api/payments
// @access  Private/Admin
export const getAllPayments = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.userId) {
      filter.user = req.query.userId;
    }

    if (req.query.loanId) {
      filter.loan = req.query.loanId;
    }

    if (req.query.startDate && req.query.endDate) {
      filter.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    if (req.query.search) {
      filter.$or = [
        { paymentId: { $regex: req.query.search, $options: 'i' } },
        { orderId: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const payments = await Payment.find(filter)
      .populate('user', 'name email phone')
      .populate('loan', 'loanAccountNumber loanType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Get payment statistics
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    res.json({
      success: true,
      payments,
      stats,
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
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payments',
      error: error.message
    });
  }
};

// @desc    Process refund
// @route   POST /api/payments/:paymentId/refund
// @access  Private/Admin
export const processRefund = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { paymentId } = req.params;
    const { amount, reason } = req.body;

    const payment = await Payment.findOne({ paymentId })
      .populate('user', 'name email')
      .populate('loan', 'loanAccountNumber');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: 'Can only refund successful payments'
      });
    }

    if (amount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed original payment amount'
      });
    }

    const refundId = generateRefundId();

    // Process refund with Cashfree
    const refundResult = await cashfreeService.initiateRefund({
      orderId: payment.orderId,
      amount: amount || payment.amount,
      reason: reason || 'Refund request',
      refundId
    });

    if (!refundResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to process refund',
        error: refundResult.error
      });
    }

    // Add refund to payment record
    payment.refunds.push({
      refundId,
      amount: amount || payment.amount,
      reason: reason || 'Refund request',
      status: 'processed'
    });

    await payment.save();

    // Create refund transaction
    await Transaction.create({
      transactionId: generatePaymentId(),
      loan: payment.loan._id,
      user: payment.user._id,
      amount: -(amount || payment.amount), // Negative amount for refund
      type: 'refund',
      paymentMethod: payment.paymentMethod,
      status: 'completed',
      description: `Refund: ${reason || 'Refund request'}`,
      cashfreePaymentId: payment.cashfreePaymentId
    });

    // Update loan balance (add back the refunded amount)
    await Loan.findByIdAndUpdate(payment.loan._id, {
      $inc: { remainingBalance: amount || payment.amount }
    });

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refund: {
        refundId,
        amount: amount || payment.amount,
        reason: reason || 'Refund request',
        status: 'processed'
      }
    });

  } catch (error) {
    console.error('Process refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while processing refund',
      error: error.message
    });
  }
};

// @desc    Cashfree webhook handler
// @route   POST /api/payments/webhook
// @access  Public
export const cashfreeWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!cashfreeService.verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ success: false, message: 'Invalid signature' });
    }

    const { data, type } = req.body;

    if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const { order } = data;

      // Find payment by order ID
      const payment = await Payment.findOne({ orderId: order.order_id })
        .populate('loan')
        .populate('user');

      if (payment && payment.status !== 'success') {
        // Update payment status
        payment.status = 'success';
        payment.cashfreePaymentId = order.cf_payment_id;
        payment.paymentMethod = order.payment_method;
        payment.paymentDate = new Date();
        await payment.save();

        // Create transaction record
        await Transaction.create({
          transactionId: generatePaymentId(),
          loan: payment.loan._id,
          user: payment.user._id,
          amount: payment.amount,
          type: 'payment',
          paymentMethod: order.payment_method,
          status: 'completed',
          description: `Loan payment via ${order.payment_method}`,
          cashfreePaymentId: order.cf_payment_id
        });

        // Update loan balance
        await Loan.findByIdAndUpdate(payment.loan._id, {
          $inc: { remainingBalance: -payment.amount }
        });

        console.log(`Webhook: Payment ${payment.paymentId} marked as successful`);
      }
    }

    res.json({ success: true, message: 'Webhook processed' });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
};

// @desc    Get payment statistics
// @route   GET /api/payments/stats
// @access  Private/Admin
export const getPaymentStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    // Today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // This month stats
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfNextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    const [
      totalPayments,
      successfulPayments,
      pendingPayments,
      totalRevenue,
      todayStats,
      monthlyStats
    ] = await Promise.all([
      // Total payments count
      Payment.countDocuments(),

      // Successful payments count
      Payment.countDocuments({ status: 'success' }),

      // Pending payments count
      Payment.countDocuments({ status: 'pending' }),

      // Total revenue
      Payment.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),

      // Today's stats
      Payment.aggregate([
        {
          $match: {
            status: 'success',
            createdAt: { $gte: today, $lt: tomorrow }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            amount: { $sum: '$amount' }
          }
        }
      ]),

      // This month stats
      Payment.aggregate([
        {
          $match: {
            status: 'success',
            createdAt: { $gte: startOfMonth, $lt: startOfNextMonth }
          }
        },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            amount: { $sum: '$amount' }
          }
        }
      ])
    ]);

    // Monthly revenue for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'success',
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      success: true,
      stats: {
        totalPayments,
        successfulPayments,
        pendingPayments,
        totalRevenue: totalRevenue[0]?.total || 0,
        today: {
          count: todayStats[0]?.count || 0,
          amount: todayStats[0]?.amount || 0
        },
        thisMonth: {
          count: monthlyStats[0]?.count || 0,
          amount: monthlyStats[0]?.amount || 0
        },
        monthlyRevenue
      }
    });

  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching payment statistics',
      error: error.message
    });
  }
};