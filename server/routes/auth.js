import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  verifyToken,
  getUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getUserStats
} from '../controllers/auth.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';
import {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation
} from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/verify-token', verifyToken);

// Protected routes (require authentication)
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfileValidation, updateProfile);
router.put('/change-password', auth, changePasswordValidation, changePassword);

// Admin only routes (require admin authentication)
router.get('/users', adminAuth, getUsers);
router.get('/users/:id', adminAuth, getUserById);
router.put('/users/:id/role', adminAuth, updateUserRole);
router.delete('/users/:id', adminAuth, deleteUser);
router.get('/stats', adminAuth, getUserStats);

export default router;