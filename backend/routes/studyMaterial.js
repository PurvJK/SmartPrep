import express from "express";
import StudyMaterial from "../models/StudyMaterial.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// GET /api/study-materials?category=DSA&difficulty=Easy&q=stack
router.get("/", async (req, res) => {
  try {
    const { category, difficulty, q } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ];
    }
    const materials = await StudyMaterial.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: materials });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET one by id
router.get("/:id", async (req, res) => {
  try {
    const material = await StudyMaterial.findById(req.params.id);
    if (!material) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: material });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create (Admin only)
router.post("/", protect, authorize('admin'), async (req, res) => {
  try {
    const { title, category, description, readTime, difficulty, content, images = [] } = req.body;
    if (!title || !category || !description || !readTime || !difficulty || !content) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const doc = await StudyMaterial.create({ title, category, description, readTime, difficulty, content, images });
    res.status(201).json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update (Admin only)
router.put("/:id", protect, authorize('admin'), async (req, res) => {
  try {
    const updates = req.body;
    const doc = await StudyMaterial.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete (Admin only)
router.delete("/:id", protect, authorize('admin'), async (req, res) => {
  try {
    const doc = await StudyMaterial.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;

