import express from 'express';
import {
  updateProfile,
  changePassword,
  updateProgress,
  getAllUsers,
  getUserById,
  updateUserRole,
  deactivateUser
} from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateProfileUpdate, validatePasswordChange } from '../middleware/validation.js';

const router = express.Router();

// All routes are protected
router.use(protect);

// User routes
router.put('/profile', validateProfileUpdate, updateProfile);
router.put('/change-password', validatePasswordChange, changePassword);
router.put('/progress', updateProgress);

// Admin routes
router.get('/', authorize('admin'), getAllUsers);
router.get('/:id', authorize('admin'), getUserById);
router.put('/:id/role', authorize('admin'), updateUserRole);
router.put('/:id/deactivate', authorize('admin'), deactivateUser);

export default router;
