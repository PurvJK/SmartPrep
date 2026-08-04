import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';

// @desc Save a quiz attempt
// @route POST /api/attempts
// @access Private (authenticated)
export const saveAttempt = async (req, res) => {
  try {
    const { quizId, answers, timeTaken } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User authentication required' });
    }

    if (!quizId || !Array.isArray(answers)) {
      return res.status(400).json({ success: false, message: 'Invalid attempt payload' });
    }

    const quiz = await Quiz.findById(quizId).lean();
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

    res.status(201).json({
      success: true,
      data: {
        _id: attempt._id,
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        timeTaken: attempt.timeTaken,
        submittedAt: attempt.submittedAt
      }
    });
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

    // allow owners, admins, or faculty
    if (
      !['admin', 'faculty'].includes(req.user.role) &&
      String(req.user.id) !== String(attempt.userId._id)
    ) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    res.status(200).json({ success: true, data: attempt });
  } catch (error) {
    console.error('Get attempt error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attempt' });
  }
};

// @desc List candidate quiz results (student attempts)
// @route GET /api/attempts/candidates/results
// @access Private (admin, faculty)
export const listCandidateResults = async (req, res) => {
  try {
    if (req.user && !['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { quizId } = req.query;
    const filter = {};
    if (quizId) {
      filter.quizId = quizId;
    }

    const attempts = await QuizAttempt.find(filter)
      .populate('userId', 'name email role profile.studentId profile.department profile.class profile.division')
      .populate('quizId', 'title category')
      .sort({ submittedAt: -1 });

    const results = attempts
      .filter((attempt) => attempt.userId && attempt.userId.role === 'student')
      .map((attempt) => {
        const total = attempt.totalQuestions || 0;
        const marks = attempt.score ?? 0;
        return {
          attemptId: attempt._id,
          studentId: attempt.userId.profile?.studentId || '—',
          name: attempt.userId.name,
          email: attempt.userId.email,
          quizId: attempt.quizId?._id,
          quizTitle: attempt.quizId?.title || 'Unknown quiz',
          marks,
          totalMarks: total,
          percentage: total > 0 ? Math.round((marks / total) * 100) : 0,
          timeTaken: attempt.timeTaken ?? null,
          submittedAt: attempt.submittedAt,
        };
      });

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error('List candidate results error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch candidate results' });
  }
};

// @desc Get quiz attempt counts and unique student count
// @route GET /api/attempts/stats
// @access Private (admin, faculty)
export const getAttemptStats = async (req, res) => {
  try {
    if (req.user && !['admin', 'faculty'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { quizId } = req.query;
    if (!quizId) {
      return res.status(400).json({ success: false, message: 'quizId is required' });
    }

    const attempts = await QuizAttempt.find({ quizId }).lean();
    const totalAttempts = attempts.length;
    const uniqueUserIds = new Set(attempts.map((attempt) => attempt.userId?.toString()).filter(Boolean));

    const percentages = attempts.map((attempt) => {
      const total = attempt.totalQuestions || 0;
      return total > 0 ? Math.round(((attempt.score ?? 0) / total) * 100) : 0;
    });

    const averageScore = totalAttempts > 0
      ? Math.round(percentages.reduce((sum, value) => sum + value, 0) / totalAttempts)
      : 0;
    const highestScore = totalAttempts > 0 ? Math.max(...percentages) : 0;
    const lowestScore = totalAttempts > 0 ? Math.min(...percentages) : 0;

    const passThreshold = 60;
    const passedAttempts = percentages.filter((value) => value >= passThreshold).length;
    const passRate = totalAttempts > 0 ? Math.round((passedAttempts / totalAttempts) * 100) : 0;
    const averageTimeSeconds = totalAttempts > 0
      ? Math.round(attempts.reduce((sum, attempt) => sum + (attempt.timeTaken || 0), 0) / totalAttempts)
      : 0;
    const averageTimeMinutes = Math.max(1, Math.round(averageTimeSeconds / 60));

    const scoreDistribution = Array.from({ length: 10 }, (_, index) => {
      const rangeStart = index * 10;
      const rangeEnd = index === 9 ? 100 : rangeStart + 9;
      const label = index === 9 ? '90-100' : `${rangeStart}-${rangeEnd}`;
      const count = percentages.filter((value) => value >= rangeStart && value <= rangeEnd).length;
      return { label, count };
    });

    res.status(200).json({
      success: true,
      data: {
        quizId,
        totalAttempts,
        uniqueStudents: uniqueUserIds.size,
        averageScore,
        highestScore,
        lowestScore,
        passRate,
        averageTimeMinutes,
        scoreDistribution
      }
    });
  } catch (error) {
    console.error('Get attempt stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch attempt stats' });
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
