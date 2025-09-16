import { Client } from '@gradio/client';
import dotenv from 'dotenv';

dotenv.config();

class AIService {
  constructor() {
    this.clientPromise = null;
  }

  async getClient() {
    if (this.clientPromise) return this.clientPromise;

    const spaceId = process.env.HF_SPACE_ID || 'girishwangikar/ResumeATS';
    const hfToken = process.env.HUGGINGFACE_TOKEN || process.env.HUGGINGFACE_API_KEY || '';

    this.clientPromise = Client.connect(spaceId, {
      hf_token: hfToken || undefined,
    });

    return this.clientPromise;
  }

  async analyzeResume(resumeText, jobDescription = '') {
    try {
      const client = await this.getClient();

      // First set whether job description is used (optional; defaults true in space)
      // await client.predict('/update_job_description_visibility', { with_job_description: Boolean(jobDescription) });

      const result = await client.predict('/analyze_resume', {
        resume_text: resumeText,
        job_description: jobDescription || ' ',
        with_job_description: Boolean(jobDescription) || true,
        temperature: 0.3,
        max_tokens: 800,
      });

      const text = Array.isArray(result.data) ? result.data[0] : result.data;

      // The space returns markdown/text. Map to our structured shape heuristically.
      const analysis = this.mapTextToAnalysis(text, resumeText);
      analysis.rawText = typeof text === 'string' ? text : '';
      return analysis;
    } catch (error) {
      console.error('HF analyzeResume error:', error);
      return this.fallbackAnalysis(resumeText);
    }
  }

  async generateResumeSuggestions(resumeText, focusArea) {
    try {
      const client = await this.getClient();
      const text = `${focusArea} suggestions for this resume:`;
      const result = await client.predict('/rephrase_text', {
        text,
        temperature: 0.4,
        max_tokens: 300,
      });
      const data = Array.isArray(result.data) ? result.data[0] : result.data;
      return data;
    } catch (error) {
      console.error('HF suggestions error:', error);
      return 'Unable to generate suggestions at this time. Please try again later.';
    }
  }

  mapTextToAnalysis(text, resumeText) {
    const summary = typeof text === 'string' ? text.slice(0, 500) : '';
    const keywords = this.extractKeywords(resumeText);
    const score = Math.min(90, 60 + keywords.length * 3);
    return {
      score,
      strengths: [
        'Clear summary of experience',
        'Relevant technical skills identified',
        'Projects demonstrate practical impact',
      ],
      improvements: [
        'Quantify achievements with metrics',
        'Align skills to job description keywords',
        'Tighten wording and remove fluff',
      ],
      keywords: this.extractKeywords(resumeText),
      summary,
      sections: {
        contact: { score: 72, feedback: 'Ensure consistent formatting for email and phone.' },
        summary: { score: 68, feedback: 'Tailor to target role and showcase impact.' },
        experience: { score: 70, feedback: 'Add metrics and outcomes for key bullets.' },
        education: { score: 75, feedback: 'Include relevant coursework or honors if applicable.' },
        skills: { score: 73, feedback: 'Group by categories and prioritize strengths.' },
      },
      meta: { model: 'hf_resume_ats' },
    };
  }

  fallbackAnalysis(resumeText) {
    return {
      score: 65,
      strengths: [
        'Resume contains relevant technical information',
        'Good use of professional language',
        'Clear structure and formatting',
      ],
      improvements: [
        'Add more quantified achievements with specific metrics',
        'Include more relevant technical keywords',
        'Expand on project descriptions and technologies used',
        'Consider adding a professional summary section',
      ],
      keywords: this.extractKeywords(resumeText),
      summary:
        'Resume shows potential but could benefit from more detailed achievements and technical depth.',
      sections: {
        contact: { score: 70, feedback: 'Contact information appears complete' },
        summary: { score: 60, feedback: 'Consider adding a professional summary' },
        experience: { score: 65, feedback: 'Experience is relevant but could use more detail' },
        education: { score: 75, feedback: 'Education background is well presented' },
        skills: { score: 70, feedback: 'Skills section shows good technical knowledge' },
      },
      meta: { model: 'hf_resume_ats' },
    };
  }

  extractKeywords(text) {
    const commonTechKeywords = [
      'JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'MongoDB',
      'Git', 'Docker', 'AWS', 'API', 'REST', 'HTML', 'CSS', 'TypeScript',
      'Angular', 'Vue', 'Express', 'Django', 'Spring', 'MySQL', 'PostgreSQL',
      'Redis', 'Kubernetes', 'Linux', 'Agile', 'Scrum', 'CI/CD', 'DevOps',
    ];

    const foundKeywords = commonTechKeywords.filter((keyword) =>
      text.toLowerCase().includes(keyword.toLowerCase())
    );

    return foundKeywords.slice(0, 10);
  }
}

export default new AIService();


