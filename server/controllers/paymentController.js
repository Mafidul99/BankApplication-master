import Transaction from '../models/Transaction.js';
import Loan from '../models/Loan.js';
import User from '../models/User.js';
import axios from 'axios';
import { validationResult } from 'express-validator';

// Cashfree Configuration
const CASHFREE_CONFIG = {
  appId: process.env.CASHFREE_APP_ID,
  secretKey: process.env.CASHFREE_SECRET_KEY,
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://api.cashfree.com/pg' 
    : 'https://sandbox.cashfree.com/pg'
};

// Generate Cashfree headers
const getCashfreeHeaders = () => ({
  'Content-Type': 'application/json',
  'x-client-id': CASHFREE_CONFIG.appId,
  'x-client-secret': CASHFREE_CONFIG.secretKey,
  'x-api-version': '2022-09-01'
});

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

    const { loanId, amount, paymentMethod } = req.body;
    const user = req.user;

    // Verify loan exists and belongs to user
    const loan = await Loan.findOne({ 
      _id: loanId, 
      user: user.role === 'admin' ? req.body.userId || user._id : user._id 
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      });
    }

    // Generate unique order ID
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create order data for Cashfree
    const orderData = {
      order_id: orderId,
      order_amount: amount,
      order_currency: 'INR',
      order_note: `Payment for loan ${loan.loanAccountNumber}`,
      customer_details: {
        customer_id: user._id.toString(),
        customer_email: user.email,
        customer_phone: user.phone,
        customer_name: user.name
      },
      order_meta: {
        return_url: `${process.env.FRONTEND_URL}/payment/callback?order_id={order_id}`,
        notify_url: `${process.env.BACKEND_URL}/api/payments/webhook`
      }
    };

    // Create order in Cashfree
    const response = await axios.post(
      `${CASHFREE_CONFIG.baseUrl}/orders`,
      orderData,
      { headers: getCashfreeHeaders() }
    );

    const cashfreeOrder = response.data;

    // Create transaction record
    const transaction = await Transaction.create({
      transactionId: orderId,
      loan: loanId,
      user: user._id,
      amount: amount,
      type: 'payment',
      paymentMethod: paymentMethod || 'cashfree',
      status: 'pending',
      cashfreePaymentId: cashfreeOrder.payment_session_id,
      description: `Payment for loan ${loan.loanAccountNumber}`,
      transactionDate: new Date()
    });

    res.json({
      success: true,
      message: 'Payment order created successfully',
      order: {
        orderId: cashfreeOrder.order_id,
        orderAmount: cashfreeOrder.order_amount,
        paymentSessionId: cashfreeOrder.payment_session_id,
        transactionId: transaction._id
      },
      paymentData: cashfreeOrder
    });

  } catch (error) {
    console.error('Create payment order error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.response?.data?.message || error.message
    });
  }
};

// @desc    Verify payment
// @route   POST /api/payments/verify-payment
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const { orderId } = req.body;
    const user = req.user;

    // Get transaction by order ID
    const transaction = await Transaction.findOne({ 
      transactionId: orderId,
      user: user._id 
    }).populate('loan');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Verify payment with Cashfree
    const response = await axios.get(
      `${CASHFREE_CONFIG.baseUrl}/orders/${orderId}`,
      { headers: getCashfreeHeaders() }
    );

    const paymentStatus = response.data;

    // Update transaction status based on Cashfree response
    let newStatus = 'pending';
    if (paymentStatus.order_status === 'PAID') {
      newStatus = 'completed';
      
      // Update loan balance
      if (transaction.loan) {
        const loan = await Loan.findById(transaction.loan._id);
        if (loan) {
          loan.remainingBalance -= transaction.amount;
          if (loan.remainingBalance < 0) loan.remainingBalance = 0;
          
          // Update loan status if fully paid
          if (loan.remainingBalance === 0) {
            loan.status = 'completed';
          }
          
          await loan.save();
        }
      }
    } else if (paymentStatus.order_status === 'FAILED') {
      newStatus = 'failed';
    }

    transaction.status = newStatus;
    transaction.cashfreePaymentId = paymentStatus.payment_details?.cf_payment_id || transaction.cashfreePaymentId;
    await transaction.save();

    res.json({
      success: true,
      message: 'Payment verification completed',
      transaction: {
        id: transaction._id,
        status: transaction.status,
        amount: transaction.amount,
        orderId: transaction.transactionId
      },
      paymentStatus: paymentStatus.order_status
    });

  } catch (error) {
    console.error('Verify payment error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.response?.data?.message || error.message
    });
  }
};

