import mongoose from 'mongoose';

const CompetitionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Competition title is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  durationMinutes: {
    type: Number,
    default: 60,
    min: [1, 'Duration must be at least 1 minute']
  },
  tags: [
    {
      type: String,
      trim: true
    }
  ],
  relatedQuizzes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz'
    }
  ],
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

CompetitionSchema.index({ isPublished: 1, startDate: 1 });

export default mongoose.model('Competition', CompetitionSchema);
