import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Users, BookOpen, Brain, Plus, Upload, X, Save, Edit, Trash2, Bold, Italic, Underline, List, Type, Code, Minus, Plus as PlusIcon, MessageSquare, Terminal, Check, Trophy, CalendarDays, ChevronDown, Download, Search, Building2, GraduationCap, LayoutGrid, ArrowRight, ArrowLeft, FileSpreadsheet, Eye, ShieldCheck, ChevronRight } from 'lucide-react';
import { read, write, utils } from 'xlsx';
import { Switch } from '@/components/ui/switch';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { downloadCandidateMarksPdf } from '@/utils/downloadResultsPdf';
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const createEmptyQuizQuestion = () => ({
  question: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  explanation: '',
  topic: '',
  marks: '',
  negativeMarks: '',
  difficulty: 'Medium',
  subject: '',
  questionType: 'MCQ'
});

const initialQuizForm = {
  title: '',
  category: '',
  difficulty: 'Medium',
  timeLimitMinutes: 10,
  description: '',
  tags: '',
  isPublished: true
};

const normalizeHeader = (header) =>
  header?.toString().trim().replace(/\s+/g, ' ').toLowerCase();

const COMPETITION_HOURS = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, '0'));
const COMPETITION_MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];
const COMPETITION_PERIODS = ['AM', 'PM'];

const formatCompetitionDateLabel = (value) => {
  if (!value) return 'Pick a date';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Pick a date';
  return format(date, 'PPP');
};

const splitDateTimeForForm = (value) => {
  if (!value) return { date: '', time: '' };
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { date: '', time: '' };

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours24 = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 || 12;

  return {
    date: `${year}-${month}-${day}`,
    hour: String(hours12).padStart(2, '0'),
    minute: minutes,
    period
  };
};

const buildCompetitionDateTime = (dateValue, hourValue, minuteValue, periodValue) => {
  if (!dateValue || !hourValue || !minuteValue || !periodValue) return null;

  const hour = Number(hourValue);
  if (Number.isNaN(hour)) return null;

  let hours24 = hour % 12;
  if (periodValue === 'PM') {
    hours24 += 12;
  }
  if (periodValue === 'AM' && hour === 12) {
    hours24 = 0;
  }

  const timestamp = new Date(`${dateValue}T00:00:00`);
  timestamp.setHours(hours24, Number(minuteValue), 0, 0);
  return Number.isNaN(timestamp.getTime()) ? null : timestamp;
};

const getDefaultCompetitionForm = () => {
  const now = new Date();
  const roundedMinutes = Math.round(now.getMinutes() / 5) * 5;
  if (roundedMinutes === 60) {
    now.setHours(now.getHours() + 1, 0, 0, 0);
  } else {
    now.setMinutes(roundedMinutes, 0, 0);
  }

  const date = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  const hours24 = now.getHours();
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hour12 = hours24 % 12 || 12;

  return {
    title: '',
    description: '',
    eligibilityMode: 'all',
    eligibleDepartment: '',
    eligibleClass: '',
    eligibleDomains: '',
    startDate: date,
    startHour: String(hour12).padStart(2, '0'),
    startMinute: String(now.getMinutes()).padStart(2, '0'),
    startPeriod: period,
    endDate: date,
    endHour: String(hour12).padStart(2, '0'),
    endMinute: String(now.getMinutes()).padStart(2, '0'),
    endPeriod: period,
    durationMinutes: 60,
    tags: '',
    relatedQuizzes: [],
    isPublished: true
  };
};

const formatDurationMinutes = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const minutes = Number(value) <= 0 ? 0 : Math.max(1, Math.round(Number(value) / 60));
  return `${minutes}m`;
};

const getPerformanceStatus = (value) => {
  if (value >= 80) return { label: '🟢 Pass', tone: 'bg-emerald-100 text-emerald-700' };
  if (value >= 60) return { label: '🟡 Borderline', tone: 'bg-amber-100 text-amber-700' };
  return { label: '🔴 Needs work', tone: 'bg-rose-100 text-rose-700' };
};

