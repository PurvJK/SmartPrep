import Competition from '../models/Competition.js';
import Quiz from '../models/Quiz.js';

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
      .populate('relatedQuizzes', 'title category difficulty isPublished');

    res.status(200).json({
      success: true,
      data: competitions
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
    const competition = await Competition.findById(req.params.id).populate('relatedQuizzes', 'title category difficulty isPublished');

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: 'Competition not found'
      });
    }

    if (!competition.isPublished && (!req.user || req.user.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Competition is not published'
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
