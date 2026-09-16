import Competition from '../models/Competition.js';
import Quiz from '../models/Quiz.js';
import QuizAttempt from '../models/QuizAttempt.js';
import CompetitionAttempt from '../models/CompetitionAttempt.js';
import { doesUserMatchCompetitionEligibility } from '../utils/competitionEligibility.js';

// @desc    List competitions
// @route   GET /api/competitions
// @access  Public (published only)
export const listCompetitions = async (req, res) => {
  try {
    const { includeUnpublished } = req.query;
    const filter = {};

    if (!includeUnpublished || includeUnpublished === 'false') {
      filter.isPublished = true;
    }

    const competitions = await Competition.find(filter)
      .sort({ startDate: -1 })
      .populate('relatedQuizzes', 'title category difficulty isPublished')
      .populate('createdBy', 'name role');

    const visibleCompetitions = req.user
      ? competitions.filter((competition) => {
          if (!req.user || req.user.role !== 'student') return true;
          return doesUserMatchCompetitionEligibility(competition, req.user);
        })
      : competitions;

    res.status(200).json({
      success: true,
      data: visibleCompetitions
    });
  } catch (error) {
    console.error('List competitions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch competitions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get competition by Id
// @route   GET /api/competitions/:id
// @access  Public (published only)
export const getCompetitionById = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id)
      .populate('relatedQuizzes', 'title category difficulty isPublished')
      .populate('createdBy', 'name role');

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    if (!competition.isPublished && (!req.user || !['admin', 'faculty'].includes(req.user.role))) {
      return res.status(403).json({
        success: false,
        message: 'Competition is not published'
      });
    }

    if (req.user && req.user.role === 'student' && !doesUserMatchCompetitionEligibility(competition, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'This competition is not available for your profile.'
      });
    }

    res.status(200).json({
      success: true,
      data: competition
    });
  } catch (error) {
    console.error('Get competition error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch competition',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get competition results for faculty/admin
// @route   GET /api/competitions/:id/results
// @access  Private (admin, faculty)
export const getCompetitionResults = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id).populate('relatedQuizzes', '_id');
    if (!competition) {
      return res.status(404).json({ success: false, message: 'Competition not found' });
    }

    const quizIds = (competition.relatedQuizzes || []).map((quiz) => quiz._id).filter(Boolean);
    if (quizIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    let attempts = await QuizAttempt.find({
      quizId: { $in: quizIds },
      submittedAt: { $gte: competition.startDate }
    })
      .populate('userId', 'name email profile.studentId profile.department profile.class profile.division role')
      .populate('quizId', 'title')
      .sort({ submittedAt: 1 });

    if (!attempts.length) {
      attempts = await QuizAttempt.find({ quizId: { $in: quizIds } })
        .populate('userId', 'name email profile.studentId profile.department profile.class profile.division role')
        .populate('quizId', 'title')
        .sort({ submittedAt: 1 });
    }

    const bestAttemptsByQuiz = new Map();
    attempts.forEach((attempt) => {
      const userId = attempt.userId?._id?.toString();
      const quizId = attempt.quizId?._id?.toString();
      if (!userId || !quizId) return;

      const key = `${userId}:${quizId}`;
      const existing = bestAttemptsByQuiz.get(key);
      const currentScore = attempt.score ?? 0;
      const existingScore = existing?.score ?? -Infinity;
      if (!existing || currentScore > existingScore) {
        bestAttemptsByQuiz.set(key, attempt);
      }
    });

    const persistedResults = await CompetitionAttempt.find({ competitionId: competition._id })
      .populate('userId', 'name profile.studentId')
      .sort({ submittedAt: 1 });

    const studentResults = new Map();
    persistedResults.forEach((entry) => {
      const userId = entry.userId?._id?.toString();
      if (!userId) return;
      studentResults.set(userId, {
        studentId: entry.userId?.profile?.studentId || '—',
        name: entry.userId?.name || 'Unknown',
        marks: entry.score ?? 0,
        totalMarks: entry.totalQuestions || 0,
        percentage: entry.totalQuestions > 0 ? Math.round(((entry.score ?? 0) / entry.totalQuestions) * 100) : 0,
        submittedAt: entry.submittedAt,
        // include any stored quiz attempt ids for this competition attempt
        attemptIds: Array.isArray(entry.quizAttemptIds) ? entry.quizAttemptIds.map(String) : []
      });
    });

    Array.from(bestAttemptsByQuiz.values()).forEach((attempt) => {
      const userId = attempt.userId?._id?.toString();
      if (!userId) return;

      const existing = studentResults.get(userId) || {
        studentId: attempt.userId?.profile?.studentId || '—',
        name: attempt.userId?.name || 'Unknown',
        marks: 0,
        totalMarks: 0,
        percentage: 0,
        submittedAt: attempt.submittedAt
      };

      existing.marks += attempt.score ?? 0;
      existing.totalMarks += attempt.totalQuestions || 0;
      existing.percentage = existing.totalMarks > 0 ? Math.round((existing.marks / existing.totalMarks) * 100) : 0;
      // add the quiz attempt id to the list so frontend can fetch detailed attempt(s)
      if (!existing.attemptIds) existing.attemptIds = [];
      try {
        const idStr = attempt._id?.toString();
        if (idStr && !existing.attemptIds.includes(idStr)) existing.attemptIds.push(idStr);
      } catch (err) {
        // ignore
      }
      studentResults.set(userId, existing);
    });

    const results = Array.from(studentResults.values()).sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error('Get competition results error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch competition results' });
  }
};