const AdminPanel = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const panelRole = authUser?.role || user?.role;
  const isFacultyPanel = panelRole === 'faculty';
  const [materialForm, setMaterialForm] = useState({
    title: '',
    category: '',
    description: '',
    readTime: '',
    difficulty: 'Easy',
    content: '',
    images: '',
  });
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [theoryDocs, setTheoryDocs] = useState([]);
  const [theoryLoading, setTheoryLoading] = useState(false);
  const [theoryError, setTheoryError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [quizForm, setQuizForm] = useState(initialQuizForm);
  const [quizQuestions, setQuizQuestions] = useState([createEmptyQuizQuestion()]);
  const [quizEditingId, setQuizEditingId] = useState(null);
  const [quizzesList, setQuizzesList] = useState([]);
  const [quizzesLoading, setQuizzesLoading] = useState(false);
  const [quizError, setQuizError] = useState('');
  const [quizSaving, setQuizSaving] = useState(false);
  const [bulkImportFile, setBulkImportFile] = useState(null);
  const [bulkImportErrors, setBulkImportErrors] = useState([]);
  const [bulkImportPreview, setBulkImportPreview] = useState([]);
  const [bulkImportQuestions, setBulkImportQuestions] = useState([]);
  const [bulkImportReadyCount, setBulkImportReadyCount] = useState(0);
  const [bulkImportStatus, setBulkImportStatus] = useState('idle');
  const [bulkImportProgress, setBulkImportProgress] = useState(0);
  const [bulkImportSuccess, setBulkImportSuccess] = useState(null);
  const [bulkImportQuizTitle, setBulkImportQuizTitle] = useState('Imported Questions');
  const [bulkImportCategory, setBulkImportCategory] = useState('DSA');
  const [bulkImportDifficulty, setBulkImportDifficulty] = useState('Medium');
  const [bulkImportTimeLimit, setBulkImportTimeLimit] = useState(10);
  const [bulkImportDescription, setBulkImportDescription] = useState('Bulk imported questions');
  const [bulkImportTags, setBulkImportTags] = useState('imported');
  const [bulkImportPublished, setBulkImportPublished] = useState(true);

  const [competitions, setCompetitions] = useState([]);
  const [competitionsLoading, setCompetitionsLoading] = useState(false);
  const [competitionsError, setCompetitionsError] = useState('');
  const [competitionForm, setCompetitionForm] = useState(() => getDefaultCompetitionForm());
  const [competitionEditingId, setCompetitionEditingId] = useState(null);
  const [competitionSaving, setCompetitionSaving] = useState(false);
  const [candidateResults, setCandidateResults] = useState([]);
  const [candidateResultsLoading, setCandidateResultsLoading] = useState(false);
  const [candidateResultsError, setCandidateResultsError] = useState('');
  const [selectedCompetitionId, setSelectedCompetitionId] = useState('');
  const [competitionSearch, setCompetitionSearch] = useState('');
  const [competitionStats, setCompetitionStats] = useState({});
  const [selectedQuizIdForStats, setSelectedQuizIdForStats] = useState('');
  const [quizAttemptStats, setQuizAttemptStats] = useState(null);
  const [quizAttemptStatsLoading, setQuizAttemptStatsLoading] = useState(false);
  const [quizAttemptStatsError, setQuizAttemptStatsError] = useState('');
  const [quizResults, setQuizResults] = useState([]);
  const [quizResultsLoading, setQuizResultsLoading] = useState(false);
  const [quizResultsError, setQuizResultsError] = useState('');

  // Interview Questions state
  const [interviewQuestions, setInterviewQuestions] = useState([]);
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [interviewError, setInterviewError] = useState('');
  const [interviewSaving, setInterviewSaving] = useState(false);
  const [interviewEditingId, setInterviewEditingId] = useState(null);
  const [interviewForm, setInterviewForm] = useState({
    question: '',
    answer: '',
    category: 'HR',
    subcategory: '',
    difficulty: 'Medium',
    tags: '',
    tips: '',
    examples: ''
  });

  // Coding Problems state
  const [codingProblems, setCodingProblems] = useState([]);
  const [codingLoading, setCodingLoading] = useState(false);
  const [codingError, setCodingError] = useState('');
  const [codingSaving, setCodingSaving] = useState(false);
  const [codingEditingId, setCodingEditingId] = useState(null);
  const [codingForm, setCodingForm] = useState({
    title: '',
    description: '',
    category: 'Arrays',
    difficulty: 'Easy',
    examples: [{ input: '', output: '', explanation: '' }],
    constraints: [''],
    testCases: [{ input: '', expectedOutput: '' }],
    hints: [''],
    solution: '',
    starterCode: {
      javascript: '',
      python: '',
      java: '',
      cpp: ''
    },
    timeLimit: 1000,
    memoryLimit: 128
  });

  const loadCompetitions = useCallback(async () => {
    try {
      setCompetitionsLoading(true);
      setCompetitionsError('');
      const res = await api.listCompetitions({ includeUnpublished: true });
      const list = Array.isArray(res) ? res : (res.data || []);
      setCompetitions(list);

      // Fetch stats for all competitions in parallel
      const statsPromises = list.map((competition) =>
        api.getCompetitionResults(competition._id)
          .then((resData) => {
            const results = Array.isArray(resData?.data) ? resData.data : [];
            const appeared = results.length;
            const avgScore = results.length > 0
              ? Math.round(results.reduce((sum, r) => sum + (r.percentage ?? 0), 0) / results.length)
              : 0;
            return { competitionId: competition._id, appeared, avgScore };
          })
          .catch(() => ({
            competitionId: competition._id,
            appeared: '—',
            avgScore: '—'
          }))
      );

      const allStats = await Promise.all(statsPromises);
      const statsMap = {};
      allStats.forEach((stat) => {
        statsMap[stat.competitionId] = stat;
      });
      setCompetitionStats(statsMap);
    } catch (error) {
      setCompetitionsError(error.message || 'Failed to load competitions');
    } finally {
      setCompetitionsLoading(false);
    }
  }, []);

  const loadQuizzes = useCallback(async () => {
    try {
      setQuizzesLoading(true);
      setQuizError('');
      const res = await api.listQuizzes({ includeUnpublished: true });
      const list = Array.isArray(res) ? res : (res.data || []);
      setQuizzesList(list);
    } catch (error) {
      setQuizError(error.message || 'Failed to load quizzes');
    } finally {
      setQuizzesLoading(false);
    }
  }, []);

  const loadCandidateResults = useCallback(async (competitionId) => {
    if (!competitionId) {
      setCandidateResults([]);
      setCandidateResultsError('');
      return;
    }

    try {
      setCandidateResultsLoading(true);
      setCandidateResultsError('');
      const res = await api.getCompetitionResults(competitionId);
      const list = Array.isArray(res?.data) ? res.data : [];
      setCandidateResults(list);
    } catch (error) {
      setCandidateResultsError(error.message || 'Failed to load competition results');
    } finally {
      setCandidateResultsLoading(false);
    }
  }, []);

  const loadQuizAttemptStats = useCallback(async (quizId) => {
    if (!quizId) {
      setQuizAttemptStats(null);
      setQuizAttemptStatsError('');
      setQuizResults([]);
      setQuizResultsError('');
      return;
    }

    try {
      setQuizAttemptStatsLoading(true);
      setQuizResultsLoading(true);
      setQuizAttemptStatsError('');
      setQuizResultsError('');

      const [statsResult, resultsResult] = await Promise.allSettled([
        api.getAttemptStats(quizId),
        api.getCandidateResults(quizId)
      ]);

      const statsData = statsResult.status === 'fulfilled' ? (statsResult.value?.data || null) : null;
      const resultsData = resultsResult.status === 'fulfilled' && Array.isArray(resultsResult.value?.data)
        ? resultsResult.value.data
        : [];

      setQuizAttemptStats(statsData);
      setQuizResults(resultsData);

      if (statsResult.status === 'rejected' && resultsResult.status === 'rejected') {
        throw new Error(statsResult.reason?.message || resultsResult.reason?.message || 'Failed to load quiz dashboard');
      }
    } catch (error) {
      setQuizAttemptStatsError(error.message || 'Failed to load quiz attempt stats');
      setQuizAttemptStats(null);
      setQuizResults([]);
      setQuizResultsError(error.message || 'Failed to load quiz results');
    } finally {
      setQuizAttemptStatsLoading(false);
      setQuizResultsLoading(false);
    }
  }, []);

  const scoreDistributionData = useMemo(() => {
    if (!quizAttemptStats?.scoreDistribution?.length) {
      return [];
    }

    return quizAttemptStats.scoreDistribution.map((bucket) => ({
      label: bucket.label,
      count: bucket.count
    }));
  }, [quizAttemptStats]);

  const rankedQuizResults = useMemo(() => {
    const sorted = [...quizResults].sort((a, b) => {
      const difference = (b.percentage ?? 0) - (a.percentage ?? 0);
      if (difference !== 0) return difference;
      return (a.timeTaken ?? 0) - (b.timeTaken ?? 0);
    });

    return sorted.map((result, index) => ({ ...result, rank: index + 1 }));
  }, [quizResults]);

  const competitionTitle = selectedCompetitionId
    ? competitions.find((competition) => competition._id === selectedCompetitionId)?.title || 'Selected competition'
    : 'Selected competition';

  const selectedQuizTitle = quizzesList.find((quiz) => quiz._id === selectedQuizIdForStats)?.title || 'Selected quiz';

  const downloadBulkTemplate = () => {
    const headers = [
      'Question',
      'Option A',
      'Option B',
      'Option C',
      'Option D',
      'Correct Answer',
      'Explanation',
      'Marks',
      'Negative Marks',
      'Difficulty',
      'Subject',
      'Topic',
      'Question Type'
    ];
    const sample = [
      'Which data structure follows LIFO?',
      'Queue',
      'Stack',
      'Graph',
      'Tree',
      'B',
      'Stack follows LIFO.',
      '1',
      '0.25',
      'Easy',
      'DSA',
      'Stack',
      'MCQ'
    ];
    const workbook = utils.book_new();
    const worksheet = utils.aoa_to_sheet([headers, sample]);
    utils.book_append_sheet(workbook, worksheet, 'Template');
    const wbout = write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'smartprep-bulk-import-template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadStudentImportTemplate = () => {
    const headers = ['name', 'email', 'studentId', 'password'];
    const sample = ['John Doe', 'john.doe@college.edu', 'CE2025001', 'Password123'];
    const workbook = utils.book_new();
    const worksheet = utils.aoa_to_sheet([headers, sample]);
    utils.book_append_sheet(workbook, worksheet, 'Template');
    const wbout = write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'smartprep-student-import-template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadFacultyImportTemplate = () => {
    const headers = ['name', 'email', 'password'];
    const sample = ['Dr. Anita Sharma', 'anita.sharma@college.edu', 'FacultyPass123'];
    const workbook = utils.book_new();
    const worksheet = utils.aoa_to_sheet([headers, sample]);
    utils.book_append_sheet(workbook, worksheet, 'Template');
    const wbout = write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'smartprep-faculty-import-template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkFileSelection = (file) => {
    setBulkImportFile(file);
    setBulkImportErrors([]);
    setBulkImportPreview([]);
    setBulkImportReadyCount(0);
    setBulkImportStatus('idle');
    setBulkImportProgress(0);
    setBulkImportSuccess(null);
  };

  const handleBulkFileInput = (event) => {
    const file = event.target.files?.[0];
    if (file) handleBulkFileSelection(file);
  };

  const handleBulkDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) handleBulkFileSelection(file);
  };

  const handleBulkValidate = async () => {
    const errors = [];
    if (!bulkImportFile) {
      errors.push('Please select an Excel file to validate.');
    } else {
      const name = bulkImportFile.name.toLowerCase();
      if (!name.endsWith('.xlsx')) {
        errors.push('File must be an .xlsx document.');
      }
      if (bulkImportFile.size > 10 * 1024 * 1024) {
        errors.push('File must be smaller than 10 MB.');
      }
    }

    if (errors.length) {
      setBulkImportErrors(errors);
      return;
    }

    try {
      const data = await bulkImportFile.arrayBuffer();
      const workbook = read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const rawRows = utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (rawRows.length < 2) {
        setBulkImportErrors(['The Excel file must contain headers and at least one question row.']);
        return;
      }

      const headers = rawRows[0].map((header) => normalizeHeader(header));
      const requiredHeaders = [
        'question',
        'option a',
        'option b',
        'option c',
        'option d',
        'correct answer',
        'explanation',
        'marks',
        'negative marks',
        'difficulty',
        'subject',
        'topic',
        'question type'
      ];

      const missing = requiredHeaders.filter((header) => !headers.includes(header));
      if (missing.length) {
        setBulkImportErrors([`Missing required columns: ${missing.join(', ')}`]);
        return;
      }

      const headerIndex = headers.reduce((acc, header, index) => {
        acc[header] = index;
        return acc;
      }, {});

      const parsedQuestions = [];
      const previewRows = [];
      const rowErrors = [];

      rawRows.slice(1).forEach((row, rowIndex) => {
        const rowNum = rowIndex + 2;
        const question = row[headerIndex['question']]?.toString().trim();
        const optionA = row[headerIndex['option a']]?.toString().trim();
        const optionB = row[headerIndex['option b']]?.toString().trim();
        const optionC = row[headerIndex['option c']]?.toString().trim();
        const optionD = row[headerIndex['option d']]?.toString().trim();
        const correctAnswerRaw = row[headerIndex['correct answer']]?.toString().trim();
        const correctAnswerValue = correctAnswerRaw?.toUpperCase();
        const explanation = row[headerIndex['explanation']]?.toString().trim();
        const marks = row[headerIndex['marks']]?.toString().trim();
        const difficulty = row[headerIndex['difficulty']]?.toString().trim();
        const subject = row[headerIndex['subject']]?.toString().trim();
        const topic = row[headerIndex['topic']]?.toString().trim();
        const questionType = row[headerIndex['question type']]?.toString().trim();

        if (!question) {
          rowErrors.push(`Row ${rowNum}: Question is empty`);
        }
        if (!optionA) rowErrors.push(`Row ${rowNum}: Option A is missing`);
        if (!optionB) rowErrors.push(`Row ${rowNum}: Option B is missing`);
        if (!optionC) rowErrors.push(`Row ${rowNum}: Option C is missing`);
        if (!optionD) rowErrors.push(`Row ${rowNum}: Option D is missing`);
        const correctAnswer = ['A', 'B', 'C', 'D'].includes(correctAnswerValue)
          ? correctAnswerValue
          : ['1', '2', '3', '4'].includes(correctAnswerRaw)
            ? ['A', 'B', 'C', 'D'][Number(correctAnswerRaw) - 1]
            : '';

        if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
          rowErrors.push(`Row ${rowNum}: Correct Answer should be A, B, C, D, or 1-4`);
        }
        if (marks === '' || Number.isNaN(Number(marks))) {
          rowErrors.push(`Row ${rowNum}: Marks must be numeric`);
        }
        if (!['Easy', 'Medium', 'Hard'].includes(difficulty)) {
          rowErrors.push(`Row ${rowNum}: Difficulty must be Easy, Medium or Hard`);
        }
        if (!questionType) {
          rowErrors.push(`Row ${rowNum}: Question Type is required`);
        }

        if (question && optionA && optionB && optionC && optionD && ['A', 'B', 'C', 'D'].includes(correctAnswer) && !Number.isNaN(Number(marks)) && ['Easy', 'Medium', 'Hard'].includes(difficulty) && questionType) {
          const correctMap = { A: 0, B: 1, C: 2, D: 3 };
          parsedQuestions.push({
            question,
            options: [optionA, optionB, optionC, optionD],
            correctAnswer: correctMap[correctAnswer],
            explanation,
            marks: Number(marks),
            negativeMarks: Number(row[headerIndex['negative marks']] || 0),
            difficulty,
            subject,
            topic,
            questionType
          });

          previewRows.push({
            question,
            correctAnswer,
            marks,
            difficulty,
            topic,
            questionType
          });
        }
      });

      if (rowErrors.length) {
        setBulkImportErrors(rowErrors);
        setBulkImportQuestions([]);
        setBulkImportPreview([]);
        setBulkImportReadyCount(0);
        return;
      }

      const uniqueQuestions = [];
      const questionTextSet = new Set();
      parsedQuestions.forEach((q) => {
        if (!questionTextSet.has(q.question)) {
          questionTextSet.add(q.question);
          uniqueQuestions.push(q);
        }
      });

      setBulkImportQuestions(uniqueQuestions);
      setBulkImportPreview(previewRows);
      setBulkImportReadyCount(uniqueQuestions.length);
      setBulkImportStatus('validated');
      setBulkImportErrors([]);
      setBulkImportSuccess(null);
    } catch (error) {
      setBulkImportErrors([error.message || 'Failed to read Excel file.']);
    }
  };

  const handleImportQuestions = async () => {
    if (!bulkImportQuestions.length) {
      setBulkImportErrors(['Please validate an Excel file before importing.']);
      return;
    }

    setBulkImportErrors([]);
    setBulkImportStatus('importing');
    setBulkImportProgress(10);
    setBulkImportSuccess(null);

    try {
      const payload = {
        title: bulkImportQuizTitle,
        category: bulkImportCategory,
        difficulty: bulkImportDifficulty,
        description: bulkImportDescription,
        timeLimit: Math.max(60, Number(bulkImportTimeLimit || 10) * 60),
        tags: bulkImportTags.split(',').map((tag) => tag.trim()).filter(Boolean),
        isPublished: bulkImportPublished,
        questions: bulkImportQuestions.map((question) => ({
          question: question.question,
          options: question.options,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation || '',
          topic: question.topic || ''
        }))
      };

      const importCount = payload.questions.length;
      const step = Math.max(1, Math.floor(80 / importCount));
      let progressValue = 10;
      const interval = setInterval(() => {
        progressValue = Math.min(progressValue + step, 90);
        setBulkImportProgress(progressValue);
      }, 150);

      const response = await api.createQuiz(payload);
      clearInterval(interval);
      setBulkImportProgress(100);
      setBulkImportStatus('completed');
      setBulkImportSuccess({ imported: importCount, failed: 0, quizId: response.data._id, quiz: response.data });
      await loadQuizzes();
      handleEditQuiz(response.data);
    } catch (error) {
      setBulkImportStatus('validated');
      setBulkImportErrors([error.message || 'Import failed.']);
      setBulkImportProgress(0);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Sync active tab with URL path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/admin/results')) setActiveTab('results');
    else if (path.includes('/admin/content')) setActiveTab('content');
    else if (path.includes('/admin/quizzes')) setActiveTab('quizzes');
    else if (path.includes('/admin/competitions')) setActiveTab('competitions');
    else if (path.includes('/admin/interviews')) setActiveTab('interviews');
    else if (path.includes('/admin/coding')) setActiveTab('coding');
    else if (path.includes('/admin/users')) setActiveTab('users');
    else if (path.includes('/admin')) setActiveTab('users');
  }, [location.pathname]);

  useEffect(() => {
    if (!isFacultyPanel) return;
    const path = location.pathname;
    const onAllowedRoute =
      path.includes('/admin/quizzes') || path.includes('/admin/competitions') || path.includes('/admin/results');
    if (!onAllowedRoute) {
      navigate('/admin/quizzes', { replace: true });
      setActiveTab('quizzes');
    }
  }, [location.pathname, isFacultyPanel, navigate]);

  // Fetch Theory when content tab is active
  useEffect(() => {
    const fetchTheory = async () => {
      if (activeTab !== 'content') return;
      try {
        setTheoryLoading(true);
        setTheoryError('');
        const res = await api.listTheory();
        const docs = Array.isArray(res) ? res : (res.data || []);
        setTheoryDocs(docs);
      } catch (e) {
        setTheoryError(e.message || 'Failed to load theory');
      } finally {
        setTheoryLoading(false);
      }
    };
    fetchTheory();
  }, [activeTab]);

  const uploadToCloudinary = async (files) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    if (!cloudName || !uploadPreset) {
      throw new Error('Missing Cloudinary config. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET');
    }
    const urls = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Cloudinary upload failed: ${text}`);
      }
      const data = await res.json();
      urls.push(data.secure_url || data.url);
    }
    return urls;
  };

  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [editingUserForm, setEditingUserForm] = useState(null);
  const [savingUser, setSavingUser] = useState(false);
  const [facultyForm, setFacultyForm] = useState({ name: '', email: '', password: '' });
  const [creatingFaculty, setCreatingFaculty] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userDepartmentFilter, setUserDepartmentFilter] = useState('all');
  const [userYearFilter, setUserYearFilter] = useState('all');
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    department: '',
    year: '',
    class: '',
    division: '',
    domain: ''
  });
  const [creatingStudent, setCreatingStudent] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  const classOptionsByDepartment = {
    CE: ['CE1', 'CE2', 'CE3', 'CE4'],
    CSE: ['CSE1', 'CSE2', 'CSE3', 'CSE4'],
    IT: ['IT1', 'IT2', 'IT3', 'IT4'],
  };
  const availableClassOptions = studentForm.department
    ? classOptionsByDepartment[studentForm.department] || []
    : ['CE1', 'CE2', 'CE3', 'CE4', 'CSE1', 'CSE2', 'CSE3', 'CSE4', 'IT1', 'IT2', 'IT3', 'IT4'];
  const editAvailableClassOptions = editingUserForm?.department
    ? classOptionsByDepartment[editingUserForm.department] || []
    : ['CE1', 'CE2', 'CE3', 'CE4', 'CSE1', 'CSE2', 'CSE3', 'CSE4', 'IT1', 'IT2', 'IT3', 'IT4'];
  const [showStudentCreator, setShowStudentCreator] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDrawerOpen, setStudentDrawerOpen] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentStatusFilter, setStudentStatusFilter] = useState('all');
  const [studentDomainFilter, setStudentDomainFilter] = useState('all');
  const [studentImportFile, setStudentImportFile] = useState(null);
  const [studentImportPreview, setStudentImportPreview] = useState([]);
  const [studentImportLoading, setStudentImportLoading] = useState(false);
  const [studentImportError, setStudentImportError] = useState('');
  const [studentImportSuccess, setStudentImportSuccess] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkEditSaving, setBulkEditSaving] = useState(false);
  const [bulkEditForm, setBulkEditForm] = useState({ year: '', class: '', division: '', domain: '' });
  const STUDENT_PAGE_SIZE = 8;

  const normalizeValue = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');
  const normalizeValueForMatch = (value) => normalizeValue(value).toLowerCase();
  const studentUsers = (usersList.filter((user) => user.role === 'student') || []);
  const competitionEligibleClassOptions = Array.from(
    new Set(
      studentUsers
        .filter((student) => {
          if (!competitionForm.eligibleDepartment) return Boolean(student.profile?.class);
          return normalizeValueForMatch(student.profile?.department) === normalizeValueForMatch(competitionForm.eligibleDepartment);
        })
        .map((student) => student.profile?.class)
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  useEffect(() => {
    const fetchUsers = async () => {
      if (activeTab !== 'users' && activeTab !== 'competitions') return;
      try {
        setUsersLoading(true);
        setUsersError('');
        const res = await api.getAllUsers(1, 200);
        // backend returns { success, data: { users, pagination } }
        const list = res.data?.users || [];
        setUsersList(list);
      } catch (e) {
        setUsersError(e.message || 'Failed to load users');
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, [activeTab]);

  useEffect(() => {
    if (competitionForm.eligibilityMode === 'departmentYearClass' && competitionForm.eligibleClass && !competitionEligibleClassOptions.includes(competitionForm.eligibleClass)) {
      setCompetitionForm((prev) => ({ ...prev, eligibleClass: '' }));
    }
  }, [competitionForm.eligibilityMode, competitionForm.eligibleClass, competitionForm.eligibleDepartment, competitionEligibleClassOptions]);

  useEffect(() => {
    if (activeTab === 'quizzes') {
      loadQuizzes();
    }

    if (activeTab === 'competitions') {
      loadCompetitions();
      loadQuizzes();
    }

    if (activeTab === 'results') {
      loadCompetitions();
      loadQuizzes();
      if (selectedCompetitionId) {
        loadCandidateResults(selectedCompetitionId);
      }
    }
  }, [activeTab, loadCompetitions, loadCandidateResults, selectedCompetitionId, loadQuizzes]);

  // Load interview questions
  const loadInterviewQuestions = useCallback(async () => {
    try {
      setInterviewLoading(true);
      setInterviewError('');
      const res = await api.listInterviewQuestions({ includeUnpublished: true });
      setInterviewQuestions(res.data || []);
    } catch (error) {
      setInterviewError(error.message || 'Failed to load interview questions');
    } finally {
      setInterviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'interviews') {
      loadInterviewQuestions();
    }
  }, [activeTab, loadInterviewQuestions]);

  // Load coding problems
  const loadCodingProblems = useCallback(async () => {
    try {
      setCodingLoading(true);
      setCodingError('');
      const res = await api.getCodingProblems({ limit: 100 });
      setCodingProblems(res.data?.problems || []);
    } catch (error) {
      setCodingError(error.message || 'Failed to load coding problems');
    } finally {
      setCodingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'coding') {
      loadCodingProblems();
    }
  }, [activeTab, loadCodingProblems]);

  // Interview question handlers
  const resetInterviewForm = () => {
    setInterviewForm({
      question: '',
      answer: '',
      category: 'HR',
      subcategory: '',
      difficulty: 'Medium',
      tags: '',
      tips: '',
      examples: ''
    });
    setInterviewEditingId(null);
  };

  const handleEditInterviewQuestion = (question) => {
    setInterviewEditingId(question._id);
    setInterviewForm({
      question: question.question || '',
      answer: question.answer || '',
      category: question.category || 'HR',
      subcategory: question.subcategory || '',
      difficulty: question.difficulty || 'Medium',
      tags: question.tags?.join(', ') || '',
      tips: question.tips || '',
      examples: question.examples || ''
    });
    document.querySelector('[data-interview-form]')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSaveInterviewQuestion = async () => {
    if (!interviewForm.question.trim() || !interviewForm.answer.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Question and answer are required',
        variant: 'destructive'
      });
      return;
    }

    try {
      setInterviewSaving(true);
      const questionData = {
        question: interviewForm.question.trim(),
        answer: interviewForm.answer.trim(),
        category: interviewForm.category,
        subcategory: interviewForm.subcategory.trim(),
        difficulty: interviewForm.difficulty,
        tags: interviewForm.tags.split(',').map(t => t.trim()).filter(t => t),
        tips: interviewForm.tips.trim(),
        examples: interviewForm.examples.trim()
      };

      if (interviewEditingId) {
        await api.updateInterviewQuestion(interviewEditingId, questionData);
        toast({ title: 'Updated', description: 'Interview question updated successfully.' });
      } else {
        await api.createInterviewQuestion(questionData);
        toast({ title: 'Created', description: 'Interview question created successfully.' });
      }

      resetInterviewForm();
      await loadInterviewQuestions();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save interview question',
        variant: 'destructive'
      });
    } finally {
      setInterviewSaving(false);
    }
  };

  const handleDeleteInterviewQuestion = async (questionId) => {
    if (!confirm('Are you sure you want to delete this interview question?')) return;
    try {
      await api.deleteInterviewQuestion(questionId);
      toast({ title: 'Deleted', description: 'Interview question deleted successfully.' });
      await loadInterviewQuestions();
      if (interviewEditingId === questionId) {
        resetInterviewForm();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete interview question',
        variant: 'destructive'
      });
    }
  };

  // Coding Problems handlers
  const resetCodingForm = () => {
    setCodingForm({
      title: '',
      description: '',
      category: 'Arrays',
      difficulty: 'Easy',
      examples: [{ input: '', output: '', explanation: '' }],
      constraints: [''],
      testCases: [{ input: '', expectedOutput: '' }],
      hints: [''],
      solution: '',
      starterCode: {
        javascript: '',
        python: '',
        java: '',
        cpp: ''
      },
      timeLimit: 1000,
      memoryLimit: 128
    });
    setCodingEditingId(null);
  };

  const handleEditCodingProblem = (problem) => {
    setCodingEditingId(problem._id);
    setCodingForm({
      title: problem.title || '',
      description: problem.description || '',
      category: problem.category || 'Arrays',
      difficulty: problem.difficulty || 'Easy',
      examples: problem.examples && problem.examples.length > 0 
        ? problem.examples 
        : [{ input: '', output: '', explanation: '' }],
      constraints: problem.constraints && problem.constraints.length > 0 
        ? problem.constraints 
        : [''],
      testCases: problem.testCases && problem.testCases.length > 0 
        ? problem.testCases.map(tc => ({ input: tc.input || '', expectedOutput: tc.expectedOutput || '' }))
        : [{ input: '', expectedOutput: '' }],
      hints: problem.hints && problem.hints.length > 0 
        ? problem.hints 
        : [''],
      solution: problem.solution || '',
      starterCode: problem.starterCode && typeof problem.starterCode === 'object'
        ? {
            javascript: problem.starterCode.javascript || problem.starterCode.get?.('javascript') || '',
            python: problem.starterCode.python || problem.starterCode.get?.('python') || '',
            java: problem.starterCode.java || problem.starterCode.get?.('java') || '',
            cpp: problem.starterCode.cpp || problem.starterCode.get?.('cpp') || ''
          }
        : {
            javascript: '',
            python: '',
            java: '',
            cpp: ''
          },
      timeLimit: problem.timeLimit || 1000,
      memoryLimit: problem.memoryLimit || 128
    });
    document.querySelector('[data-coding-form]')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSaveCodingProblem = async () => {
    if (!codingForm.title.trim() || !codingForm.description.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Title and description are required',
        variant: 'destructive'
      });
      return;
    }

    if (!codingForm.testCases || codingForm.testCases.length === 0 || 
        !codingForm.testCases[0].input.trim() || !codingForm.testCases[0].expectedOutput.trim()) {
      toast({
        title: 'Validation Error',
        description: 'At least one test case with input and expected output is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      setCodingSaving(true);
      const problemData = {
        title: codingForm.title.trim(),
        description: codingForm.description.trim(),
        category: codingForm.category,
        difficulty: codingForm.difficulty,
        examples: codingForm.examples.filter(ex => ex.input.trim() || ex.output.trim()),
        constraints: codingForm.constraints.filter(c => c.trim()),
        testCases: codingForm.testCases.filter(tc => tc.input.trim() && tc.expectedOutput.trim()),
        hints: codingForm.hints.filter(h => h.trim()),
        solution: codingForm.solution.trim(),
        starterCode: codingForm.starterCode,
        timeLimit: codingForm.timeLimit,
        memoryLimit: codingForm.memoryLimit,
        isActive: true
      };

      if (codingEditingId) {
        await api.updateCodingProblem(codingEditingId, problemData);
        toast({ title: 'Updated', description: 'Coding problem updated successfully.' });
      } else {
        await api.createCodingProblem(problemData);
        toast({ title: 'Created', description: 'Coding problem created successfully.' });
      }

      resetCodingForm();
      await loadCodingProblems();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save coding problem',
        variant: 'destructive'
      });
    } finally {
      setCodingSaving(false);
    }
  };

  const handleDeleteCodingProblem = async (problemId) => {
    if (!confirm('Are you sure you want to delete this coding problem?')) return;
    try {
      await api.deleteCodingProblem(problemId);
      toast({ title: 'Deleted', description: 'Coding problem deleted successfully.' });
      await loadCodingProblems();
      if (codingEditingId === problemId) {
        resetCodingForm();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete coding problem',
        variant: 'destructive'
      });
    }
  };

  const resetQuizForm = () => {
    setQuizForm({ ...initialQuizForm });
    setQuizQuestions([createEmptyQuizQuestion()]);
    setQuizEditingId(null);
  };

  const handleQuestionTextChange = (index, value) => {
    setQuizQuestions(prev =>
      prev.map((question, i) => (i === index ? { ...question, question: value } : question))
    );
  };

  const handleOptionChange = (questionIndex, optionIndex, value) => {
    setQuizQuestions(prev =>
      prev.map((question, i) => {
        if (i !== questionIndex) return question;
        const options = [...question.options];
        options[optionIndex] = value;
        return { ...question, options };
      })
    );
  };

  const handleCorrectAnswerChange = (questionIndex, value) => {
    setQuizQuestions(prev =>
      prev.map((question, i) =>
        i === questionIndex ? { ...question, correctAnswer: Number(value) } : question
      )
    );
  };

  const handleExplanationChange = (index, value) => {
    setQuizQuestions(prev =>
      prev.map((question, i) => (i === index ? { ...question, explanation: value } : question))
    );
  };

  const addQuizQuestion = () => {
    setQuizQuestions(prev => [...prev, createEmptyQuizQuestion()]);
  };

  const removeQuizQuestion = (index) => {
    setQuizQuestions(prev => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleEditQuiz = (quiz) => {
    setQuizEditingId(quiz._id);
    setQuizForm({
      title: quiz.title || '',
      category: quiz.category || '',
      difficulty: quiz.difficulty || 'Medium',
      timeLimitMinutes: Math.max(1, Math.round((quiz.timeLimit || 600) / 60)),
      description: quiz.description || '',
      tags: Array.isArray(quiz.tags) ? quiz.tags.join(', ') : '',
      isPublished: quiz.isPublished !== undefined ? quiz.isPublished : true
    });

    if (Array.isArray(quiz.questions) && quiz.questions.length > 0) {
      setQuizQuestions(
        quiz.questions.map((question) => {
          const options = Array.isArray(question.options)
            ? [...question.options, '', '', '', ''].slice(0, 4).map(opt => opt || '')
            : ['', '', '', ''];
          const correctAnswer = typeof question.correctAnswer === 'number' &&
            question.correctAnswer >= 0 &&
            question.correctAnswer < options.length
              ? question.correctAnswer
              : 0;
          return {
            question: question.question || '',
            options,
            correctAnswer,
            explanation: question.explanation || '',
            topic: question.topic || '',
            marks: question.marks || '',
            negativeMarks: question.negativeMarks || '',
            difficulty: question.difficulty || 'Medium',
            subject: question.subject || '',
            questionType: question.questionType || 'MCQ'
          };
        })
      );
    } else {
      setQuizQuestions([createEmptyQuizQuestion()]);
    }

    document.querySelector('[data-quiz-form]')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    try {
      await api.deleteQuiz(quizId);
      toast({ title: 'Deleted', description: 'Quiz deleted successfully.' });
      await loadQuizzes();
      if (quizEditingId === quizId) {
        resetQuizForm();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete quiz',
        variant: 'destructive'
      });
    }
  };

  const handleSaveQuiz = async () => {
    try {
      if (!quizForm.title.trim() || !quizForm.category.trim()) {
        toast({
          title: 'Validation Error',
          description: 'Quiz topic and subject are required',
          variant: 'destructive'
        });
        return;
      }

      const invalidQuestionIndex = quizQuestions.findIndex(question => {
        const hasEmptyOption = question.options.some(option => !option || !option.trim());
        return (
          !question.question.trim() ||
          hasEmptyOption ||
          typeof question.correctAnswer !== 'number' ||
          question.correctAnswer < 0 ||
          question.correctAnswer > 3
        );
      });

      if (invalidQuestionIndex !== -1) {
        toast({
          title: 'Validation Error',
          description: `Please complete all fields for question ${invalidQuestionIndex + 1}`,
          variant: 'destructive'
        });
        return;
      }

      const normalizedQuestions = quizQuestions.map(question => ({
        question: question.question.trim(),
        options: question.options.map(option => option.trim()),
        correctAnswer: question.correctAnswer,
        explanation: question.explanation.trim()
      }));

      const tags = quizForm.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean);

      const timeLimitSeconds = Math.max(60, Number(quizForm.timeLimitMinutes || 0) * 60);

      const payload = {
        title: quizForm.title.trim(),
        category: quizForm.category.trim(),
        difficulty: quizForm.difficulty,
        description: quizForm.description.trim(),
        timeLimit: timeLimitSeconds,
        tags,
        isPublished: quizForm.isPublished,
        questions: normalizedQuestions
      };

      setQuizSaving(true);
      if (quizEditingId) {
        await api.updateQuiz(quizEditingId, payload);
        toast({ title: 'Updated', description: 'Quiz updated successfully.' });
      } else {
        await api.createQuiz(payload);
        toast({ title: 'Created', description: 'Quiz created successfully.' });
      }

      resetQuizForm();
      await loadQuizzes();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save quiz',
        variant: 'destructive'
      });
    } finally {
      setQuizSaving(false);
    }
  };

  const resetCompetitionForm = () => {
    setCompetitionForm(getDefaultCompetitionForm());
    setCompetitionEditingId(null);
  };

  const handleEditCompetition = (competition) => {
    const startParts = splitDateTimeForForm(competition.startDate);
    const endParts = splitDateTimeForForm(competition.endDate);
    setCompetitionEditingId(competition._id);
    setCompetitionForm({
      title: competition.title || '',
      description: competition.description || '',
      eligibilityMode: competition.eligibilityMode || 'all',
      eligibleDepartment: competition.eligibleDepartment || '',
      eligibleClass: competition.eligibleClass || '',
      eligibleDomains: Array.isArray(competition.eligibleDomains) ? competition.eligibleDomains.join(', ') : '',
      startDate: startParts.date,
      startHour: startParts.hour || '',
      startMinute: startParts.minute || '',
      startPeriod: startParts.period || 'AM',
      endDate: endParts.date,
      endHour: endParts.hour || '',
      endMinute: endParts.minute || '',
      endPeriod: endParts.period || 'AM',
      durationMinutes: competition.durationMinutes || 60,
      tags: Array.isArray(competition.tags) ? competition.tags.join(', ') : '',
      relatedQuizzes: Array.isArray(competition.relatedQuizzes)
        ? competition.relatedQuizzes.map((quiz) => quiz._id || quiz)
        : [],
      isPublished: competition.isPublished !== undefined ? competition.isPublished : true
    });
    document.querySelector('[data-competition-form]')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSaveCompetition = async () => {
    if (
      !competitionForm.title.trim() ||
      !competitionForm.startDate ||
      !competitionForm.startHour ||
      !competitionForm.startMinute ||
      !competitionForm.startPeriod ||
      !competitionForm.endDate ||
      !competitionForm.endHour ||
      !competitionForm.endMinute ||
      !competitionForm.endPeriod
    ) {
      toast({
        title: 'Validation Error',
        description: 'Title, start date, start time, end date, and end time are required',
        variant: 'destructive'
      });
      return;
    }

    const start = buildCompetitionDateTime(
      competitionForm.startDate,
      competitionForm.startHour,
      competitionForm.startMinute,
      competitionForm.startPeriod
    );
    const end = buildCompetitionDateTime(
      competitionForm.endDate,
      competitionForm.endHour,
      competitionForm.endMinute,
      competitionForm.endPeriod
    );

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      toast({
        title: 'Validation Error',
        description: 'Start date must be before end date',
        variant: 'destructive'
      });
      return;
    }

    try {
      setCompetitionSaving(true);
      const payload = {
        title: competitionForm.title.trim(),
        description: competitionForm.description.trim(),
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        durationMinutes: Number(competitionForm.durationMinutes) || 60,
        tags: competitionForm.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        eligibilityMode: competitionForm.eligibilityMode,
        eligibleDepartment: competitionForm.eligibleDepartment.trim(),
        eligibleClass: competitionForm.eligibleClass.trim(),
        eligibleDomains: competitionForm.eligibleDomains
          .split(',')
          .map((domain) => domain.trim())
          .filter(Boolean),
        relatedQuizzes: competitionForm.relatedQuizzes,
        isPublished: competitionForm.isPublished
      };

      if (competitionEditingId) {
        await api.updateCompetition(competitionEditingId, payload);
        toast({ title: 'Updated', description: 'Competition updated successfully.' });
      } else {
        await api.createCompetition(payload);
        toast({ title: 'Created', description: 'Competition created successfully.' });
      }

      resetCompetitionForm();
      await loadCompetitions();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save competition',
        variant: 'destructive'
      });
    } finally {
      setCompetitionSaving(false);
    }
  };

  const handleDeleteCompetition = async (competitionId) => {
    if (!confirm('Are you sure you want to delete this competition?')) return;
    try {
      await api.deleteCompetition(competitionId);
      toast({ title: 'Deleted', description: 'Competition deleted successfully.' });
      await loadCompetitions();
      if (competitionEditingId === competitionId) {
        resetCompetitionForm();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete competition',
        variant: 'destructive'
      });
    }
  };

  const refreshUsers = async () => {
    const res = await api.getAllUsers(1, 200);
    setUsersList(res.data?.users || []);
  };

  const facultyUsers = (usersList.filter((user) => user.role === 'faculty') || []);

  const normalizedSearch = userSearch.trim().toLowerCase();
  const filteredFacultyUsers = facultyUsers.filter((user) => {
    if (!normalizedSearch) return true;
    return [user.name, user.email].some((value) => (value || '').toLowerCase().includes(normalizedSearch));
  });

  const getStudentProfileValue = (student, key) => normalizeValue(student?.profile?.[key] ?? student?.[key] ?? '');

  const departmentGroups = studentUsers.reduce((acc, student) => {
    const department = getStudentProfileValue(student, 'department') || 'Unassigned';
    const className = getStudentProfileValue(student, 'class') || 'Unassigned';
    const year = getStudentProfileValue(student, 'year') || 'Unassigned';
    if (!acc[department]) {
      acc[department] = { students: [], years: {}, classes: new Set() };
    }
    acc[department].students.push(student);
    acc[department].classes.add(className);
    if (!acc[department].years[year]) {
      acc[department].years[year] = [];
    }
    acc[department].years[year].push(student);
    return acc;
  }, {});

  const departmentOptions = Object.keys(departmentGroups).sort((a, b) => a.localeCompare(b));
  const filteredDepartmentStudents = selectedDepartment
    ? studentUsers.filter((student) => normalizeValueForMatch(getStudentProfileValue(student, 'department')) === normalizeValueForMatch(selectedDepartment))
    : studentUsers;
  const yearOptions = Array.from(new Set(filteredDepartmentStudents.map((student) => getStudentProfileValue(student, 'year') || 'Unassigned'))).sort((a, b) => a.localeCompare(b));
  const filteredYearStudents = selectedYear
    ? filteredDepartmentStudents.filter((student) => normalizeValueForMatch(getStudentProfileValue(student, 'year')) === normalizeValueForMatch(selectedYear))
    : filteredDepartmentStudents;
  const classOptions = Array.from(new Set(filteredYearStudents.map((student) => getStudentProfileValue(student, 'class') || 'Unassigned'))).sort((a, b) => a.localeCompare(b));
  const filteredClassStudents = selectedClass
    ? filteredYearStudents.filter((student) => normalizeValueForMatch(getStudentProfileValue(student, 'class')) === normalizeValueForMatch(selectedClass))
    : filteredYearStudents;

  const visibleStudents = filteredClassStudents.filter((student) => {
    const matchesSearch = !normalizedSearch || [student.name, student.email, getStudentProfileValue(student, 'studentId')].some((value) => normalizeValueForMatch(value).includes(normalizedSearch));
    const matchesStatus = studentStatusFilter === 'all' || (studentStatusFilter === 'active' ? student.isActive !== false : student.isActive === false);
    const domainValues = [student.profile?.domain, student.profile?.skills].flat().filter(Boolean);
    const matchesDomain = studentDomainFilter === 'all' || domainValues.some((value) => normalizeValueForMatch(value).includes(normalizeValueForMatch(studentDomainFilter)));
    const matchesDepartment = !selectedDepartment || normalizeValueForMatch(getStudentProfileValue(student, 'department')) === normalizeValueForMatch(selectedDepartment);
    const matchesYear = !selectedYear || normalizeValueForMatch(getStudentProfileValue(student, 'year')) === normalizeValueForMatch(selectedYear);
    const matchesClass = !selectedClass || normalizeValueForMatch(getStudentProfileValue(student, 'class')) === normalizeValueForMatch(selectedClass);
    return matchesSearch && matchesStatus && matchesDomain && matchesDepartment && matchesYear && matchesClass;
  });

  const pagedStudents = visibleStudents.slice((studentPage - 1) * STUDENT_PAGE_SIZE, studentPage * STUDENT_PAGE_SIZE);
  const studentPageCount = Math.max(1, Math.ceil(visibleStudents.length / STUDENT_PAGE_SIZE));
  const selectedStudents = visibleStudents.filter((student) => selectedStudentIds.includes(student._id));
  const currentPageStudentIds = pagedStudents.map((student) => student._id);

  useEffect(() => {
    if (studentPage > studentPageCount) {
      setStudentPage(studentPageCount);
    }
  }, [studentPage, studentPageCount]);
  const isAllCurrentPageSelected = pagedStudents.length > 0 && currentPageStudentIds.every((id) => selectedStudentIds.includes(id));
  const isSomeCurrentPageSelected = pagedStudents.some((student) => selectedStudentIds.includes(student._id));
  const summaryStats = [
    { label: 'Students', value: studentUsers.length, tone: 'secondary' },
    { label: 'Departments', value: departmentOptions.length, tone: 'primary' },
    { label: 'Classes', value: Array.from(new Set(studentUsers.map((student) => student.profile?.class || 'Unassigned'))).length, tone: 'outline' },
    { label: 'Active Students', value: studentUsers.filter((student) => student.isActive !== false).length, tone: 'outline' },
    { label: 'Inactive Students', value: studentUsers.filter((student) => student.isActive === false).length, tone: 'outline' }
  ];

  const resetStudentHierarchy = () => {
    setSelectedDepartment('');
    setSelectedYear('');
    setSelectedClass('');
    setStudentPage(1);
    setSelectedStudentIds([]);
  };

  const openStudentCreator = () => {
    setStudentForm((prev) => ({
      ...prev,
      department: selectedDepartment || prev.department,
      year: selectedYear || prev.year,
      class: selectedClass || prev.class,
    }));
    setShowStudentCreator(true);
  };

  const openStudentDetails = (student) => {
    setSelectedStudent(student);
    setStudentDrawerOpen(true);
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds((prev) => (prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]));
  };

  const handleBulkDelete = async () => {
    if (!selectedStudents.length) return;
    if (!confirm(`Delete ${selectedStudents.length} selected student${selectedStudents.length > 1 ? 's' : ''}?`)) return;
    try {
      await Promise.all(selectedStudents.map((student) => api.deleteUser(student._id)));
      toast({ title: 'Deleted', description: `Removed ${selectedStudents.length} students successfully.` });
      await refreshUsers();
      setSelectedStudentIds([]);
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Failed to delete selected students', variant: 'destructive' });
    }
  };

  const handleBulkDeactivate = async () => {
    if (!selectedStudents.length) return;
    if (!confirm(`Deactivate ${selectedStudents.length} selected student${selectedStudents.length > 1 ? 's' : ''}?`)) return;
    try {
      await Promise.all(selectedStudents.map((student) => api.deactivateUser(student._id)));
      toast({ title: 'Updated', description: `Deactivated ${selectedStudents.length} students successfully.` });
      await refreshUsers();
      setSelectedStudentIds([]);
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Failed to deactivate selected students', variant: 'destructive' });
    }
  };

  const handleBulkEdit = async () => {
    if (!selectedStudents.length) return;

    const updates = {};
    if (bulkEditForm.year.trim()) updates.year = bulkEditForm.year.trim();
    if (bulkEditForm.class.trim()) updates.class = bulkEditForm.class.trim();
    if (bulkEditForm.division) updates.division = bulkEditForm.division;
    if (bulkEditForm.domain.trim()) updates.domain = bulkEditForm.domain.split(',').map((item) => item.trim()).filter(Boolean);

    if (Object.keys(updates).length === 0) {
      toast({ title: 'Nothing to update', description: 'Enter at least one field to bulk edit.', variant: 'destructive' });
      return;
    }

    try {
      setBulkEditSaving(true);
      await Promise.all(selectedStudents.map((student) => api.updateUserProfile(student._id, updates)));
      toast({ title: 'Updated', description: `Updated ${selectedStudents.length} students successfully.` });
      await refreshUsers();
      setSelectedStudentIds([]);
      setBulkEditOpen(false);
      setBulkEditForm({ year: '', class: '', division: '', domain: '' });
    } catch (error) {
      toast({ title: 'Error', description: error.message || 'Failed to update selected students', variant: 'destructive' });
    } finally {
      setBulkEditSaving(false);
    }
  };

  const handleExportSelected = () => {
    if (!selectedStudents.length) return;
    const workbook = utils.book_new();
    const worksheet = utils.aoa_to_sheet([
      ['Name', 'Email', 'Student ID', 'Department', 'Year', 'Class', 'Domain', 'Status'],
      ...selectedStudents.map((student) => [
        student.name || '',
        student.email || '',
        student.profile?.studentId || '',
        student.profile?.department || '',
        student.profile?.year || '',
        student.profile?.class || '',
        (student.profile?.domain || []).join(', '),
        student.isActive === false ? 'Inactive' : 'Active'
      ])
    ]);
    utils.book_append_sheet(workbook, worksheet, 'Selected Students');
    const wbout = write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'selected-students.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Exported', description: `Prepared ${selectedStudents.length} selected students for download.` });
  };

  const handleStudentImportFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setStudentImportFile(file);
      setStudentImportError('');
      setStudentImportSuccess('');
      const data = await file.arrayBuffer();
      const workbook = read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = utils.sheet_to_json(sheet, { defval: '' });
      const requiredHeaders = ['name', 'email', 'studentid', 'password'];
      const normalizedHeaders = rows[0] ? Object.keys(rows[0]).map((header) => String(header).trim().toLowerCase()) : [];
      const missing = requiredHeaders.filter((header) => !normalizedHeaders.includes(header));
      if (missing.length) {
        throw new Error(`Missing required columns: ${missing.join(', ')}`);
      }
      setStudentImportPreview(rows.slice(0, 5).map((row) => ({
        name: row.name || '',
        email: row.email || '',
        studentId: row.studentid || row.studentId || '',
        password: row.password || ''
      })));
    } catch (error) {
      setStudentImportError(error.message || 'Unable to read the Excel file.');
      setStudentImportPreview([]);
    }
  };

  const handleStudentImport = async () => {
    if (!studentImportFile) {
      setStudentImportError('Please select an Excel file first.');
      return;
    }
    try {
      setStudentImportLoading(true);
      setStudentImportError('');
      setStudentImportSuccess('');
      const data = await studentImportFile.arrayBuffer();
      const workbook = read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = utils.sheet_to_json(sheet, { defval: '' });
      const studentPayloads = rows
        .filter((row) => row.name || row.email || row.studentid || row.studentId)
        .map((row) => ({
          name: String(row.name || '').trim(),
          email: String(row.email || '').trim(),
          password: String(row.password || '').trim(),
          studentId: String(row.studentid || row.studentId || '').trim(),
          department: selectedDepartment || studentForm.department || '',
          year: selectedYear || studentForm.year || '',
          class: selectedClass || studentForm.class || '',
          division: studentForm.division || '',
        }));
      if (!studentPayloads.length) {
        throw new Error('The file does not contain any student rows.');
      }
      for (const payload of studentPayloads) {
        await api.createStudent(payload);
      }
      await refreshUsers();
      setStudentImportSuccess(`Imported ${studentPayloads.length} student${studentPayloads.length > 1 ? 's' : ''} into ${selectedClass || 'the current class'}.`);
      setStudentImportFile(null);
      setStudentImportPreview([]);
    } catch (error) {
      setStudentImportError(error.message || 'Failed to import students.');
    } finally {
      setStudentImportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={() => setUser(null)} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isFacultyPanel ? 'Faculty Panel' : 'Admin Panel'}
          </h1>
          <p className="text-muted-foreground">
            {isFacultyPanel
              ? 'Manage quizzes and competitions'
              : 'Manage users, content, and quizzes'}
          </p>
        </div>

        {activeTab === 'users' && (
          <>
            <Card className="mb-6 border-primary/20 shadow-sm">
              <CardHeader>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" /> Student Management
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Organize students by department, academic year, and class with a scalable admin dashboard.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {summaryStats.map((item) => (
                      <div key={item.label} className="rounded-lg border bg-background px-3 py-2 min-w-[120px] shadow-sm">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</p>
                        <p className="text-lg font-semibold">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr]">
                  <div className="space-y-2">
                    <Label htmlFor="user-search">Search students</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="user-search"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        placeholder="Search by name, email, or student ID"
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-status">Status</Label>
                    <Select value={studentStatusFilter} onValueChange={setStudentStatusFilter}>
                      <SelectTrigger id="student-status">
                        <SelectValue placeholder="All status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-domain">Domain</Label>
                    <Select value={studentDomainFilter} onValueChange={setStudentDomainFilter}>
                      <SelectTrigger id="student-domain">
                        <SelectValue placeholder="All domains" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All domains</SelectItem>
                        {Array.from(new Set(studentUsers.flatMap((student) => [student.profile?.domain, student.profile?.skills].flat().filter(Boolean)).map((value) => value?.toString().trim()).filter(Boolean)) ).sort().map((domain) => (
                          <SelectItem key={domain} value={domain}>{domain}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>Create Faculty Account</CardTitle>
                    <Badge variant="secondary">Quick Add</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Faculty log in with the email and password you set here. They can manage quizzes and competitions only.
                  </p>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="faculty-name">Full name</Label>
                      <Input
                        id="faculty-name"
                        value={facultyForm.name}
                        onChange={(e) => setFacultyForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Faculty name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="faculty-email">Email (login ID)</Label>
                      <Input
                        id="faculty-email"
                        type="email"
                        value={facultyForm.email}
                        onChange={(e) => setFacultyForm((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="faculty@college.edu"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="faculty-password">Password</Label>
                      <Input
                        id="faculty-password"
                        type="password"
                        value={facultyForm.password}
                        onChange={(e) => setFacultyForm((prev) => ({ ...prev, password: e.target.value }))}
                        placeholder="Min. 6 characters"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button
                      disabled={creatingFaculty}
                      onClick={async () => {
                        const { name, email, password } = facultyForm;
                        if (!name?.trim() || !email?.trim() || !password) {
                          toast({
                            title: 'Validation Error',
                            description: 'Name, email, and password are required',
                            variant: 'destructive',
                          });
                          return;
                        }
                        if (password.length < 6) {
                          toast({
                            title: 'Validation Error',
                            description: 'Password must be at least 6 characters',
                            variant: 'destructive',
                          });
                          return;
                        }
                        try {
                          setCreatingFaculty(true);
                          await api.createFaculty({
                            name: name.trim(),
                            email: email.trim(),
                            password,
                          });
                          toast({
                            title: 'Success',
                            description: 'Faculty account created successfully',
                          });
                          setFacultyForm({ name: '', email: '', password: '' });
                          await refreshUsers();
                        } catch (error) {
                          toast({
                            title: 'Error',
                            description: error.message || 'Failed to create faculty account',
                            variant: 'destructive',
                          });
                        } finally {
                          setCreatingFaculty(false);
                        }
                      }}
                    >
                      {creatingFaculty ? 'Creating...' : 'Create Faculty'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle>Import Templates</CardTitle>
                    <Badge variant="outline">Faculty / Student</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Download ready-made Excel templates for importing faculty and student accounts.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Card className="border border-border bg-background shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">Faculty Import</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">Use this file to bulk import faculty accounts with name, email, and password.</p>
                        <Button variant="outline" onClick={downloadFacultyImportTemplate} className="w-full gap-2">
                          <Download className="h-4 w-4" /> Download Faculty Template
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border border-border bg-background shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">Student Import</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground">Use this file to bulk import student accounts with department, class, and login details.</p>
                        <Button variant="outline" onClick={downloadStudentImportTemplate} className="w-full gap-2">
                          <Download className="h-4 w-4" /> Download Student Template
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> Departments</CardTitle>
                      <p className="text-sm text-muted-foreground">Open a department to view its academic years and classes.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={resetStudentHierarchy} className="gap-2"><LayoutGrid className="h-4 w-4" /> Reset</Button>
                      <Button onClick={openStudentCreator} className="gap-2"><Plus className="h-4 w-4" /> Add Student</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {usersLoading && <p className="text-sm text-muted-foreground">Loading student hierarchy...</p>}
                  {usersError && <p className="text-sm text-red-600">{usersError}</p>}
                  {!usersLoading && !usersError && (
                    <div className="space-y-4">
                      {!selectedDepartment && !selectedYear && !selectedClass && (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {departmentOptions.length === 0 && <p className="text-sm text-muted-foreground">No departments available yet.</p>}
                          {departmentOptions.map((department) => {
                            const deptStudents = departmentGroups[department]?.students || [];
                            const years = Object.keys(departmentGroups[department]?.years || {}).length;
                            const classes = departmentGroups[department]?.classes?.size || 0;
                            return (
                              <div key={department} className="rounded-2xl border bg-background p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-primary">{department}</p>
                                    <h3 className="mt-1 text-xl font-semibold">{department}</h3>
                                  </div>
                                  <Badge variant="secondary">{deptStudents.length} students</Badge>
                                </div>
                                <div className="mt-4 grid gap-2 text-sm text-muted-foreground">
                                  <div className="flex items-center justify-between"><span>Years</span><span>{years}</span></div>
                                  <div className="flex items-center justify-between"><span>Classes</span><span>{classes}</span></div>
                                  <div className="flex items-center justify-between"><span>Active</span><span>{deptStudents.filter((student) => student.isActive !== false).length}</span></div>
                                </div>
                                <Button className="mt-5 w-full" onClick={() => { setSelectedDepartment(department); setSelectedYear(''); setSelectedClass(''); setStudentPage(1); }}>Open Department</Button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {selectedDepartment && !selectedYear && !selectedClass && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedDepartment(''); setSelectedYear(''); setSelectedClass(''); setStudentPage(1); }} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back to Departments</Button>
                            <ChevronRight className="h-4 w-4" />
                            <span className="font-medium text-foreground">{selectedDepartment}</span>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {Object.keys(departmentGroups[selectedDepartment]?.years || {}).sort((a, b) => a.localeCompare(b)).map((year) => {
                              const yearStudents = departmentGroups[selectedDepartment].years[year] || [];
                              return (
                                <div key={year} className="rounded-2xl border bg-background p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-primary">Academic Year</p>
                                      <h3 className="mt-1 text-xl font-semibold">Year {year}</h3>
                                    </div>
                                    <Badge variant="outline">{yearStudents.length}</Badge>
                                  </div>
                                  <Button className="mt-5 w-full" onClick={() => { setSelectedYear(year); setSelectedClass(''); setStudentPage(1); }}>Open Year</Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {selectedDepartment && selectedYear && !selectedClass && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedDepartment(selectedDepartment); setSelectedYear(''); setSelectedClass(''); setStudentPage(1); }} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back to Year List</Button>
                            <ChevronRight className="h-4 w-4" />
                            <span className="font-medium text-foreground">{selectedDepartment}</span>
                            <ChevronRight className="h-4 w-4" />
                            <span className="font-medium text-foreground">Year {selectedYear}</span>
                          </div>
                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {classOptions.map((className) => {
                              const classStudents = filteredYearStudents.filter((student) => (student.profile?.class || 'Unassigned') === className);
                              return (
                                <div key={className} className="rounded-2xl border bg-background p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-primary">Class</p>
                                      <h3 className="mt-1 text-xl font-semibold">{className}</h3>
                                    </div>
                                    <Badge variant="outline">{classStudents.length}</Badge>
                                  </div>
                                  <Button className="mt-5 w-full" onClick={() => { setSelectedClass(className); setStudentPage(1); }}>Open Class</Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {selectedDepartment && selectedYear && selectedClass && (
                        <div className="space-y-4">
                          <div className="flex items-center flex-wrap gap-2 text-sm text-muted-foreground">
                            <Button variant="ghost" size="sm" onClick={() => { setSelectedClass(''); setStudentPage(1); }} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back to Classes</Button>
                            <ChevronRight className="h-4 w-4" />
                            <span className="font-medium text-foreground">{selectedDepartment}</span>
                            <ChevronRight className="h-4 w-4" />
                            <span className="font-medium text-foreground">Year {selectedYear}</span>
                            <ChevronRight className="h-4 w-4" />
                            <span className="font-medium text-foreground">{selectedClass}</span>
                          </div>

                          <div className="flex flex-col gap-4 rounded-2xl border bg-muted/20 p-4 md:flex-row md:items-center md:justify-between">
                            <div>
                              <h3 className="text-lg font-semibold">{selectedClass}</h3>
                              <p className="text-sm text-muted-foreground">Manage {visibleStudents.length} student{visibleStudents.length === 1 ? '' : 's'} in this class.</p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button variant="outline" onClick={handleBulkDelete} className="gap-2"><Trash2 className="h-4 w-4" /> Delete Selected</Button>
                              <Button variant="outline" onClick={handleBulkDeactivate} className="gap-2"><ShieldCheck className="h-4 w-4" /> Deactivate Selected</Button>
                              <Button variant="outline" onClick={() => { setBulkEditForm({ year: selectedYear || '', class: selectedClass || '', division: '', domain: '' }); setBulkEditOpen(true); }} className="gap-2"><Edit className="h-4 w-4" /> Bulk Edit Selected</Button>
                              <Button variant="outline" onClick={handleExportSelected} className="gap-2"><Download className="h-4 w-4" /> Export Selected</Button>
                            </div>
                          </div>

                          <div className="rounded-2xl border bg-background p-4 shadow-sm">
                                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                  <div className="flex items-center gap-2">
                                    <GraduationCap className="h-5 w-5 text-primary" />
                                    <div>
                                      <p className="font-semibold">Student List</p>
                                      <p className="text-sm text-muted-foreground">Search and manage students inside the selected class.</p>
                                    </div>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <label className="flex cursor-pointer items-center gap-2 rounded-md border bg-background px-3 py-2 text-sm hover:bg-muted">
                                      <FileSpreadsheet className="h-4 w-4" />
                                      <span>Select Excel</span>
                                      <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleStudentImportFileChange} />
                                    </label>
                                    <Button variant="outline" size="sm" onClick={downloadStudentImportTemplate} className="gap-2">
                                      <Download className="h-4 w-4" />
                                      Download Template
                                    </Button>
                                    {studentImportFile && (
                                      <Button variant="secondary" size="sm" onClick={handleStudentImport} className="gap-2" disabled={studentImportLoading}>
                                        <Upload className="h-4 w-4" />
                                        {studentImportLoading ? 'Importing...' : 'Import Students'}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                <div className="overflow-x-auto rounded-xl border">
                                  <table className="min-w-full divide-y divide-border text-sm">
                                    <thead className="bg-muted/40">
                                      <tr>
                                        <th className="px-3 py-3 text-left">
                                          <Checkbox
                                            checked={isAllCurrentPageSelected}
                                            indeterminate={isSomeCurrentPageSelected && !isAllCurrentPageSelected}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                setSelectedStudentIds((prev) => Array.from(new Set([...prev, ...currentPageStudentIds])));
                                              } else {
                                                setSelectedStudentIds((prev) => prev.filter((id) => !currentPageStudentIds.includes(id)));
                                              }
                                            }}
                                          />
                                        </th>
                                        <th className="px-3 py-3 text-left">Profile</th>
                                        <th className="px-3 py-3 text-left">Name</th>
                                        <th className="px-3 py-3 text-left">Student ID</th>
                                        <th className="px-3 py-3 text-left">Email</th>
                                        <th className="px-3 py-3 text-left">Domain</th>
                                        <th className="px-3 py-3 text-left">Status</th>
                                        <th className="px-3 py-3 text-left">Actions</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border bg-background">
                                      {pagedStudents.length === 0 ? (
                                        <tr>
                                          <td colSpan={8} className="px-3 py-10 text-center text-sm text-muted-foreground">
                                            {visibleStudents.length === 0
                                              ? 'No students found in this class. Check the department, year, and class selection.'
                                              : 'No students on this page. Please go back to the first page.'}
                                          </td>
                                        </tr>
                                      ) : pagedStudents.map((student) => (
                                        <tr key={student._id} className="hover:bg-muted/30">
                                          <td className="px-3 py-3"><Checkbox checked={selectedStudentIds.includes(student._id)} onCheckedChange={() => toggleStudentSelection(student._id)} /></td>
                                          <td className="px-3 py-3"><Button variant="ghost" size="icon" onClick={() => openStudentDetails(student)}><Eye className="h-4 w-4" /></Button></td>
                                          <td className="px-3 py-3">
                                            <div>
                                              <p className="font-medium">{student.name}</p>
                                              <p className="text-xs text-muted-foreground">{student.profile?.division || '—'}</p>
                                            </div>
                                          </td>
                                          <td className="px-3 py-3">{student.profile?.studentId || '—'}</td>
                                          <td className="px-3 py-3">{student.email}</td>
                                          <td className="px-3 py-3">{student.profile?.domain?.join(', ') || '—'}</td>
                                          <td className="px-3 py-3"><Badge variant={student.isActive === false ? 'destructive' : 'secondary'}>{student.isActive === false ? 'Inactive' : 'Active'}</Badge></td>
                                          <td className="px-3 py-3">
                                            <div className="flex flex-wrap gap-2">
                                              <Button size="sm" variant="outline" onClick={() => openStudentDetails(student)}><Eye className="h-3 w-3 mr-1" /> View</Button>
                                              <Button size="sm" variant="outline" onClick={() => { setEditingUser(student); setEditingUserForm({ name: student.name, phone: student.profile?.phone || '', college: student.profile?.college || '', branch: student.profile?.branch || '', year: student.profile?.year || '', studentId: student.profile?.studentId || '', department: student.profile?.department || '', class: student.profile?.class || '', division: student.profile?.division || '', domain: student.profile?.domain?.join(', ') || student.profile?.skills?.join(', ') || '', password: '' }); }}><Edit className="h-3 w-3 mr-1" /> Edit</Button>
                                              <Button size="sm" variant="destructive" onClick={async () => { if (!confirm(`Delete ${student.name}?`)) return; try { await api.deleteUser(student._id); toast({ title: 'Deleted', description: 'Student removed.' }); await refreshUsers(); } catch (e) { toast({ title: 'Error', description: e.message || 'Failed to delete student', variant: 'destructive' }); } }}><Trash2 className="h-3 w-3" /></Button>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                  <p className="text-sm text-muted-foreground">Showing {pagedStudents.length} of {visibleStudents.length} students</p>
                                  <div className="flex gap-2">
                                    <Button variant="outline" size="sm" disabled={studentPage === 1} onClick={() => setStudentPage((page) => Math.max(1, page - 1))}>Previous</Button>
                                    <Button variant="outline" size="sm" disabled={studentPage >= studentPageCount} onClick={() => setStudentPage((page) => Math.min(studentPageCount, page + 1))}>Next</Button>
                                  </div>
                                </div>
                              </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Sheet open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
              <SheetContent side="right" className="w-full sm:max-w-xl">
                <SheetHeader>
                  <SheetTitle>Bulk Edit Students</SheetTitle>
                  <SheetDescription>Update the shared academic fields for {selectedStudents.length} selected student{selectedStudents.length === 1 ? '' : 's'}.</SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-5">
                  <div className="rounded-2xl border bg-background p-4">
                    <p className="text-sm text-muted-foreground">Leave any field blank to keep that value unchanged.</p>
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="bulk-year">Academic Year</Label>
                        <Input
                          id="bulk-year"
                          value={bulkEditForm.year}
                          onChange={(e) => setBulkEditForm((prev) => ({ ...prev, year: e.target.value }))}
                          placeholder="e.g. 2024"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bulk-class">Class</Label>
                        <Input
                          id="bulk-class"
                          value={bulkEditForm.class}
                          onChange={(e) => setBulkEditForm((prev) => ({ ...prev, class: e.target.value }))}
                          placeholder="e.g. CSE1"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bulk-division">Division</Label>
                        <Select
                          value={bulkEditForm.division}
                          onValueChange={(value) => setBulkEditForm((prev) => ({ ...prev, division: value }))}
                        >
                          <SelectTrigger id="bulk-division">
                            <SelectValue placeholder="Select division" />
                          </SelectTrigger>
                          <SelectContent>
                            {['A', 'B', 'C', 'D'].map((div) => (
                              <SelectItem key={div} value={div}>{div}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bulk-domain">Domain (comma-separated)</Label>
                        <Input
                          id="bulk-domain"
                          value={bulkEditForm.domain}
                          onChange={(e) => setBulkEditForm((prev) => ({ ...prev, domain: e.target.value }))}
                          placeholder="e.g. Web Development, AI"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setBulkEditOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleBulkEdit} disabled={bulkEditSaving || !selectedStudents.length}>
                      {bulkEditSaving ? 'Updating...' : `Apply to ${selectedStudents.length} Student${selectedStudents.length === 1 ? '' : 's'}`}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Sheet open={showStudentCreator} onOpenChange={setShowStudentCreator}>
              <SheetContent side="right" className="w-full sm:max-w-xl">
                <SheetHeader>
                  <SheetTitle>Add New Student</SheetTitle>
                  <SheetDescription>Create a student account and assign academic details.</SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-5 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
                  <div className="rounded-2xl border bg-background p-4">
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select value={studentForm.department} onValueChange={(value) => setStudentForm((prev) => ({ ...prev, department: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {['CE', 'CSE', 'IT'].map((dept) => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Academic Year</Label>
                      <Input value={studentForm.year} onChange={(e) => setStudentForm((prev) => ({ ...prev, year: e.target.value }))} placeholder="e.g. 1, 2, 3, 4" />
                    </div>

                    <div className="space-y-2">
                      <Label>Class</Label>
                      <Input value={studentForm.class} onChange={(e) => setStudentForm((prev) => ({ ...prev, class: e.target.value }))} placeholder="e.g. CSE1" />
                    </div>

                    <div className="space-y-2">
                      <Label>Division</Label>
                      <Select value={studentForm.division} onValueChange={(value) => setStudentForm((prev) => ({ ...prev, division: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select division" />
                        </SelectTrigger>
                        <SelectContent>
                          {['A', 'B', 'C', 'D'].map((div) => (
                            <SelectItem key={div} value={div}>{div}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Student Name</Label>
                      <Input value={studentForm.name} onChange={(e) => setStudentForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Student name" />
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={studentForm.email} onChange={(e) => setStudentForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="student@college.edu" />
                    </div>

                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input type="password" value={studentForm.password} onChange={(e) => setStudentForm((prev) => ({ ...prev, password: e.target.value }))} placeholder="Min. 6 characters" />
                    </div>

                    <div className="space-y-2">
                      <Label>Student ID</Label>
                      <Input value={studentForm.studentId} onChange={(e) => setStudentForm((prev) => ({ ...prev, studentId: e.target.value }))} placeholder="12345" />
                    </div>

                    <div className="space-y-2">
                      <Label>Domain</Label>
                      <Input value={studentForm.domain} onChange={(e) => setStudentForm((prev) => ({ ...prev, domain: e.target.value }))} placeholder="Web Development, AI" />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowStudentCreator(false)}>
                        Cancel
                      </Button>
                      <Button
                        className="w-full"
                        disabled={creatingStudent}
                        onClick={async () => {
                          if (!studentForm.name?.trim() || !studentForm.email?.trim() || !studentForm.password) {
                            toast({ title: 'Validation Error', description: 'Name, email, and password are required', variant: 'destructive' });
                            return;
                          }
                          if (studentForm.password.length < 6) {
                            toast({ title: 'Validation Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
                            return;
                          }
                          try {
                            setCreatingStudent(true);
                            await api.createStudent({
                              name: studentForm.name.trim(),
                              email: studentForm.email.trim(),
                              password: studentForm.password,
                              studentId: studentForm.studentId.trim(),
                              department: studentForm.department,
                              year: studentForm.year,
                              class: studentForm.class,
                              division: studentForm.division || '',
                              domain: studentForm.domain
                            });
                            toast({ title: 'Success', description: 'Student created successfully.' });
                            setStudentForm((prev) => ({ ...prev, name: '', email: '', password: '', studentId: '', division: '', domain: '' }));
                            setShowStudentCreator(false);
                            await refreshUsers();
                          } catch (error) {
                            toast({ title: 'Error', description: error.message || 'Failed to create student', variant: 'destructive' });
                          } finally {
                            setCreatingStudent(false);
                          }
                        }}
                      >
                        {creatingStudent ? 'Creating...' : 'Create Student'}
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Sheet open={studentDrawerOpen} onOpenChange={setStudentDrawerOpen}>
              <SheetContent side="right" className="w-full sm:max-w-xl">
                <SheetHeader>
                  <SheetTitle>{selectedStudent?.name || 'Student Profile'}</SheetTitle>
                  <SheetDescription>Review academic details and perform quick account actions.</SheetDescription>
                </SheetHeader>
                {selectedStudent && (
                  <div className="mt-6 space-y-5">
                    <div className="rounded-2xl border bg-background p-4">
                      <h3 className="font-semibold">Basic Details</h3>
                      <div className="mt-3 grid gap-3 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span>{selectedStudent.name}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{selectedStudent.email}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Student ID</span><span>{selectedStudent.profile?.studentId || '—'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span>{selectedStudent.profile?.phone || '—'}</span></div>
                      </div>
                    </div>
                    <div className="rounded-2xl border bg-background p-4">
                      <h3 className="font-semibold">Academic Details</h3>
                      <div className="mt-3 grid gap-3 text-sm">
                        <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span>{selectedStudent.profile?.department || '—'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Year</span><span>{selectedStudent.profile?.year || '—'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Class</span><span>{selectedStudent.profile?.class || '—'}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Division</span><span>{selectedStudent.profile?.division || '—'}</span></div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => { setEditingUser(selectedStudent); setEditingUserForm({ name: selectedStudent.name, phone: selectedStudent.profile?.phone || '', college: selectedStudent.profile?.college || '', branch: selectedStudent.profile?.branch || '', year: selectedStudent.profile?.year || '', studentId: selectedStudent.profile?.studentId || '', department: selectedStudent.profile?.department || '', class: selectedStudent.profile?.class || '', division: selectedStudent.profile?.division || '', domain: selectedStudent.profile?.domain?.join(', ') || selectedStudent.profile?.skills?.join(', ') || '', password: '' }); setStudentDrawerOpen(false); }}>Edit</Button>
                      <Button variant="outline" onClick={async () => { if (!confirm('Deactivate this student?')) return; try { await api.deactivateUser(selectedStudent._id); toast({ title: 'Updated', description: 'Student deactivated.' }); setStudentDrawerOpen(false); await refreshUsers(); } catch (error) { toast({ title: 'Error', description: error.message || 'Failed to deactivate student', variant: 'destructive' }); } }}>Deactivate</Button>
                      <Button variant="destructive" onClick={async () => { if (!confirm('Delete this student?')) return; try { await api.deleteUser(selectedStudent._id); toast({ title: 'Deleted', description: 'Student removed.' }); setStudentDrawerOpen(false); await refreshUsers(); } catch (error) { toast({ title: 'Error', description: error.message || 'Failed to delete student', variant: 'destructive' }); } }}>Delete</Button>
                    </div>
                  </div>
                )}
              </SheetContent>
            </Sheet>

            {/* Edit User Modal */}
            {editingUser && editingUserForm && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Edit User: {editingUser.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Name</Label>
                    <Input
                      id="edit-name"
                      value={editingUserForm.name}
                      onChange={(e) => setEditingUserForm({ ...editingUserForm, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input
                      id="edit-phone"
                      value={editingUserForm.phone}
                      onChange={(e) => setEditingUserForm({ ...editingUserForm, phone: e.target.value })}
                    />
                </div>

                {editingUser.role === 'faculty' && (
                  <div className="space-y-2">
                    <Label htmlFor="edit-faculty-password">New password (optional)</Label>
                    <Input
                      id="edit-faculty-password"
                      type="password"
                      value={editingUserForm.password || ''}
                      onChange={(e) => setEditingUserForm({ ...editingUserForm, password: e.target.value })}
                      placeholder="Leave blank to keep current password"
                    />
                  </div>
                )}

                {editingUser.role === 'student' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="edit-studentId">Student ID</Label>
                      <Input
                        id="edit-studentId"
                        value={editingUserForm.studentId}
                        onChange={(e) => setEditingUserForm({ ...editingUserForm, studentId: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-year">Academic Year</Label>
                      <Select 
                        value={editingUserForm.year} 
                        onValueChange={(value) => setEditingUserForm({ ...editingUserForm, year: value })}
                      >
                        <SelectTrigger id="edit-year">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {['1', '2', '3', '4'].map((y) => (
                            <SelectItem key={y} value={y}>{y}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-department">Department</Label>
                      <Select 
                        value={editingUserForm.department} 
                        onValueChange={(value) => setEditingUserForm({ ...editingUserForm, department: value })}
                      >
                        <SelectTrigger id="edit-department">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {['CE', 'CSE', 'IT'].map((d) => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-class">Class</Label>
                      <Input
                        id="edit-class"
                        value={editingUserForm.class}
                        onChange={(e) => setEditingUserForm({ ...editingUserForm, class: e.target.value })}
                        placeholder="e.g. CE-3A"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="edit-division">Division</Label>
                      <Select 
                        value={editingUserForm.division} 
                        onValueChange={(value) => setEditingUserForm({ ...editingUserForm, division: value })}
                      >
                        <SelectTrigger id="edit-division">
                          <SelectValue placeholder="Select division" />
                        </SelectTrigger>
                        <SelectContent>
                          {['A', 'B', 'C', 'D'].map((div) => (
                            <SelectItem key={div} value={div}>{div}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className="space-y-2">
                  <Label htmlFor="edit-domain">Domain (comma-separated)</Label>
                  <Input
                    id="edit-domain"
                    value={editingUserForm.domain}
                    onChange={(e) => setEditingUserForm({ ...editingUserForm, domain: e.target.value })}
                    placeholder="e.g., Web Development, AI"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setEditingUser(null);
                      setEditingUserForm(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={async () => {
                      if (!editingUserForm.name || editingUserForm.name.trim() === '') {
                        toast({
                          title: 'Validation Error',
                          description: 'Name is required',
                          variant: 'destructive'
                        });
                        return;
                      }

                      try {
                        setSavingUser(true);

                        if (editingUser.role === 'faculty' && editingUserForm.password?.trim()) {
                          if (editingUserForm.password.trim().length < 6) {
                            toast({
                              title: 'Validation Error',
                              description: 'Password must be at least 6 characters',
                              variant: 'destructive',
                            });
                            return;
                          }
                        }

                        const profileData = {
                          name: editingUserForm.name,
                          phone: editingUserForm.phone,
                          college: editingUserForm.college,
                          branch: editingUserForm.branch,
                          year: editingUserForm.year,
                          studentId: editingUserForm.studentId,
                          department: editingUserForm.department,
                          class: editingUserForm.class,
                          division: editingUserForm.division,
                          domain: editingUserForm.domain.split(',').map(s => s.trim()).filter(s => s)
                        };

                        const response = await api.updateUserProfile(editingUser._id, profileData);

                        if (editingUser.role === 'faculty' && editingUserForm.password?.trim()) {
                          await api.setUserPassword(editingUser._id, editingUserForm.password.trim());
                        }
                        
                        if (response.success) {
                          toast({
                            title: 'Success',
                            description: 'User profile updated successfully'
                          });
                          
                          // Refresh users list
                          const res = await api.getAllUsers(1, 50);
                          setUsersList(res.data?.users || []);
                          
                          setEditingUser(null);
                          setEditingUserForm(null);
                        } else {
                          const errorMsg = response.error || (response.errors && response.errors.join(', ')) || response.message || 'Failed to update user profile';
                          toast({
                            title: 'Error',
                            description: errorMsg,
                            variant: 'destructive'
                          });
                        }
                      } catch (error) {
                        toast({
                          title: 'Error',
                          description: error.message || 'Failed to update user profile',
                          variant: 'destructive'
                        });
                      } finally {
                        setSavingUser(false);
                      }
                    }}
                    disabled={savingUser}
                  >
                    {savingUser ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
            )}
          </>
        )}

        {activeTab === 'results' && (
          <Card className="border-0 shadow-none">
            <CardHeader className="rounded-2xl border bg-slate-950 px-6 py-6 text-white">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="mb-2 inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
                    Competition Dashboard
                  </div>
                  <CardTitle className="text-2xl font-semibold text-white">Competition Results</CardTitle>
                  <p className="mt-2 max-w-3xl text-sm text-slate-300">
                    Browse placement-style competitions, review live performance metrics, and open analytics for any selected competition.
                  </p>
                </div>
                <div className="w-full max-w-sm">
                  <Label className="text-xs uppercase tracking-[0.2em] text-slate-400">Search Competition</Label>
                  <div className="relative mt-2">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={competitionSearch}
                      onChange={(e) => setCompetitionSearch(e.target.value)}
                      placeholder="Search by competition name"
                      className="border-white/20 bg-white/10 pl-9 text-white placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 px-0 pb-0">
              <div className="grid gap-4 xl:grid-cols-3 lg:grid-cols-2">
                {competitions.filter((competition) => {
                  const query = competitionSearch.trim().toLowerCase();
                  if (!query) return true;
                  const title = (competition.title || '').toLowerCase();
                  const quizTitle = Array.isArray(competition.relatedQuizzes) && competition.relatedQuizzes[0]?.title
                    ? competition.relatedQuizzes[0].title.toLowerCase()
                    : '';
                  return title.includes(query) || quizTitle.includes(query);
                }).map((competition) => {
                  const isSelected = selectedCompetitionId === competition._id;
                  const quizTitle = Array.isArray(competition.relatedQuizzes) && competition.relatedQuizzes[0]?.title
                    ? competition.relatedQuizzes[0].title
                    : 'Multiple quizzes';
                  const createdBy = competition.createdBy
                    ? (typeof competition.createdBy === 'object'
                      ? (competition.createdBy.role === 'admin' ? 'Admin' : competition.createdBy.name || 'Faculty')
                      : competition.createdBy)
                    : 'Faculty';
                  const createdDate = competition.createdAt
                    ? format(new Date(competition.createdAt), 'dd MMM yyyy')
                    : '—';
                  const startTime = competition.startDate
                    ? format(new Date(competition.startDate), 'dd MMM yyyy, HH:mm')
                    : '—';
                  const endTime = competition.endDate
                    ? format(new Date(competition.endDate), 'dd MMM yyyy, HH:mm')
                    : '—';
                  const status = new Date(competition.endDate) < new Date() ? 'Completed' : 'Active';
                  const stats = competitionStats[competition._id] || { appeared: '—', avgScore: '—' };
                  const appearedCount = isSelected && candidateResults.length ? candidateResults.length : stats.appeared;
                  const averageScore = isSelected && candidateResults.length
                    ? `${Math.round(candidateResults.reduce((sum, result) => sum + (result.percentage ?? 0), 0) / candidateResults.length)}%`
                    : (stats.avgScore === '—' ? '—' : `${stats.avgScore}%`);

                  return (
                    <button
                      key={competition._id}
                      type="button"
                      onClick={() => {
                        navigate(`/admin/competition/${competition._id}`);
                      }}
                      className={`rounded-2xl border p-5 text-left transition ${isSelected ? 'border-slate-900 bg-slate-900 text-white shadow-lg' : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${isSelected ? 'bg-white/10 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                          {status === 'Active' ? '🟢 Active' : '🔵 Completed'}
                        </div>
                        <div className={`text-sm ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {isSelected ? 'Selected' : 'View Analytics →'}
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className={`text-lg font-semibold ${isSelected ? 'text-white' : 'text-slate-900'}`}>{competition.title || 'Untitled Competition'}</div>
                        <div className={`text-sm ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                          <span className="font-medium">Quiz:</span> {quizTitle}
                        </div>
                        <div className={`text-sm ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                          <span className="font-medium">Created By:</span> {createdBy}
                        </div>
                        <div className={`text-sm ${isSelected ? 'text-slate-300' : 'text-slate-600'}`}>
                          <span className="font-medium">Created Date:</span> {createdDate}
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className={`rounded-xl border p-3 text-sm ${isSelected ? 'border-white/10 bg-white/10' : 'border-slate-200 bg-slate-50'}`}>
                          <div className={`text-xs uppercase tracking-[0.2em] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>Assigned Students</div>
                          <div className={`mt-1 text-lg font-semibold ${isSelected ? 'text-white' : 'text-slate-900'}`}>500</div>
                        </div>
                        <div className={`rounded-xl border p-3 text-sm ${isSelected ? 'border-white/10 bg-white/10' : 'border-slate-200 bg-slate-50'}`}>
                          <div className={`text-xs uppercase tracking-[0.2em] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>Appeared Students</div>
                          <div className={`mt-1 text-lg font-semibold ${isSelected ? 'text-white' : 'text-slate-900'}`}>{appearedCount}</div>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className={`rounded-xl border p-3 text-sm ${isSelected ? 'border-white/10 bg-white/10' : 'border-slate-200 bg-slate-50'}`}>
                          <div className={`text-xs uppercase tracking-[0.2em] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>Average Score</div>
                          <div className={`mt-1 text-lg font-semibold ${isSelected ? 'text-white' : 'text-slate-900'}`}>{averageScore}</div>
                        </div>
                        <div className={`rounded-xl border p-3 text-sm ${isSelected ? 'border-white/10 bg-white/10' : 'border-slate-200 bg-slate-50'}`}>
                          <div className={`text-xs uppercase tracking-[0.2em] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>Time Window</div>
                          <div className={`mt-1 text-sm ${isSelected ? 'text-slate-200' : 'text-slate-700'}`}>{startTime}</div>
                          <div className={`text-sm ${isSelected ? 'text-slate-200' : 'text-slate-700'}`}>{endTime}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {competitions.length === 0 && !competitionsLoading && (
                <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  No competitions were found for this workspace.
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Selected competition</div>
                    <div className="text-sm text-slate-600">
                      {selectedCompetitionId
                        ? competitions.find((competition) => competition._id === selectedCompetitionId)?.title || 'Loaded analytics for the selected competition.'
                        : 'Choose a competition card to open its analytics view.'}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => downloadCandidateMarksPdf(candidateResults, {
                      reportTitle: competitions.find((competition) => competition._id === selectedCompetitionId)?.title || 'Competition Results',
                      generatedAt: new Date().toLocaleString(),
                    })}
                    disabled={candidateResults.length === 0 || !selectedCompetitionId}
                  >
                    <Download className="mr-2 h-4 w-4" /> Download PDF
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-slate-900">Dashboard Summary</div>
                      <div className="text-sm text-slate-600">
                        <span className="font-medium text-slate-800">Competition:</span> {competitionTitle}
                      </div>
                      <div className="text-sm text-slate-600">
                        <span className="font-medium text-slate-800">Quiz:</span> {selectedQuizTitle}
                      </div>
                    </div>
                    <div className="w-full max-w-xs space-y-2">
                      <Label htmlFor="quiz-stat-select">Select quiz for dashboard</Label>
                      <Select
                        value={selectedQuizIdForStats}
                        onValueChange={(value) => {
                          setSelectedQuizIdForStats(value);
                          loadQuizAttemptStats(value);
                        }}
                      >
                        <SelectTrigger id="quiz-stat-select">
                          <SelectValue placeholder="Select a quiz" />
                        </SelectTrigger>
                        <SelectContent>
                          {quizzesList.map((quiz) => (
                            <SelectItem key={quiz._id} value={quiz._id}>{quiz.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {quizAttemptStatsLoading || quizResultsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading quiz dashboard...</p>
                ) : quizAttemptStatsError ? (
                  <p className="text-sm text-red-600">{quizAttemptStatsError}</p>
                ) : quizAttemptStats ? (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-5 text-white shadow-sm">
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                        <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Students Attempted</div>
                          <div className="mt-2 text-2xl font-semibold">{quizAttemptStats.uniqueStudents}</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Average Score</div>
                          <div className="mt-2 text-2xl font-semibold">{quizAttemptStats.averageScore ?? 0}%</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Highest</div>
                          <div className="mt-2 text-2xl font-semibold">{quizAttemptStats.highestScore ?? 0}%</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Lowest</div>
                          <div className="mt-2 text-2xl font-semibold">{quizAttemptStats.lowestScore ?? 0}%</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Pass Rate</div>
                          <div className="mt-2 text-2xl font-semibold">{quizAttemptStats.passRate ?? 0}%</div>
                        </div>
                        <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                          <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Avg Time</div>
                          <div className="mt-2 text-2xl font-semibold">{formatDurationMinutes(quizAttemptStats.averageTimeMinutes * 60)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Score Distribution</div>
                            <div className="text-sm text-slate-500">A quick view of how challenging this quiz felt.</div>
                          </div>
                        </div>
                        <div className="mt-4 h-72">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={scoreDistributionData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                              <XAxis dataKey="label" tickLine={false} axisLine={false} />
                              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                              <Tooltip />
                              <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="text-sm font-semibold text-slate-900">Quiz Statistics</div>
                          <div className="mt-3 space-y-3 text-sm text-slate-600">
                            <div className="rounded-xl bg-slate-50 p-3">
                              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Attempts</div>
                              <div className="mt-1 text-lg font-semibold text-slate-900">{quizAttemptStats.totalAttempts}</div>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3">
                              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Unique students</div>
                              <div className="mt-1 text-lg font-semibold text-slate-900">{quizAttemptStats.uniqueStudents}</div>
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3">
                              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Average time</div>
                              <div className="mt-1 text-lg font-semibold text-slate-900">{formatDurationMinutes(quizAttemptStats.averageTimeMinutes)}</div>
                            </div>
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="text-sm font-semibold text-slate-900">Question Analysis</div>
                          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                            Use the attempt data to spot the questions that consistently pull the class average down.
                          </div>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                          <div className="text-sm font-semibold text-slate-900">Topic Analysis</div>
                          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                            Review topic-level performance trends and identify the topics that need more revision.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Student Performance Table</div>
                          <div className="text-sm text-slate-500">Ranked by score, accuracy, and response time.</div>
                        </div>
                        <Badge variant="outline" className="w-fit">{rankedQuizResults.length} attempts</Badge>
                      </div>
                      <div className="mt-4 overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                          <thead>
                            <tr className="border-b bg-slate-50 text-left">
                              <th className="px-3 py-2">Rank</th>
                              <th className="px-3 py-2">Student</th>
                              <th className="px-3 py-2">Score</th>
                              <th className="px-3 py-2">Accuracy</th>
                              <th className="px-3 py-2">Time</th>
                              <th className="px-3 py-2">Status</th>
                              <th className="px-3 py-2">Report</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rankedQuizResults.map((result) => {
                              const status = getPerformanceStatus(result.percentage ?? 0);
                              return (
                                <tr key={`${result.attemptId || result.studentId}-${result.name}`} className="border-b">
                                  <td className="px-3 py-2 font-semibold text-slate-700">{result.rank}</td>
                                  <td className="px-3 py-2">{result.name || '—'}</td>
                                  <td className="px-3 py-2">{result.marks ?? 0}/{result.totalMarks ?? 0}</td>
                                  <td className="px-3 py-2">{result.percentage ?? 0}%</td>
                                  <td className="px-3 py-2">{formatDurationMinutes(result.timeTaken ?? 0)}</td>
                                  <td className="px-3 py-2">
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.tone}`}>
                                      {status.label}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2">
                                    <Button variant="outline" size="sm">
                                      <Eye className="mr-2 h-4 w-4" /> View
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Select a quiz to see the dashboard summary.</p>
                )}
              </div>
              {candidateResultsLoading && <p className="text-sm text-muted-foreground">Loading competition results...</p>}
              {candidateResultsError && <p className="text-sm text-red-600">{candidateResultsError}</p>}
            </CardContent>
          </Card>
        )}

        {activeTab === 'content' && (
          <div className="h-[calc(100vh-200px)]">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              {/* Add/Edit Form */}
              <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
                <div className="h-full overflow-y-auto pr-4">
                  <Card data-form-card className="h-full">
            <CardHeader>
                <CardTitle>
                  {editingId ? 'Edit Study Material' : 'Add New Study Material'}
                </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Array Data Structure"
                      value={materialForm.title}
                      onChange={e => setMaterialForm(v => ({ ...v, title: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">Category *</Label>
                    <Select
                      value={materialForm.category}
                      onValueChange={(value) => setMaterialForm(v => ({ ...v, category: value }))}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DSA">DSA</SelectItem>
                        <SelectItem value="OS">Operating Systems</SelectItem>
                        <SelectItem value="DBMS">Database Management</SelectItem>
                        <SelectItem value="Aptitude">Aptitude</SelectItem>
                        <SelectItem value="Programming">Programming</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="difficulty">Difficulty</Label>
                    <Select
                      value={materialForm.difficulty}
                      onValueChange={(value) => setMaterialForm(v => ({ ...v, difficulty: value }))}
                    >
                      <SelectTrigger id="difficulty">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Brief description of the topic"
                      value={materialForm.description}
                      onChange={e => setMaterialForm(v => ({ ...v, description: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="content">Theory Content</Label>
                    <div className="border rounded-md">
                      {/* Formatting Toolbar */}
                      <div className="flex items-center gap-1 p-2 border-b bg-muted/50 flex-wrap">
                        {/* Text Formatting */}
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const textarea = document.getElementById('content');
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;
                              const selectedText = materialForm.content.substring(start, end);
                              const newText = materialForm.content.substring(0, start) +
                                (selectedText ? `**${selectedText}**` : '****') +
                                materialForm.content.substring(end);
                              setMaterialForm(v => ({ ...v, content: newText }));
                              setTimeout(() => {
                                textarea.focus();
                                textarea.setSelectionRange(
                                  start + (selectedText ? 2 : 0),
                                  end + (selectedText ? 2 : 0)
                                );
                              }, 0);
                            }}
                            title="Bold"
                          >
                            <Bold className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const textarea = document.getElementById('content');
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;
                              const selectedText = materialForm.content.substring(start, end);
                              const newText = materialForm.content.substring(0, start) +
                                (selectedText ? `*${selectedText}*` : '**') +
                                materialForm.content.substring(end);
                              setMaterialForm(v => ({ ...v, content: newText }));
                              setTimeout(() => {
                                textarea.focus();
                                textarea.setSelectionRange(
                                  start + (selectedText ? 1 : 0),
                                  end + (selectedText ? 1 : 0)
                                );
                              }, 0);
                            }}
                            title="Italic"
                          >
                            <Italic className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const textarea = document.getElementById('content');
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;
                              const selectedText = materialForm.content.substring(start, end);
                              const newText = materialForm.content.substring(0, start) +
                                (selectedText ? `<u>${selectedText}</u>` : '<u></u>') +
                                materialForm.content.substring(end);
                              setMaterialForm(v => ({ ...v, content: newText }));
                              setTimeout(() => {
                                textarea.focus();
                                textarea.setSelectionRange(
                                  start + (selectedText ? 3 : 0),
                                  end + (selectedText ? 3 : 0)
                                );
                              }, 0);
                            }}
                            title="Underline"
                          >
                            <Underline className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="w-px h-6 bg-border mx-1" />

                        {/* Text Size Controls */}
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const textarea = document.getElementById('content');
                              const start = textarea.selectionStart;
                              const lines = materialForm.content.split('\n');
                              let currentPos = 0;
                              let lineIndex = 0;
                              
                              for (let i = 0; i < lines.length; i++) {
                                if (currentPos + lines[i].length >= start) {
                                  lineIndex = i;
                                  break;
                                }
                                currentPos += lines[i].length + 1;
                              }
                              
                              const line = lines[lineIndex];
                              if (line.startsWith('### ')) {
                                lines[lineIndex] = '## ' + line.substring(4);
                              } else if (line.startsWith('## ')) {
                                lines[lineIndex] = '# ' + line.substring(3);
                              } else if (line.startsWith('# ')) {
                                // Already largest
                              } else {
                                lines[lineIndex] = '# ' + line;
                              }
                              
                              const newContent = lines.join('\n');
                              setMaterialForm(v => ({ ...v, content: newContent }));
                              setTimeout(() => {
                                textarea.focus();
                                const newPos = start + (line.startsWith('#') ? 0 : 2);
                                textarea.setSelectionRange(newPos, newPos);
                              }, 0);
                            }}
                            title="Increase Text Size (Heading)"
                          >
                            <PlusIcon className="h-4 w-4" />
                            <Type className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const textarea = document.getElementById('content');
                              const start = textarea.selectionStart;
                              const lines = materialForm.content.split('\n');
                              let currentPos = 0;
                              let lineIndex = 0;
                              
                              for (let i = 0; i < lines.length; i++) {
                                if (currentPos + lines[i].length >= start) {
                                  lineIndex = i;
                                  break;
                                }
                                currentPos += lines[i].length + 1;
                              }
                              
                              const line = lines[lineIndex];
                              if (line.startsWith('# ')) {
                                lines[lineIndex] = '## ' + line.substring(2);
                              } else if (line.startsWith('## ')) {
                                lines[lineIndex] = '### ' + line.substring(3);
                              } else if (line.startsWith('### ')) {
                                lines[lineIndex] = line.substring(4); // Remove heading
                              } else {
                                // Already normal text
                              }
                              
                              const newContent = lines.join('\n');
                              setMaterialForm(v => ({ ...v, content: newContent }));
                              setTimeout(() => {
                                textarea.focus();
                                const newPos = start - (line.startsWith('#') ? 1 : 0);
                                textarea.setSelectionRange(newPos, newPos);
                              }, 0);
                            }}
                            title="Decrease Text Size"
                          >
                            <Minus className="h-4 w-4" />
                            <Type className="h-3 w-3" />
                          </Button>
                        </div>

                        <div className="w-px h-6 bg-border mx-1" />

                        {/* List and Code */}
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const textarea = document.getElementById('content');
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;
                              const selectedText = materialForm.content.substring(start, end);
                              
                              if (selectedText) {
                                // Wrap selected text in code block
                                const codeBlock = `\`\`\`\n${selectedText}\n\`\`\``;
                                const newText = materialForm.content.substring(0, start) +
                                  codeBlock +
                                  materialForm.content.substring(end);
                                setMaterialForm(v => ({ ...v, content: newText }));
                                setTimeout(() => {
                                  textarea.focus();
                                  textarea.setSelectionRange(start + 4, start + 4 + selectedText.length);
                                }, 0);
                              } else {
                                // Insert empty code block
                                const codeBlock = `\`\`\`\n// Your code here\n\`\`\``;
                                const newText = materialForm.content.substring(0, start) +
                                  codeBlock +
                                  materialForm.content.substring(end);
                                setMaterialForm(v => ({ ...v, content: newText }));
                                setTimeout(() => {
                                  textarea.focus();
                                  const codeStart = start + 4;
                                  const codeEnd = codeStart + 18; // "// Your code here"
                                  textarea.setSelectionRange(codeStart, codeEnd);
                                }, 0);
                              }
                            }}
                            title="Add Code Block"
                          >
                            <Code className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const textarea = document.getElementById('content');
                              const start = textarea.selectionStart;
                              const end = textarea.selectionEnd;
                              const selectedText = materialForm.content.substring(start, end);
                              
                              if (selectedText) {
                                // Wrap selected text in inline code
                                const inlineCode = `\`${selectedText}\``;
                                const newText = materialForm.content.substring(0, start) +
                                  inlineCode +
                                  materialForm.content.substring(end);
                                setMaterialForm(v => ({ ...v, content: newText }));
                                setTimeout(() => {
                                  textarea.focus();
                                  textarea.setSelectionRange(
                                    start + 1,
                                    end + 1
                                  );
                                }, 0);
                              } else {
                                // Insert empty inline code
                                const inlineCode = '``';
                                const newText = materialForm.content.substring(0, start) +
                                  inlineCode +
                                  materialForm.content.substring(end);
                                setMaterialForm(v => ({ ...v, content: newText }));
                                setTimeout(() => {
                                  textarea.focus();
                                  textarea.setSelectionRange(start + 1, start + 1);
                                }, 0);
                              }
                            }}
                            title="Add Inline Code"
                          >
                            <Code className="h-4 w-4" />
                            <span className="text-xs ml-1">inline</span>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const textarea = document.getElementById('content');
                              const start = textarea.selectionStart;
                              const lines = materialForm.content.split('\n');
                              let currentPos = 0;
                              let lineIndex = 0;
                              
                              for (let i = 0; i < lines.length; i++) {
                                if (currentPos + lines[i].length >= start) {
                                  lineIndex = i;
                                  break;
                                }
                                currentPos += lines[i].length + 1; // +1 for newline
                              }
                              
                              const line = lines[lineIndex];
                              if (!line.trim().startsWith('- ')) {
                                lines[lineIndex] = '- ' + line;
                              }
                              
                              const newContent = lines.join('\n');
                              setMaterialForm(v => ({ ...v, content: newContent }));
                              setTimeout(() => {
                                textarea.focus();
                                const newPos = start + (line.trim().startsWith('- ') ? 0 : 2);
                                textarea.setSelectionRange(newPos, newPos);
                              }, 0);
                            }}
                            title="Bullet Point"
                          >
                            <List className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        id="content"
                        placeholder="Write your theory content here. Use the toolbar above for formatting."
                        value={materialForm.content}
                        onChange={e => setMaterialForm(v => ({ ...v, content: e.target.value }))}
                        className="min-h-[250px] border-0 focus-visible:ring-0"
                        rows={12}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Use the toolbar buttons to format text: Bold, Italic, Underline, Text Size (Headings), Code Blocks, and Bullet Points. Images can be added in the Images tab below.
                    </p>
                  </div>

                  <div>
                    <Label className="mb-2 block">Images & Preview</Label>
                    <Tabs defaultValue="images" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="images">
                          <Upload className="h-4 w-4 mr-2" />
                          Upload Images
                        </TabsTrigger>
                        <TabsTrigger value="preview">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Preview Content
                        </TabsTrigger>
                      </TabsList>
                    <TabsContent value="images" className="space-y-3">
                <div>
                        <Label>Upload Images</Label>
                        <div className="mt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => document.getElementById('image-upload').click()}
                        disabled={uploading}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? 'Uploading...' : 'Choose Images'}
                      </Button>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                    try {
                      if (!e.target.files || e.target.files.length === 0) return;
                      setUploading(true);
                            
                            // Try backend upload first, fallback to Cloudinary
                            let urls = [];
                            try {
                              const formData = new FormData();
                              Array.from(e.target.files).forEach(file => {
                                formData.append('images', file);
                              });
                              const result = await api.uploadTheoryImages(Array.from(e.target.files));
                              urls = result.urls || [];
                            } catch (backendError) {
                              // Fallback to Cloudinary
                              urls = await uploadToCloudinary([...e.target.files]);
                            }
                            
                      setUploadedImages(prev => [...prev, ...urls]);
                            toast({ 
                              title: 'Uploaded', 
                              description: `${urls.length} image(s) uploaded successfully.` 
                            });
                    } catch (err) {
                            toast({ 
                              title: 'Upload failed', 
                              description: err.message, 
                              variant: 'destructive' 
                            });
                    } finally {
                      setUploading(false);
                      e.target.value = '';
                    }
                        }}
                      />
                        </div>

                  {uploadedImages.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <Label>Uploaded Images ({uploadedImages.length})</Label>
                            <div className="grid grid-cols-4 gap-2">
                      {uploadedImages.map((url, i) => (
                                <div key={i} className="relative group">
                                  <img 
                                    src={url} 
                                    alt={`Preview ${i + 1}`} 
                                    className="h-20 w-full object-cover rounded border"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      setUploadedImages(prev => prev.filter((_, idx) => idx !== i));
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="secondary"
                                    className="absolute bottom-1 left-1 h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                    data-index={i}
                                    onClick={(e) => {
                                      const imageMarkdown = `![](${url})`;
                                      const textarea = document.getElementById('content');
                                      const cursorPos = textarea.selectionStart;
                                      const newContent = 
                                        materialForm.content.substring(0, cursorPos) +
                                        `\n\n${imageMarkdown}\n\n` +
                                        materialForm.content.substring(cursorPos);
                                      setMaterialForm(v => ({ ...v, content: newContent }));
                                      toast({ 
                                        title: 'Inserted', 
                                        description: 'Image inserted at cursor position' 
                                      });
                                    }}
                                  >
                                    Insert
                                  </Button>
                        </div>
                      ))}
                    </div>
                          <div className="flex gap-2 mt-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const imageMarkdown = uploadedImages.map(url => `![](${url})`).join('\n\n');
                                setMaterialForm(v => ({
                                  ...v,
                                  content: v.content ? `${v.content}\n\n${imageMarkdown}` : imageMarkdown
                                }));
                                toast({ 
                                  title: 'Added', 
                                  description: 'All images inserted into content' 
                                });
                              }}
                            >
                              Insert All Images at End
                            </Button>
                          </div>
                        </div>
                        )}
                      </div>
                    </TabsContent>
                    <TabsContent value="preview" className="space-y-3">
                      <div>
                        <Label>Content Preview</Label>
                        <div className="border rounded-md p-4 min-h-[200px] bg-muted/30">
                          {materialForm.content ? (
                            <div className="prose max-w-none">
                              {(() => {
                                // Split content by code blocks
                                const parts = materialForm.content.split(/(```[\s\S]*?```)/g);
                                return parts.map((part, idx) => {
                                  // Check if this is a code block
                                  if (part.startsWith('```') && part.endsWith('```')) {
                                    const codeContent = part.slice(3, -3).trim();
                                    const lines = codeContent.split('\n');
                                    const language = lines[0] || '';
                                    const code = lines.slice(1).join('\n') || lines[0];
                                    
                                    // Basic syntax highlighting for JavaScript/TypeScript
                                    const highlightCode = (codeText) => {
                                      // Escape HTML first to prevent issues
                                      const escapeHtml = (text) => {
                                        const map = {
                                          '&': '&amp;',
                                          '<': '&lt;',
                                          '>': '&gt;',
                                          '"': '&quot;',
                                          "'": '&#039;'
                                        };
                                        return text.replace(/[&<>"']/g, m => map[m]);
                                      };
                                      
                                      const escaped = escapeHtml(codeText);
                                      
                                      return escaped
                                        // Comments first (before other processing)
                                        .replace(/(\/\/.*$)/gm, '<span style="color: #6b7280;">$1</span>')
                                        .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color: #6b7280;">$1</span>')
                                        // Strings
                                        .replace(/(['"`])((?:\\.|(?!\1)[^\\])*?)(\1)/g, '<span style="color: #fde047;">$1$2$3</span>')
                                        // Keywords
                                        .replace(/\b(useEffect|useState|const|let|var|function|if|else|return|import|export|from|default|async|await|try|catch|finally|for|while|do|switch|case|break|continue|new|this|class|extends|super)\b/g, '<span style="color: #22d3ee;">$1</span>')
                                        // Numbers
                                        .replace(/\b(\d+\.?\d*)\b/g, '<span style="color: #a78bfa;">$1</span>')
                                        // Function calls (but not keywords)
                                        .replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, (match, funcName) => {
                                          const keywords = ['useEffect', 'useState', 'const', 'let', 'var', 'function', 'if', 'else', 'return', 'import', 'export', 'from', 'default', 'async', 'await', 'try', 'catch', 'finally', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'class', 'extends', 'super'];
                                          if (keywords.includes(funcName)) {
                                            return match;
                                          }
                                          return `<span style="color: #fb923c;">${funcName}</span> `;
                                        })
                                        // Operators and brackets
                                        .replace(/([{}()[\]])/g, '<span style="color: #d1d5db;">$1</span>');
                                    };
                                    
                                    return (
                                      <pre key={idx} className="bg-[#1e1e1e] dark:bg-[#0d1117] p-4 rounded-md overflow-x-auto my-4 border border-gray-700">
                                        <code 
                                          className="text-sm font-mono whitespace-pre block"
                                          style={{ color: '#e5e7eb' }}
                                          dangerouslySetInnerHTML={{ __html: highlightCode(code) }}
                                        />
                                      </pre>
                                    );
                                  }
                                  
                                  // Regular content - process markdown
                                  return (
                                    <div 
                                      key={idx}
                                      className="text-sm"
                                      dangerouslySetInnerHTML={{ 
                                        __html: part
                                          .split('\n')
                                          .map(line => {
                                            let processed = line;
                                            
                                            // Bold: **text**
                                            processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                                            
                                            // Italic: *text* (but not **)
                                            processed = processed.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em>$1</em>');
                                            
                                            // Underline: <u>text</u>
                                            processed = processed.replace(/<u>(.*?)<\/u>/g, '<u>$1</u>');
                                            
                                            // Inline code (`code`)
                                            processed = processed.replace(/`([^`\n]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-xs font-mono">$1</code>');
                                            
                                            // Headers
                                            if (processed.trim().startsWith('# ')) {
                                              return `<h1 class="text-2xl font-bold mt-4 mb-2">${processed.substring(2)}</h1>`;
                                            }
                                            if (processed.trim().startsWith('## ')) {
                                              return `<h2 class="text-xl font-bold mt-3 mb-2">${processed.substring(3)}</h2>`;
                                            }
                                            if (processed.trim().startsWith('### ')) {
                                              return `<h3 class="text-lg font-semibold mt-2 mb-1">${processed.substring(4)}</h3>`;
                                            }
                                            
                                            // Bullet points
                                            if (processed.trim().startsWith('- ')) {
                                              return `<li class="ml-4 mb-1">${processed.substring(2)}</li>`;
                                            }
                                            
                                            // Images
                                            if (processed.includes('![](')) {
                                              const urlMatch = processed.match(/!\[\]\((.*?)\)/);
                                              if (urlMatch) {
                                                return `<img src="${urlMatch[1]}" alt="" class="max-w-full rounded my-4" />`;
                                              }
                                            }
                                            
                                            // Empty line
                                            if (processed.trim() === '') {
                                              return '<br />';
                                            }
                                            
                                            return `<p class="mb-2">${processed}</p>`;
                                          })
                                          .join('')
                                      }}
                                    />
                                  );
                                });
                              })()}
                            </div>
                          ) : (
                            <p className="text-muted-foreground text-sm">No content to preview. Start typing in the Theory Content field.</p>
                  )}
                </div>
                      </div>
                    </TabsContent>
                    </Tabs>
                  </div>

                  <div className="flex space-x-2">
                    {editingId && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setMaterialForm({ 
                            title: '', 
                            category: '', 
                            description: '', 
                            readTime: '', 
                            difficulty: 'Easy', 
                            content: '', 
                            images: '' 
                          });
                          setUploadedImages([]);
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      className="flex-1"
                      onClick={async () => {
                        try {
                          if (!materialForm.category || !materialForm.title) {
                            toast({ 
                              title: 'Validation Error', 
                              description: 'Category and Title are required', 
                              variant: 'destructive' 
                            });
                            return;
                          }

                          let finalContent = materialForm.content || '';
                          
                          // Add uploaded images if not already in content
                          if (uploadedImages.length > 0) {
                            const imageMarkdown = uploadedImages
                              .map(url => `![](${url})`)
                              .join('\n\n');
                            if (!finalContent.includes(imageMarkdown)) {
                              finalContent = finalContent 
                                ? `${finalContent}\n\n${imageMarkdown}` 
                                : imageMarkdown;
                            }
                          }

                          if (editingId) {
                            await api.updateTheory(editingId, {
                              category: materialForm.category,
                              title: materialForm.title,
                              description: materialForm.description,
                              difficulty: materialForm.difficulty || 'Medium',
                              content: finalContent
                            });
                            toast({ title: 'Updated', description: 'Study material updated successfully.' });
                          } else {
                            await api.createTheory({
                              category: materialForm.category,
                              title: materialForm.title,
                              description: materialForm.description,
                              difficulty: materialForm.difficulty || 'Medium',
                              content: finalContent
                            });
                            toast({ title: 'Created', description: 'Study material added successfully.' });
                          }

                          // Reset form
                    setEditingId(null);
                          setMaterialForm({ 
                            title: '', 
                            category: '', 
                            description: '', 
                            readTime: '', 
                            difficulty: 'Easy', 
                            content: '', 
                            images: '' 
                          });
                    setUploadedImages([]);

                          // Refresh list
                          const res = await api.listTheory();
                          setTheoryDocs(Array.isArray(res) ? res : (res.data || []));
                  } catch (e) {
                          toast({ 
                            title: 'Error', 
                            description: e.message || 'Failed to save study material', 
                            variant: 'destructive' 
                          });
                        }
                      }}
                    >
                      {editingId ? (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Update Material
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Material
                        </>
                      )}
                    </Button>
                  </div>
              </div>
              </CardContent>
            </Card>
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              {/* List of Materials */}
              <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
                <div className="h-full overflow-y-auto pl-4">
                  <Card className="h-full">
              <CardHeader>
                <CardTitle>All Study Materials</CardTitle>
              </CardHeader>
              <CardContent>
                {theoryLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
                {theoryError && <p className="text-sm text-red-600">{theoryError}</p>}
                {!theoryLoading && !theoryError && (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {theoryDocs.map(m => (
                      <div key={m._id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium">{m.title}</p>
                              <Badge variant="outline">{m.category}</Badge>
                              <Badge 
                                variant="outline"
                                className={
                                  m.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                                  m.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }
                              >
                                {m.difficulty}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {m.description || 'No description'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Created: {new Date(m.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                              setEditingId(m._id);
                              setMaterialForm({
                                title: m.title || '',
                                category: m.category || '',
                                description: m.description || '',
                                  content: m.content || '',
                                images: '',
                                readTime: '',
                                  difficulty: m.difficulty || 'Easy',
                              });
                              setUploadedImages([]);
                                // Scroll to form
                                document.querySelector('[data-form-card]')?.scrollIntoView({ behavior: 'smooth' });
                              }}
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={async () => {
                                if (!confirm('Are you sure you want to delete this material?')) return;
                                try {
                                  await api.deleteTheory(m._id);
                                  toast({ title: 'Deleted', description: 'Study material deleted.' });
                                  const res = await api.listTheory();
                                  setTheoryDocs(Array.isArray(res) ? res : (res.data || []));
                                } catch (e) {
                                  toast({ 
                                    title: 'Error', 
                                    description: e.message || 'Failed to delete', 
                                    variant: 'destructive' 
                                  });
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {theoryDocs.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No study materials yet. Add your first one!
                      </p>
                    )}
                  </div>
                )}
            </CardContent>
          </Card>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        )}

        {activeTab === 'quizzes' && (
          <div className="h-[calc(100vh-200px)] overflow-y-auto space-y-6">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardContent className="flex flex-col gap-4 py-6 px-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg">Question Management</CardTitle>
                    <p className="text-sm text-slate-500">Review quizzes first, import questions next, and use manual entry last.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Existing Quizzes</CardTitle>
                </CardHeader>
                <CardContent>
                  {quizzesLoading && (
                    <p className="text-sm text-muted-foreground">Loading quizzes...</p>
                  )}
                  {quizError && (
                    <p className="text-sm text-red-600">{quizError}</p>
                  )}
                  {!quizzesLoading && !quizError && (
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                      {quizzesList.map((quiz) => (
                        <div key={quiz._id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-base">{quiz.title}</p>
                                <Badge variant="outline">{quiz.category}</Badge>
                                <Badge
                                  variant="outline"
                                  className={
                                    quiz.difficulty === 'Easy'
                                      ? 'bg-green-100 text-green-800'
                                      : quiz.difficulty === 'Medium'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : 'bg-red-100 text-red-800'
                                  }
                                >
                                  {quiz.difficulty}
                                </Badge>
                                <Badge variant={quiz.isPublished ? 'default' : 'outline'}>
                                  {quiz.isPublished ? 'Published' : 'Draft'}
                                </Badge>
                              </div>
                              {quiz.description && (
                                <p className="text-sm text-muted-foreground">{quiz.description}</p>
                              )}
                              <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                                <span>Time: {Math.round((quiz.timeLimit || 600) / 60)} min</span>
                                <span>Questions: {quiz.questions?.length || 0}</span>
                                {Array.isArray(quiz.tags) && quiz.tags.length > 0 && (
                                  <span>Tags: {quiz.tags.join(', ')}</span>
                                )}
                                <span>
                                  Updated: {quiz.updatedAt ? new Date(quiz.updatedAt).toLocaleDateString() : '-'}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEditQuiz(quiz)}>
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteQuiz(quiz._id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {quizzesList.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          No quizzes yet. Create your first quiz!
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>Bulk Import Questions</CardTitle>
                      <p className="text-sm text-slate-500">Import multiple questions using an Excel (.xlsx) file.</p>
                    </div>
                    <Button variant="outline" onClick={downloadBulkTemplate}>
                      Download Excel Template
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  <div
                    className="group flex min-h-[220px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 text-center transition hover:border-blue-400 hover:bg-slate-100"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={handleBulkDrop}
                  >
                    <Upload className="mb-4 h-12 w-12 text-blue-600" />
                    <p className="text-lg font-semibold text-slate-900">Drag & Drop Excel File Here</p>
                    <p className="mt-2 text-sm text-slate-500">OR</p>
                    <label className="mt-4 inline-flex items-center rounded-full border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 cursor-pointer">
                      Choose File
                      <input type="file" accept=".xlsx" className="hidden" onChange={handleBulkFileInput} />
                    </label>
                    {bulkImportFile && (
                      <p className="mt-3 text-sm text-slate-600">Selected file: <span className="font-semibold">{bulkImportFile.name}</span></p>
                    )}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <p className="mb-2 font-semibold text-slate-900">Supported Format</p>
                      <p className="text-sm text-slate-600">✓ .xlsx</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <p className="mb-2 font-semibold text-slate-900">Maximum Size</p>
                      <p className="text-sm text-slate-600">10 MB</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <Label htmlFor="bulk-quiz-title">Quiz Title</Label>
                      <Input
                        id="bulk-quiz-title"
                        value={bulkImportQuizTitle}
                        onChange={(e) => setBulkImportQuizTitle(e.target.value)}
                        placeholder="Imported Questions"
                      />
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <Label htmlFor="bulk-category">Subject</Label>
                      <Input
                        id="bulk-category"
                        value={bulkImportCategory}
                        onChange={(e) => setBulkImportCategory(e.target.value)}
                        placeholder="DSA"
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <Label htmlFor="bulk-difficulty">Difficulty</Label>
                      <Select
                        value={bulkImportDifficulty}
                        onValueChange={(value) => setBulkImportDifficulty(value)}
                      >
                        <SelectTrigger id="bulk-difficulty">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Easy">Easy</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <Label htmlFor="bulk-time-limit">Time Limit (minutes)</Label>
                      <Input
                        id="bulk-time-limit"
                        type="number"
                        min={1}
                        value={bulkImportTimeLimit}
                        onChange={(e) => setBulkImportTimeLimit(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <Label htmlFor="bulk-description">Description</Label>
                      <Textarea
                        id="bulk-description"
                        value={bulkImportDescription}
                        onChange={(e) => setBulkImportDescription(e.target.value)}
                        rows={2}
                      />
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <Label htmlFor="bulk-tags">Tags</Label>
                      <Input
                        id="bulk-tags"
                        value={bulkImportTags}
                        onChange={(e) => setBulkImportTags(e.target.value)}
                        placeholder="imported, excel"
                      />
                    </div>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <Switch
                        id="bulk-published"
                        checked={bulkImportPublished}
                        onCheckedChange={(checked) => setBulkImportPublished(checked)}
                      />
                      <Label htmlFor="bulk-published" className="text-sm">
                        Publish imported quiz immediately
                      </Label>
                    </div>
                  </div>

                  {bulkImportErrors.length > 0 && (
                    <Card className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
                      <CardTitle className="text-base text-rose-700">Import Errors</CardTitle>
                      <ul className="mt-3 space-y-2 text-sm text-rose-700">
                        {bulkImportErrors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </Card>
                  )}

                  <div className="flex items-center justify-between gap-4">
                    <Button variant="outline" onClick={handleBulkValidate}>Validate File</Button>
                    <Button onClick={handleImportQuestions} disabled={bulkImportStatus === 'importing' || bulkImportStatus === 'completed'}>
                      {bulkImportStatus === 'importing' ? 'Importing...' : 'Import Questions'}
                    </Button>
                  </div>

                  {bulkImportStatus === 'validated' && bulkImportPreview.length > 0 && (
                    <Card className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="mb-4 flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-slate-500">{bulkImportReadyCount} Questions Ready To Import</p>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => handleBulkFileSelection(null)}>Cancel</Button>
                          <Button onClick={handleImportQuestions}>Import Questions</Button>
                        </div>
                      </div>
                      <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white p-2">
                        <table className="min-w-full text-left text-sm text-slate-700">
                          <thead className="border-b bg-slate-100 text-slate-700">
                            <tr>
                              <th className="px-3 py-2">Question</th>
                              <th className="px-3 py-2">Correct Answer</th>
                              <th className="px-3 py-2">Marks</th>
                              <th className="px-3 py-2">Difficulty</th>
                              <th className="px-3 py-2">Topic</th>
                              <th className="px-3 py-2">Type</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bulkImportPreview.slice(0, 20).map((item, index) => (
                              <tr key={index} className={index % 2 === 0 ? 'bg-slate-50' : ''}>
                                <td className="px-3 py-2">{item.question}</td>
                                <td className="px-3 py-2">{item.correctAnswer}</td>
                                <td className="px-3 py-2">{item.marks}</td>
                                <td className="px-3 py-2">{item.difficulty}</td>
                                <td className="px-3 py-2">{item.topic}</td>
                                <td className="px-3 py-2">{item.questionType}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}

                  {bulkImportStatus === 'importing' && (
                    <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">Importing...</p>
                      <Progress value={bulkImportProgress} />
                      <p className="text-sm text-slate-600">{bulkImportProgress}%</p>
                    </div>
                  )}

                  {bulkImportStatus === 'completed' && bulkImportSuccess && (
                    <Card className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-emerald-600 p-2 text-white">
                          <Check className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-emerald-900">Import Completed Successfully</p>
                          <p className="text-sm text-emerald-800">{bulkImportSuccess.imported} Questions Imported · {bulkImportSuccess.failed} Failed</p>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button variant="outline" onClick={() => setBulkImportStatus('idle')}>Import Another File</Button>
                        <Button onClick={() => {
                          handleEditQuiz(bulkImportSuccess.quiz);
                        }}>
                          Edit Imported Quiz
                        </Button>
                      </div>
                    </Card>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle>Manual Entry</CardTitle>
                      <p className="text-sm text-slate-500">Create or edit a quiz manually with the question composer.</p>
                    </div>
                    {quizEditingId && (
                      <Button variant="outline" size="sm" onClick={resetQuizForm}>
                        Cancel Edit
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="quiz-title">Quiz Topic *</Label>
                      <Input
                        id="quiz-title"
                        placeholder="e.g., Data Structures Basics"
                        value={quizForm.title}
                        onChange={(e) => setQuizForm(v => ({ ...v, title: e.target.value }))}
                      />
                    </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="quiz-category">Subject *</Label>
                          <Input
                            id="quiz-category"
                            placeholder="e.g., DSA, OS, Aptitude"
                            value={quizForm.category}
                            onChange={(e) => setQuizForm(v => ({ ...v, category: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="quiz-difficulty">Difficulty</Label>
                          <Select
                            value={quizForm.difficulty}
                            onValueChange={(value) => setQuizForm(v => ({ ...v, difficulty: value }))}
                          >
                            <SelectTrigger id="quiz-difficulty">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Easy">Easy</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="Hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="quiz-time">Time Limit (minutes) *</Label>
                          <Input
                            id="quiz-time"
                            type="number"
                            min={1}
                            value={quizForm.timeLimitMinutes}
                            onChange={(e) => setQuizForm(v => ({ ...v, timeLimitMinutes: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="quiz-tags">Tags (comma separated)</Label>
                          <Input
                            id="quiz-tags"
                            placeholder="e.g., arrays, searching"
                            value={quizForm.tags}
                            onChange={(e) => setQuizForm(v => ({ ...v, tags: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="quiz-description">Description</Label>
                        <Textarea
                          id="quiz-description"
                          placeholder="Short description about the quiz"
                          value={quizForm.description}
                          onChange={(e) => setQuizForm(v => ({ ...v, description: e.target.value }))}
                          rows={3}
                        />
                      </div>

                      <div className="flex items-center space-x-3">
                        <Switch
                          id="quiz-published"
                          checked={quizForm.isPublished}
                          onCheckedChange={(checked) => setQuizForm(v => ({ ...v, isPublished: checked }))}
                        />
                        <Label htmlFor="quiz-published" className="text-sm">
                          Publish quiz for students
                        </Label>
                      </div>

                      <div className="flex items-center justify-between p-3 border rounded-md">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Total Questions</p>
                          <p className="text-2xl font-semibold">{quizQuestions.length}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={addQuizQuestion}>
                          <PlusIcon className="h-4 w-4 mr-2" />
                          Add Question
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {quizQuestions.map((question, index) => (
                          <Card key={index} className="border">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                              <CardTitle className="text-base font-semibold">Question {index + 1}</CardTitle>
                              {quizQuestions.length > 1 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeQuizQuestion(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div>
                                <Label htmlFor={`question-${index}`}>Question Text *</Label>
                                <Textarea
                                  id={`question-${index}`}
                                  placeholder="Enter question"
                                  value={question.question}
                                  onChange={(e) => handleQuestionTextChange(index, e.target.value)}
                                  rows={3}
                                />
                              </div>

                              <div className="space-y-3">
                                <Label>Options *</Label>
                                {question.options.map((option, optionIndex) => (
                                  <div key={optionIndex}>
                                    <Input
                                      placeholder={`Option ${optionIndex + 1}`}
                                      value={option}
                                      onChange={(e) => handleOptionChange(index, optionIndex, e.target.value)}
                                    />
                                  </div>
                                ))}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Correct Option *</Label>
                                  <Select
                                    value={question.correctAnswer.toString()}
                                    onValueChange={(value) => handleCorrectAnswerChange(index, value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select correct option" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="0">Option 1</SelectItem>
                                      <SelectItem value="1">Option 2</SelectItem>
                                      <SelectItem value="2">Option 3</SelectItem>
                                      <SelectItem value="3">Option 4</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Explanation (optional)</Label>
                                  <Textarea
                                    placeholder="Explain the correct answer"
                                    value={question.explanation}
                                    onChange={(e) => handleExplanationChange(index, e.target.value)}
                                    rows={2}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <div className="flex items-center space-x-2">
                        {quizEditingId && (
                          <Button variant="outline" onClick={resetQuizForm}>
                            Cancel
                          </Button>
                        )}
                        <Button onClick={handleSaveQuiz} disabled={quizSaving}>
                          {quizSaving ? 'Saving...' : quizEditingId ? 'Update Quiz' : 'Create Quiz'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
          )}

        {activeTab === 'competitions' && (
          <div className="h-[calc(100vh-200px)]">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
                <div className="h-full overflow-y-auto pr-4">
                  <Card data-competition-form className="h-full">
                    <CardHeader>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <CardTitle>{competitionEditingId ? 'Edit Competition' : 'Create Competition'}</CardTitle>
                          <p className="text-sm text-slate-500">Define competition details and link quizzes for the event.</p>
                        </div>
                        {competitionEditingId && (
                          <Button variant="outline" size="sm" onClick={resetCompetitionForm}>
                            Cancel Edit
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="competition-title">Title *</Label>
                          <Input
                            id="competition-title"
                            placeholder="e.g., April Coding Challenge"
                            value={competitionForm.title}
                            onChange={(e) => setCompetitionForm(v => ({ ...v, title: e.target.value }))}
                          />
                        </div>

                        <div>
                          <Label htmlFor="competition-description">Description</Label>
                          <Textarea
                            id="competition-description"
                            placeholder="Short description about the competition"
                            value={competitionForm.description}
                            onChange={(e) => setCompetitionForm(v => ({ ...v, description: e.target.value }))}
                            rows={3}
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm font-medium text-slate-900">Start Schedule *</p>
                                <p className="text-xs text-slate-500">Pick the starting date and time for this competition section.</p>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="competition-start-date">Start Date</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      id="competition-start-date"
                                      variant="outline"
                                      className="h-11 w-full justify-between rounded-2xl px-4 text-left font-normal"
                                    >
                                      <span className="flex items-center gap-2 truncate">
                                        <CalendarDays className="h-4 w-4 shrink-0 text-slate-500" />
                                        <span className="truncate">{formatCompetitionDateLabel(competitionForm.startDate)}</span>
                                      </span>
                                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={competitionForm.startDate ? new Date(`${competitionForm.startDate}T00:00:00`) : undefined}
                                      onSelect={(date) => setCompetitionForm((prev) => ({ ...prev, startDate: date ? format(date, 'yyyy-MM-dd') : '' }))}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>

                              <div className="space-y-2">
                                <Label>Start Time</Label>
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <Select
                                      value={competitionForm.startHour}
                                      onValueChange={(value) => setCompetitionForm((prev) => ({ ...prev, startHour: value }))}
                                    >
                                      <SelectTrigger id="competition-start-hour" className="h-11 rounded-2xl">
                                        <SelectValue placeholder="Hour" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {COMPETITION_HOURS.map((hour) => (
                                          <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Select
                                      value={competitionForm.startMinute}
                                      onValueChange={(value) => setCompetitionForm((prev) => ({ ...prev, startMinute: value }))}
                                    >
                                      <SelectTrigger id="competition-start-minute" className="h-11 rounded-2xl">
                                        <SelectValue placeholder="Min" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {COMPETITION_MINUTES.map((minute) => (
                                          <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Select
                                      value={competitionForm.startPeriod}
                                      onValueChange={(value) => setCompetitionForm((prev) => ({ ...prev, startPeriod: value }))}
                                    >
                                      <SelectTrigger id="competition-start-period" className="h-11 rounded-2xl">
                                        <SelectValue placeholder="AM/PM" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {COMPETITION_PERIODS.map((period) => (
                                          <SelectItem key={period} value={period}>{period}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm font-medium text-slate-900">End Schedule *</p>
                                <p className="text-xs text-slate-500">Pick the closing date and time for this competition section.</p>
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="competition-end-date">End Date</Label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      id="competition-end-date"
                                      variant="outline"
                                      className="h-11 w-full justify-between rounded-2xl px-4 text-left font-normal"
                                    >
                                      <span className="flex items-center gap-2 truncate">
                                        <CalendarDays className="h-4 w-4 shrink-0 text-slate-500" />
                                        <span className="truncate">{formatCompetitionDateLabel(competitionForm.endDate)}</span>
                                      </span>
                                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={competitionForm.endDate ? new Date(`${competitionForm.endDate}T00:00:00`) : undefined}
                                      onSelect={(date) => setCompetitionForm((prev) => ({ ...prev, endDate: date ? format(date, 'yyyy-MM-dd') : '' }))}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>

                              <div className="space-y-2">
                                <Label>End Time</Label>
                                <div className="grid grid-cols-3 gap-2">
                                  <div>
                                    <Select
                                      value={competitionForm.endHour}
                                      onValueChange={(value) => setCompetitionForm((prev) => ({ ...prev, endHour: value }))}
                                    >
                                      <SelectTrigger id="competition-end-hour" className="h-11 rounded-2xl">
                                        <SelectValue placeholder="Hour" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {COMPETITION_HOURS.map((hour) => (
                                          <SelectItem key={hour} value={hour}>{hour}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Select
                                      value={competitionForm.endMinute}
                                      onValueChange={(value) => setCompetitionForm((prev) => ({ ...prev, endMinute: value }))}
                                    >
                                      <SelectTrigger id="competition-end-minute" className="h-11 rounded-2xl">
                                        <SelectValue placeholder="Min" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {COMPETITION_MINUTES.map((minute) => (
                                          <SelectItem key={minute} value={minute}>{minute}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Select
                                      value={competitionForm.endPeriod}
                                      onValueChange={(value) => setCompetitionForm((prev) => ({ ...prev, endPeriod: value }))}
                                    >
                                      <SelectTrigger id="competition-end-period" className="h-11 rounded-2xl">
                                        <SelectValue placeholder="AM/PM" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {COMPETITION_PERIODS.map((period) => (
                                          <SelectItem key={period} value={period}>{period}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center justify-between mb-3 gap-3">
                            <div>
                              <p className="font-medium">Eligibility Rules</p>
                              <p className="text-sm text-slate-500">Choose who can enter this competition.</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                              <Label htmlFor="competition-eligibility-mode">Eligibility Mode</Label>
                              <Select
                                value={competitionForm.eligibilityMode}
                                onValueChange={(value) => setCompetitionForm((prev) => ({ ...prev, eligibilityMode: value }))}
                              >
                                <SelectTrigger id="competition-eligibility-mode" className="h-11 rounded-2xl">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="all">All students</SelectItem>
                                  <SelectItem value="departmentYearClass">Department / Year / Class</SelectItem>
                                  <SelectItem value="domain">Domain</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="competition-eligible-domains">Domains (comma-separated)</Label>
                              <Input
                                id="competition-eligible-domains"
                                placeholder="e.g. React, Node"
                                value={competitionForm.eligibleDomains}
                                onChange={(e) => setCompetitionForm((prev) => ({ ...prev, eligibleDomains: e.target.value }))}
                                disabled={competitionForm.eligibilityMode !== 'domain'}
                              />
                            </div>
                          </div>
                          {competitionForm.eligibilityMode === 'departmentYearClass' && (
                            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                              <div>
                                <Label htmlFor="competition-eligible-department">Department</Label>
                                <Select
                                  value={competitionForm.eligibleDepartment}
                                  onValueChange={(value) => setCompetitionForm((prev) => ({ ...prev, eligibleDepartment: value }))}
                                >
                                  <SelectTrigger id="competition-eligible-department" className="h-11 rounded-2xl">
                                    <SelectValue placeholder="Select department" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="CE">CE</SelectItem>
                                    <SelectItem value="CSE">CSE</SelectItem>
                                    <SelectItem value="IT">IT</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label htmlFor="competition-eligible-class">Class</Label>
                                <Select
                                  value={competitionForm.eligibleClass}
                                  onValueChange={(value) => setCompetitionForm((prev) => ({ ...prev, eligibleClass: value }))}
                                >
                                  <SelectTrigger id="competition-eligible-class" className="h-11 rounded-2xl">
                                    <SelectValue placeholder={competitionEligibleClassOptions.length ? 'Select class' : 'No classes found'} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {competitionEligibleClassOptions.length > 0 ? (
                                      competitionEligibleClassOptions.map((className) => (
                                        <SelectItem key={className} value={className}>{className}</SelectItem>
                                      ))
                                    ) : (
                                      <div className="px-3 py-2 text-sm text-muted-foreground">No student classes found for this department yet.</div>
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="competition-duration">Duration (minutes)</Label>
                            <Input
                              id="competition-duration"
                              type="number"
                              min={1}
                              value={competitionForm.durationMinutes}
                              onChange={(e) => setCompetitionForm(v => ({ ...v, durationMinutes: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="competition-tags">Tags</Label>
                            <Input
                              id="competition-tags"
                              placeholder="e.g., monthly, campus, competitive"
                              value={competitionForm.tags}
                              onChange={(e) => setCompetitionForm(v => ({ ...v, tags: e.target.value }))}
                            />
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center gap-3">
                            <Checkbox
                              checked={competitionForm.isPublished}
                              onCheckedChange={(checked) => setCompetitionForm(v => ({ ...v, isPublished: checked }))}
                              id="competition-published"
                            />
                            <Label htmlFor="competition-published" className="text-sm">
                              Publish competition for students
                            </Label>
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-center justify-between mb-3 gap-3">
                            <div>
                              <p className="font-medium">Related Quizzes</p>
                              <p className="text-sm text-slate-500">Each selected quiz becomes one exam section in the same order you pick it.</p>
                            </div>
                            <span className="text-sm text-slate-500">Select quizzes to include in this competition</span>
                          </div>
                          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                            {quizzesList.length > 0 ? (
                              quizzesList.map((quiz) => (
                                <label key={quiz._id} className="flex items-center gap-2 rounded-lg border p-3 hover:bg-slate-50">
                                  <Checkbox
                                    checked={competitionForm.relatedQuizzes.includes(quiz._id)}
                                    onCheckedChange={(checked) => {
                                      setCompetitionForm((prev) => {
                                        const selected = new Set(prev.relatedQuizzes);
                                        if (checked) selected.add(quiz._id);
                                        else selected.delete(quiz._id);
                                        return { ...prev, relatedQuizzes: Array.from(selected) };
                                      });
                                    }}
                                    id={`quiz-rel-${quiz._id}`}
                                  />
                                  <div className="flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-medium">{quiz.title}</p>
                                        {competitionForm.relatedQuizzes.includes(quiz._id) && (
                                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Section {competitionForm.relatedQuizzes.indexOf(quiz._id) + 1}</Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-500">{quiz.category} • {quiz.difficulty} • {Math.round((quiz.timeLimit || 600) / 60)} min</p>
                                  </div>
                                </label>
                              ))
                            ) : (
                              <p className="text-sm text-muted-foreground">Load quizzes by opening the quizzes tab, or create a quiz first.</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {competitionEditingId && (
                            <Button variant="outline" onClick={resetCompetitionForm}>
                              Cancel
                            </Button>
                          )}
                          <Button onClick={handleSaveCompetition} disabled={competitionSaving}>
                            {competitionSaving ? 'Saving...' : competitionEditingId ? 'Update Competition' : 'Create Competition'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle />

              <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
                <div className="h-full overflow-y-auto pl-4">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle>Existing Competitions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {competitionsLoading && <p className="text-sm text-muted-foreground">Loading competitions...</p>}
                      {competitionsError && <p className="text-sm text-red-600">{competitionsError}</p>}
                      {!competitionsLoading && !competitionsError && (
                        <div className="space-y-4 max-h-[600px] overflow-y-auto">
                          {competitions.map((competition) => (
                            <div key={competition._id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-medium text-base">{competition.title}</p>
                                    <Badge variant="outline">{competition.isPublished ? 'Published' : 'Draft'}</Badge>
                                    <Badge variant="outline">{competition.relatedQuizzes?.length || 0} quizzes</Badge>
                                  </div>
                                  {competition.description && (
                                    <p className="text-sm text-muted-foreground">{competition.description}</p>
                                  )}
                                  <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                                    <span>Start: {new Date(competition.startDate).toLocaleString()}</span>
                                    <span>End: {new Date(competition.endDate).toLocaleString()}</span>
                                    <span>Duration: {competition.durationMinutes} min</span>
                                  </div>
                                  <div className="text-xs text-slate-500">
                                    Eligibility: {competition.eligibilityMode === 'departmentYearClass'
                                      ? `Department ${competition.eligibleDepartment || 'any'}, Class ${competition.eligibleClass || 'any'}`
                                      : competition.eligibilityMode === 'domain'
                                        ? `Domain: ${(competition.eligibleDomains || []).join(', ') || 'any'}`
                                        : 'All students'}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" variant="outline" onClick={() => handleEditCompetition(competition)}>
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button size="sm" variant="destructive" onClick={() => handleDeleteCompetition(competition._id)}>
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                          {competitions.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">No competitions yet. Create your first one!</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        )}

        {activeTab === 'interviews' && (
          <div className="h-[calc(100vh-200px)]">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
                <div className="h-full overflow-y-auto pr-4">
                  <Card data-interview-form className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{interviewEditingId ? 'Edit Interview Question' : 'Add Interview Question'}</CardTitle>
                  {interviewEditingId && (
                    <Button variant="outline" size="sm" onClick={resetInterviewForm}>
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="interview-category">Category *</Label>
                    <Select
                      value={interviewForm.category}
                      onValueChange={(value) => setInterviewForm(v => ({ ...v, category: value }))}
                    >
                      <SelectTrigger id="interview-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HR">HR</SelectItem>
                        <SelectItem value="Technical">Technical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="interview-question">Question *</Label>
                    <Textarea
                      id="interview-question"
                      placeholder="Enter the interview question"
                      value={interviewForm.question}
                      onChange={(e) => setInterviewForm(v => ({ ...v, question: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="interview-answer">Answer *</Label>
                    <Textarea
                      id="interview-answer"
                      placeholder="Enter a comprehensive answer"
                      value={interviewForm.answer}
                      onChange={(e) => setInterviewForm(v => ({ ...v, answer: e.target.value }))}
                      rows={6}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="interview-difficulty">Difficulty</Label>
                      <Select
                        value={interviewForm.difficulty}
                        onValueChange={(value) => setInterviewForm(v => ({ ...v, difficulty: value }))}
                      >
                        <SelectTrigger id="interview-difficulty">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Easy">Easy</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="interview-subcategory">Subcategory</Label>
                      <Input
                        id="interview-subcategory"
                        placeholder="e.g., JavaScript, System Design"
                        value={interviewForm.subcategory}
                        onChange={(e) => setInterviewForm(v => ({ ...v, subcategory: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="interview-tags">Tags (comma-separated)</Label>
                    <Input
                      id="interview-tags"
                      placeholder="e.g., arrays, algorithms, oop"
                      value={interviewForm.tags}
                      onChange={(e) => setInterviewForm(v => ({ ...v, tags: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="interview-tips">Tips</Label>
                    <Textarea
                      id="interview-tips"
                      placeholder="Additional tips for answering this question"
                      value={interviewForm.tips}
                      onChange={(e) => setInterviewForm(v => ({ ...v, tips: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="interview-examples">Examples</Label>
                    <Textarea
                      id="interview-examples"
                      placeholder="Code examples or real-world examples"
                      value={interviewForm.examples}
                      onChange={(e) => setInterviewForm(v => ({ ...v, examples: e.target.value }))}
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    {interviewEditingId && (
                      <Button variant="outline" onClick={resetInterviewForm}>
                        Cancel
                      </Button>
                    )}
                    <Button onClick={handleSaveInterviewQuestion} disabled={interviewSaving}>
                      {interviewSaving ? 'Saving...' : interviewEditingId ? 'Update Question' : 'Add Question'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
                <div className="h-full overflow-y-auto pl-4">
                  <Card className="h-full">
              <CardHeader>
                <CardTitle>Existing Interview Questions</CardTitle>
              </CardHeader>
              <CardContent>
                {interviewLoading && (
                  <p className="text-sm text-muted-foreground">Loading interview questions...</p>
                )}
                {interviewError && (
                  <p className="text-sm text-red-600">{interviewError}</p>
                )}
                {!interviewLoading && !interviewError && (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {interviewQuestions.map((question) => (
                      <div key={question._id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-base line-clamp-2">{question.question}</p>
                              <Badge variant="outline">{question.category}</Badge>
                              <Badge
                                variant="outline"
                                className={
                                  question.difficulty === 'Easy'
                                    ? 'bg-green-100 text-green-800'
                                    : question.difficulty === 'Medium'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                }
                              >
                                {question.difficulty}
                              </Badge>
                            </div>
                            {question.subcategory && (
                              <Badge variant="secondary" className="text-xs">
                                {question.subcategory}
                              </Badge>
                            )}
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {question.answer}
                            </p>
                            {question.tags && question.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {question.tags.map((tag, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                              Updated: {question.updatedAt ? new Date(question.updatedAt).toLocaleDateString() : '-'}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditInterviewQuestion(question)}>
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteInterviewQuestion(question._id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {interviewQuestions.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No interview questions yet. Add your first one!
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        )}

        {activeTab === 'coding' && (
          <div className="h-[calc(100vh-200px)]">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
                <div className="h-full overflow-y-auto pr-4">
                  <Card data-coding-form className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{codingEditingId ? 'Edit Coding Problem' : 'Add Coding Problem'}</CardTitle>
                  {codingEditingId && (
                    <Button variant="outline" size="sm" onClick={resetCodingForm}>
                      Cancel Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="coding-title">Title *</Label>
                    <Input
                      id="coding-title"
                      placeholder="e.g., Two Sum"
                      value={codingForm.title}
                      onChange={(e) => setCodingForm(v => ({ ...v, title: e.target.value }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="coding-category">Category *</Label>
                      <Select
                        value={codingForm.category}
                        onValueChange={(value) => setCodingForm(v => ({ ...v, category: value }))}
                      >
                        <SelectTrigger id="coding-category">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arrays">Arrays</SelectItem>
                          <SelectItem value="Strings">Strings</SelectItem>
                          <SelectItem value="Linked Lists">Linked Lists</SelectItem>
                          <SelectItem value="Trees">Trees</SelectItem>
                          <SelectItem value="Graphs">Graphs</SelectItem>
                          <SelectItem value="Dynamic Programming">Dynamic Programming</SelectItem>
                          <SelectItem value="Sorting">Sorting</SelectItem>
                          <SelectItem value="Searching">Searching</SelectItem>
                          <SelectItem value="Math">Math</SelectItem>
                          <SelectItem value="Greedy">Greedy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="coding-difficulty">Difficulty *</Label>
                      <Select
                        value={codingForm.difficulty}
                        onValueChange={(value) => setCodingForm(v => ({ ...v, difficulty: value }))}
                      >
                        <SelectTrigger id="coding-difficulty">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Easy">Easy</SelectItem>
                          <SelectItem value="Medium">Medium</SelectItem>
                          <SelectItem value="Hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="coding-description">Description *</Label>
                    <Textarea
                      id="coding-description"
                      placeholder="Describe the problem in detail"
                      value={codingForm.description}
                      onChange={(e) => setCodingForm(v => ({ ...v, description: e.target.value }))}
                      rows={6}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Examples</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCodingForm(v => ({
                          ...v,
                          examples: [...v.examples, { input: '', output: '', explanation: '' }]
                        }))}
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Example
                      </Button>
                    </div>
                    {codingForm.examples.map((example, idx) => (
                      <Card key={idx} className="mb-2 p-3">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium">Example {idx + 1}</span>
                          {codingForm.examples.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setCodingForm(v => ({
                                ...v,
                                examples: v.examples.filter((_, i) => i !== idx)
                              }))}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Input
                            placeholder="Input"
                            value={example.input}
                            onChange={(e) => {
                              const newExamples = [...codingForm.examples];
                              newExamples[idx].input = e.target.value;
                              setCodingForm(v => ({ ...v, examples: newExamples }));
                            }}
                          />
                          <Input
                            placeholder="Output"
                            value={example.output}
                            onChange={(e) => {
                              const newExamples = [...codingForm.examples];
                              newExamples[idx].output = e.target.value;
                              setCodingForm(v => ({ ...v, examples: newExamples }));
                            }}
                          />
                          <Input
                            placeholder="Explanation (optional)"
                            value={example.explanation}
                            onChange={(e) => {
                              const newExamples = [...codingForm.examples];
                              newExamples[idx].explanation = e.target.value;
                              setCodingForm(v => ({ ...v, examples: newExamples }));
                            }}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Constraints</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCodingForm(v => ({
                          ...v,
                          constraints: [...v.constraints, '']
                        }))}
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Constraint
                      </Button>
                    </div>
                    {codingForm.constraints.map((constraint, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <Input
                          placeholder={`Constraint ${idx + 1}`}
                          value={constraint}
                          onChange={(e) => {
                            const newConstraints = [...codingForm.constraints];
                            newConstraints[idx] = e.target.value;
                            setCodingForm(v => ({ ...v, constraints: newConstraints }));
                          }}
                        />
                        {codingForm.constraints.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setCodingForm(v => ({
                              ...v,
                              constraints: v.constraints.filter((_, i) => i !== idx)
                            }))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Test Cases *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCodingForm(v => ({
                          ...v,
                          testCases: [...v.testCases, { input: '', expectedOutput: '' }]
                        }))}
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Test Case
                      </Button>
                    </div>
                    {codingForm.testCases.map((testCase, idx) => (
                      <Card key={idx} className="mb-2 p-3">
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-sm font-medium">Test Case {idx + 1}</span>
                          {codingForm.testCases.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setCodingForm(v => ({
                                ...v,
                                testCases: v.testCases.filter((_, i) => i !== idx)
                              }))}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Input
                            placeholder="Input"
                            value={testCase.input}
                            onChange={(e) => {
                              const newTestCases = [...codingForm.testCases];
                              newTestCases[idx].input = e.target.value;
                              setCodingForm(v => ({ ...v, testCases: newTestCases }));
                            }}
                          />
                          <Input
                            placeholder="Expected Output"
                            value={testCase.expectedOutput}
                            onChange={(e) => {
                              const newTestCases = [...codingForm.testCases];
                              newTestCases[idx].expectedOutput = e.target.value;
                              setCodingForm(v => ({ ...v, testCases: newTestCases }));
                            }}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Hints</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCodingForm(v => ({
                          ...v,
                          hints: [...v.hints, '']
                        }))}
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Add Hint
                      </Button>
                    </div>
                    {codingForm.hints.map((hint, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <Input
                          placeholder={`Hint ${idx + 1}`}
                          value={hint}
                          onChange={(e) => {
                            const newHints = [...codingForm.hints];
                            newHints[idx] = e.target.value;
                            setCodingForm(v => ({ ...v, hints: newHints }));
                          }}
                        />
                        {codingForm.hints.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setCodingForm(v => ({
                              ...v,
                              hints: v.hints.filter((_, i) => i !== idx)
                            }))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div>
                    <Label>Predefined Code (Optional)</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Add boilerplate code with input parsing. Use <code className="bg-muted px-1 rounded">// YOUR CODE HERE</code> as a placeholder where users will write their solution function.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium mb-2 block">JavaScript</Label>
                        <Textarea
                          placeholder={`// Example for JavaScript
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let input = [];
rl.on('line', (line) => {
  input.push(line);
});

rl.on('close', () => {
  const nums = JSON.parse(input[0]);
  
  // YOUR CODE HERE
  function solution(nums) {
    // Write your logic here
    return 0;
  }
  
  const result = solution(nums);
  console.log(result);
});`}
                          value={codingForm.starterCode.javascript}
                          onChange={(e) => setCodingForm(v => ({
                            ...v,
                            starterCode: { ...v.starterCode, javascript: e.target.value }
                          }))}
                          rows={12}
                          className="font-mono text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Python</Label>
                        <Textarea
                          placeholder={`# Example for Python
import sys
import json

data = sys.stdin.read().strip()
nums = json.loads(data)

# YOUR CODE HERE
def solution(nums):
    # Write your logic here
    return 0

result = solution(nums)
print(result)`}
                          value={codingForm.starterCode.python}
                          onChange={(e) => setCodingForm(v => ({
                            ...v,
                            starterCode: { ...v.starterCode, python: e.target.value }
                          }))}
                          rows={12}
                          className="font-mono text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Java</Label>
                        <Textarea
                          placeholder={`// Example for Java
import java.util.*;
import java.io.*;

public class Solution {
    public static void main(String[] args) throws IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));
        String line = br.readLine();
        
        // Parse array
        line = line.trim().replaceAll("[\\\\[\\\\]]", "");
        String[] numsStr = line.isEmpty() ? new String[0] : line.split(",");
        int[] nums = new int[numsStr.length];
        for (int i = 0; i < numsStr.length; i++) {
            nums[i] = Integer.parseInt(numsStr[i].trim());
        }
        
        // YOUR CODE HERE
        int result = solution(nums);
        
        System.out.println(result);
    }
    
    public static int solution(int[] nums) {
        // Write your logic here
        return 0;
    }
}`}
                          value={codingForm.starterCode.java}
                          onChange={(e) => setCodingForm(v => ({
                            ...v,
                            starterCode: { ...v.starterCode, java: e.target.value }
                          }))}
                          rows={12}
                          className="font-mono text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium mb-2 block">C++</Label>
                        <Textarea
                          placeholder={`// Example for C++
#include <bits/stdc++.h>
using namespace std;

// YOUR CODE HERE
int solution(vector<int>& nums) {
    // Write your logic here
    return 0;
}

int main() {
    string line;
    getline(cin, line);
    
    // Parse array
    vector<int> nums;
    if (line.length() > 2) {
        line = line.substr(1, line.length() - 2);
        stringstream ss(line);
        string item;
        
        while (getline(ss, item, ',')) {
            size_t first = item.find_first_not_of(" \\t\\n\\r");
            if (first != string::npos) {
                size_t last = item.find_last_not_of(" \\t\\n\\r");
                item = item.substr(first, last - first + 1);
                if (!item.empty()) {
                    nums.push_back(stoi(item));
                }
            }
        }
    }
    
    int result = solution(nums);
    cout << result;
    
    return 0;
}`}
                          value={codingForm.starterCode.cpp}
                          onChange={(e) => setCodingForm(v => ({
                            ...v,
                            starterCode: { ...v.starterCode, cpp: e.target.value }
                          }))}
                          rows={12}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="coding-solution">Solution (optional)</Label>
                    <Textarea
                      id="coding-solution"
                      placeholder="Provide a solution code or explanation"
                      value={codingForm.solution}
                      onChange={(e) => setCodingForm(v => ({ ...v, solution: e.target.value }))}
                      rows={6}
                      className="font-mono text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="coding-time-limit">Time Limit (ms)</Label>
                      <Input
                        id="coding-time-limit"
                        type="number"
                        min={100}
                        value={codingForm.timeLimit}
                        onChange={(e) => setCodingForm(v => ({ ...v, timeLimit: parseInt(e.target.value) || 1000 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="coding-memory-limit">Memory Limit (MB)</Label>
                      <Input
                        id="coding-memory-limit"
                        type="number"
                        min={1}
                        value={codingForm.memoryLimit}
                        onChange={(e) => setCodingForm(v => ({ ...v, memoryLimit: parseInt(e.target.value) || 128 }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {codingEditingId && (
                      <Button variant="outline" onClick={resetCodingForm}>
                        Cancel
                      </Button>
                    )}
                    <Button onClick={handleSaveCodingProblem} disabled={codingSaving}>
                      {codingSaving ? 'Saving...' : codingEditingId ? 'Update Problem' : 'Create Problem'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
                </div>
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
                <div className="h-full overflow-y-auto pl-4">
                  <Card className="h-full">
              <CardHeader>
                <CardTitle>Existing Coding Problems</CardTitle>
              </CardHeader>
              <CardContent>
                {codingLoading && (
                  <p className="text-sm text-muted-foreground">Loading coding problems...</p>
                )}
                {codingError && (
                  <p className="text-sm text-red-600">{codingError}</p>
                )}
                {!codingLoading && !codingError && (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {codingProblems.map((problem) => (
                      <div key={problem._id} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-base">{problem.title}</p>
                              <Badge variant="outline">{problem.category}</Badge>
                              <Badge
                                variant="outline"
                                className={
                                  problem.difficulty === 'Easy'
                                    ? 'bg-green-100 text-green-800'
                                    : problem.difficulty === 'Medium'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                }
                              >
                                {problem.difficulty}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {problem.description}
                            </p>
                            <div className="text-xs text-muted-foreground flex flex-wrap gap-3">
                              <span>Test Cases: {problem.testCases?.length || 0}</span>
                              <span>Time Limit: {problem.timeLimit || 1000}ms</span>
                              <span>Memory Limit: {problem.memoryLimit || 128}MB</span>
                              <span>
                                Updated: {problem.updatedAt ? new Date(problem.updatedAt).toLocaleDateString() : '-'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditCodingProblem(problem)}>
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteCodingProblem(problem._id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {codingProblems.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No coding problems yet. Create your first one!
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
