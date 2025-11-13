import mongoose from "mongoose";

const StudyTheorySectionSchema = new mongoose.Schema({
  heading: { type: String, required: true },
  items: { type: [String], default: [] },
  image: { type: String }
}, { _id: false });

const StudyTopicSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, trim: true },
  content: { type: String },
  sections: { type: [StudyTheorySectionSchema], default: [] }
}, { _id: true, timestamps: true });

const StudyTheorySchema = new mongoose.Schema({
  category: { 
    type: String, 
    required: true,
    unique: true,
    enum: [
      "Data Structures & Algorithms (DSA)",
      "Operating System Concepts",
      "Database Management Systems (DBMS)",
      "Quantitative Aptitude (Apti)",
      "Object-Oriented Programming (OOP)"
    ]
  },
  title: { type: String, required: true },
  slug: { type: String, trim: true, index: true },
  description: { type: String },
  content: { type: String }, // Optional markdown/plain text
  sections: { type: [StudyTheorySectionSchema], default: [] },
  topics: { type: [StudyTopicSchema], default: [] }
}, { timestamps: true });

export default mongoose.model("StudyTheory", StudyTheorySchema);


