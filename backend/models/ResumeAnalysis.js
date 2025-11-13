import mongoose from 'mongoose';

const ResumeAnalysisSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    originalFileName: { type: String },
    text: { type: String, required: true },
    jobDescription: { type: String },
    extracted: {
      name: String,
      email: String,
      phone: String,
      skills: [String],
      education: [String],
      experience: [
        {
          company: String,
          title: String,
          startDate: String,
          endDate: String,
          durationMonths: Number,
          bullets: [String],
        },
      ],
      certifications: [String],
      titles: [String],
      totalExperienceYears: Number,
    },
    scoring: {
      finalScore: { type: Number, index: true },
      weights: {},
      components: {
        skillMatch: Number,
        experienceFit: Number,
        titleFit: Number,
        educationFit: Number,
        achievements: Number,
        formatting: Number,
        keywordCoverage: Number,
      },
      missingSkills: [String],
      keywordCoverage: {
        matched: [String],
        missing: [String],
      },
    },
    suggestions: {
      summary: String,
      actions: [String],
      atsTips: [String],
      rewriteIdeas: String,
    },
    meta: {
      analyzedAt: { type: Date, default: Date.now },
      model: { type: String, default: 'rule_based_v1' },
      runtimeMs: Number,
    },
  },
  { timestamps: true }
);

ResumeAnalysisSchema.index({ 'extracted.skills': 1 });
ResumeAnalysisSchema.index({ createdAt: -1 });

const ResumeAnalysis = mongoose.model('ResumeAnalysis', ResumeAnalysisSchema);
export default ResumeAnalysis;





