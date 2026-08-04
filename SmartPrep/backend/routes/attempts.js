import express from 'express';
import {
  saveAttempt,
  getAttemptById,
  getMyAttempts,
  listCandidateResults,
  getAttemptStats
} from '../controllers/attemptController.js';
import { protect, optionalAuth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, saveAttempt);
router.get('/my', protect, getMyAttempts);
router.get('/stats', optionalAuth, getAttemptStats);
router.get(
  '/candidates/results',
  optionalAuth,
  listCandidateResults
);
router.get('/:id', protect, getAttemptById);

export default router;
