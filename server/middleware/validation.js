import { body } from 'express-validator';

// Validation rules for authentication
export const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone()
    .withMessage('Please enter a valid phone number'),
  
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),

  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Street address must be less than 100 characters'),

  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City must be less than 50 characters'),

  body('address.state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State must be less than 50 characters'),

  body('address.zipCode')
    .optional()
    .trim()
    .isPostalCode('any')
    .withMessage('Please enter a valid zip code')
];

export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

export const updateProfileValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please enter a valid phone number'),

  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Street address must be less than 100 characters'),

  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City must be less than 50 characters'),

  body('address.state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State must be less than 50 characters'),

  body('address.zipCode')
    .optional()
    .trim()
    .isPostalCode('any')
    .withMessage('Please enter a valid zip code')
];

export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number')
];

// Validation for user management (admin only)
export const updateUserRoleValidation = [
  body('role')
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin')
];

// Common validation rules
export const paginationValidation = [
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

// Loan validation rules
export const createLoanValidation = [
  body('userId')
    .optional()
    .isMongoId()
    .withMessage('Invalid user ID'),
  
  body('loanType')
    .isIn(['personal', 'home', 'car', 'business', 'education'])
    .withMessage('Loan type must be one of: personal, home, car, business, education'),
  
  body('loanAmount')
    .isFloat({ min: 1000 })
    .withMessage('Loan amount must be at least 1000'),
  
  body('interestRate')
    .isFloat({ min: 0.1, max: 50 })
    .withMessage('Interest rate must be between 0.1% and 50%'),
  
  body('loanTerm')
    .isInt({ min: 1, max: 360 })
    .withMessage('Loan term must be between 1 and 360 months'),
  
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('purpose')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Purpose cannot exceed 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

export const updateLoanValidation = [
  body('loanAmount')
    .optional()
    .isFloat({ min: 1000 })
    .withMessage('Loan amount must be at least 1000'),
  
  body('interestRate')
    .optional()
    .isFloat({ min: 0.1, max: 50 })
    .withMessage('Interest rate must be between 0.1% and 50%'),
  
  body('loanTerm')
    .optional()
    .isInt({ min: 1, max: 360 })
    .withMessage('Loan term must be between 1 and 360 months'),
  
  body('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'active', 'completed', 'defaulted'])
    .withMessage('Invalid loan status'),
  
  body('purpose')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Purpose cannot exceed 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

export const updateLoanStatusValidation = [
  body('status')
    .isIn(['pending', 'approved', 'rejected', 'active', 'completed', 'defaulted'])
    .withMessage('Invalid loan status'),
  
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks cannot exceed 500 characters')
];

// Transaction validation rules
export const createTransactionValidation = [
  body('loanId')
    .isMongoId()
    .withMessage('Valid loan ID is required'),
  
  body('amount')
    .isFloat({ min: 1 })
    .withMessage('Amount must be at least 1'),
  
  body('type')
    .isIn(['payment', 'disbursement', 'refund'])
    .withMessage('Transaction type must be one of: payment, disbursement, refund'),
  
  body('paymentMethod')
    .isIn(['cashfree', 'bank_transfer', 'cash', 'check', 'card'])
    .withMessage('Payment method must be one of: cashfree, bank_transfer, cash, check, card'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  body('transactionDate')
    .optional()
    .isISO8601()
    .withMessage('Transaction date must be a valid date')
];

export const updateTransactionValidation = [
  body('status')
    .optional()
    .isIn(['pending', 'completed', 'failed', 'refunded'])
    .withMessage('Invalid transaction status'),
  
  body('paymentMethod')
    .optional()
    .isIn(['cashfree', 'bank_transfer', 'cash', 'check', 'card'])
    .withMessage('Payment method must be one of: cashfree, bank_transfer, cash, check, card'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters')
];

// User management validation rules
export const createUserValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .isMobilePhone()
    .withMessage('Please enter a valid phone number'),
  
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Role must be either user or admin'),

  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Street address must be less than 100 characters'),

  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City must be less than 50 characters'),

  body('address.state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State must be less than 50 characters'),

  body('address.zipCode')
    .optional()
    .trim()
    .isPostalCode('any')
    .withMessage('Please enter a valid zip code')
];

export const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please enter a valid email')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please enter a valid phone number'),

  body('address.street')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Street address must be less than 100 characters'),

  body('address.city')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('City must be less than 50 characters'),

  body('address.state')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('State must be less than 50 characters'),

  body('address.zipCode')
    .optional()
    .trim()
    .isPostalCode('any')
    .withMessage('Please enter a valid zip code'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

