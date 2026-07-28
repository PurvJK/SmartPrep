import express from 'express';
import { saveAttempt, getAttemptById, getMyAttempts } from '../controllers/attemptController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, saveAttempt);
router.get('/my', protect, getMyAttempts);
router.get('/:id', protect, getAttemptById);

export default router;
