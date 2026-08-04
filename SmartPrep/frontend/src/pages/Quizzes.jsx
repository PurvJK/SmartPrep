import { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import api from '@/services/api';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Circle,
  Clock,
  Flag,
  RotateCcw,
  Send,
  ShieldAlert,
  Sparkles,
  Target,
  Trophy,
  X,
} from 'lucide-react';

const STATUS_STYLES = {
  'not-visited': 'border-slate-200 bg-white text-slate-600',
  visited: 'border-blue-200 bg-blue-50 text-blue-700',
  answered: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  skipped: 'border-slate-300 bg-slate-100 text-slate-700',
  review: 'border-amber-200 bg-amber-50 text-amber-700',
  'answered-review': 'border-violet-200 bg-violet-50 text-violet-700',
};

const buildSections = (quiz) => {
  if (!quiz?.questions) return [];

  if (Array.isArray(quiz.sections) && quiz.sections.length) {
    return quiz.sections.map((section, index) => ({
      id: section._id || `section-${index + 1}`,
      name: section.name || `Section ${index + 1}`,
      questionIndices: section.questionIndices || Array.from({ length: section.questions?.length || 0 }, (_, idx) => idx),
    }));
  }

  return [{ id: 'section-1', name: 'Section 1', questionIndices: quiz.questions.map((_, index) => index) }];
};

const getInitialQuestionStates = (length) => Array.from({ length }, (_, index) => (index === 0 ? 'visited' : 'not-visited'));

const getQuestionState = (questionStates, index) => questionStates[index] || 'not-visited';

const getAnswerSummary = (answers, questionIndex, question) => {
  const answer = answers[questionIndex];

  if (answer === null || answer === undefined || answer === '') {
    return 'Not answered';
  }

  if (Array.isArray(answer)) {
    return answer.length > 0 ? answer.map((value) => question.options?.[value] || value).join(', ') : 'Not answered';
  }

  return question.options?.[answer] || answer;
};

const formatSelectedAnswer = (question, selected) => {
  if (selected === null || selected === undefined || selected === '') {
    return 'Not answered';
  }

  if (Array.isArray(selected)) {
    return selected.length > 0 ? selected.map((value) => question.options?.[value] || value).join(', ') : 'Not answered';
  }

  return question.options?.[selected] || selected;
};

const extractQuizData = (response) => {
  if (!response) return null;
  if (response.data) return response.data;
  return response;
};

