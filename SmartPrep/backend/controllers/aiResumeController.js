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

export const updateJobDescriptionVisibility = async (req, res) => {
  try {
    const { withJobDescription = true } = req.body;
    const value = await aiService.updateJobDescriptionVisibility(withJobDescription);
    return res.status(200).json({ success: true, data: { value } });
  } catch (error) {
    console.error('Update job description visibility error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update job description visibility' });
  }
};

export const processResumeViaHF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const text = await aiService.processResumeFile(req.file.buffer, {
      mimeType: req.file.mimetype,
      fileName: req.file.originalname,
    });

    const parsed = (text || '').trim();
    if (!parsed) {
      return res.status(422).json({ success: false, message: 'Unable to parse resume via HuggingFace' });
    }

    return res.status(200).json({ success: true, data: { text: parsed } });
  } catch (error) {
    console.error('HF process resume error:', error);
    return res.status(500).json({ success: false, message: 'Failed to process resume via HuggingFace' });
  }
};

export const generateCoverLetter = async (req, res) => {
  try {
    const { resumeText, jobDescription, temperature, max_tokens } = req.body;

    if (!resumeText || typeof resumeText !== 'string' || resumeText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'resumeText is required and must be at least 50 characters.'
      });
    }

    const coverLetter = await aiService.generateCoverLetter(resumeText, jobDescription || '', {
      temperature: typeof temperature === 'number' ? temperature : undefined,
      max_tokens: typeof max_tokens === 'number' ? max_tokens : undefined,
    });

    return res.status(200).json({ success: true, data: { coverLetter } });
  } catch (error) {
    console.error('Generate cover letter error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate cover letter' });
  }
};

export const generateInterviewQuestions = async (req, res) => {
  try {
    const { jobDescription, temperature, max_tokens } = req.body;

    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'jobDescription is required and must be at least 20 characters.'
      });
    }

    const questionsText = await aiService.generateInterviewQuestions(jobDescription, {
      temperature: typeof temperature === 'number' ? temperature : undefined,
      max_tokens: typeof max_tokens === 'number' ? max_tokens : undefined,
    });

    return res.status(200).json({ success: true, data: { questions: questionsText } });
  } catch (error) {
    console.error('Generate interview questions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate interview questions' });
  }
};






