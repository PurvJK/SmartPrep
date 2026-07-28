import express from 'express';
import {
  listCompetitions,
  getCompetitionById,
  createCompetition,
  updateCompetition,
  deleteCompetition
} from '../controllers/competitionController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', listCompetitions);
router.get('/:id', protect, getCompetitionById);
router.post('/', protect, authorize('admin'), createCompetition);
router.put('/:id', protect, authorize('admin'), updateCompetition);
router.delete('/:id', protect, authorize('admin'), deleteCompetition);

export default router;
