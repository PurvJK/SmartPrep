import mongoose from "mongoose";

const TheorySchema = new mongoose.Schema({
  // e.g., DSA, OS, DBMS, Aptitude, Programming
  category: { type: String, required: true },
  // topic title
  title: { type: String, required: true },
  // short summary shown on card
  description: { type: String, default: "" },
  // Easy | Medium | Hard
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Medium" },
  // Combined content with text and image tokens (e.g., markdown). Images can be stored as ![](url)
  content: { type: String, default: "" }
}, { timestamps: true });

export default mongoose.model("Theory", TheorySchema);


