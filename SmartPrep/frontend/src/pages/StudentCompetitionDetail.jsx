import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import api from '@/services/api';
import {
  ArrowLeft,
  Trophy,
  Clock,
  TrendingUp,
  PieChart,
  FileText,
  Users,
  CircleDot,
  CheckCircle,
  XCircle,
  BarChart2,
  BookOpen,
  Code,
  Sparkles,
  MessageSquare,
  Download,
  ChartLine,
  Award
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine
} from 'recharts';

const formatDuration = (seconds) => {
  if (!seconds && seconds !== 0) return '—';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs < 10 ? `0${secs}` : secs}s`;
};

const getPerformanceStatus = (value) => {
  if (value >= 85) return { label: 'Excellent', tone: 'bg-emerald-100 text-emerald-700' };
  if (value >= 70) return { label: 'Good', tone: 'bg-amber-100 text-amber-700' };
  if (value >= 50) return { label: 'Average', tone: 'bg-orange-100 text-orange-700' };
  return { label: 'Needs Improvement', tone: 'bg-rose-100 text-rose-700' };
};

const StudentCompetitionDetail = () => {
  const { competitionId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.getMyCompetitionResultById(competitionId);
        const data = res?.data || res || null;
        setResult(data);
      } catch (err) {
        setError(err.message || 'Unable to load result details');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [competitionId]);

  const resultAvailable = result?.resultAvailable !== false;

  const phases = useMemo(() => {
    if (!result || !resultAvailable) return [];
    return [
      { label: 'Score Summary' },
      { label: 'Performance Cards' },
      { label: 'Comparison' },
      { label: 'Topic Analysis' },
      { label: 'Radar Chart' },
      { label: 'Question Review' },
      { label: 'Progress Timeline' },
      { label: 'Strengths & Weaknesses' }
    ];
  }, [result, resultAvailable]);

  const questionSummary = useMemo(() => {
    if (!result || !resultAvailable) return [];
    return result.questionReview.map((question, index) => ({
      index,
      status: question.skipped ? 'skipped' : question.correct ? 'correct' : 'wrong'
    }));
  }, [result, resultAvailable]);

  const chartTimelineData = useMemo(() => {
    if (!result) return [];
    const previousData = (result.previousCompetitions || []).map((item) => ({
      name: item.competitionTitle,
      percentage: item.percentage || 0
    })).reverse();

    return [
      ...previousData,
      {
        name: result.competitionTitle,
        percentage: result.percentage || 0
      }
    ];
  }, [result]);

  const ratio = useMemo(() => {
    if (!result || !result.totalQuestions) return { correct: 0, wrong: 0, skipped: 0 };
    const skipped = result.questionReview.filter((q) => q.skipped).length;
    const correct = result.questionReview.filter((q) => q.correct).length;
    const wrong = result.questionReview.filter((q) => !q.correct && !q.skipped).length;
    return { correct, wrong, skipped };
  }, [result]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-slate-600">Loading competition result...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center py-24">
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center shadow-sm">
            <p className="text-red-700 mb-4">{error}</p>
            <Button variant="outline" onClick={() => navigate('/results')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Results
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  if (!resultAvailable) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm text-center">
            <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Clock className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Results are pending</h1>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              Your competition submission has been received, but results are not available until the competition window ends.
            </p>
            <div className="mt-6 text-sm text-slate-500">
              <p>Competition ends on:</p>
              <p className="font-semibold text-slate-900">{result.endDate ? format(new Date(result.endDate), 'dd MMM yyyy, hh:mm a') : 'Unknown'}</p>
            </div>
            <div className="mt-8 flex justify-center gap-3">
              <Button variant="outline" onClick={() => navigate('/results')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Results
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const status = getPerformanceStatus(result.percentage);
  const averageTimePerQuestion = result.totalQuestions > 0 ? Math.round(result.timeTakenSeconds / result.totalQuestions) : 0;
  const radarData = result.topicPerformance.slice(0, 6).map((topic) => ({
    subject: topic.topic,
    A: topic.accuracy || 0,
    fullMark: 100
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Result Overview</p>
            <h1 className="mt-2 text-2xl font-bold text-slate-900">{result.competitionTitle}</h1>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">{result.description || 'A complete dashboard of your competition performance and learning gaps.'}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" onClick={() => navigate('/results')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Competitions
            </Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Download className="mr-2 h-4 w-4" /> Download Report
            </Button>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-slate-500">Completed on: <span className="font-semibold text-slate-900">{result.submittedAt ? format(new Date(result.submittedAt), 'dd MMM yyyy') : '—'}</span></p>
              <p className="text-sm text-slate-500">Duration: <span className="font-semibold text-slate-900">{formatDuration(result.timeTakenSeconds)}</span></p>
            </div>
            <div className="flex flex-wrap gap-2 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2"> <Clock className="h-4 w-4" /> {result.questionReview.length} Questions</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2"> <Users className="h-4 w-4" /> Rank {result.rank}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="space-y-6">
            <Card className="rounded-3xl border border-slate-200 shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="mt-4 text-3xl font-semibold text-slate-900">{result.score} / {result.totalQuestions}</div>
                    <div className="mt-2 text-lg font-semibold text-slate-700">{result.percentage}%</div>
                    <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${status.tone}`}>{status.label}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3">
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Rank</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{result.rank}/{result.previousCompetitions.length + 1}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Percentile</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{result.percentile}%</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Accuracy</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{result.percentage}%</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Time Taken</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{formatDuration(result.timeTakenSeconds)}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Submission</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{result.submittedAt ? format(new Date(result.submittedAt), 'hh:mm a') : '—'}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Status</p>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{status.label}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3 xl:grid-cols-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Correct</p>
                  <p className="mt-3 text-xl font-semibold text-slate-900">{ratio.correct}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Wrong</p>
                  <p className="mt-3 text-xl font-semibold text-slate-900">{ratio.wrong}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Skipped</p>
                  <p className="mt-3 text-xl font-semibold text-slate-900">{ratio.skipped}</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Accuracy</p>
                  <p className="mt-3 text-xl font-semibold text-slate-900">{result.percentage}%</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Avg Time / Q</p>
                  <p className="mt-3 text-xl font-semibold text-slate-900">{averageTimePerQuestion}s</p>
                </div>
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Rank</p>
                  <p className="mt-3 text-xl font-semibold text-slate-900">{result.rank}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Compare With Others</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { label: 'Your Score', value: result.percentage, color: 'bg-sky-500' },
                  { label: 'Class Average', value: result.classAverage, color: 'bg-slate-400' },
                  { label: 'Highest', value: result.highestScore, color: 'bg-emerald-500' }
                ].map((item) => (
                  <div key={item.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>{item.label}</span>
                      <span className="font-semibold text-slate-900">{item.value}%</span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div style={{ width: `${Math.min(item.value, 100)}%` }} className={`${item.color} h-3`} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Question Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  {questionSummary.map((item) => (
                    <button
                      key={item.index}
                      type="button"
                      onClick={() => setSelectedQuestion(item.index)}
                      className={`rounded-2xl border p-3 text-sm font-semibold ${item.status === 'correct' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : item.status === 'wrong' ? 'border-rose-300 bg-rose-50 text-rose-800' : 'border-slate-300 bg-slate-50 text-slate-700'} ${selectedQuestion === item.index ? 'ring-2 ring-slate-300' : ''}`}
                    >
                      Q{item.index + 1} {item.status === 'correct' ? 'Correct' : item.status === 'wrong' ? 'Wrong' : 'Skipped'}
                    </button>
                  ))}
                </div>
                {selectedQuestion !== null ? (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    {(() => {
                      const selected = result.questionReview[selectedQuestion];
                      if (!selected) return null;
                      const correctOption = typeof selected.correctAnswer === 'number'
                        ? selected.options?.[selected.correctAnswer]
                        : selected.correctAnswer;
                      const selectedOption = selected.skipped
                        ? 'Not answered'
                        : typeof selected.selected === 'number'
                        ? selected.options?.[selected.selected]
                        : selected.selected;
                      return (
                        <>
                          <div className="mb-3 flex items-center justify-between">
                            <h3 className="text-base font-semibold text-slate-900">Question {selectedQuestion + 1}</h3>
                            <Badge className={`border-0 ${selected.skipped ? 'bg-slate-100 text-slate-700' : selected.correct ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {selected.skipped ? 'Skipped' : selected.correct ? 'Correct' : 'Incorrect'}
                            </Badge>
                          </div>
                          <p className="mb-3 text-sm text-slate-800">{selected.question}</p>
                          <div className="space-y-3 text-sm text-slate-700">
                            <div>
                              <p className="font-medium">Your Answer</p>
                              <p>{selectedOption || '—'}</p>
                            </div>
                            <div>
                              <p className="font-medium">Correct Answer</p>
                              <p>{correctOption || '—'}</p>
                            </div>
                            <div>
                              <p className="font-medium">Explanation</p>
                              <p>{selected.explanation || 'No explanation available.'}</p>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                    Click a question above to review the answer and explanation.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Performance Timeline</CardTitle>
              </CardHeader>
              <CardContent className="h-72">
                {chartTimelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartTimelineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#64748b" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                      <Tooltip formatter={(value) => [`${value}%`, 'Score']} />
                      <Line type="monotone" dataKey="percentage" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-slate-600">No previous competition history available yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="rounded-3xl border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Topic Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.topicPerformance.map((topic) => (
                  <div key={topic.topic} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-slate-900">{topic.topic}</p>
                        <p className="text-xs text-slate-500">{topic.correct}/{topic.total} correct</p>
                      </div>
                      <Badge className="rounded-full border-0 bg-slate-100 text-slate-700">{topic.status}</Badge>
                    </div>
                    <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                      <div style={{ width: `${topic.accuracy}%` }} className="h-3 rounded-full bg-sky-500" />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                      <span>{topic.accuracy}% accuracy</span>
                      <span>{topic.total} questions</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Strengths & Weaknesses</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-800">Strengths</p>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
                    {result.strengths.length > 0 ? result.strengths.map((item) => <li key={item}>{item}</li>) : <li>Keep practicing to build strengths.</li>}
                  </ul>
                </div>
                <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4">
                  <p className="text-sm font-semibold text-rose-800">Weak Areas</p>
                  <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
                    {result.weaknesses.length > 0 ? result.weaknesses.map((item) => <li key={item}>{item}</li>) : <li>No weak topics detected.</li>}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCompetitionDetail;
