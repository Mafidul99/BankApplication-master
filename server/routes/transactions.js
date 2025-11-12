import express from 'express';
import {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats,
  getLoanTransactions,
  processCashfreeWebhook
} from '../controllers/transaction.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';
import { 
  canAccessTransaction, 
  canModifyTransaction, 
  validateTransactionOwnership,
  validateLoanForTransaction 
} from '../middleware/Transaction.js';
import {
  createTransactionValidation,
  updateTransactionValidation
} from '../middleware/validation.js';

const router = express.Router();

// Public routes (webhooks)
router.post('/cashfree/webhook', processCashfreeWebhook);

// Protected routes (require authentication)
router.get('/', auth, getTransactions);
router.get('/stats', auth, getTransactionStats);
router.get('/loan/:loanId', auth, getLoanTransactions);
router.get('/:id', auth, validateTransactionOwnership(), getTransaction);

// Create transaction - users can create for their loans, admins for any loan
router.post('/', auth, createTransactionValidation, validateLoanForTransaction, createTransaction);

// Admin only routes
router.put('/:id', adminAuth, updateTransactionValidation, canModifyTransaction, updateTransaction);
router.delete('/:id', adminAuth, deleteTransaction);

export default router;