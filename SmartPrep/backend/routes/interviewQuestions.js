
import express from 'express';
import {
  listInterviewQuestions,
  getInterviewQuestionById,
  createInterviewQuestion,
  updateInterviewQuestion,
  deleteInterviewQuestion
} from '../controllers/interviewController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', listInterviewQuestions);
router.get('/:id', getInterviewQuestionById);
router.post('/', protect, authorize('admin'), createInterviewQuestion);
router.put('/:id', protect, authorize('admin'), updateInterviewQuestion);
router.delete('/:id', protect, authorize('admin'), deleteInterviewQuestion);

export default router;

