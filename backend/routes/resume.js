import express from 'express';
import { body } from 'express-validator';
import { optionalAuth } from '../middleware/auth.js';
import multer from 'multer';
import { analyzeResume, getResumeSuggestions } from '../controllers/aiResumeController.js';
import { uploadResumeFile } from '../controllers/resumeUploadController.js';
import { analyzeResumeStructured, listAnalyses } from '../controllers/structuredResumeController.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// AI-based resume analysis endpoints (match frontend calls)
router.post('/analyze', optionalAuth, analyzeResume);
router.post('/suggestions', optionalAuth, getResumeSuggestions);

// Upload resume file (PDF/DOCX) and extract text
router.post('/upload', optionalAuth, upload.single('file'), uploadResumeFile);

// Structured analyze and list
router.post('/analyze-structured', optionalAuth, analyzeResumeStructured);
router.get('/analyses', optionalAuth, listAnalyses);

export default router;

