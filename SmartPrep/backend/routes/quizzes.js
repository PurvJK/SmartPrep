import express from 'express';
import {
  listQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  deleteQuiz
} from '../controllers/quizController.js';
import { protect, optionalAuth, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', listQuizzes);
router.get('/:id', optionalAuth, getQuizById);
router.post('/', protect, authorize('admin', 'faculty'), createQuiz);
router.put('/:id', protect, authorize('admin', 'faculty'), updateQuiz);
router.delete('/:id', protect, authorize('admin', 'faculty'), deleteQuiz);

export default router;











