const mongoose = require("mongoose");

const blockSchema = new mongoose.Schema({
  type: { type: String, enum: ["text", "image"], required: true },
  content: String, // for text
  imageUrl: String // for images
});

const theorySchema = new mongoose.Schema({
  subject: String,
  title: String,
  blocks: [blockSchema] // array of content/image blocks
});

module.exports = mongoose.model("Theory", theorySchema);
