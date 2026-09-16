import express from 'express';
import {
  listCompetitions,
  getCompetitionById,
  getCompetitionResults,
  getMyCompetitionResults,
  getMyCompetitionResultById,
  saveCompetitionResult,
  createCompetition,
  updateCompetition,
  deleteCompetition
} from '../controllers/competitionController.js';
import { protect, authorize, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', optionalAuth, listCompetitions);
router.get('/my/results', protect, getMyCompetitionResults);
router.get('/my/results/:competitionId', protect, getMyCompetitionResultById);
router.get('/:id/results', protect, authorize('admin', 'faculty'), getCompetitionResults);
router.post('/:id/results', protect, saveCompetitionResult);
router.get('/:id', protect, getCompetitionById);
router.post('/', protect, authorize('admin', 'faculty'), createCompetition);
router.put('/:id', protect, authorize('admin', 'faculty'), updateCompetition);
router.delete('/:id', protect, authorize('admin', 'faculty'), deleteCompetition);

export default router;
