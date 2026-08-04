// k6 load test for SmartPrep quiz submissions
// Usage:
//   k6 run --env TARGET=http://localhost:5000 --env VUS=100 --env DURATION=30s --env STUDENT_PASSWORD=Password123! backend/load-test/quiz-load-test.js
//
// This script simulates the student journey:
//   1) login/register
//   2) fetch a quiz
//   3) submit an attempt
//
// It reads students from students.csv and runs them as concurrent virtual users.

import http from 'k6/http';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Counter } from 'k6/metrics';

const BASE_URL = __ENV.TARGET || 'http://localhost:5000';
const STUDENT_PASSWORD = __ENV.STUDENT_PASSWORD || 'Password123!';
const QUIZ_ID = __ENV.QUIZ_ID || '';
const VUS = Number(__ENV.VUS || 100);
const DURATION = __ENV.DURATION || '30s';
const RAMP_UP = __ENV.RAMP_UP || '10s';
const STAGE_DURATION = __ENV.STAGE_DURATION || '20s';

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
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1500'],
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

const tokenPool = new SharedArray('tokenPool', function () {
  return [];
});

const loginCounter = new Counter('logins');

function getStudent() {
  return students[(__VU - 1) % students.length];
}

function sanitizeEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) {
    return '';
  }

  return normalized.replace(/\+/g, '-');
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

function getQuiz(token, quizId) {
  const res = http.get(`${BASE_URL}/api/quizzes/${quizId}`, {
    headers: { Authorization: `Bearer ${token}` },
    tags: { name: 'quiz.get' },
  });

  if (res.status !== 200) {
    return null;
  }

  const body = res.json();
  return body?.data || null;
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

export default function () {
  const student = getStudent();
  const token = loginOrRegister(student);

  if (!token) {
    console.log(`login failed for ${student.studentId}`);
    return;
  }

  const quizId = QUIZ_ID || '';
  let resolvedQuizId = quizId;

  if (!resolvedQuizId) {
    const quizzesRes = http.get(`${BASE_URL}/api/quizzes`, {
      headers: { Authorization: `Bearer ${token}` },
      tags: { name: 'quiz.list' },
    });

    if (quizzesRes.status === 200) {
      const body = quizzesRes.json();
      resolvedQuizId = body?.data?.[0]?._id || body?.data?.[0]?.id || '';
    }
  }

  if (!resolvedQuizId) {
    console.log(`no quiz available for ${student.studentId}`);
    return;
  }

  const quiz = getQuiz(token, resolvedQuizId);
  if (!quiz) {
    console.log(`quiz fetch failed for ${student.studentId}`);
    return;
  }

  const payload = buildAttemptPayload(quiz, student);
  const submitRes = http.post(
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

  check(submitRes, {
    'submission accepted': (res) => res.status === 200 || res.status === 201,
  });

  sleep(Math.random() * 0.5 + 0.1);
}
