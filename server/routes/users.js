import express from 'express';
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateUserRole,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  getUserStats,
  getUserLoans,
  getUserTransactions,
  createUser,
  deactivateUser,
  activateUser
} from '../controllers/users.controller.js';
import { auth, adminAuth } from '../middleware/auth.js';
import {
  createUserValidation,
  updateUserValidation,
  updateUserRoleValidation,
  changePasswordValidation,
  updateProfileValidation
} from '../middleware/validation.js';

const router = express.Router();

// All routes are protected
router.use(auth);

router.get('/profile', getUserProfile);
router.put('/profile', updateProfileValidation, updateUserProfile);
router.put('/change-password', changePasswordValidation, changeUserPassword);
router.get('/my-loans', getUserLoans);
router.get('/my-transactions', getUserTransactions);
router.use(adminAuth);
router.get('/', getUsers);
router.get('/stats', getUserStats);
router.post('/', createUserValidation, createUser);
router.get('/:id', getUserById);
router.put('/:id', updateUserValidation, updateUser);
router.put('/:id/role', updateUserRoleValidation, updateUserRole);
router.patch('/:id/deactivate', deactivateUser);
router.patch('/:id/activate', activateUser);
router.delete('/:id', deleteUser);
router.get('/:id/loans', getUserLoans);
router.get('/:id/transactions', getUserTransactions);

export default router;