import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  cashfreeWebhook,
  getPaymentMethods,
  getPaymentHistory,
  refundPayment,
  getPaymentStats
} from '../controllers/paymentController.js';
import auth from '../middleware/auth.js';
import {
  createOrderValidation,
  verifyPaymentValidation,
  refundPaymentValidation,
  paymentHistoryValidation
} from '../middleware/paymentValidation.js';

const router = express.Router();

// Public routes (webhooks don't require auth)
router.post('/webhook', cashfreeWebhook);

// Protected routes
router.post('/create-order', auth, createOrderValidation, createPaymentOrder);
router.post('/verify-payment', auth, verifyPaymentValidation, verifyPayment);
router.get('/methods', auth, getPaymentMethods);
router.get('/history', auth, paymentHistoryValidation, getPaymentHistory);
router.get('/stats', auth, getPaymentStats);

// Admin only routes
router.post('/refund', auth, refundPaymentValidation, refundPayment);

export default router;