// @desc    Save a completed competition result
// @route   POST /api/competitions/:id/results
// @access  Private
export const getMyCompetitionResults = async (req, res) => {
  try {
    const attempts = await CompetitionAttempt.find({ userId: req.user.id })
      .populate('competitionId', 'title startDate endDate')
      .sort({ submittedAt: -1 });

    const now = new Date();
    const results = attempts.map((attempt) => {
      const competitionEndDate = attempt.competitionId?.endDate;
      const resultAvailable = competitionEndDate ? now >= new Date(competitionEndDate) : true;
      const totalQuestions = resultAvailable ? attempt.totalQuestions ?? 0 : null;
      const score = resultAvailable ? attempt.score ?? 0 : null;
      const percentage = resultAvailable && totalQuestions
        ? Math.round((score / totalQuestions) * 100)
        : null;

      return {
        competitionId: attempt.competitionId?._id,
        competitionTitle: attempt.competitionId?.title || 'Unknown competition',
        startDate: attempt.competitionId?.startDate,
        endDate: attempt.competitionId?.endDate,
        score,
        totalQuestions,
        percentage,
        resultAvailable,
        submittedAt: attempt.submittedAt
      };
    });

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error('Get my competition results error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch competition results for user' });
  }
};

export const getMyCompetitionResultById = async (req, res) => {
  try {
    const competitionId = req.params.competitionId;
    const userId = req.user.id;

    const competitionAttempt = await CompetitionAttempt.findOne({ competitionId, userId })
      .populate('competitionId', 'title description startDate endDate')
      .lean();

    if (!competitionAttempt) {
      return res.status(404).json({ success: false, message: 'Competition result not found' });
    }

    const competition = competitionAttempt.competitionId;
    const now = new Date();
    const competitionEndDate = competition?.endDate ? new Date(competition.endDate) : null;
    const resultAvailable = !competitionEndDate || now >= competitionEndDate;

    if (!resultAvailable) {
      return res.status(200).json({
        success: true,
        data: {
          competitionId: competition?._id,
          competitionTitle: competition?.title || 'Competition',
          description: competition?.description || '',
          startDate: competition?.startDate,
          endDate: competition?.endDate,
          submittedAt: competitionAttempt.submittedAt,
          resultAvailable: false
        }
      });
    }

    const [quizAttempts, allAttempts] = await Promise.all([
      QuizAttempt.find({ _id: { $in: competitionAttempt.quizAttemptIds } })
        .populate('quizId')
        .lean(),
      CompetitionAttempt.find({ competitionId }).lean()
    ]);

    const attemptPercentages = allAttempts.map((att) => {
      const total = att.totalQuestions || 0;
      return total > 0 ? Math.round(((att.score ?? 0) / total) * 100) : 0;
    });
    const sortedPercentages = [...attemptPercentages].sort((a, b) => b - a);
    const userPercentage = competitionAttempt.totalQuestions
      ? Math.round(((competitionAttempt.score ?? 0) / competitionAttempt.totalQuestions) * 100)
      : 0;
    const rank = sortedPercentages.findIndex((value) => value === userPercentage) + 1;
    const totalParticipants = sortedPercentages.length;
    const classAverage = totalParticipants > 0
      ? Math.round(sortedPercentages.reduce((sum, value) => sum + value, 0) / totalParticipants)
      : 0;
    const highestScore = totalParticipants > 0 ? sortedPercentages[0] : 0;
    const percentile = totalParticipants > 1
      ? Number((((totalParticipants - rank) / (totalParticipants - 1)) * 100).toFixed(2))
      : 100;

    const allCompetitionAttempts = await CompetitionAttempt.find({ userId }).populate('competitionId', 'title').sort({ submittedAt: -1 }).lean();
    const previousCompetitions = allCompetitionAttempts
      .filter((att) => String(att.competitionId?._id) !== String(competitionId))
      .slice(0, 5)
      .map((att) => ({
        competitionId: att.competitionId?._id,
        competitionTitle: att.competitionId?.title || 'Unknown competition',
        percentage: att.totalQuestions ? Math.round(((att.score ?? 0) / att.totalQuestions) * 100) : 0,
        submittedAt: att.submittedAt
      }));

    const questionReview = [];
    const topicMap = {};
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalSkipped = 0;
    let answeredCount = 0;

    quizAttempts.forEach((quizAttempt) => {
      const quiz = quizAttempt.quizId;
      const answers = quizAttempt.answers || [];
      const questionCount = quiz?.questions?.length || 0;

      for (let idx = 0; idx < questionCount; idx += 1) {
        const question = quiz.questions[idx];
        const answer = answers.find((ans) => Number(ans.questionIndex) === idx);
        const selected = answer?.selected;
        const correct = !!answer?.correct;
        const skipped = answer === undefined || selected === undefined || selected === null;
        if (skipped) {
          totalSkipped += 1;
        } else if (correct) {
          totalCorrect += 1;
          answeredCount += 1;
        } else {
          totalWrong += 1;
          answeredCount += 1;
        }

        const topic = question.topic || 'General';
        if (!topicMap[topic]) {
          topicMap[topic] = { topic, total: 0, correct: 0, wrong: 0, skipped: 0 };
        }
        topicMap[topic].total += 1;
        if (skipped) topicMap[topic].skipped += 1;
        else if (correct) topicMap[topic].correct += 1;
        else topicMap[topic].wrong += 1;

        questionReview.push({
          quizTitle: quiz.title || 'Quiz',
          questionIndex: idx,
          question: question.question,
          options: question.options || [],
          selected,
          correctAnswer: question.correctAnswer,
          correct,
          skipped,
          explanation: question.explanation || '',
          topic,
          quizId: quiz._id
        });
      }
    });

    const topicPerformance = Object.values(topicMap).map((topicData) => {
      const correct = topicData.correct;
      const accuracy = topicData.total > 0 ? Math.round((correct / topicData.total) * 100) : 0;
      let status = 'Average';
      if (accuracy >= 80) status = 'Excellent';
      else if (accuracy >= 60) status = 'Good';
      else if (accuracy >= 40) status = 'Average';
      else status = 'Needs Improvement';
      return {
        ...topicData,
        accuracy,
        status
      };
    }).sort((a, b) => b.accuracy - a.accuracy);

    const strengths = topicPerformance.filter((topic) => topic.accuracy >= 70).map((topic) => topic.topic);
    const weaknesses = topicPerformance.filter((topic) => topic.accuracy < 70).map((topic) => topic.topic);
    const recommendations = weaknesses.slice(0, 3).map((topic) => ({
      title: `Master ${topic}`,
      description: `Review theory and practice questions for ${topic}.`,
      links: [
        { label: 'Read Theory', href: '/study-materials' },
        { label: 'Practice Quiz', href: '/quizzes' },
        { label: 'Interview Questions', href: '/interview-prep' }
      ]
    }));

    const detail = {
      competitionId: competitionAttempt.competitionId?._id,
      competitionTitle: competitionAttempt.competitionId?.title || 'Competition',
      description: competitionAttempt.competitionId?.description || '',
      startDate: competitionAttempt.competitionId?.startDate,
      endDate: competitionAttempt.competitionId?.endDate,
      score: competitionAttempt.score ?? 0,
      totalQuestions: competitionAttempt.totalQuestions ?? 0,
      percentage: userPercentage,
      rank,
      percentile,
      classAverage,
      highestScore,
      timeTakenSeconds: quizAttempts.reduce((sum, attempt) => sum + (attempt.timeTaken || 0), 0),
      submittedAt: competitionAttempt.submittedAt,
      quizAttempts: quizAttempts.map((attempt) => ({
        _id: attempt._id,
        quizTitle: attempt.quizId?.title || 'Quiz',
        score: attempt.score ?? 0,
        totalQuestions: attempt.totalQuestions ?? 0,
        percentage: attempt.totalQuestions ? Math.round(((attempt.score ?? 0) / attempt.totalQuestions) * 100) : 0,
        timeTaken: attempt.timeTaken,
        submittedAt: attempt.submittedAt
      })),
      questionReview,
      topicPerformance,
      strengths,
      weaknesses,
      recommendations,
      previousCompetitions,
      facultyFeedback: competitionAttempt.facultyFeedback || ''
    };

    res.status(200).json({ success: true, data: detail });
  } catch (error) {
    console.error('Get my competition detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch competition result detail' });
  }
};

