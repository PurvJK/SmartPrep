import express from 'express';
import {
  register,
  login,
  getMe,
  logout,
  verifyToken
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { validateRegister, validateLogin } from '../middleware/validation.js';

const router = express.Router();

// Public routes
router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.get('/verify', protect, verifyToken);

export default router;
