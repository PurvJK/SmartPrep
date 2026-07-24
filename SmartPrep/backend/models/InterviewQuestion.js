import mongoose from 'mongoose';

const InterviewQuestionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  answer: {
    type: String,
    required: [true, 'Answer is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['HR', 'Technical'],
    trim: true
  },
  subcategory: {
    type: String,
    trim: true,
    default: ''
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium'
  },
  tags: [{
    type: String,
    trim: true
  }],
  tips: {
    type: String,
    default: ''
  },
  examples: {
    type: String,
    default: ''
  },
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

// Index for faster queries
InterviewQuestionSchema.index({ category: 1, isPublished: 1 });
InterviewQuestionSchema.index({ difficulty: 1 });

export default mongoose.model('InterviewQuestion', InterviewQuestionSchema);

