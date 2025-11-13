
const JUDGE0_BASE_URL = process.env.JUDGE0_BASE_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || '';
const JUDGE0_HOST = process.env.JUDGE0_HOST || 'judge0-ce.p.rapidapi.com';

const LANGUAGE_ID_MAP = {
  javascript: 63, // Node.js 18.x
  python: 71,     // Python 3.8.1
  java: 62,       // Java (OpenJDK 13.0.1)
  cpp: 54         // C++ (GCC 9.2.0)
};

export async function createSubmission({ sourceCode, language, stdin }) {
  const language_id = LANGUAGE_ID_MAP[language];
  if (!language_id) throw new Error('Unsupported language');

  const url = `${JUDGE0_BASE_URL}/submissions?base64_encoded=false&wait=true`;
  const headers = {
    'Content-Type': 'application/json',
  };
  if (JUDGE0_API_KEY) {
    headers['X-RapidAPI-Key'] = JUDGE0_API_KEY;
    headers['X-RapidAPI-Host'] = JUDGE0_HOST;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      source_code: sourceCode,
      language_id,
      stdin
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Judge0 submission failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data; // includes stdout, stderr, status, time, memory
}
