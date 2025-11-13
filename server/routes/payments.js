import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  getPaymentDetails,
  getUserPayments,
  getAllPayments,
  processRefund,
  cashfreeWebhook,
  getPaymentStats
} from '../controllers/paymentController.js';
import auth from '../middleware/auth.js';
import {
  createOrderValidation,
  verifyPaymentValidation,
  refundValidation,
  paymentQueryValidation
} from '../middleware/paymentValidation.js';

const router = express.Router();

// Public webhook route (no auth required)
router.post('/webhook', cashfreeWebhook);

// Protected routes
router.post('/create-order', auth, createOrderValidation, createPaymentOrder);
router.post('/verify', auth, verifyPaymentValidation, verifyPayment);
// router.get('/user/:userId?', auth, paymentQueryValidation, getUserPayments);
router.get('/:paymentId', auth, getPaymentDetails);

// Admin only routes
router.get('/', auth, paymentQueryValidation, getAllPayments);
router.post('/:paymentId/refund', auth, refundValidation, processRefund);
router.get('/stats/overview', auth, getPaymentStats);

export default router;