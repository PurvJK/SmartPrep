import ResumeAnalysis from '../models/ResumeAnalysis.js';
import { analyzeStructured } from '../services/resumeParserService.js';

export const analyzeResumeStructured = async (req, res) => {
  try {
    const { text, jobDescription, originalFileName } = req.body;
    if (!text || text.trim().length < 50) {
      return res.status(400).json({ success: false, message: 'text is required (min 50 chars)' });
    }

    const start = Date.now();
    const result = await analyzeStructured(text, jobDescription || '');
    const doc = new ResumeAnalysis({
      userId: req.user?._id,
      originalFileName,
      text,
      jobDescription,
      extracted: result.extracted,
      scoring: result.scoring,
      suggestions: result.suggestions,
      meta: { analyzedAt: new Date(), model: 'rule_based_v1', runtimeMs: Date.now() - start },
    });
    await doc.save();
    return res.status(200).json({ success: true, data: doc });
  } catch (err) {
    console.error('Structured analyze error:', err);
    return res.status(500).json({ success: false, message: 'Failed to analyze resume' });
  }
};

export const listAnalyses = async (req, res) => {
  try {
    const { q, minScore, maxScore, skill, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (req.user && req.user.role !== 'admin' && req.user.role !== 'recruiter') {
      filter.userId = req.user._id;
    }
    if (q) filter.$text = { $search: q };
    if (skill) filter['extracted.skills'] = { $in: [skill] };
    if (minScore || maxScore) filter['scoring.finalScore'] = {
      ...(minScore ? { $gte: Number(minScore) } : {}),
      ...(maxScore ? { $lte: Number(maxScore) } : {}),
    };
    const docs = await ResumeAnalysis.find(filter)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    const total = await ResumeAnalysis.countDocuments(filter);
    return res.status(200).json({ success: true, data: { items: docs, total } });
  } catch (err) {
    console.error('List analyses error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch analyses' });
  }
};



























