import express from "express";
import CodingProblem from "../models/CodingProblem.js";
import Submission from "../models/Submission.js";
import { protect, authorize } from "../middleware/auth.js";
import { createSubmission as judge0Run } from "../services/judge0Service.js";

const router = express.Router();

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
    for (const tc of problem.testCases) {
      const result = await judge0Run({ sourceCode: code, language, stdin: tc.input });
      const status = result.status?.description || 'Unknown';
      const stdout = (result.stdout || '').trim();
      const stderr = (result.stderr || '').trim();
      const actual = stdout || stderr;
      const passed = stdout?.trim() === String(tc.expectedOutput).trim();
      testResults.push({
        passed,
        input: tc.input,
        expected: tc.expectedOutput,
        actual: actual,
        status,
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
    res.status(500).json({ success: false, message: err.message });
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
