import mongoose from "mongoose";

const StudyMaterialSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String, required: true },
  readTime: { type: String, required: true },
  difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], required: true },
  content: { type: String, required: true },
  images: { type: [String], default: [] },
}, { timestamps: true });

export default mongoose.model("StudyMaterial", StudyMaterialSchema);
