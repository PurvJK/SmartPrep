// k6 load test for SmartPrep competition submissions
// Usage:
//   k6 run --env TARGET=http://localhost:5000 --env VUS=300 --env DURATION=30s --env STUDENT_PASSWORD=Password123! backend/load-test/competition-load-test.js
//
// This script simulates the competition journey:
//   1) login/register
//   2) fetch the competition
//   3) fetch each related quiz and submit attempts
//   4) submit the competition result

import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Counter } from 'k6/metrics';

const BASE_URL = __ENV.TARGET || 'http://localhost:5000';
const STUDENT_PASSWORD = __ENV.STUDENT_PASSWORD || 'Password123!';
const COMPETITION_ID = __ENV.COMPETITION_ID || '';
const VUS = Number(__ENV.VUS || 700);
const RAMP_UP = __ENV.RAMP_UP || '15s';
const STAGE_DURATION = __ENV.STAGE_DURATION || '25s';
const LOGIN_ONLY = __ENV.LOGIN_ONLY !== 'false';

export const options = {
  scenarios: {
    default: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: RAMP_UP, target: VUS },
        { duration: STAGE_DURATION, target: VUS },
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.09'],
    http_req_duration: ['p(95)<2500'],
  },
};

const students = new SharedArray('students', function () {
  const csvText = open('./students.csv');
  const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
  const [header, ...rows] = lines;
  const keys = header.split(',').map((k) => k.trim());

  return rows.map((line) => {
    const values = line.split(',').map((v) => v.trim());
    const student = {};
    keys.forEach((key, index) => {
      student[key] = values[index] || '';
    });
    return student;
  });
});

const loginCounter = new Counter('competition_logins');

function getStudent() {
  return students[(__VU - 1) % students.length];
}

function sanitizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function normalizeOption(value) {
  return String(value || '').trim().toUpperCase();
}

function resolveSelectedIndex(answerValue, question) {
  if (!question || !Array.isArray(question.options) || question.options.length === 0) {
    return 0;
  }

  const normalizedAnswer = normalizeOption(answerValue);
  const exactMatch = question.options.findIndex((option) => normalizeOption(option) === normalizedAnswer);
  if (exactMatch !== -1) {
    return exactMatch;
  }

  const startsWithMatch = question.options.findIndex((option) => normalizeOption(option).startsWith(normalizedAnswer));
  if (startsWithMatch !== -1) {
    return startsWithMatch;
  }

  const letterIndex = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.indexOf(normalizedAnswer);
  return letterIndex >= 0 && letterIndex < question.options.length ? letterIndex : 0;
}

function loginOrRegister(student) {
  const email = sanitizeEmail(student.email || `${student.studentId}@example.com`);
  const password = STUDENT_PASSWORD;

  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'auth.login' },
    }
  );

  if (loginRes.status === 200) {
    loginCounter.add(1);
    return loginRes.json('data')?.token || null;
  }

  if (LOGIN_ONLY) {
    return null;
  }

  const registerRes = http.post(
    `${BASE_URL}/api/auth/register`,
    JSON.stringify({
      name: student.name || student.studentId,
      email,
      password,
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'auth.register' },
    }
  );

  if (registerRes.status === 201) {
    loginCounter.add(1);
    return registerRes.json('data')?.token || null;
  }

  return null;
}

function getCompetition(token, competitionId) {
  const res = http.get(`${BASE_URL}/api/competitions/${competitionId}`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { name: 'competition.get' },
  });

  if (res.status !== 200) {
    console.log(`competition fetch failed with ${res.status} for ${competitionId}`);
    return null;
  }

  return res.json('data') || null;
}

function resolveCompetition(token) {
  if (COMPETITION_ID) {
    return getCompetition(token, COMPETITION_ID);
  }

  const listRes = http.get(`${BASE_URL}/api/competitions`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { name: 'competition.list' },
  });

  if (listRes.status !== 200) {
    console.log(`competition list failed with ${listRes.status}`);
    return null;
  }

  const body = listRes.json();
  const competitions = Array.isArray(body?.data) ? body.data : [];
  const selectedCompetition = competitions.find((competition) => competition?.relatedQuizzes?.length) || competitions[0];

  if (!selectedCompetition?._id && !selectedCompetition?.id) {
    return null;
  }

  return getCompetition(token, selectedCompetition._id || selectedCompetition.id);
}

function getQuiz(token, quizId) {
  const res = http.get(`${BASE_URL}/api/quizzes/${quizId}`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { name: 'quiz.get' },
  });

  if (res.status !== 200) {
    return null;
  }

  return res.json('data') || null;
}

function buildAttemptPayload(quiz, student) {
  const answerValues = (student.answers || '').split(';').filter(Boolean);
  const answers = answerValues.map((rawAnswer, index) => ({
    questionIndex: index,
    selected: resolveSelectedIndex(rawAnswer, quiz?.questions?.[index]),
  }));

  return {
    quizId: quiz?._id || quiz?.id,
    answers,
    timeTaken: 60 + (__VU % 5) * 5,
  };
}

function submitQuizAttempt(token, quiz, student) {
  const payload = buildAttemptPayload(quiz, student);
  const res = http.post(
    `${BASE_URL}/api/attempts`,
    JSON.stringify(payload),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      tags: { name: 'attempt.submit' },
    }
  );

  if (res.status !== 200 && res.status !== 201) {
    return null;
  }

  return res.json('data') || null;
}

export default function () {
  const student = getStudent();
  const token = loginOrRegister(student);

  if (!token) {
    console.log(`login failed for ${student.studentId}`);
    return;
  }

  const competition = resolveCompetition(token);
  if (!competition) {
    console.log(`competition fetch failed for ${student.studentId}`);
    return;
  }

  const competitionId = competition._id || competition.id;

  const relatedQuizzes = Array.isArray(competition.relatedQuizzes) ? competition.relatedQuizzes : [];
  if (!relatedQuizzes.length) {
    console.log(`no quizzes for ${student.studentId}`);
    return;
  }

  let score = 0;
  let totalQuestions = 0;
  const quizAttemptIds = [];

  for (const relatedQuiz of relatedQuizzes) {
    const quiz = getQuiz(token, relatedQuiz._id || relatedQuiz.id);
    if (!quiz) {
      console.log(`quiz fetch failed for ${student.studentId}`);
      return;
    }

    const attempt = submitQuizAttempt(token, quiz, student);
    if (!attempt) {
      console.log(`attempt submit failed for ${student.studentId}`);
      return;
    }

    score += Number(attempt.score || 0);
    totalQuestions += Number(attempt.totalQuestions || 0);
    if (attempt._id) {
      quizAttemptIds.push(attempt._id);
    }
  }

  const resultRes = http.post(
    `${BASE_URL}/api/competitions/${competitionId}/results`,
    JSON.stringify({ score, totalQuestions, quizAttemptIds }),
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      tags: { name: 'competition.result' },
    }
  );

  if (resultRes.status !== 200 && resultRes.status !== 201) {
    console.log(`competition result failed with ${resultRes.status} for ${student.studentId} on ${competitionId}`);
    console.log(resultRes.body);
  }

  check(resultRes, {
    'competition result accepted': (res) => res.status === 200 || res.status === 201,
  });

  sleep(Math.random() * 0.5 + 0.1);
}