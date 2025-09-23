import validator from 'validator';

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_REGEX = /(\+\d{1,3}\s?)?(\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{4}/;
const SECTION_HEADERS = /(education|experience|work experience|skills|projects|certifications|achievements)/i;

const CANONICAL_SKILLS = [
  'javascript','typescript','react','node.js','express','mongodb','postgresql','mysql','python','java','spring','docker','kubernetes','aws','gcp','azure','git','rest','graphql','html','css','tailwind','redux','next.js','nest.js','ci/cd','linux','kafka','redis','rabbitmq','pandas','numpy','scikit-learn','pytorch','tensorflow','nlp','spacy'
];

export function extractContact(text) {
  const email = (text.match(EMAIL_REGEX) || [null])[0];
  const phone = (text.match(PHONE_REGEX) || [null])[0];
  const nameLine = text.split(/\n|\r/).find(l => l.trim().split(' ').length >= 2 && !EMAIL_REGEX.test(l) && !PHONE_REGEX.test(l));
  return { name: nameLine ? nameLine.trim().slice(0, 100) : undefined, email, phone };
}

export function extractSkills(text) {
  const lower = text.toLowerCase();
  const found = CANONICAL_SKILLS.filter(s => lower.includes(s));
  return Array.from(new Set(found)).sort();
}

export function splitSections(text) {
  const lines = text.split(/\r?\n/);
  const sections = {};
  let current = 'summary';
  sections[current] = [];
  for (const line of lines) {
    const h = line.trim().toLowerCase();
    if (SECTION_HEADERS.test(h)) {
      current = h.match(SECTION_HEADERS)[1];
      if (!sections[current]) sections[current] = [];
      continue;
    }
    sections[current].push(line);
  }
  for (const key of Object.keys(sections)) sections[key] = sections[key].join('\n').trim();
  return sections;
}

export function extractEducation(text) {
  const edu = [];
  const eduText = splitSections(text).education || '';
  eduText.split(/\n+/).forEach(line => {
    const l = line.trim();
    if (!l) return;
    if (/b\.?tech|bachelor|master|m\.?tech|b\.?e\.?|ph\.?d/i.test(l)) edu.push(l);
  });
  return edu.slice(0, 10);
}

export function extractExperience(text) {
  const exp = [];
  const expText = splitSections(text).experience || splitSections(text)['work experience'] || '';
  expText.split(/\n{2,}/).forEach(block => {
    const lines = block.split(/\n/).map(s => s.trim()).filter(Boolean);
    if (lines.length === 0) return;
    const header = lines[0];
    const titleMatch = header.match(/-\s*(.*)$/);
    exp.push({ company: header.replace(/-.*$/, '').trim(), title: titleMatch ? titleMatch[1] : undefined, bullets: lines.slice(1) });
  });
  return exp.slice(0, 10);
}

export function computeScores({ skills, requiredSkills = [], text, education, experience }) {
  const weights = { skill: 0.4, exp: 0.2, title: 0.1, edu: 0.1, achievements: 0.1, formatting: 0.1 };

  const matchedSkills = requiredSkills.filter(s => skills.map(x => x.toLowerCase()).includes(s.toLowerCase()));
  const missingSkills = requiredSkills.filter(s => !matchedSkills.includes(s));
  const skillScore = requiredSkills.length ? (matchedSkills.length / requiredSkills.length) * 100 : 60;

  const years = (text.match(/\b(\d+\.?\d*)\s*(years|yrs)\b/gi) || []).reduce((max, m) => Math.max(max, parseFloat(m)), 0);
  const expScore = Math.min(years * 10, 100);

  const eduScore = education.length ? 80 : 40;
  const titleScore = experience.length ? 60 : 30;
  const achievementsScore = /%|\b(increased|reduced|improved|grew|cut)\b/i.test(text) ? 80 : 40;
  const formattingScore = /@|\bexperience\b|\beducation\b|\bskills\b/i.test(text) ? 80 : 50;

  const finalScore = Math.round(
    0.4 * skillScore +
    0.2 * expScore +
    0.1 * titleScore +
    0.1 * eduScore +
    0.1 * achievementsScore +
    0.1 * formattingScore
  );

  return {
    finalScore,
    components: {
      skillMatch: Math.round(skillScore),
      experienceFit: Math.round(expScore),
      titleFit: Math.round(titleScore),
      educationFit: Math.round(eduScore),
      achievements: Math.round(achievementsScore),
      formatting: Math.round(formattingScore),
      keywordCoverage: matchedSkills.length,
    },
    missingSkills,
    keywordCoverage: { matched: matchedSkills, missing: missingSkills },
  };
}

export function generateSuggestions({ missingSkills, text }) {
  const actions = [];
  if (missingSkills.length) actions.push(`Add missing skills: ${missingSkills.join(', ')}`);
  if (!/%|\b(increased|reduced|improved|grew|cut)\b/i.test(text)) actions.push('Quantify achievements with metrics (e.g., increased performance by 30%)');
  if (!/@/.test(text)) actions.push('Ensure contact details are present (email, phone)');
  return {
    summary: 'Improve skill coverage and quantify achievements for better ATS scores.',
    actions,
    atsTips: ['Use standard section headings (Experience, Education, Skills)', 'Avoid images or complex tables for ATS parsing'],
  };
}

export async function analyzeStructured(text, jobDescription = '') {
  const contact = extractContact(text);
  const skills = extractSkills(text);
  const education = extractEducation(text);
  const experience = extractExperience(text);
  const requiredSkills = extractSkills(jobDescription);
  const scoring = computeScores({ skills, requiredSkills, text, education, experience });
  const suggestions = generateSuggestions({ missingSkills: scoring.missingSkills, text });
  return {
    extracted: {
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      skills,
      education,
      experience,
      titles: experience.map(e => e.title).filter(Boolean),
    },
    scoring,
    suggestions,
  };
}

























