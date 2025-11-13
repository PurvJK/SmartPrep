const express = require("express");
const Theory = require("../models/Theory");
const router = express.Router();

// Get all topics
router.get("/", async (req, res) => {
  const topics = await Theory.find();
  res.json(topics);
});

// Add new topic
router.post("/", async (req, res) => {
  const { subject, title, content, imageUrl } = req.body;
  const newTopic = new Theory({ subject, title, content, imageUrl });
  await newTopic.save();
  res.json(newTopic);
});

module.exports = router;
