import express from "express";
import StudyTheory from "../models/StudyTheory.js";

const router = express.Router();

// GET all theory or filter by category via ?category=...
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;
    if (category) {
      const doc = await StudyTheory.findOne({ category });
      if (!doc) return res.status(404).json({ success: false, message: "No theory found for category" });
      return res.json({ success: true, data: doc });
    }
    const docs = await StudyTheory.find().sort({ createdAt: -1 });
    res.json({ success: true, data: docs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// List topics for a category
router.get("/topics", async (req, res) => {
  try {
    const { category } = req.query;
    if (!category) return res.status(400).json({ success: false, message: "category is required" });
    const doc = await StudyTheory.findOne({ category }).lean();
    if (!doc) return res.status(404).json({ success: false, message: "No theory found for category" });
    const topics = (doc.topics || []).map(t => ({ _id: t._id, title: t.title, slug: t.slug }));
    res.json({ success: true, data: topics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Get a single topic by id for a category
router.get("/topic", async (req, res) => {
  try {
    const { category, topicId } = req.query;
    if (!category || !topicId) return res.status(400).json({ success: false, message: "category and topicId are required" });
    const doc = await StudyTheory.findOne({ category }).lean();
    if (!doc) return res.status(404).json({ success: false, message: "No theory found for category" });
    const topic = (doc.topics || []).find(t => String(t._id) === String(topicId));
    if (!topic) return res.status(404).json({ success: false, message: "Topic not found" });
    res.json({ success: true, data: topic });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Add or update topics array for a category (replace or append)
router.post("/topics", async (req, res) => {
  try {
    const { category, mode = 'append', topics = [] } = req.body;
    if (!category) return res.status(400).json({ success: false, message: "category is required" });
    if (!Array.isArray(topics)) return res.status(400).json({ success: false, message: "topics must be an array" });

    const doc = await StudyTheory.findOne({ category });
    if (!doc) return res.status(404).json({ success: false, message: "No theory found for category" });

    if (mode === 'replace') {
      doc.topics = topics;
    } else {
      doc.topics = [...(doc.topics || []), ...topics];
    }

    await doc.save();
    res.status(201).json({ success: true, data: doc.topics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET by id
router.get("/:id", async (req, res) => {
  try {
    const doc = await StudyTheory.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: doc });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// CREATE or UPDATE (upsert) by category
router.post("/", async (req, res) => {
  try {
    const { category, title, description, content, sections } = req.body;
    if (!category || !title) {
      return res.status(400).json({ success: false, message: "category and title are required" });
    }
    const updated = await StudyTheory.findOneAndUpdate(
      { category },
      { category, title, description, content, sections: sections || [] },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;


