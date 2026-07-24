import express from "express";
import CodingProblem from "../models/CodingProblem.js";
import Submission from "../models/Submission.js";
import { protect, authorize } from "../middleware/auth.js";
import { createSubmission as judge0Run, checkJudge0Health } from "../services/judge0Service.js";

const router = express.Router();

// Health check endpoint for Judge0
router.get("/health/judge0", async (req, res) => {
  try {
    const health = await checkJudge0Health();
    res.json({ success: true, data: health });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET all coding problems with filters
router.get("/", async (req, res) => {
  try {
    const { difficulty, category, q, page = 1, limit = 10 } = req.query;
    const filter = { isActive: true };
    
    if (difficulty) filter.difficulty = difficulty;
    if (category) filter.category = category;
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const problems = await CodingProblem.find(filter)
      .select('-testCases -solution')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CodingProblem.countDocuments(filter);

    res.json({
      success: true,
      data: {
        problems,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single problem by ID
router.get("/:id", async (req, res) => {
  try {
    const problem = await CodingProblem.findById(req.params.id);
    if (!problem || !problem.isActive) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }
    res.json({ success: true, data: problem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST new problem (Admin only)
router.post("/", protect, authorize('admin'), async (req, res) => {
  try {
    const problem = await CodingProblem.create(req.body);
    res.status(201).json({ success: true, data: problem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT update problem (Admin only)
router.put("/:id", protect, authorize('admin'), async (req, res) => {
  try {
    const problem = await CodingProblem.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    );
    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }
    res.json({ success: true, data: problem });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE problem (Admin only)
router.delete("/:id", protect, authorize('admin'), async (req, res) => {
  try {
    const problem = await CodingProblem.findByIdAndUpdate(
      req.params.id, 
      { isActive: false }, 
      { new: true }
    );
    if (!problem) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }
    res.json({ success: true, message: "Problem deactivated" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST submit solution
router.post("/:id/submit", protect, async (req, res) => {
  try {
    const { code, language } = req.body;
    const problemId = req.params.id;
    const userId = req.user.id;

    if (!code || !language) {
      return res.status(400).json({ 
        success: false, 
        message: "Code and language are required" 
      });
    }

    const problem = await CodingProblem.findById(problemId);
    if (!problem || !problem.isActive) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }

    // Execute against test cases using Judge0
    const testResults = [];
    for (let i = 0; i < problem.testCases.length; i++) {
      const tc = problem.testCases[i];
      
      // Log test case execution (in development)
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Test Case ${i + 1}/${problem.testCases.length}] Input: ${tc.input}, Expected: ${tc.expectedOutput}`);
      }
      
      // Execute each test case independently
      const result = await judge0Run({ 
        sourceCode: code, 
        language, 
        stdin: tc.input || '' // Ensure we pass the input, even if empty
      });
      
      const status = result.status?.description || 'Unknown';
      const stdout = (result.stdout || '').trim();
      const stderr = (result.stderr || '').trim();
      const compileOutput = (result.compile_output || '').trim();
      const message = (result.message || '').trim();
      const actual = stdout || stderr || compileOutput || message;
      
      // Compare outputs (case-insensitive and whitespace-normalized)
      const expectedNormalized = String(tc.expectedOutput || '').trim();
      const actualNormalized = actual.trim();
      const passed = actualNormalized === expectedNormalized;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Test Case ${i + 1}] Output: "${actualNormalized}", Expected: "${expectedNormalized}", Passed: ${passed}`);
      }
      
      testResults.push({
        passed,
        input: tc.input || '',
        expected: expectedNormalized,
        actual: actualNormalized || 'No output',
        status,
        stderr,
        compileOutput,
        message,
        time: result.time,
        memory: result.memory,
      });
    }

    const passedCount = testResults.filter(r => r.passed).length;
    const finalStatus = passedCount === testResults.length ? "Accepted" : "Wrong Answer";

    const submission = await Submission.create({
      userId,
      problemId,
      code,
      language,
      status: finalStatus,
      testCasesPassed: passedCount,
      totalTestCases: testResults.length,
      executionTime: testResults.reduce((acc, r) => acc + (parseFloat(r.time) || 0), 0),
      memoryUsed: Math.max(...testResults.map(r => parseFloat(r.memory) || 0)) || 0
    });

    return res.json({ success: true, data: { submission, testResults, status: finalStatus } });
  } catch (err) {
    console.error('Judge0 submit error:', err);
    
    // Provide better error messages based on status code
    let statusCode = 500;
    let message = err.message || 'Failed to submit solution';
    
    if (err.statusCode === 400) {
      statusCode = 400;
      message = err.message || 'Invalid code execution request. Please check code format and try again.';
    } else if (err.statusCode === 401) {
      statusCode = 401;
      message = err.message || 'Invalid Judge0 API credentials. Please update server configuration.';
    } else if (err.statusCode === 403) {
      statusCode = 403;
      message = 'Code execution service is not available. Please contact administrator.';
    } else if (err.statusCode === 429) {
      statusCode = 429;
      message = 'Too many requests. Please wait a moment before trying again.';
    } else if (err.statusCode === 500 || err.statusCode === 503) {
      statusCode = 503;
      message = 'Code execution service is temporarily unavailable. Please try again later.';
    }
    
    res.status(statusCode).json({ 
      success: false, 
      message,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// POST run code (without submitting)
router.post("/:id/run", protect, async (req, res) => {
  try {
    const { code, language, stdin = '' } = req.body;
    const problemId = req.params.id;

    if (!code || !language) {
      return res.status(400).json({ 
        success: false, 
        message: "Code and language are required" 
      });
    }

    const problem = await CodingProblem.findById(problemId);
    if (!problem || !problem.isActive) {
      return res.status(404).json({ success: false, message: "Problem not found" });
    }

    // Use first test case input if no stdin provided
    const input = stdin || (problem.testCases?.[0]?.input || '');
    
    // Execute code using Judge0
    const result = await judge0Run({ sourceCode: code, language, stdin: input });
    
    const output = {
      stdout: (result.stdout || '').trim(),
      stderr: (result.stderr || '').trim(),
      compile_output: (result.compile_output || '').trim(),
      message: (result.message || '').trim(),
      status: result.status?.description || 'Unknown',
      time: result.time,
      memory: result.memory
    };

    return res.json({ success: true, data: output });
  } catch (err) {
    console.error('Judge0 run error:', err);
    
    // Provide better error messages based on status code
    let statusCode = 500;
    let message = err.message || 'Failed to execute code';
    
    if (err.statusCode === 400) {
      statusCode = 400;
      message = err.message || 'Invalid code execution request. Please check code format and try again.';
    } else if (err.statusCode === 401) {
      statusCode = 401;
      message = err.message || 'Invalid Judge0 API credentials. Please update server configuration.';
    } else if (err.statusCode === 403) {
      statusCode = 403;
      message = 'Code execution service is not available. Please contact administrator.';
    } else if (err.statusCode === 429) {
      statusCode = 429;
      message = 'Too many requests. Please wait a moment before trying again.';
    } else if (err.statusCode === 500 || err.statusCode === 503) {
      statusCode = 503;
      message = 'Code execution service is temporarily unavailable. Please try again later.';
    }
    
    res.status(statusCode).json({ 
      success: false, 
      message,
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// GET user submissions for a problem
router.get("/:id/submissions", protect, async (req, res) => {
  try {
    const submissions = await Submission.find({
      problemId: req.params.id,
      userId: req.user.id
    }).sort({ submittedAt: -1 });

    res.json({ success: true, data: submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
