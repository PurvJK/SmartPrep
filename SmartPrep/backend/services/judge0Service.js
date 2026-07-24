// Use free Judge0 Community Edition by default
// For RapidAPI, set JUDGE0_BASE_URL, JUDGE0_API_KEY, and JUDGE0_HOST in .env
// Alternative free endpoints:
// - https://ce.judge0.com (may require auth)
// - Self-hosted Judge0 CE instance
const JUDGE0_BASE_URL = process.env.JUDGE0_BASE_URL || 'https://ce.judge0.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || '';
const JUDGE0_HOST = process.env.JUDGE0_HOST || '';
const JUDGE0_DISABLED = process.env.JUDGE0_DISABLED === 'true';
const FREE_CE_URL = 'https://ce.judge0.com';

function toBase64(value = '') {
  return Buffer.from(String(value), 'utf8').toString('base64');
}

function fromBase64(value) {
  if (!value) return '';
  try {
    return Buffer.from(String(value), 'base64').toString('utf8');
  } catch {
    return String(value);
  }
}

function decodeJudge0Result(data) {
  return {
    ...data,
    stdout: fromBase64(data.stdout),
    stderr: fromBase64(data.stderr),
    compile_output: fromBase64(data.compile_output),
    message: fromBase64(data.message),
  };
}

function isPlaceholder(value) {
  if (!value) return true;
  const normalized = String(value).trim().toLowerCase();
  return normalized === 'your_rapidapi_key' || normalized === 'your_rapidapi_host';
}

function shouldUseRapidAPI(baseUrl) {
  const rapidEndpoint = /rapidapi\.com/i.test(baseUrl) || /rapidapi\.com/i.test(JUDGE0_HOST);
  const hasValidKey = JUDGE0_API_KEY && !isPlaceholder(JUDGE0_API_KEY);
  const hasValidHost = JUDGE0_HOST && !isPlaceholder(JUDGE0_HOST);
  return rapidEndpoint && hasValidKey && hasValidHost;
}

function resolveBaseUrl() {
  const configuredBaseUrl = JUDGE0_BASE_URL.replace(/\/$/, '');
  const isRapidEndpoint = /rapidapi\.com/i.test(configuredBaseUrl);

  if (isRapidEndpoint && !shouldUseRapidAPI(configuredBaseUrl)) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Judge0] RapidAPI endpoint configured without valid RapidAPI credentials. Falling back to free CE endpoint.');
    }
    return FREE_CE_URL;
  }

  return configuredBaseUrl;
}

const LANGUAGE_ID_MAP = {
  javascript: 63, // Node.js 18.x
  python: 71,     // Python 3.8.1
  java: 62,       // Java (OpenJDK 13.0.1)
  cpp: 54         // C++ (GCC 9.2.0)
};

// Health check function to test Judge0 connection
export async function checkJudge0Health() {
  if (JUDGE0_DISABLED) {
    return { available: false, reason: 'Judge0 is disabled via JUDGE0_DISABLED=true' };
  }

  try {
    const baseUrl = resolveBaseUrl();
    const url = `${baseUrl}/about`;
    
    const headers = { 'Content-Type': 'application/json' };
    const usingRapidAPI = shouldUseRapidAPI(baseUrl);
    if (usingRapidAPI) {
      headers['X-RapidAPI-Key'] = JUDGE0_API_KEY;
      headers['X-RapidAPI-Host'] = JUDGE0_HOST;
    }

    // Create timeout controller
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(url, { 
      method: 'GET', 
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    return { 
      available: res.ok, 
      status: res.status,
      endpoint: baseUrl,
      usingRapidAPI 
    };
  } catch (error) {
    return { 
      available: false, 
      error: error.message,
      endpoint: resolveBaseUrl()
    };
  }
}

export async function createSubmission({ sourceCode, language, stdin }) {
  if (JUDGE0_DISABLED) {
    throw new Error('Code execution is currently disabled. Please contact administrator.');
  }

  const language_id = LANGUAGE_ID_MAP[language];
  if (!language_id) throw new Error('Unsupported language');

  // Remove trailing slash from base URL
  const baseUrl = resolveBaseUrl();
  const url = `${baseUrl}/submissions?base64_encoded=true&wait=true`;
  
  const headers = {
    'Content-Type': 'application/json',
  };
  
  // Only add RapidAPI headers if using RapidAPI endpoint
  const usingRapidAPI = shouldUseRapidAPI(baseUrl);
  if (usingRapidAPI) {
    headers['X-RapidAPI-Key'] = JUDGE0_API_KEY;
    headers['X-RapidAPI-Host'] = JUDGE0_HOST;
  }
  
  // Log which endpoint is being used (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Judge0] Using endpoint: ${baseUrl}${usingRapidAPI ? ' (RapidAPI)' : ' (Free CE)'}`);
    console.log(`[Judge0] Executing ${language} code with stdin: "${stdin.substring(0, 100)}${stdin.length > 100 ? '...' : ''}"`);
  }

  const requestBody = {
    source_code: toBase64(sourceCode),
    language_id,
    stdin: toBase64(stdin || '') // Ensure stdin is always a string
  };

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(requestBody)
  });

  if (!res.ok) {
    const text = await res.text();
    let errorMessage = `Judge0 submission failed: ${res.status}`;
    
    // Provide user-friendly error messages
    if (res.status === 401) {
      errorMessage = 'Invalid Judge0 API key. If using free CE, set JUDGE0_BASE_URL=https://ce.judge0.com and remove RapidAPI key/host.';
    } else if (res.status === 403) {
      errorMessage = 'Judge0 API access denied. Please check your API configuration or use the free endpoint.';
    } else if (res.status === 429) {
      errorMessage = 'Too many requests. Please wait a moment and try again. The free Judge0 endpoint has rate limits.';
    } else if (res.status === 500 || res.status === 503) {
      errorMessage = 'Judge0 service is temporarily unavailable. Please try again later.';
    } else if (res.status === 400) {
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.error || errorData.message || `Invalid Judge0 request (400).`;
      } catch {
        errorMessage = `Invalid Judge0 request (400): ${text}`;
      }
    } else {
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.message || errorMessage;
      } catch {
        errorMessage = `${errorMessage}: ${text}`;
      }
    }
    
    const error = new Error(errorMessage);
    error.statusCode = res.status;
    throw error;
  }
  const data = await res.json();
  return decodeJudge0Result(data); // decoded stdout/stderr/compile_output/message
}
