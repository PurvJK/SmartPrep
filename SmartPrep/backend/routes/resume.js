import express from 'express';
import { body } from 'express-validator';
import { optionalAuth } from '../middleware/auth.js';
import multer from 'multer';
import {
  analyzeResume,
  getResumeSuggestions,
  updateJobDescriptionVisibility,
  processResumeViaHF,
  generateCoverLetter,
  generateInterviewQuestions,
} from '../controllers/aiResumeController.js';
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

// HuggingFace/Gradio extra endpoints
router.post('/jobdesc-visibility', optionalAuth, updateJobDescriptionVisibility);
router.post('/process-hf', optionalAuth, upload.single('file'), processResumeViaHF);
router.post('/cover-letter', optionalAuth, generateCoverLetter);
router.post('/interview-questions', optionalAuth, generateInterviewQuestions);

// Upload resume file (PDF/DOCX) and extract text
router.post('/upload', optionalAuth, upload.single('file'), uploadResumeFile);

// Structured analyze and list
router.post('/analyze-structured', optionalAuth, analyzeResumeStructured);
router.get('/analyses', optionalAuth, listAnalyses);

export default router;