export const saveCompetitionResult = async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.id);
    if (!competition) {
      return res.status(404).json({ success: false, message: 'Competition not found' });
    }

    const { score = 0, totalQuestions = 0, quizAttemptIds = [] } = req.body || {};

    const existing = await CompetitionAttempt.findOne({ competitionId: competition._id, userId: req.user.id });
    if (existing) {
      existing.score = score;
      existing.totalQuestions = totalQuestions;
      existing.quizAttemptIds = quizAttemptIds;
      existing.submittedAt = new Date();
      await existing.save();
      return res.status(200).json({ success: true, data: existing });
    }

    const created = await CompetitionAttempt.create({
      userId: req.user.id,
      competitionId: competition._id,
      score,
      totalQuestions,
      quizAttemptIds,
      submittedAt: new Date()
    });

    res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error('Save competition result error:', error);
    res.status(500).json({ success: false, message: 'Failed to save competition result' });
  }
};

// @desc    Create a new competition
// @route   POST /api/competitions
// @access  Private/Admin
export const createCompetition = async (req, res) => {
  try {
    const data = req.body;
    if (!data.title || !data.startDate || !data.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Title, start date, and end date are required'
      });
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Start date and end date must be valid dates'
      });
    }

    if (startDate >= endDate) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    const tags = Array.isArray(data.tags)
      ? data.tags.map((tag) => tag.trim()).filter(Boolean)
      : typeof data.tags === 'string'
      ? data.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
      : [];

    const eligibleDomains = Array.isArray(data.eligibleDomains)
      ? data.eligibleDomains.map((domain) => domain.trim()).filter(Boolean)
      : typeof data.eligibleDomains === 'string'
      ? data.eligibleDomains.split(',').map((domain) => domain.trim()).filter(Boolean)
      : [];

    const relatedQuizzes = Array.isArray(data.relatedQuizzes)
      ? data.relatedQuizzes.filter((quizId) => quizId)
      : [];

    const competition = await Competition.create({
      title: data.title.trim(),
      description: data.description || '',
      startDate,
      endDate,
      durationMinutes: Number(data.durationMinutes) || 60,
      tags,
      eligibilityMode: data.eligibilityMode || 'all',
      eligibleDepartment: data.eligibleDepartment || '',
      eligibleClass: data.eligibleClass || '',
      eligibleDomains,
      relatedQuizzes,
      isPublished: data.isPublished !== undefined ? data.isPublished : true,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Competition created successfully',
      data: competition
    });
  } catch (error) {
    console.error('Create competition error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create competition'
    });
  }
};

