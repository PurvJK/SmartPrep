import mongoose from 'mongoose';

const QuizQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question text is required']
  },
  options: {
    type: [String],
    validate: {
      validator: function(val) {
        return Array.isArray(val) && val.length >= 2;
      },
      message: 'Each question must have at least two options'
    },
    required: [true, 'Options are required for each question']
  },
  correctAnswer: {
    type: Number,
    required: [true, 'Correct answer index is required'],
    min: [0, 'Correct answer index cannot be negative']
  },
  explanation: {
    type: String,
    default: ''
  }
}, { _id: false });

const QuizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz title is required']
  },
  category: {
    type: String,
    required: [true, 'Quiz category is required'],
    trim: true
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  description: {
    type: String,
    default: ''
  },
  timeLimit: {
    type: Number,
    default: 600, // seconds
    min: [60, 'Time limit should be at least 60 seconds']
  },
  questions: {
    type: [QuizQuestionSchema],
    validate: {
      validator: function(val) {
        return Array.isArray(val) && val.length > 0;
      },
      message: 'Quiz must contain at least one question'
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublished: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

export default mongoose.model('Quiz', QuizSchema);











