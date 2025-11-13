import { body, param, query } from 'express-validator';

export const createOrderValidation = [
  body('loanId')
    .notEmpty()
    .withMessage('Loan ID is required')
    .isMongoId()
    .withMessage('Invalid Loan ID'),

  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be at least 1')
    .toFloat(),

  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters')
];

export const verifyPaymentValidation = [
  body('orderId')
    .notEmpty()
    .withMessage('Order ID is required')
];

export const refundValidation = [
  body('amount')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Amount must be at least 1')
    .toFloat(),

  body('reason')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Reason must be less than 255 characters')
];

export const paymentQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),

  query('status')
    .optional()
    .isIn(['pending', 'success', 'failed', 'cancelled'])
    .withMessage('Invalid status'),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
];