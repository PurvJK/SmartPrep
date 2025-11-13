import aiService from '../services/aiService.js';

export const analyzeResume = async (req, res) => {
  try {
    const { resumeText, jobDescription } = req.body;

    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'resumeText is required and must be at least 50 characters.'
      });
    }

    const analysis = await aiService.analyzeResume(resumeText, jobDescription || '');

    return res.status(200).json({
      success: true,
      data: { analysis }
    });
  } catch (error) {
    console.error('Analyze resume error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to analyze resume'
    });
  }
};

export const getResumeSuggestions = async (req, res) => {
  try {
    const { resumeText, focusArea } = req.body;

    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'resumeText is required and must be at least 50 characters.'
      });
    }

    if (!focusArea || typeof focusArea !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'focusArea is required.'
      });
    }

    const suggestions = await aiService.generateResumeSuggestions(resumeText, focusArea);

    return res.status(200).json({
      success: true,
      data: { suggestions }
    });
  } catch (error) {
    console.error('Get resume suggestions error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get resume suggestions'
    });
  }
};






