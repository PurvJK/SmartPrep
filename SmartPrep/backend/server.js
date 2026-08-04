import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import cluster from 'cluster';
import os from 'os';
import process from 'process';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/database.js';
import { shouldUseClusterMode } from './utils/serverConfig.js';

// Import routes
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import resumeRoutes from './routes/resume.js';
// Removed legacy study material/theory routes
// import studyMaterialRoutes from './routes/studyMaterial.js';
// import studyTheoryRoutes from './routes/studyTheory.js'; 
import theoryRoutes from './routes/theory.js';
import uploadRoutes from './routes/upload.js';
import codingProblemRoutes from './routes/codingProblems.js';
import quizRoutes from './routes/quizzes.js';
import attemptRoutes from './routes/attempts.js';
import interviewQuestionRoutes from './routes/interviewQuestions.js';
import competitionRoutes from './routes/competitions.js';

// Load environment variables
dotenv.config();

const app = express();

const createApp = () => {
  // Security middleware (allow cross-origin images from frontend)
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));

  // Rate limiting
  const disableRateLimit = process.env.DISABLE_RATE_LIMIT === 'true';
  const limiter = rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000 * 60 *2),
    max: disableRateLimit ? 1000000 : Number(process.env.RATE_LIMIT_MAX || 200000),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.'
    },
    skip: disableRateLimit ? () => true : undefined
  });
  app.use(limiter);

  // CORS configuration
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:8080', 'http://localhost:8081'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  // Body parser middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Serve static files from frontend public directory
  app.use('/images', express.static('../frontend/public/images'));
  // Serve uploaded images
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

  // Logging middleware
  const enableRequestLogging = process.env.ENABLE_REQUEST_LOGGING === 'true';
  if (process.env.NODE_ENV === 'development' && enableRequestLogging) {
    app.use(morgan('dev'));
  }

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({
      success: true,
      message: 'SmartPrep API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/resume', resumeRoutes);
  // Removed: app.use('/api/study-materials', studyMaterialRoutes);
  // Removed: app.use('/api/study-theory', studyTheoryRoutes);
  app.use('/api/theory', theoryRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/coding-problems', codingProblemRoutes);
  app.use('/api/quizzes', quizRoutes);
  app.use('/api/competitions', competitionRoutes);
  app.use('/api/attempts', attemptRoutes);
  app.use('/api/interview-questions', interviewQuestionRoutes);

  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`
    });
  });

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('Global error handler:', err);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors
      });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    // Default error
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Internal Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  });

  return app;
};

const PORT = process.env.PORT || 5000;

const startServer = () => {
  createApp();
  const server = app.listen(PORT, () => {
    console.log(`🚀 SmartPrep API Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 CORS enabled for: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    console.log(`📚 API Documentation: http://localhost:${PORT}/api/health`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please stop the existing process and try again.`);
      process.exit(1);
    }

    console.error('Server error:', error);
    process.exit(1);
  });

  server.keepAliveTimeout = 65000;
  server.headersTimeout = 70000;
};

if (cluster.isPrimary && shouldUseClusterMode()) {
  const workers = Number(process.env.WORKERS || Math.max(1, os.cpus().length - 1));
  console.log(`Starting SmartPrep with ${workers} workers`);
  for (let i = 0; i < workers; i += 1) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died (${code || signal || 'unknown'}). Restarting...`);
    cluster.fork();
  });
} else {
  connectDB();
  startServer();
}

