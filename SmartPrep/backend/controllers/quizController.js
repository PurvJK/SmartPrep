import Quiz from '../models/Quiz.js';

// @desc    List quizzes (optional filters)
// @route   GET /api/quizzes
// @access  Public (only published quizzes)
export const listQuizzes = async (req, res) => {
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

    const quizzes = await Quiz.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: quizzes
    });
  } catch (error) {
    console.error('List quizzes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quizzes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get quiz by ID
// @route   GET /api/quizzes/:id
// @access  Public (only published quizzes)
export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    if (!quiz.isPublished && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Quiz is not published'
      });
    }

    res.status(200).json({
      success: true,
      data: quiz
    });
  } catch (error) {
    console.error('Get quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Create new quiz
// @route   POST /api/quizzes
// @access  Private/Admin
export const createQuiz = async (req, res) => {
  try {
    const quizData = req.body;

    if (!quizData.questions || !Array.isArray(quizData.questions) || quizData.questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Quiz must include at least one question'
      });
    }

    // Ensure correctAnswer index is within range
    const normalizedQuestions = quizData.questions.map((question, index) => {
      if (
        typeof question.correctAnswer !== 'number' ||
        !question.options ||
        question.correctAnswer < 0 ||
        question.correctAnswer >= question.options.length
      ) {
        throw new Error(`Question ${index + 1} has invalid correct answer index`);
      }

      return {
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || ''
      };
    });

    const quiz = await Quiz.create({
      title: quizData.title,
      category: quizData.category,
      difficulty: quizData.difficulty || 'Medium',
      description: quizData.description || '',
      timeLimit: quizData.timeLimit || 600,
      tags: quizData.tags || [],
      isPublished: quizData.isPublished !== undefined ? quizData.isPublished : true,
      questions: normalizedQuestions,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: quiz
    });
  } catch (error) {
    console.error('Create quiz error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create quiz'
    });
  }
};

// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Private/Admin
export const updateQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.questions) {
      if (!Array.isArray(updates.questions) || updates.questions.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Quiz must include at least one question'
        });
      }

      updates.questions = updates.questions.map((question, index) => {
        if (
          typeof question.correctAnswer !== 'number' ||
          !question.options ||
          question.correctAnswer < 0 ||
          question.correctAnswer >= question.options.length
        ) {
          throw new Error(`Question ${index + 1} has invalid correct answer index`);
        }

        return {
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation || ''
        };
      });
    }

    const quiz = await Quiz.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Quiz updated successfully',
      data: quiz
    });
  } catch (error) {
    console.error('Update quiz error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update quiz'
    });
  }
};

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private/Admin
export const deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findByIdAndDelete(id);

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: 'Quiz not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Quiz deleted successfully'
    });
  } catch (error) {
    console.error('Delete quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete quiz'
    });
  }
};











