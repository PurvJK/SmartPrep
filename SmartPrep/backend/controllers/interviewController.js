import InterviewQuestion from '../models/InterviewQuestion.js';

// @desc    List interview questions (optional filters)
// @route   GET /api/interview-questions
// @access  Public (only published questions)
export const listInterviewQuestions = async (req, res) => {
  try {
    const { category, difficulty, includeUnpublished } = req.query;
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (difficulty) {
      filter.difficulty = difficulty;
    }

    if (!includeUnpublished || includeUnpublished === 'false') {
      filter.isPublished = true;
    }

    const questions = await InterviewQuestion.find(filter)
      .sort({ createdAt: -1 })
      .select('-createdBy');

    res.status(200).json({
      success: true,
      data: questions
    });
  } catch (error) {
    console.error('List interview questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview questions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get interview question by ID
// @route   GET /api/interview-questions/:id
// @access  Public (only published questions)
export const getInterviewQuestionById = async (req, res) => {
  try {
    const question = await InterviewQuestion.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Interview question not found'
      });
    }

    if (!question.isPublished && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Question is not published'
      });
    }

    res.status(200).json({
      success: true,
      data: question
    });
  } catch (error) {
    console.error('Get interview question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch interview question',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new interview question
// @route   POST /api/interview-questions
// @access  Private/Admin
export const createInterviewQuestion = async (req, res) => {
  try {
    const questionData = req.body;

    if (!questionData.question || !questionData.answer) {
      return res.status(400).json({
        success: false,
        message: 'Question and answer are required'
      });
    }

    if (!questionData.category || !['HR', 'Technical'].includes(questionData.category)) {
      return res.status(400).json({
        success: false,
        message: 'Valid category (HR or Technical) is required'
      });
    }

    const question = await InterviewQuestion.create({
      question: questionData.question,
      answer: questionData.answer,
      category: questionData.category,
      subcategory: questionData.subcategory || '',
      difficulty: questionData.difficulty || 'Medium',
      tags: questionData.tags || [],
      tips: questionData.tips || '',
      examples: questionData.examples || '',
      isPublished: questionData.isPublished !== undefined ? questionData.isPublished : true,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Interview question created successfully',
      data: question
    });
  } catch (error) {
    console.error('Create interview question error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create interview question'
    });
  }
};

// @desc    Update interview question
// @route   PUT /api/interview-questions/:id
// @access  Private/Admin
export const updateInterviewQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.category && !['HR', 'Technical'].includes(updates.category)) {
      return res.status(400).json({
        success: false,
        message: 'Valid category (HR or Technical) is required'
      });
    }

    const question = await InterviewQuestion.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Interview question not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Interview question updated successfully',
      data: question
    });
  } catch (error) {
    console.error('Update interview question error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update interview question'
    });
  }
};

// @desc    Delete interview question
// @route   DELETE /api/interview-questions/:id
// @access  Private/Admin
export const deleteInterviewQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await InterviewQuestion.findByIdAndDelete(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Interview question not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Interview question deleted successfully'
    });
  } catch (error) {
    console.error('Delete interview question error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete interview question'
    });
  }
};

