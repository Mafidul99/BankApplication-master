import express from 'express';
import {
  getLoans,
  getLoan,
  createLoan,
  updateLoan,
  deleteLoan,
  updateLoanStatus,
  getLoanStats,
  getUserLoans,
  getAmortizationSchedule
} from '../controllers/loan.conroller.js';
import { auth, adminAuth } from '../middleware/auth.js';
import { canAccessLoan, canModifyLoan, validateLoanOwnership } from '../middleware/loan.js';
import {
  createLoanValidation,
  updateLoanValidation,
  updateLoanStatusValidation
} from '../middleware/validation.js';

const router = express.Router();

// Public routes - none

// Protected routes (require authentication)
router.get('/', auth, getLoans);
router.get('/stats', auth, getLoanStats);
router.get('/:id', auth, validateLoanOwnership(), getLoan);
router.get('/:id/amortization', auth, validateLoanOwnership(), getAmortizationSchedule);

// Create loan - both users and admins can create, but with different permissions
router.post('/', auth, createLoanValidation, createLoan);

// Update loan - users can only update their pending loans, admins can update any
router.put('/:id', auth, updateLoanValidation, canModifyLoan, updateLoan);

// Admin only routes
router.get('/user/:userId', adminAuth, getUserLoans);
router.patch('/:id/status', adminAuth, updateLoanStatusValidation, updateLoanStatus);
router.delete('/:id', adminAuth, deleteLoan);

export default router;