import mongoose from 'mongoose';

const AnswerSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  selected: { type: mongoose.Schema.Types.Mixed },
  correct: { type: Boolean, default: false }
}, { _id: false });

const QuizAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  answers: { type: [AnswerSchema], default: [] },
  score: { type: Number, default: 0 },
  totalQuestions: { type: Number, default: 0 },
  timeTaken: { type: Number }, // seconds
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('QuizAttempt', QuizAttemptSchema);
