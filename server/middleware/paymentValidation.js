import { body, query, param } from 'express-validator';

export const createOrderValidation = [
  body('loanId')
    .notEmpty()
    .withMessage('Loan ID is required')
    .isMongoId()
    .withMessage('Invalid Loan ID'),
  
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be a positive number')
    .notEmpty()
    .withMessage('Amount is required'),
  
  body('paymentMethod')
    .optional()
    .isIn(['cashfree', 'card', 'upi', 'netbanking', 'wallet'])
    .withMessage('Invalid payment method')
];

export const verifyPaymentValidation = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
    .matches(/^ORDER_/)
    .withMessage('Invalid Order ID format')
];

export const refundPaymentValidation = [
  body('transactionId')
    .notEmpty()
    .withMessage('Transaction ID is required')
    .isMongoId()
    .withMessage('Invalid Transaction ID'),
  
  body('refundAmount')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Refund amount must be a positive number'),
  
  body('refundNote')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Refund note must be less than 500 characters')
];

export const paymentHistoryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('userId')
    .optional()
    .isMongoId()
    .withMessage('Invalid User ID')
];