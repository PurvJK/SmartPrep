import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, Brain, Plus, Upload, X, Save, Edit, Trash2, Bold, Italic, Underline, List, Type, Code, Minus, Plus as PlusIcon, MessageSquare, Terminal } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import api from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const createEmptyQuizQuestion = () => ({
  question: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  explanation: ''
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

const AdminPanel = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
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

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Sync active tab with URL path
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('/admin/content')) setActiveTab('content');
    else if (path.includes('/admin/quizzes')) setActiveTab('quizzes');
    else if (path.includes('/admin/interviews')) setActiveTab('interviews');
    else if (path.includes('/admin/coding')) setActiveTab('coding');
    else if (path.includes('/admin/users')) setActiveTab('users');
    else if (path.includes('/admin')) setActiveTab('users');
  }, [location.pathname]);

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

  useEffect(() => {
    const fetchUsers = async () => {
      if (activeTab !== 'users') return;
      try {
        setUsersLoading(true);
        setUsersError('');
        const res = await api.getAllUsers(1, 50);
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
    if (activeTab === 'quizzes') {
      loadQuizzes();
    }
  }, [activeTab, loadQuizzes]);

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
            explanation: question.explanation || ''
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={() => setUser(null)} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users, content, and quizzes</p>
        </div>

        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading && <p className="text-sm text-muted-foreground">Loading users...</p>}
              {usersError && <p className="text-sm text-red-600">{usersError}</p>}
              {!usersLoading && !usersError && (
                <div className="space-y-4">
                  {usersList.map(u => (
                    <div key={u._id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                          {u.role}
                        </span>
                        <Button size="sm" variant="outline">Edit</Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            if (!confirm(`Are you sure you want to delete user "${u.name}" (${u.email})? This action cannot be undone.`)) return;
                            try {
                              await api.deleteUser(u._id);
                              toast({ 
                                title: 'Success', 
                                description: 'User deleted successfully.' 
                              });
                              // Refresh users list
                              const res = await api.getAllUsers(1, 50);
                              const list = res.data?.users || [];
                              setUsersList(list);
                            } catch (e) {
                              toast({ 
                                title: 'Error', 
                                description: e.message || 'Failed to delete user', 
                                variant: 'destructive' 
                              });
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {usersList.length === 0 && (
                    <p className="text-sm text-muted-foreground">No users found.</p>
                  )}
                </div>
              )}
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
          <div className="h-[calc(100vh-200px)]">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
                <div className="h-full overflow-y-auto pr-4">
                  <Card data-quiz-form className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{quizEditingId ? 'Edit Quiz' : 'Create Quiz'}</CardTitle>
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
                          <CardTitle className="text-base font-semibold">
                            Question {index + 1}
                          </CardTitle>
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
              </ResizablePanel>
              
              <ResizableHandle withHandle />
              
              <ResizablePanel defaultSize={50} minSize={30} maxSize={70}>
                <div className="h-full overflow-y-auto pl-4">
                  <Card className="h-full">
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
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
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
