import ResumeScore from "../models/resumeScore.model.js";
import ApplicationModel from "../models/application.model.js";
import UserModel from "../models/user.model.js";
import JobModel from "../models/job.model.js";
import dotenv from 'dotenv';
import fs from 'fs';
import axios from 'axios';
import Tesseract from "tesseract.js";
import validator from 'validator';
import { PDFExtract } from 'pdf.js-extract';

dotenv.config();

const extractTextFromImage = async (pdfBuffer) => {
  try {
    const { data: { text } } = await Tesseract.recognize(pdfBuffer, 'eng', {
      logger: (m) => console.log(m),
    });
    return text || '';
  } catch (error) {
    console.error('Error extracting text from image:', error.message);
    return '';
  }
};

const calculateResumeScore = async (resume, job) => {
  try {
    console.log('Processing resume:', resume);

    if (!resume) {
      return { score: 50, details: 'No resume provided; default score assigned' };
    }

    let resumeText = '';
    let pdfBuffer;

    if (validator.isURL(resume, { protocols: ['http', 'https'], require_tld: false })) {
      try {
        const response = await axios.get(resume, { responseType: 'arraybuffer' });
        pdfBuffer = Buffer.from(response.data);
        console.log('Resume downloaded successfully, buffer length:', pdfBuffer.length);
      } catch (error) {
        console.error('Error downloading resume from URL:', error.message);
        return { score: 50, details: `Failed to download resume from ${resume}; default score assigned` };
      }
    } else {
      const absolutePath = resume.startsWith('uploads/') ? resume : `uploads/resumes/${resume}`;
      if (!fs.existsSync(absolutePath)) {
        console.error('Resume file not found at:', absolutePath);
        return { score: 50, details: `Resume file not found at path: ${absolutePath}; default score assigned` };
      }
      pdfBuffer = fs.readFileSync(absolutePath);
      console.log('Resume read from local path, buffer length:', pdfBuffer.length);
    }

    if (!pdfBuffer || pdfBuffer.length === 0) {
      console.error('Invalid or empty PDF buffer');
      return { score: 50, details: 'Invalid or empty resume file; default score assigned' };
    }

    try {
      const pdfExtract = new PDFExtract();
      const data = await pdfExtract.extractBuffer(pdfBuffer);
      resumeText = data.pages.map(page => page.content.map(item => item.str).join(' ')).join(' ');
      console.log('PDF parsed with pdf.js-extract, text length:', resumeText.length);
    } catch (error) {
      console.error('PDF parsing failed with pdf.js-extract:', error.message);
      resumeText = '';
    }

    if (!resumeText.trim()) {
      console.log('No text extracted from PDF, attempting OCR...');
      resumeText = await extractTextFromImage(pdfBuffer);
      console.log('OCR text length:', resumeText.length);
    }

    if (!resumeText.trim()) {
      return { score: 50, details: 'Unable to extract text from resume; default score assigned' };
    }

    const jobKeywords = [...job.skills, job.role, job.experienceLevel].map(k => k.toLowerCase());
    const skills = jobKeywords;
    const educationKeywords = ['b.sc', 'b.tech', 'm.tech', 'ph.d', 'bachelor', 'master', 'degree', 'diploma'];
    const experienceRegex = /(\d+)\s*(years?|yrs?)\s*(of)?\s*(experience|exp\.?)/i;

    let score = 0;
    const details = [];

    // Skills (40 points) - More flexible matching
    const skillMatches = skills.reduce((count, skill) => {
      const skillWords = skill.toLowerCase().split(/\s+/);
      const resumeWords = resumeText.toLowerCase().split(/\s+/);
      return skillWords.some(skillWord => resumeWords.some(word => word.includes(skillWord))) ? count + 1 : count;
    }, 0);
    const skillScore = Math.min(40, (skillMatches / skills.length) * 40);
    score += skillScore;
    details.push(`Skills: Matched ${skillMatches} out of ${skills.length} keywords (${skillScore}/40)`);

    // Experience (20 points)
    const experienceMatch = resumeText.match(experienceRegex);
    let experienceScore = 0;
    if (experienceMatch) {
      const years = parseInt(experienceMatch[1]);
      experienceScore = Math.min(years * 4, 20); // 4 points per year, max 20
    }
    score += experienceScore;
    details.push(`Experience: ${experienceMatch ? `${experienceMatch[1]} years detected` : 'No experience details found'} (${experienceScore}/20)`);

    // Education (20 points)
    const hasEducation = educationKeywords.some(keyword =>
      resumeText.toLowerCase().includes(keyword.toLowerCase()));
    const educationScore = hasEducation ? 20 : 0;
    score += educationScore;
    details.push(`Education: ${hasEducation ? 'Relevant degree found' : 'No degree detected'} (${educationScore}/20)`);

    // Formatting/Clarity (10 points)
    const wordCount = resumeText.split(/\s+/).length;
    const formattingScore = (wordCount > 200 && wordCount < 600) ? 10 : 5;
    score += formattingScore;
    details.push(`Formatting: ${wordCount} words ${formattingScore === 10 ? '(ideal length)' : '(not ideal length)'} (${formattingScore}/10)`);

    // AI Analysis (20 points)
    let aiScore = 0;
    if (process.env.HUGGINGFACE_API_KEY) {
      try {
        const aiResponse = await axios.post(
          'https://api-inference.huggingface.co/models/nlptown/bert-base-multilingual-uncased-sentiment',
          { inputs: resumeText.slice(0, 512) },
          { headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}` } }
        );
        console.log('Hugging Face API response:', aiResponse.data);
        if (aiResponse.data && aiResponse.data[0] && aiResponse.data[0][0]) {
          const sentimentData = aiResponse.data[0];
          const highestSentiment = sentimentData.reduce((max, current) =>
            current.score > max.score ? current : max, sentimentData[0]);
          const sentimentScore = parseInt(highestSentiment.label.split(' ')[0]); // e.g., "4 stars" -> 4
          aiScore = sentimentScore * 4; // Map 1-5 stars to 0-20 points
          details.push(`AI Analysis: Sentiment rating ${sentimentScore}/5 (${aiScore}/20)`);
        } else {
          throw new Error('Unexpected API response structure');
        }
      } catch (aiError) {
        console.error('AI analysis failed:', aiError.message, aiError.response?.data || '');
        details.push('AI Analysis: Not available (0/20)');
      }
    } else {
      console.warn('HUGGINGFACE_API_KEY not set; skipping AI analysis');
      details.push('AI Analysis: Not available (0/20)');
    }
    score += aiScore;

    // Cap score at 100
    score = Math.min(Math.round(score), 100);
    const finalDetails = details.join('; ');

    return { score, details: finalDetails };
  } catch (error) {
    console.error('Error calculating resume score:', error.message);
    return { score: 50, details: `Error processing resume: ${error.message}; default score assigned` };
  }
};

export const createResumeScore = async (req, res) => {
  try {
    const { applicationId } = req.body;
    const application = await ApplicationModel.findById(applicationId)
      .populate('job')
      .populate('user');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Allow if recruiter of job OR user who owns the application
    const isRecruiter =
      req.recruiter &&
      req.recruiter._id &&
      application.job.recruiterId.toString() === req.recruiter._id.toString();

    const isUser =
      req.user &&
      req.user._id &&
      application.user._id.toString() === req.user._id.toString();

    if (!isRecruiter && !isUser) {
      return res.status(403).json({ message: 'Unauthorized: Only the recruiter or the applicant can generate a score for this application' });
    }

    // Check for Undo score and delete it to allow re-scoring
    const existingScore = await ResumeScore.findOne({ application: applicationId });
    if (existingScore) {
      console.log(`Deleting existing resume score for application ${applicationId}:`, existingScore._id);
      await ResumeScore.deleteOne({ application: applicationId });
    }

    const resume = application.user.resume;
    const job = application.job;

    const { score, details } = await calculateResumeScore(resume, job);

    const resumeScore = new ResumeScore({
      application: applicationId,
      score,
      details,
    });

    await resumeScore.save();
    res.status(201).json({ message: 'Resume score created successfully', resumeScore });
  } catch (error) {
    console.error('Error creating resume score:', error);
    res.status(500).json({ message: 'Failed to create resume score', error: error.message });
  }
};

export const generateResumeScoreForApplication = async (applicationId) => {
  try {
    const application = await ApplicationModel.findById(applicationId)
      .populate('job')
      .populate('user');
    if (!application) {
      throw new Error('Application not found');
    }

    // Delete existing score if any, to allow re-scoring
    const existingScore = await ResumeScore.findOne({ application: applicationId });
    if (existingScore) {
      console.log(`Deleting existing resume score for application ${applicationId}:`, existingScore._id);
      await ResumeScore.deleteOne({ application: applicationId });
    }

    const resume = application.user.resume;
    const job = application.job;

    const { score, details } = await calculateResumeScore(resume, job);

    const resumeScore = new ResumeScore({
      application: applicationId,
      score,
      details,
    });

    await resumeScore.save();
    return resumeScore;
  } catch (error) {
    console.error('Error generating resume score:', error);
    throw error;
  }
};

export const getResumeScoreByApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await ApplicationModel.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const job = await JobModel.findById(application.job);
    const isUser = req.user && application.user.toString() === req.user._id.toString();
    const isRecruiter = req.recruiter && job.recruiterId.toString() === req.recruiter._id.toString();
    if (!isUser && !isRecruiter) {
      return res.status(403).json({ message: 'Unauthorized to view this resume score' });
    }

    const resumeScore = await ResumeScore.findOne({ application: applicationId });
    if (!resumeScore) {
      return res.status(404).json({ message: 'Resume score not found' });
    }

    res.status(200).json({ message: 'Resume score retrieved successfully', resumeScore });
  } catch (error) {
    console.error('Error retrieving resume score:', error);
    res.status(500).json({ message: 'Failed to retrieve resume score', error: error.message });
  }
};