// @desc    Cashfree webhook handler
// @route   POST /api/payments/webhook
// @access  Public
export const cashfreeWebhook = async (req, res) => {
  try {
    const webhookData = req.body;
    
    // Verify webhook signature (implement signature verification in production)
    // const signature = req.headers['x-webhook-signature'];
    // if (!verifySignature(webhookData, signature)) {
    //   return res.status(401).json({ success: false, message: 'Invalid signature' });
    // }

    const { data, type } = webhookData;

    if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const { orderId, cfPaymentId, orderAmount, paymentStatus } = data;

      // Find transaction
      const transaction = await Transaction.findOne({ transactionId: orderId })
        .populate('loan')
        .populate('user');

      if (transaction && transaction.status === 'pending') {
        transaction.status = 'completed';
        transaction.cashfreePaymentId = cfPaymentId;
        await transaction.save();

        // Update loan balance
        if (transaction.loan) {
          const loan = await Loan.findById(transaction.loan._id);
          if (loan) {
            loan.remainingBalance -= transaction.amount;
            if (loan.remainingBalance < 0) loan.remainingBalance = 0;
            
            if (loan.remainingBalance === 0) {
              loan.status = 'completed';
            }
            
            await loan.save();
          }
        }

        console.log(`Webhook: Payment completed for order ${orderId}`);
      }
    } else if (type === 'PAYMENT_FAILED_WEBHOOK') {
      const { orderId } = data;
      
      const transaction = await Transaction.findOne({ transactionId: orderId });
      if (transaction && transaction.status === 'pending') {
        transaction.status = 'failed';
        await transaction.save();
        
        console.log(`Webhook: Payment failed for order ${orderId}`);
      }
    }

    res.json({ success: true, message: 'Webhook processed' });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Webhook processing failed',
      error: error.message 
    });
  }
};

// @desc    Get payment methods
// @route   GET /api/payments/methods
// @access  Private
export const getPaymentMethods = async (req, res) => {
  try {
    const { orderAmount } = req.query;

    const response = await axios.get(
      `${CASHFREE_CONFIG.baseUrl}/orders/payment-methods`,
      {
        headers: getCashfreeHeaders(),
        params: {
          order_amount: orderAmount || 100 // Default amount for testing
        }
      }
    );

    res.json({
      success: true,
      paymentMethods: response.data
    });

  } catch (error) {
    console.error('Get payment methods error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment methods',
      error: error.response?.data?.message || error.message
    });
  }
};

// @desc    Get payment history
// @route   GET /api/payments/history
// @access  Private
export const getPaymentHistory = async (req, res) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let filter = { user: user._id, type: 'payment' };
    
    // Admin can see all payments or filter by user
    if (user.role === 'admin' && req.query.userId) {
      filter.user = req.query.userId;
    } else if (user.role === 'user') {
      filter.user = user._id;
    }

    const transactions = await Transaction.find(filter)
      .populate('loan', 'loanAccountNumber loanType')
      .populate('user', 'name email')
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
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
};

// @desc    Refund payment
// @route   POST /api/payments/refund
// @access  Private/Admin
export const refundPayment = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can process refunds
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only.'
      });
    }

    const { transactionId, refundAmount, refundNote } = req.body;

    const transaction = await Transaction.findOne({ 
      _id: transactionId,
      status: 'completed'
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Completed transaction not found'
      });
    }

    // Create refund in Cashfree
    const refundId = `REFUND_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const refundData = {
      refund_id: refundId,
      refund_amount: refundAmount || transaction.amount,
      refund_note: refundNote || 'Payment refund'
    };

    const response = await axios.post(
      `${CASHFREE_CONFIG.baseUrl}/orders/${transaction.transactionId}/refunds`,
      refundData,
      { headers: getCashfreeHeaders() }
    );

    // Create refund transaction
    const refundTransaction = await Transaction.create({
      transactionId: refundId,
      loan: transaction.loan,
      user: transaction.user,
      amount: refundData.refund_amount,
      type: 'refund',
      paymentMethod: transaction.paymentMethod,
      status: 'completed',
      cashfreePaymentId: response.data.cf_refund_id,
      description: refundNote || `Refund for transaction ${transaction.transactionId}`,
      transactionDate: new Date()
    });

    // Update original transaction status
    transaction.status = 'refunded';
    await transaction.save();

    // Update loan balance (add back the refunded amount)
    const loan = await Loan.findById(transaction.loan);
    if (loan) {
      loan.remainingBalance += refundData.refund_amount;
      await loan.save();
    }

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refund: {
        refundId: refundTransaction.transactionId,
        amount: refundTransaction.amount,
        status: refundTransaction.status
      }
    });

  } catch (error) {
    console.error('Refund payment error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.response?.data?.message || error.message
    });
  }
};

// @desc    Get payment statistics
// @route   GET /api/payments/stats
// @access  Private
export const getPaymentStats = async (req, res) => {
  try {
    const user = req.user;
    let filter = { type: 'payment' };

    if (user.role === 'user') {
      filter.user = user._id;
    }

    const stats = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      }
    ]);

    // Calculate total payments and success rate
    const totalPayments = stats.reduce((sum, stat) => sum + stat.count, 0);
    const completedPayments = stats.find(stat => stat._id === 'completed')?.count || 0;
    const successRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0;

    // Monthly payment stats for last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await Transaction.aggregate([
      {
        $match: {
          ...filter,
          transactionDate: { $gte: sixMonthsAgo },
          status: 'completed'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$transactionDate' },
            month: { $month: '$transactionDate' }
          },
          totalAmount: { $sum: '$amount' },
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
        statusBreakdown: stats,
        totalPayments,
        completedPayments,
        successRate: Math.round(successRate * 100) / 100,
        monthlyStats
      }
    });

  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment statistics',
      error: error.message
    });
  }
};