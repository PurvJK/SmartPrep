import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';

// @desc Save a quiz attempt
// @route POST /api/attempts
// @access Private (authenticated)
export const saveAttempt = async (req, res) => {
  try {
    const { quizId, answers, timeTaken } = req.body;
    const userId = req.user?.id;

    if (!quizId || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Invalid attempt payload' });
    }

    const quiz = await Quiz.findById(quizId);
    if (!quiz) return res.status(404).json({ success: false, message: 'Quiz not found' });

    const total = quiz.questions.length;
    let correctCount = 0;

    // Build answer records with correctness
    const answerRecords = answers.map((ans) => {
      const qIndex = ans.questionIndex;
      const selected = ans.selected;
      const correct = Array.isArray(selected)
        ? selected.length === 1 && quiz.questions[qIndex]?.correctAnswer === selected[0]
        : quiz.questions[qIndex]?.correctAnswer === selected;
      if (correct) correctCount += 1;
      return { questionIndex: qIndex, selected, correct };
    });

    const attempt = await QuizAttempt.create({
      userId,
      quizId,
      answers: answerRecords,
      score: correctCount,
      totalQuestions: total,
      timeTaken
    });

    res.status(201).json({ success: true, data: attempt });
  } catch (error) {
    console.error('Save attempt error:', error);
    res.status(500).json({ success: false, message: 'Failed to save attempt' });
  }
};

// @desc Get attempt by id
// @route GET /api/attempts/:id
// @access Private (owner or admin)
export const getAttemptById = async (req, res) => {
  try {
    const attempt = await QuizAttempt.findById(req.params.id).populate('quizId').populate('userId', '-password');
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' });

    // allow owners or admins
    if (req.user.role !== 'admin' && String(req.user.id) !== String(attempt.userId._id)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    res.status(200).json({ success: true, data: attempt });
  } catch (error) {
    console.error('Get attempt error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attempt' });
  }
};

// @desc Get attempts for current user
// @route GET /api/attempts/my
// @access Private
export const getMyAttempts = async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ userId: req.user.id }).populate('quizId').sort({ submittedAt: -1 });
    res.status(200).json({ success: true, data: attempts });
  } catch (error) {
    console.error('Get my attempts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attempts' });
  }
};