// @desc    Update competition
// @route   PUT /api/competitions/:id
// @access  Private/Admin
export const updateCompetition = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.startDate) {
      updates.startDate = new Date(updates.startDate);
    }
    if (updates.endDate) {
      updates.endDate = new Date(updates.endDate);
    }

    if (updates.startDate && updates.endDate && updates.startDate >= updates.endDate) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    if (updates.tags) {
      updates.tags = Array.isArray(updates.tags)
        ? updates.tags.map((tag) => tag.trim()).filter(Boolean)
        : typeof updates.tags === 'string'
        ? updates.tags.split(',').map((tag) => tag.trim()).filter(Boolean)
        : [];
    }

    if (updates.relatedQuizzes) {
      updates.relatedQuizzes = Array.isArray(updates.relatedQuizzes)
        ? updates.relatedQuizzes.filter((quizId) => quizId)
        : [];
    }

    if (updates.eligibleDomains !== undefined) {
      updates.eligibleDomains = Array.isArray(updates.eligibleDomains)
        ? updates.eligibleDomains.map((domain) => domain.trim()).filter(Boolean)
        : typeof updates.eligibleDomains === 'string'
        ? updates.eligibleDomains.split(',').map((domain) => domain.trim()).filter(Boolean)
        : [];
    }

    const competition = await Competition.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Competition updated successfully',
      data: competition
    });
  } catch (error) {
    console.error('Update competition error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update competition'
    });
  }
};

// @desc    Delete competition
// @route   DELETE /api/competitions/:id
// @access  Private/Admin
export const deleteCompetition = async (req, res) => {
  try {
    const { id } = req.params;
    const competition = await Competition.findByIdAndDelete(id);

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Competition deleted successfully'
    });
  } catch (error) {
    console.error('Delete competition error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete competition'
    });
  }
};
