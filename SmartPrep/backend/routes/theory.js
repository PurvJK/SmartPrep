import express from "express";
import Theory from "../models/Theory.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// List theory topics (optionally filter by category)
router.get("/", async (req, res) => {
  try {
    const { category, title } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (title) filter.title = { $regex: title, $options: 'i' };
    const topics = await Theory.find(filter).sort({ createdAt: -1 });
    res.json(topics);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single theory topic by ID
router.get("/:id", async (req, res) => {
  try {
    const topic = await Theory.findById(req.params.id);
    if (!topic) {
      return res.status(404).json({ message: 'Theory topic not found' });
    }
    res.json(topic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new theory topic (admin only)
router.post("/", protect, authorize('admin'), async (req, res) => {
  try {
    const { category, title, description, difficulty, content } = req.body;
    if (!category || !title) {
      return res.status(400).json({ message: 'category and title are required' });
    }
    const doc = await Theory.create({ category, title, description, difficulty, content });
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update a theory topic (admin only)
router.put("/:id", protect, authorize('admin'), async (req, res) => {
  try {
    const { category, title, description, difficulty, content } = req.body;
    const topic = await Theory.findByIdAndUpdate(
      req.params.id,
      { category, title, description, difficulty, content },
      { new: true, runValidators: true }
    );
    if (!topic) {
      return res.status(404).json({ message: 'Theory topic not found' });
    }
    res.json(topic);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete a theory topic (admin only)
router.delete("/:id", protect, authorize('admin'), async (req, res) => {
  try {
    const topic = await Theory.findByIdAndDelete(req.params.id);
    if (!topic) {
      return res.status(404).json({ message: 'Theory topic not found' });
    }
    res.json({ message: 'Theory topic deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;


