import mongoose from "mongoose";

const SubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingProblem', required: true },
  code: { type: String, required: true },
  language: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["Accepted", "Wrong Answer", "Time Limit Exceeded", "Runtime Error", "Compilation Error"],
    required: true 
  },
  executionTime: { type: Number }, // milliseconds
  memoryUsed: { type: Number }, // MB
  testCasesPassed: { type: Number, default: 0 },
  totalTestCases: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("Submission", SubmissionSchema);


