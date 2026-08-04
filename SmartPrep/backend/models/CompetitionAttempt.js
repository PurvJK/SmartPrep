import mongoose from 'mongoose';

const CompetitionAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  competitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competition',
    required: true
  },
  score: {
    type: Number,
    default: 0
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  quizAttemptIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuizAttempt'
  }],
  submittedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

CompetitionAttemptSchema.index({ competitionId: 1, userId: 1 });

export default mongoose.model('CompetitionAttempt', CompetitionAttemptSchema);