const Quizzes = () => {
  const [user, setUser] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [competitionsLoading, setCompetitionsLoading] = useState(false);
  const [lastAttemptsMap, setLastAttemptsMap] = useState({});
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [questionStates, setQuestionStates] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeLimit, setTimeLimit] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [attemptId, setAttemptId] = useState(null);
  const [savedAttempt, setSavedAttempt] = useState(null);
  const [competitionSession, setCompetitionSession] = useState(null);
  const [completedCompetitions, setCompletedCompetitions] = useState({});
  const [warningCount, setWarningCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.listQuizzes();
        const list = Array.isArray(res) ? res : (res.data || []);
        const available = list.filter(
          (quiz) => quiz.questions && quiz.questions.length > 0 && quiz.isPublished !== false
        );
        setQuizzes(available);
        // If user is logged in, fetch their attempts and build latest-attempt map
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const attemptsRes = await api.getMyAttempts();
            const attempts = (attemptsRes && attemptsRes.data) || [];
            const map = {};
            attempts.forEach((a) => {
              const qid = a.quizId?._id || a.quizId;
              if (!qid) return;
              if (!map[qid] || new Date(a.submittedAt) > new Date(map[qid].submittedAt)) {
                map[qid] = a;
              }
            });
            setLastAttemptsMap(map);
          }
        } catch (err) {
          // ignore attempts fetch errors
          console.warn('Failed to load attempts', err);
        }
      } catch (err) {
        setError(err.message || 'Failed to load quizzes');
      } finally {
        setLoading(false);
      }
    };

    const fetchCompetitions = async () => {
      try {
        setCompetitionsLoading(true);
        const res = await api.listCompetitions({ includeUnpublished: false });
        const list = Array.isArray(res) ? res : (res.data || []);
        setCompetitions(list);
      } catch (err) {
        console.warn('Failed to load competitions', err);
      } finally {
        setCompetitionsLoading(false);
      }
    };

    fetchQuizzes();
    fetchCompetitions();
  }, []);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('smartprep-competition-session');
      if (raw) {
        setCompetitionSession(JSON.parse(raw));
      }
    } catch (e) {
      // ignore
    }

    try {
      const completedRaw = localStorage.getItem('smartprep-completed-competitions');
      if (completedRaw) {
        const parsed = JSON.parse(completedRaw);
        if (parsed && typeof parsed === 'object') {
          setCompletedCompetitions(parsed);
        }
      }
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!selectedQuiz) return;

    const storageKey = `smartprep-cbt-${selectedQuiz._id}`;
    const saved = localStorage.getItem(storageKey);

    if (saved && !sessionLoaded) {
      try {
        const parsed = JSON.parse(saved);
        setCurrentQuestion(parsed.currentQuestion || 0);
        setCurrentSectionIndex(parsed.currentSectionIndex || 0);
        setAnswers(parsed.answers || []);
        setQuestionStates(parsed.questionStates || getInitialQuestionStates(selectedQuiz.questions.length));
        setTimeLeft(parsed.timeLeft || selectedQuiz.timeLimit || selectedQuiz.questions.length * 60 || 600);
        setTimeLimit(parsed.timeLimit || selectedQuiz.timeLimit || selectedQuiz.questions.length * 60 || 600);
        setWarningCount(parsed.warningCount || 0);
        setQuizCompleted(false);
        setShowResults(false);
      } catch {
        // Ignore malformed saved session and fall back to defaults
      }
    } else if (!sessionLoaded) {
      const freshAnswers = Array(selectedQuiz.questions.length).fill(null);
      const freshStates = getInitialQuestionStates(selectedQuiz.questions.length);
      setAnswers(freshAnswers);
      setQuestionStates(freshStates);
      setTimeLeft(selectedQuiz.timeLimit || selectedQuiz.questions.length * 60 || 600);
      setTimeLimit(selectedQuiz.timeLimit || selectedQuiz.questions.length * 60 || 600);
      setCurrentQuestion(0);
      setCurrentSectionIndex(0);
      setWarningCount(0);
      setQuizCompleted(false);
      setShowResults(false);
      setShowReview(false);
      setScore(0);
      setIsFullscreen(false);
    }

    setSessionLoaded(true);
  }, [selectedQuiz, sessionLoaded]);

  useEffect(() => {
    if (!selectedQuiz || quizCompleted || showResults) return;

    const timer = setTimeout(() => {
      setTimeLeft((previous) => {
        if (previous <= 1) {
          finalizeSubmission();
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [selectedQuiz, timeLeft, quizCompleted, showResults]);

  useEffect(() => {
    if (!selectedQuiz) return;

    const storageKey = `smartprep-cbt-${selectedQuiz._id}`;
    const timeout = setTimeout(() => {
      const payload = {
        currentQuestion,
        currentSectionIndex,
        answers,
        questionStates,
        timeLeft,
        timeLimit,
        warningCount,
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    }, 700);

    return () => clearTimeout(timeout);
  }, [answers, currentQuestion, currentSectionIndex, questionStates, selectedQuiz, timeLeft, timeLimit, warningCount]);

  useEffect(() => {
    if (!selectedQuiz || showResults) return;

    const requestFullscreen = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
          setIsFullscreen(true);
        }
      } catch {
        // Ignore fullscreen issues on unsupported browsers
      }
    };

    requestFullscreen();
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      // Do not exit fullscreen here — keep fullscreen active across section transitions.
    };
  }, [selectedQuiz, showResults]);

  useEffect(() => {
    if (!selectedQuiz || quizCompleted) return;

    const incrementWarning = (message) => {
      setWarningCount((previous) => {
        const nextValue = previous + 1;
        toast({
          title: 'Warning',
          description: `${message} (${nextValue}/3)`,
          variant: 'destructive',
        });

        if (nextValue >= 3) {
          finalizeSubmission();
        }

        return nextValue;
      });
    };

    const handleContextMenu = (event) => {
      event.preventDefault();
      incrementWarning('Right-click is disabled');
    };

    const handleKeyDown = (event) => {
      const target = event.target;
      const isTypingField = target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      if (event.ctrlKey || event.metaKey) {
        if (['c', 'v', 'x', 'a', 's', 'p'].includes(event.key.toLowerCase())) {
          event.preventDefault();
          incrementWarning(`Keyboard shortcut blocked: ${event.key.toUpperCase()}`);
        }
      }

      if (event.key === 'F12' || (event.key === 'I' && event.ctrlKey && event.shiftKey) || (event.key === 'J' && event.ctrlKey && event.shiftKey) || (event.key === 'C' && event.ctrlKey && event.shiftKey)) {
        event.preventDefault();
        incrementWarning('Developer tools shortcut blocked');
      }

      if (!isTypingField) {
        if (event.key === 'ArrowRight') {
          event.preventDefault();
          goToNextQuestion();
        }
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          goToPreviousQuestion();
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        incrementWarning('Tab switch detected');
      }
    };

    const handleBlur = () => {
      incrementWarning('Window focus lost');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        incrementWarning('Fullscreen exited');
      } else {
        setIsFullscreen(true);
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [selectedQuiz, quizCompleted]);

  const sections = useMemo(() => buildSections(selectedQuiz), [selectedQuiz]);
  const currentCompetition = useMemo(() => {
    if (!competitions || competitions.length === 0) return null;
    if (competitionSession?.competitionId) {
      return competitions.find((c) => c._id === competitionSession.competitionId) || null;
    }
    if (selectedQuiz) {
      return competitions.find((c) => (c.relatedQuizzes || []).some((q) => (typeof q === 'string' ? q : q?._id) === selectedQuiz._id)) || null;
    }
    return null;
  }, [competitions, competitionSession, selectedQuiz]);

  const resetQuiz = () => {
    localStorage.removeItem(`smartprep-cbt-${selectedQuiz?._id}`);
    setSelectedQuiz(null);
    setCurrentQuestion(0);
    setCurrentSectionIndex(0);
    setAnswers([]);
    setQuestionStates([]);
    setTimeLeft(0);
    setTimeLimit(0);
    setQuizCompleted(false);
    setShowResults(false);
    setShowReview(false);
    setWarningCount(0);
    setScore(0);
    setSessionLoaded(false);
    setIsFullscreen(false);
  };

  const persistCompletedCompetition = (competitionId, payload) => {
    setCompletedCompetitions((previous) => {
      const nextValue = { ...previous, [competitionId]: payload };
      try {
        localStorage.setItem('smartprep-completed-competitions', JSON.stringify(nextValue));
      } catch (e) {
        // ignore
      }
      return nextValue;
    });
  };

  const showCompetitionResults = (competition) => {
    const result = competition?._id ? completedCompetitions[competition._id] : null;
    if (!result) return;

    const firstRelatedQuiz = Array.isArray(competition?.relatedQuizzes) ? competition.relatedQuizzes.find((quiz) => quiz && typeof quiz === 'object') : null;
    setSelectedQuiz(firstRelatedQuiz || { _id: competition._id, title: competition.title, questions: [] });
    setAttemptId(result.attemptId || null);
    setSavedAttempt(result);
    setScore(result.score || 0);
    setQuizCompleted(true);
    setShowResults(true);
    setShowReview(false);
    setSessionLoaded(true);
    setCompetitionSession(null);
    setIsFullscreen(false);
    try {
      localStorage.removeItem('smartprep-competition-session');
    } catch (e) {
      // ignore
    }
  };

  const startQuiz = async (quiz) => {
    let quizToStart = quiz;

    if (!quizToStart || !Array.isArray(quizToStart.questions) || quizToStart.questions.length === 0) {
      try {
        quizToStart = await resolveQuizForStart(quiz);
      } catch (err) {
        console.error('Failed to load quiz before starting', err);
      }
    }

    if (!quizToStart || !Array.isArray(quizToStart.questions) || quizToStart.questions.length === 0) {
      toast({
        title: 'Quiz not available',
        description: 'This quiz does not have any questions yet.',
        variant: 'destructive',
      });
      return;
    }

    const initialAnswers = Array(quizToStart.questions.length).fill(null);
    const initialStates = getInitialQuestionStates(quizToStart.questions.length);
    setSelectedQuiz(quizToStart);
    setCurrentQuestion(0);
    setCurrentSectionIndex(0);
    setAnswers(initialAnswers);
    setQuestionStates(initialStates);
    setTimeLeft(quizToStart.timeLimit || quizToStart.questions.length * 60 || 600);
    setTimeLimit(quizToStart.timeLimit || quizToStart.questions.length * 60 || 600);
    setQuizCompleted(false);
    setShowResults(false);
    setShowReview(false);
    setWarningCount(0);
    setScore(0);
    setSessionLoaded(false);
    setIsFullscreen(false);
  };

  const goToPreviousQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((previous) => previous - 1);
    }
  };

  const goToNextQuestion = () => {
    if (!selectedQuiz) return;
    if (currentQuestion < selectedQuiz.questions.length - 1) {
      setCurrentQuestion((previous) => previous + 1);
    }
  };

  const jumpToQuestion = (index) => {
    setCurrentQuestion(index);
    const sectionIndex = sections.findIndex((section) => section.questionIndices.includes(index));
    if (sectionIndex >= 0) {
      setCurrentSectionIndex(sectionIndex);
    }
  };

  const handleAnswerSelect = (answerIndex) => {
    if (!selectedQuiz) return;

    const nextAnswers = [...answers];
    nextAnswers[currentQuestion] = answerIndex;
    setAnswers(nextAnswers);
    setQuestionStates((previous) => {
      const nextState = [...previous];
      const currentState = nextState[currentQuestion];
      nextState[currentQuestion] = currentState === 'review' || currentState === 'answered-review' ? 'answered-review' : 'answered';
      return nextState;
    });
  };

  const markForReview = () => {
    setQuestionStates((previous) => {
      const nextState = [...previous];
      const hasAnswer = answers[currentQuestion] !== null && answers[currentQuestion] !== undefined && answers[currentQuestion] !== '';
      nextState[currentQuestion] = hasAnswer ? 'answered-review' : 'review';
      return nextState;
    });
    if (currentQuestion < selectedQuiz.questions.length - 1) {
      setCurrentQuestion((previous) => previous + 1);
    }
  };

  const clearResponse = () => {
    const nextAnswers = [...answers];
    nextAnswers[currentQuestion] = null;
    setAnswers(nextAnswers);
    setQuestionStates((previous) => {
      const nextState = [...previous];
      nextState[currentQuestion] = nextState[currentQuestion] === 'answered-review' || nextState[currentQuestion] === 'review' ? 'review' : 'visited';
      return nextState;
    });
  };

  const finalizeSubmission = async () => {
    if (!selectedQuiz) return;

    const total = selectedQuiz.questions.length;
    const correctAnswers = selectedQuiz.questions.reduce((count, question, index) => {
      const userAnswer = answers[index];
      return userAnswer === question.correctAnswer ? count + 1 : count;
    }, 0);

    const payloadAnswers = answers.map((selected, questionIndex) => ({ questionIndex, selected }));
    const timeTaken = (timeLimit || 0) - (timeLeft || 0);

    // Save attempt regardless of competition/session
    let attempt = null;
    try {
      const res = await api.saveQuizAttempt({ quizId: selectedQuiz._id, answers: payloadAnswers, timeTaken });
      attempt = res.data;
      setAttemptId(attempt._id);
      setSavedAttempt(attempt);
    } catch (err) {
      console.error('Failed to save attempt', err);
      toast({ title: 'Saved failed', description: 'Could not save attempt to server', variant: 'destructive' });
    }

    // If this was part of a competition, record attempt id and either auto-start next section or finalize the full competition
    let shouldFinalizeCompetition = false;
    try {
      if (competitionSession && competitionSession.quizIds && competitionSession.quizIds.length) {
        const idx = competitionSession.currentSectionIndex || 0;
        const ids = Array.isArray(competitionSession.attemptIds) ? [...competitionSession.attemptIds] : [];
        if (attempt && attempt._id && !ids.includes(attempt._id)) ids.push(attempt._id);
        const baseSession = { ...competitionSession, attemptIds: ids };

        const isLastSection = idx >= competitionSession.quizIds.length - 1;
        if (!isLastSection) {
          const nextIndex = idx + 1;
          const updated = { ...baseSession, currentSectionIndex: nextIndex };
          setCompetitionSession(updated);
          setShowReview(false);
          try { localStorage.setItem('smartprep-competition-session', JSON.stringify(updated)); } catch (e) {}

          const nextQuizId = competitionSession.quizIds[nextIndex];
          const nextQuiz = await resolveQuizForStart(nextQuizId);
          setTimeout(async () => {
            try { localStorage.removeItem(`smartprep-cbt-${nextQuiz._id}`); } catch (e) {}
            setSessionLoaded(false);
            await startQuiz(nextQuiz);
            try { if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); } catch (e) {}
          }, 900);
          return;
        }

        shouldFinalizeCompetition = true;
        try {
          const allIds = baseSession.attemptIds || [];
          const fetched = await Promise.all(allIds.map((id) => api.getAttemptById(id).then((r) => (r.data || r)).catch(() => null)));
          const valid = fetched.filter(Boolean);
          const totalScore = valid.reduce((s, a) => s + (a.score || 0), 0);
          const totalQuestions = valid.reduce((s, a) => s + (a.totalQuestions || (a.answers ? a.answers.length : 0)), 0);
          const combined = { attempts: valid, score: totalScore, totalQuestions, submittedAt: new Date().toISOString() };
          setSavedAttempt(combined);
          setScore(totalScore);
          if (competitionSession?.competitionId) {
            persistCompletedCompetition(competitionSession.competitionId, combined);
            try {
              await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/competitions/${competitionSession.competitionId}/results`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
                body: JSON.stringify({ score: totalScore, totalQuestions, quizAttemptIds: allIds })
              });
            } catch (persistErr) {
              console.warn('Failed to persist competition result', persistErr);
            }
          }
        } catch (aggErr) {
          console.warn('Failed to aggregate attempts for competition', aggErr);
        }

        try { localStorage.removeItem('smartprep-competition-session'); } catch (e) {}
        setCompetitionSession(null);
      }
    } catch (e) {
      console.warn('Failed to advance competition session', e);
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Failed to exit fullscreen:', err);
    }
    setIsFullscreen(false);

    if (!shouldFinalizeCompetition) {
      setScore(correctAnswers);
    }
    setQuizCompleted(true);
    setShowResults(true);
    setShowReview(false);
    localStorage.removeItem(`smartprep-cbt-${selectedQuiz._id}`);
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleString();
  };

  const resolveQuizForStart = async (quizOrId) => {
    if (!quizOrId) return null;

    if (typeof quizOrId === 'object' && Array.isArray(quizOrId.questions) && quizOrId.questions.length > 0) {
      return quizOrId;
    }

    const quizId = typeof quizOrId === 'string' ? quizOrId : quizOrId?._id;
    if (!quizId) return null;

    const response = await api.getQuizById(quizId);
    return extractQuizData(response);
  };

  const beginCompetition = async (competition, sectionIndex = 0) => {
    if (competition?._id && completedCompetitions[competition._id]) {
      showCompetitionResults(competition);
      return;
    }

    if (user?.role === 'student' && competition?.eligibilityMode === 'departmentYearClass') {
      const matchesDepartment = !competition.eligibleDepartment || (user.profile?.department || '').toLowerCase() === competition.eligibleDepartment.toLowerCase();
      const matchesYear = !competition.eligibleYear || (user.profile?.year || '').toLowerCase() === competition.eligibleYear.toLowerCase();
      const matchesClass = !competition.eligibleClass || (user.profile?.class || '').toLowerCase() === competition.eligibleClass.toLowerCase();
      if (!(matchesDepartment && matchesYear && matchesClass)) {
        toast({ title: 'Not eligible', description: 'This competition is restricted to a different department, year, or class.', variant: 'destructive' });
        return;
      }
    }

    if (user?.role === 'student' && competition?.eligibilityMode === 'domain') {
      const userDomains = Array.isArray(user.profile?.domain) ? user.profile.domain : [];
      const eligibleDomains = Array.isArray(competition.eligibleDomains) ? competition.eligibleDomains : [];
      const hasDomainMatch = eligibleDomains.some((domain) => userDomains.map((value) => value.toLowerCase()).includes(domain.toLowerCase()));
      if (!hasDomainMatch) {
        toast({ title: 'Not eligible', description: 'This competition is restricted to a different domain.', variant: 'destructive' });
        return;
      }
    }

    try {
      const quizIds = (competition.relatedQuizzes || []).map((q) => (typeof q === 'string' ? q : q?._id)).filter(Boolean);
      if (!quizIds.length) {
        toast({ title: 'No quizzes', description: 'This competition has no linked quizzes.', variant: 'destructive' });
        return;
      }
      const session = { competitionId: competition._id, quizIds, currentSectionIndex: sectionIndex };
      setCompetitionSession(session);
      localStorage.setItem('smartprep-competition-session', JSON.stringify(session));
      const quizData = await resolveQuizForStart(quizIds[sectionIndex]);
      if (!quizData) {
        toast({ title: 'Quiz unavailable', description: 'Failed to load the first section quiz.', variant: 'destructive' });
        return;
      }
      await startQuiz(quizData);
    } catch (err) {
      console.error('Failed to begin competition', err);
      toast({ title: 'Error', description: 'Could not start competition', variant: 'destructive' });
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-emerald-100 text-emerald-700';
      case 'Medium':
        return 'bg-amber-100 text-amber-700';
      case 'Hard':
        return 'bg-rose-100 text-rose-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  const activeCompetitions = useMemo(() => {
    const now = Date.now();
    return competitions.filter((competition) => {
      const start = new Date(competition.startDate).getTime();
      const end = new Date(competition.endDate).getTime();
      return Number.isFinite(start) && Number.isFinite(end) && now >= start && now <= end;
    });
  }, [competitions]);

  const activeCompetitionQuizIds = useMemo(() => {
    const ids = new Set();
    activeCompetitions.forEach((competition) => {
      (competition.relatedQuizzes || []).forEach((quiz) => {
        const quizId = typeof quiz === 'string' ? quiz : quiz?._id;
        if (quizId) ids.add(quizId);
      });
    });
    return ids;
  }, [activeCompetitions]);

  const practiceQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => !activeCompetitionQuizIds.has(quiz._id));
  }, [quizzes, activeCompetitionQuizIds]);

  const completionPercent = selectedQuiz?.questions?.length
    ? Math.round((questionStates.filter((state) => state !== 'not-visited' && state !== 'visited').length / selectedQuiz.questions.length) * 100)
    : 0;

  const answeredCount = answers.filter((answer) => answer !== null && answer !== undefined && answer !== '').length;
  const skippedCount = selectedQuiz?.questions?.length ? selectedQuiz.questions.length - answeredCount : 0;
  const reviewCount = questionStates.filter((state) => state === 'review' || state === 'answered-review').length;
  const allQuestionsVisited = questionStates.every((state) => state !== 'not-visited');
  const showSubmitAction = currentQuestion === selectedQuiz?.questions?.length - 1 || allQuestionsVisited;

  const isCompetitionForSelected = Boolean(
    competitionSession && competitionSession.quizIds && selectedQuiz && (competitionSession.quizIds || []).includes(selectedQuiz._id)
  );
  const compCurrentIndex = competitionSession?.currentSectionIndex ?? 0;
  const compLastIndex = competitionSession?.quizIds ? (competitionSession.quizIds.length - 1) : -1;
  const isCompetitionNotLast = isCompetitionForSelected && compCurrentIndex < compLastIndex;

  if (!selectedQuiz) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar user={user} onLogout={() => setUser(null)} />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Hero banner removed per request */}

          {loading && <p className="text-slate-600">Loading exams…</p>}
          {error && <p className="text-red-600">{error}</p>}

          {!loading && !error && activeCompetitions.length === 0 && practiceQuizzes.length === 0 && (
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="p-8 text-center">
                <CardTitle className="mb-2 text-xl">No quizzes available yet</CardTitle>
                <p className="text-slate-600">Please check back later.</p>
              </CardContent>
            </Card>
          )}

          {!loading && !error && (
            <div className="space-y-8">
              {activeCompetitions.length > 0 && (
                <section className="rounded-3xl border border-amber-300 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-6 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
                        <Trophy className="h-4 w-4" /> Ongoing live tests
                      </p>
                      <h2 className="mt-3 text-2xl font-semibold text-slate-900">Live competitions right now</h2>
                      <p className="mt-2 text-sm text-slate-600">These are highlighted so you can see the active window and join at the right time.</p>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-white px-4 py-3 text-sm text-slate-600">
                      {competitionsLoading ? 'Loading schedule…' : `${activeCompetitions.length} active`}
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    {activeCompetitions.map((competition) => (
                      <div key={competition._id} className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-2">
                          <Badge className="bg-amber-100 text-amber-700">Live now</Badge>
                          <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{competition.relatedQuizzes?.length || 0} quiz{(competition.relatedQuizzes?.length || 0) === 1 ? '' : 'zes'}</span>
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-slate-900">{competition.title}</h3>
                        <p className="mt-2 text-sm text-slate-600">{competition.description || 'Join this live assessment and complete the linked quizzes before it closes.'}</p>
                        <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 sm:grid-cols-2">
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Start time</p>
                            <p className="mt-1 font-medium text-slate-900">{formatTimestamp(competition.startDate)}</p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">End time</p>
                            <p className="mt-1 font-medium text-slate-900">{formatTimestamp(competition.endDate)}</p>
                          </div>
                        </div>
                        <div className="mt-4 space-y-2">
                          {(competition.relatedQuizzes || []).length > 0 ? (() => {
                            const sessionForThis = competitionSession && competitionSession.competitionId === competition._id;
                            const currentIdx = sessionForThis ? (competitionSession.currentSectionIndex || 0) : 0;
                            const displayQuizRaw = (competition.relatedQuizzes || [])[currentIdx];
                            const displayQuizId = typeof displayQuizRaw === 'string' ? displayQuizRaw : displayQuizRaw?._id;
                            const displayQuiz = typeof displayQuizRaw === 'string' ? null : displayQuizRaw;
                            const quizMinutes = Math.max(1, Math.round((displayQuiz?.timeLimit || 600) / 60));
                            const totalSections = (competition.relatedQuizzes || []).length;

                            if (!displayQuizRaw) return (<p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">No linked quizzes yet for this live assessment.</p>);

                            return (
                              <div key={displayQuizId || 'section-display'} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-3">
                                <div className="space-y-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="font-medium text-slate-900">{displayQuiz?.title || `Section ${currentIdx + 1}`}</p>
                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Section {currentIdx + 1}</Badge>
                                    <span className="text-xs text-slate-400">of {totalSections}</span>
                                  </div>
                                  <p className="text-xs text-slate-500">{displayQuiz?.category || 'Practice quiz'} • {quizMinutes} min</p>
                                </div>
                                {completedCompetitions[competition._id] ? (
                                  <Button size="sm" onClick={() => showCompetitionResults(competition)}>View score</Button>
                                ) : sessionForThis ? (
                                  <Button size="sm" onClick={() => void beginCompetition(competition, currentIdx)}>Continue section</Button>
                                ) : (
                                  <Button size="sm" onClick={() => void beginCompetition(competition, 0)}>Start exam</Button>
                                )}
                              </div>
                            );
                          })() : (
                            <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-500">No linked quizzes yet for this live assessment.</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {practiceQuizzes.length > 0 && (
                <section>
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Other quizzes</p>
                      <h2 className="text-2xl font-semibold text-slate-900">Practice at your own pace</h2>
                    </div>
                    <p className="text-sm text-slate-600">These are regular quizzes and are not part of a live assessment.</p>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {practiceQuizzes.map((quiz) => (
                      <Card key={quiz._id} className="border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600"><Brain className="h-6 w-6" /></div>
                            <Badge className={getDifficultyColor(quiz.difficulty)}>{quiz.difficulty}</Badge>
                          </div>
                          <CardTitle className="text-lg">{quiz.title}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-slate-600">
                            <div className="flex items-center gap-1"><Clock className="h-4 w-4" />{Math.max(1, Math.round((quiz.timeLimit || 600) / 60))} min</div>
                            <div className="flex items-center gap-1"><Target className="h-4 w-4" />{quiz.questions?.length || 0} questions</div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="mb-4 text-sm text-slate-600">{quiz.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">{quiz.category}</Badge>
                            <div className="flex items-center gap-2">
                              {lastAttemptsMap[quiz._id] && (
                                <Button variant="ghost" onClick={() => {
                                  const attempt = lastAttemptsMap[quiz._id];
                                  const quizDoc = attempt.quizId || quiz;
                                  setSelectedQuiz(quizDoc);
                                  setAttemptId(attempt._id);
                                  setSavedAttempt(attempt);
                                  const ansArr = Array(quizDoc.questions.length).fill(null);
                                  (attempt.answers || []).forEach((a) => {
                                    ansArr[a.questionIndex] = a.selected;
                                  });
                                  setAnswers(ansArr);
                                  const states = ansArr.map((a, i) => (a !== null && a !== undefined && a !== '' ? 'answered' : (i === 0 ? 'visited' : 'not-visited')));
                                  setQuestionStates(states);
                                  setScore(attempt.score || 0);
                                  setQuizCompleted(true);
                                  setShowReview(false);
                                  setSessionLoaded(true);
                                  setIsFullscreen(false);
                                  setShowResults(true);
                                }}>View Last Score</Button>
                              )}
                              <Button onClick={() => void startQuiz(quiz)}>Start Quiz</Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  

  if (showResults) {
    const isCompetitionResult = savedAttempt?.attempts && Array.isArray(savedAttempt.attempts);
    const resultTotalQuestions = savedAttempt?.totalQuestions || selectedQuiz.questions.length;
    const resultAttempted = isCompetitionResult
      ? savedAttempt.attempts.reduce((sum, attempt) => sum + (attempt.answers?.filter((a) => a.selected !== null && a.selected !== undefined && a.selected !== '').length || 0), 0)
      : answeredCount;

    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar user={user} onLogout={() => setUser(null)} />
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <Card className="overflow-hidden border-slate-200 bg-white shadow-sm">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-slate-900 p-8 text-center text-white">
              <Trophy className="mx-auto mb-4 h-16 w-16" />
              <CardTitle className="text-3xl">{isCompetitionResult ? 'Competition complete' : (selectedQuiz?.title || 'Assessment complete')}</CardTitle>
              <p className="mt-2 text-sm text-blue-100">Completed on {formatTimestamp(savedAttempt?.submittedAt || new Date())}</p>
            </CardHeader>
            <CardContent className="p-8">
              <div className="mb-8 grid gap-6 rounded-3xl border border-slate-200 bg-slate-50 p-6 lg:grid-cols-3">
                <div>
                  <p className="text-sm text-slate-500">Score</p>
                  <p className="text-4xl font-semibold text-slate-900">{score}/{resultTotalQuestions}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Accuracy</p>
                  <p className="text-4xl font-semibold text-slate-900">{Math.round((score / resultTotalQuestions) * 100)}%</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Attempted</p>
                  <p className="text-4xl font-semibold text-slate-900">{resultAttempted}</p>
                </div>
              </div>

              {isCompetitionResult ? (
                <div className="space-y-4">
                  {savedAttempt.attempts.map((attempt, index) => {
                    const quiz = attempt.quizId || {};
                    const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
                    return (
                      <Card key={attempt._id || index} className="border-slate-200">
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between gap-4">
                              <div>
                                <p className="font-medium text-slate-900">{quiz.title || `Section ${index + 1}`}</p>
                                <p className="text-sm text-slate-600">Section {index + 1} • {attempt.score}/{attempt.totalQuestions} correct</p>
                              </div>
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{formatTimestamp(attempt.submittedAt)}</span>
                            </div>
                            <div className="grid gap-3 md:grid-cols-3">
                              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                                <p className="text-slate-500">Score</p>
                                <p className="font-semibold text-slate-900">{attempt.score}/{attempt.totalQuestions}</p>
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                                <p className="text-slate-500">Accuracy</p>
                                <p className="font-semibold text-slate-900">{attempt.totalQuestions ? Math.round((attempt.score / attempt.totalQuestions) * 100) : 0}%</p>
                              </div>
                              <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
                                <p className="text-slate-500">Questions</p>
                                <p className="font-semibold text-slate-900">{attempt.totalQuestions}</p>
                              </div>
                            </div>

                            {questions.length > 0 && (
                              <div className="space-y-4 mt-6">
                                {questions.map((question, questionIndex) => {
                                  const answerData = (attempt.answers || []).find((a) => a.questionIndex === questionIndex) || {};
                                  const selectedText = formatSelectedAnswer(question, answerData.selected);
                                  const correctText = Array.isArray(question.correctAnswer)
                                    ? question.correctAnswer.map((value) => question.options?.[value] || value).join(', ')
                                    : question.options?.[question.correctAnswer] || question.correctAnswer;
                                  const isCorrect = answerData.correct;
                                  return (
                                    <Card key={`${attempt._id || index}-q-${questionIndex}`} className="border-slate-200 bg-slate-50">
                                      <CardContent className="p-4">
                                        <div className="flex flex-col gap-2">
                                          <p className="font-semibold text-slate-900">{questionIndex + 1}. {question.question}</p>
                                          <p className="text-sm text-slate-500">Correct answer: <span className="text-slate-900">{correctText}</span></p>
                                          <p className={`text-sm ${isCorrect ? 'text-emerald-700' : 'text-rose-600'}`}>Your answer: <span className="font-medium text-slate-900">{selectedText}</span></p>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                  {selectedQuiz.questions.map((question, index) => (
                    <Card key={`${question._id || index}`} className="border-slate-200">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          {answers[index] === question.correctAnswer ? (
                            <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-600" />
                          ) : (
                            <Circle className="mt-1 h-5 w-5 text-rose-500" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{question.question}</p>
                            <p className="mt-2 text-sm text-slate-600">Correct answer: {question.options?.[question.correctAnswer] || question.correctAnswer}</p>
                            <p className="mt-2 text-sm text-slate-600">Your answer: {getAnswerSummary(answers, index, question)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Button variant="outline" onClick={resetQuiz}>Back to exams</Button>
                {isCompetitionResult ? (
                  <Button variant="secondary" disabled>Completed once</Button>
                ) : (
                  <Button onClick={() => void startQuiz(selectedQuiz)}><RotateCcw className="mr-2 h-4 w-4" />Retake exam</Button>
                )}
                {attemptId && (
                  <Button className="bg-slate-700 text-white" onClick={async () => {
                    try {
                      const attemptData = savedAttempt || (await api.getAttemptById(attemptId)).data;
                      const isCompetitionResult = attemptData?.attempts && Array.isArray(attemptData.attempts);
                      const attemptsToPrint = isCompetitionResult ? attemptData.attempts : [attemptData];
                      if (!attemptsToPrint.length) throw new Error('No attempt data available for download');

                      const w = window.open('', '_blank');
                      if (!w) throw new Error('Popup blocked');
                      w.document.write('<html><head><title>Exam Result</title>');
                      w.document.write('<style>body{font-family: Arial, sans-serif; padding: 20px; color:#111} .q{margin-bottom:16px} .correct{color:green} .wrong{color:red}</style>');
                      w.document.write('</head><body>');

                      attemptsToPrint.forEach((attempt, attemptIndex) => {
                        const quiz = attempt.quizId && attempt.quizId.questions ? attempt.quizId : selectedQuiz;
                        const quizTitle = quiz.title || `Section ${attemptIndex + 1}`;
                        const submittedAt = attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : new Date().toLocaleString();
                        w.document.write(`<h1>${quizTitle} - Result</h1>`);
                        w.document.write(`<p>Completed: ${submittedAt}</p>`);
                        w.document.write(`<p>Score: ${attempt.score}/${attempt.totalQuestions}</p>`);
                        (attempt.answers || []).forEach((a) => {
                          const q = quiz.questions?.[a.questionIndex];
                          if (!q) return;
                          const isCorrect = a.correct;
                          const selectedAnswer = Array.isArray(a.selected)
                            ? a.selected.map((i) => q.options?.[i] || i).join(', ')
                            : (q.options?.[a.selected] ?? a.selected);
                          const correctAnswer = Array.isArray(q.correctAnswer)
                            ? q.correctAnswer.map((i) => q.options?.[i] || i).join(', ')
                            : (q.options?.[q.correctAnswer] ?? q.correctAnswer);
                          w.document.write(`<div class="q"><h3>Q${a.questionIndex + 1}: ${q.question}</h3>`);
                          w.document.write(`<p>Correct answer: <strong>${correctAnswer}</strong></p>`);
                          w.document.write(`<p>Your answer: <span class="${isCorrect ? 'correct' : 'wrong'}">${selectedAnswer}</span></p>`);
                          if (q.explanation) w.document.write(`<p>Explanation: ${q.explanation}</p>`);
                          w.document.write('</div>');
                        });
                        if (attemptIndex < attemptsToPrint.length - 1) {
                          w.document.write('<hr style="margin: 40px 0;"/>');
                        }
                      });

                      w.document.write('</body></html>');
                      w.document.close();
                      w.print();
                    } catch (err) {
                      console.error('Print failed', err);
                      toast({ title: 'Print failed', description: err.message || 'Unable to open print dialog', variant: 'destructive' });
                    }
                  }}>Download PDF</Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="flex h-screen flex-col overflow-hidden">
        <header className="border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-600 p-2.5 text-white"><BookOpen className="h-5 w-5" /></div>
              <div>
                <p className="text-sm font-semibold text-slate-900">{selectedQuiz.title}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge className="bg-blue-600 text-white">{sections[currentSectionIndex]?.name || `Section ${currentSectionIndex + 1}`}</Badge>
                  {sections.length > 1 && (
                    <div className="-ml-1 flex gap-2 overflow-x-auto py-1">
                      {sections.map((section, index) => (
                        <button
                          key={section.id}
                          onClick={() => {
                            const targetQuestion = section.questionIndices[0];
                            if (targetQuestion !== undefined) jumpToQuestion(targetQuestion);
                            setCurrentSectionIndex(index);
                          }}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition ${currentSectionIndex === index ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                          {section.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Completed</p>
                <p className="font-medium text-slate-900">{formatTimestamp(savedAttempt?.submittedAt || new Date())}</p>
              </div>
              <div className={`rounded-2xl border px-3 py-2 ${timeLeft <= 60 ? 'border-rose-200 bg-rose-50 text-rose-700' : timeLeft <= 900 ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                <p className="text-[11px] uppercase tracking-[0.2em]">Timer</p>
                <p className="font-semibold">{formatTime(timeLeft)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Fullscreen</p>
                <p className="font-medium text-slate-900">{isFullscreen ? 'Enabled' : 'Pending'}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Warnings</p>
                <p className="font-medium text-slate-900">{warningCount}/3</p>
              </div>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex flex-wrap gap-2">
                {currentCompetition ? (
                  (currentCompetition.relatedQuizzes || []).map((rq, idx) => {
                    const title = typeof rq === 'string' ? `Section ${idx + 1}` : (rq.title || `Section ${idx + 1}`);
                    const sessionForThis = competitionSession && competitionSession.competitionId === currentCompetition._id;
                    const currentIdx = sessionForThis ? (competitionSession.currentSectionIndex || 0) : 0;
                    const isCurrent = idx === currentIdx;
                    const isCompleted = sessionForThis && idx < currentIdx;
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          if (isCurrent) {
                            // jump to the start of this quiz
                            setCurrentSectionIndex(0);
                            // keep selectedQuiz as is (current section)
                          } else if (isCompleted) {
                            toast({ title: 'Section completed', description: 'You can review completed sections in results.' });
                          } else {
                            toast({ title: 'Locked', description: 'This section is locked until you complete the current section.' });
                          }
                        }}
                        className={`rounded-full px-3 py-2 text-sm font-medium transition ${isCurrent ? 'bg-blue-600 text-white' : isCompleted ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}
                      >
                        {title}
                      </button>
                    );
                  })
                ) : (
                  sections.map((section, index) => (
                    <button
                      key={section.id}
                      onClick={() => {
                        const targetQuestion = section.questionIndices[0];
                        if (targetQuestion !== undefined) {
                          jumpToQuestion(targetQuestion);
                        }
                        setCurrentSectionIndex(index);
                      }}
                      className={`rounded-full px-3 py-2 text-sm font-medium transition ${currentSectionIndex === index ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      {section.name}
                    </button>
                  ))
                )}
              </div>
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
                <Flag className="h-4 w-4 text-amber-500" />
                <span>Question {currentQuestion + 1} / {selectedQuiz.questions.length}</span>
              </div>
            </div>

            <div className="grid h-[calc(100%-5rem)] gap-4 xl:grid-cols-[1fr_260px]">
              <div className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Progress</p>
                    <p className="text-sm font-semibold text-slate-900">{completionPercent}% completed</p>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">Answered {answeredCount}</span>
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">Review {reviewCount}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1">Skipped {skippedCount}</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                    <Badge className="bg-blue-50 text-blue-700">{selectedQuiz.questions[currentQuestion]?.difficulty || 'Mixed'}</Badge>
                    <Badge variant="outline" className="border-slate-300 text-slate-600">{selectedQuiz.questions[currentQuestion]?.type || 'MCQ'}</Badge>
                    <Badge variant="outline" className="border-slate-300 text-slate-600">{selectedQuiz.questions[currentQuestion]?.marks || 1} marks</Badge>
                  </div>

                  <h2 className="text-xl font-semibold text-slate-900">{selectedQuiz.questions[currentQuestion]?.question}</h2>
                  <p className="mt-4 text-sm text-slate-600">Select the best answer and use the navigation controls to move through the exam.</p>

                  <div className="mt-6 space-y-3">
                    {selectedQuiz.questions[currentQuestion]?.options?.map((option, index) => {
                      const isSelected = Array.isArray(answers[currentQuestion])
                        ? answers[currentQuestion].includes(index)
                        : answers[currentQuestion] === index;
                      return (
                        <button
                          key={`${option}-${index}`}
                          type="button"
                          onClick={() => handleAnswerSelect(index)}
                          className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition ${isSelected ? 'border-blue-500 bg-blue-50 text-slate-900 shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                        >
                          <span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border text-sm font-semibold ${isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300 text-slate-600'}`}>{String.fromCharCode(65 + index)}</span>
                          <span>{option}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100" onClick={goToPreviousQuestion} disabled={currentQuestion === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" />Previous
                  </Button>
                  <Button variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100" onClick={markForReview}>
                    <Flag className="mr-2 h-4 w-4" />Mark for Review & Next
                  </Button>
                  <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100" onClick={clearResponse}>
                    <RotateCcw className="mr-2 h-4 w-4" />Clear Response
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-500" onClick={goToNextQuestion}>
                    Save & Next<ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  {showSubmitAction && (
                    isCompetitionNotLast ? (
                      <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={() => setShowReview(true)}>
                        <SendIcon />Submit Section
                      </Button>
                    ) : (
                      <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={() => setShowReview(true)}>
                        <SendIcon />Submit Exam
                      </Button>
                    )
                  )}
                </div>
              </div>

              <aside className="flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white px-4 py-4 shadow-sm">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Question palette</h3>
                </div>
                <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" />Current</div>
                  <div className="mt-2 flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />Answered</div>
                  <div className="mt-2 flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-slate-400" />Not visited</div>
                  <div className="mt-2 flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" />Review</div>
                  <div className="mt-2 flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-violet-500" />Answered + Review</div>
                </div>
                <div className="grid grid-cols-4 gap-2.5 overflow-y-auto">
                  {selectedQuiz.questions.map((_, index) => {
                    const state = getQuestionState(questionStates, index);
                    const isCurrent = index === currentQuestion;
                    return (
                      <button
                        key={index}
                        onClick={() => jumpToQuestion(index)}
                        className={`flex h-11 items-center justify-center rounded-2xl border text-sm font-semibold transition ${isCurrent ? 'border-blue-500 bg-blue-50 text-blue-700' : STATUS_STYLES[state]}`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </aside>
            </div>
          </main>
        </div>
      </div>

      {showReview && (() => {
        const isCompetition = Boolean(competitionSession && competitionSession.quizIds && competitionSession.quizIds.length);
        const compIdx = competitionSession?.currentSectionIndex ?? 0;
        const compLast = competitionSession?.quizIds ? (competitionSession.quizIds.length - 1) : -1;
        const competitionSectionName = `Section ${compIdx + 1}`;
        const quizName = selectedQuiz?.title || competitionSectionName;
        const sectionQuestions = selectedQuiz?.questions ? selectedQuiz.questions.map((_, index) => index) : [];
        const answered = sectionQuestions.filter((index) => answers[index] !== null && answers[index] !== undefined && answers[index] !== '').length;
        const review = sectionQuestions.filter((index) => questionStates[index] === 'review' || questionStates[index] === 'answered-review').length;
        const remaining = sectionQuestions.length - answered - review;

        // If this is a competition and not the last section, show a compact "Submit this section?" modal
        if (isCompetition && compIdx < compLast) {
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
              <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-white p-6 text-slate-900 shadow-2xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Submit Section</p>
                    <h3 className="text-2xl font-semibold">Submit {quizName}?</h3>
                    <p className="mt-2 text-sm text-slate-600">Answered {answered} • Review {review} • Remaining {remaining}</p>
                  </div>
                  <button onClick={() => setShowReview(false)} className="rounded-full border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"><X className="h-4 w-4" /></button>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowReview(false)}>Return to section</Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={finalizeSubmission}>Confirm submit section</Button>
                </div>
              </div>
            </div>
          );
        }

        // Otherwise show the full review modal for final exam submission
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
            <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-900 p-6 text-slate-100 shadow-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Review before submission</p>
                  <h3 className="text-2xl font-semibold text-white">{isCompetition ? `Submit ${quizName}?` : 'Submit your exam?'}</h3>
                </div>
                <button onClick={() => setShowReview(false)} className="rounded-full border border-slate-700 p-2 text-slate-400 hover:text-white"><X className="h-4 w-4" /></button>
              </div>

              <div className="mt-6 space-y-4">
                {(isCompetition ? [{
                  id: 'current-competition-section',
                  name: `Current section: ${competitionSectionName}`,
                  questionIndices: selectedQuiz.questions.map((_, index) => index),
                }] : sections).map((section) => {
                  const sectionQuestions = section.questionIndices.filter((index) => index < selectedQuiz.questions.length);
                  const answered = sectionQuestions.filter((index) => answers[index] !== null && answers[index] !== undefined && answers[index] !== '').length;
                  const review = sectionQuestions.filter((index) => questionStates[index] === 'review' || questionStates[index] === 'answered-review').length;
                  const remaining = sectionQuestions.length - answered - review;
                  return (
                    <div key={section.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-white">{section.name}</p>
                        <div className="flex gap-2 text-sm text-slate-400">
                          <span className="rounded-full bg-emerald-900/40 px-2.5 py-1 text-emerald-200">Answered {answered}</span>
                          <span className="rounded-full bg-amber-900/40 px-2.5 py-1 text-amber-200">Review {review}</span>
                          <span className="rounded-full bg-slate-800 px-2.5 py-1">Remaining {remaining}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800" onClick={() => setShowReview(false)}>Return to exam</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-500" onClick={finalizeSubmission}>Confirm submission</Button>
              </div>
            </div>
          </div>
        );
      })()}
      
    </div>
  );
};

const SendIcon = () => <Send className="mr-2 h-4 w-4" />;

export default Quizzes;
