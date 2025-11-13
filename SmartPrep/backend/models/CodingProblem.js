import mongoose from "mongoose";

const TestCaseSchema = new mongoose.Schema({
  input: { type: String, required: true },
  expectedOutput: { type: String, required: true },
  isHidden: { type: Boolean, default: false }
}, { _id: false });

const CodingProblemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { 
    type: String, 
    enum: ["Easy", "Medium", "Hard"], 
    required: true 
  },
  category: { 
    type: String, 
    required: true,
    enum: ["Arrays", "Strings", "Linked Lists", "Trees", "Graphs", "Dynamic Programming", "Sorting", "Searching", "Math", "Greedy"]
  },
  examples: [{
    input: String,
    output: String,
    explanation: String
  }],
  constraints: [String],
  testCases: [TestCaseSchema],
  hints: [String],
  solution: { type: String },
  timeLimit: { type: Number, default: 1000 }, // milliseconds
  memoryLimit: { type: Number, default: 128 }, // MB
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("CodingProblem", CodingProblemSchema);


