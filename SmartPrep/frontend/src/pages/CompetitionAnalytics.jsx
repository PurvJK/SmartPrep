import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Download } from 'lucide-react';
import { downloadCandidateMarksPdf } from '@/utils/downloadResultsPdf';
import api from '@/services/api';
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const formatDurationMinutes = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const minutes = Number(value) <= 0 ? 0 : Math.max(1, Math.round(Number(value) / 60));
  return `${minutes}m`;
};

const getPerformanceStatus = (value) => {
  if (value >= 80) return { label: 'Pass', tone: 'bg-emerald-100 text-emerald-700' };
  if (value >= 60) return { label: 'Borderline', tone: 'bg-amber-100 text-amber-700' };
  return { label: 'Needs work', tone: 'bg-rose-100 text-rose-700' };
};

const CompetitionAnalytics = () => {
  const { competitionId } = useParams();
  const navigate = useNavigate();

  const [competition, setCompetition] = useState(null);
  const [competitionLoading, setCompetitionLoading] = useState(false);
  const [competitionError, setCompetitionError] = useState('');

  const [competitionResults, setCompetitionResults] = useState([]);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [resultsError, setResultsError] = useState('');

  // Result modal state & selected result
  const [resultModalOpen, setResultModalOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);
  const [resultLoading, setResultLoading] = useState(false);
  const [resultAttempt, setResultAttempt] = useState(null);
  const [resultActiveTab, setResultActiveTab] = useState(1);
  const [questionReviewIndex, setQuestionReviewIndex] = useState(null);
  const [resultPrevAttempts, setResultPrevAttempts] = useState([]);
  const [topicRadarData, setTopicRadarData] = useState([]);
  const [topicRadarLoading, setTopicRadarLoading] = useState(false);
  const [topicRadarError, setTopicRadarError] = useState('');
  const [topicRadarLabel, setTopicRadarLabel] = useState('');

  const RadarDot = ({ cx, cy, payload }) => {
    const fill = payload?.isWeak ? '#ef4444' : '#22c55e';
    return <circle cx={cx} cy={cy} r={4} fill={fill} stroke={fill} />;
  };

  // Helper: format duration (seconds -> human minutes)
  const formatDuration = (secs) => formatDurationMinutes(secs);

  // Compute topic-wise analysis from attempt (returns { topics: [{topic, total, correct, accuracy}] })
  const computeTopicAnalysis = (attempt) => {
    if (!attempt || !attempt.quizId || !Array.isArray(attempt.quizId.questions)) return { topics: [] };
    const topicsMap = {};
    const questions = attempt.quizId.questions || [];
    const answers = attempt.answers || [];

    questions.forEach((q, idx) => {
      const topic = q.topic || 'General';
      if (!topicsMap[topic]) topicsMap[topic] = { topic, total: 0, correct: 0 };
      topicsMap[topic].total += 1;
      const ans = answers.find(a => Number(a.questionIndex) === idx) || {};
      if (ans.correct) topicsMap[topic].correct += 1;
    });

    const topics = Object.values(topicsMap).map(t => ({
      topic: t.topic,
      total: t.total,
      correct: t.correct,
      accuracy: Math.round((t.correct / Math.max(1, t.total)) * 100)
    }));
    return { topics };
  };

  // Open the result modal and load the attempt by id (handles multiple shapes)
  const openResultModal = async (result) => {
    if (!result) return;
    setSelectedResult(result);
    setResultActiveTab(1);
    setQuestionReviewIndex(null);
    setResultPrevAttempts([]);
    setResultLoading(true);
    setResultAttempt(null);
    setResultModalOpen(true);

    // resolve attempt id from known fields
    let attemptId = null;
    if (result.attemptId) attemptId = result.attemptId;
    else if (result.attemptIds && result.attemptIds.length) attemptId = result.attemptIds[0];
    else if (result.quizAttemptIds && result.quizAttemptIds.length) attemptId = result.quizAttemptIds[0];
    else if (result.bestAttemptId) attemptId = result.bestAttemptId;

    if (!attemptId) {
      setResultLoading(false);
      return;
    }

    try {
      const res = await api.getAttemptById(attemptId);
      const attempt = res?.data || res;
      setResultAttempt(attempt || null);

      // load previous attempts if available (attempt ids array)
      const prevIds = result.attemptIds || result.quizAttemptIds || [];
      if (prevIds && prevIds.length > 1) {
        const uniqueIds = Array.from(new Set(prevIds.filter(id => id && id !== attemptId)));
        const fetched = await Promise.allSettled(uniqueIds.map(id => api.getAttemptById(id)));
        const prev = fetched
          .filter(p => p.status === 'fulfilled')
          .map(p => (p.value?.data || p.value))
          .filter(Boolean)
          .map((a, index) => {
            const percentage = a.percentage ?? Math.round((a.marks || 0) / Math.max(1, a.totalMarks || 1) * 100);
            return {
              id: a._id || a.id || `previous-${index}`,
              quizTitle: a.quizId?.title || (a.quizId?._id ? `Quiz ${a.quizId._id}` : `Quiz ${index + 1}`),
              percentage,
              marks: a.marks ?? 0,
              totalMarks: a.totalMarks ?? 0,
              timeTaken: a.timeTaken ?? 0,
              submittedAt: a.createdAt || a.submittedAt || a.updatedAt || null,
              status: getPerformanceStatus(percentage).label,
            };
          });
        setResultPrevAttempts(prev);
      }
    } catch (err) {
      console.error('Failed to load attempt', err);
    } finally {
      setResultLoading(false);
    }
  };

  // Load competition details and results
  useEffect(() => {
    const loadData = async () => {
      if (!competitionId) return;
      try {
        setCompetitionLoading(true);
        setResultsLoading(true);
        setCompetitionError('');
        setResultsError('');

        // Load competition and results in parallel
        const [compRes, resultsRes] = await Promise.allSettled([
          api.getCompetitionById(competitionId),
          api.getCompetitionResults(competitionId)
        ]);

        // Handle competition load
        if (compRes.status === 'fulfilled') {
          const comp = compRes.value?.data || compRes.value;
          setCompetition(comp);
        } else {
          setCompetitionError(compRes.reason?.message || 'Failed to load competition');
        }

        // Handle results load
        if (resultsRes.status === 'fulfilled') {
          const results = resultsRes.value?.data || [];
          setCompetitionResults(Array.isArray(results) ? results : []);
        } else {
          setResultsError(resultsRes.reason?.message || 'Failed to load results');
        }
      } catch (error) {
        setCompetitionError(error.message || 'Failed to load data');
      } finally {
        setCompetitionLoading(false);
        setResultsLoading(false);
      }
    };

    loadData();
  }, [competitionId]);

  useEffect(() => {
    const loadRadarData = async () => {
      if (!competitionResults.length) {
        setTopicRadarData([]);
        setTopicRadarLabel('');
        return;
      }

      const attemptIds = Array.from(
        new Set(
          competitionResults.flatMap((result) => {
            const ids = [];
            if (result.attemptId) ids.push(result.attemptId);
            if (Array.isArray(result.attemptIds) && result.attemptIds.length) ids.push(result.attemptIds[0]);
            if (Array.isArray(result.quizAttemptIds) && result.quizAttemptIds.length) ids.push(result.quizAttemptIds[0]);
            if (result.bestAttemptId) ids.push(result.bestAttemptId);
            return ids;
          })
        )
      );

      if (!attemptIds.length) {
        setTopicRadarData([]);
        setTopicRadarLabel('');
        return;
      }

      try {
        setTopicRadarLoading(true);
        setTopicRadarError('');

        const fetches = await Promise.allSettled(
          attemptIds.map((id) => api.getAttemptById(id))
        );

        const topicMap = {};
        const successfulAttempts = fetches
          .filter((item) => item.status === 'fulfilled' && item.value)
          .map((item) => item.value?.data || item.value)
          .filter(Boolean);

        successfulAttempts.forEach((attempt) => {
          const { topics } = computeTopicAnalysis(attempt);
          topics.forEach((topic) => {
            if (!topicMap[topic.topic]) {
              topicMap[topic.topic] = { topic: topic.topic, total: 0, correct: 0 };
            }
            topicMap[topic.topic].total += topic.total;
            topicMap[topic.topic].correct += topic.correct;
          });
        });

        const radarData = Object.values(topicMap)
          .map((topic) => {
            const accuracy = topic.total > 0 ? Math.round((topic.correct / topic.total) * 100) : 0;
            return {
              subject: topic.topic,
              A: accuracy,
              fullMark: 100,
              isWeak: accuracy < 70
            };
          })
          .sort((a, b) => b.A - a.A)
          .slice(0, 8);

        setTopicRadarData(radarData);
        setTopicRadarLabel('Average across all students');
      } catch (err) {
        console.error('Failed to load topic radar data', err);
        setTopicRadarError('Unable to load topic radar');
        setTopicRadarData([]);
        setTopicRadarLabel('');
      } finally {
        setTopicRadarLoading(false);
      }
    };

    loadRadarData();
  }, [competitionResults]);

  // Calculate competition stats
  const competitionStats = useMemo(() => {
    if (competitionResults.length === 0) {
      return {
        totalAttempted: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passRate: 0,
        scoreDistribution: []
      };
    }

    const scores = competitionResults.map(r => r.percentage || 0);
    const aboveAverage = scores.filter(s => s >= 50).length;
    
    // Create score distribution buckets (0-10, 11-20, ..., 91-100)
    const buckets = [
      { label: '0-10%', count: 0 },
      { label: '11-20%', count: 0 },
      { label: '21-30%', count: 0 },
      { label: '31-40%', count: 0 },
      { label: '41-50%', count: 0 },
      { label: '51-60%', count: 0 },
      { label: '61-70%', count: 0 },
      { label: '71-80%', count: 0 },
      { label: '81-90%', count: 0 },
      { label: '91-100%', count: 0 }
    ];

    scores.forEach(score => {
      const bucketIndex = Math.min(Math.floor(score / 10), 9);
      buckets[bucketIndex].count += 1;
    });

    return {
      totalAttempted: competitionResults.length,
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      aboveAverageRate: Math.round((aboveAverage / competitionResults.length) * 100),
      scoreDistribution: buckets
    };
  }, [competitionResults]);

  const rankedResults = useMemo(() => {
    const sorted = [...competitionResults].sort((a, b) => {
      const scoreDiff = (b.percentage ?? 0) - (a.percentage ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return (a.name || '').localeCompare(b.name || '');
    });

    const n = sorted.length;
    return sorted.map((result, index) => {
      const rank = index + 1;
      const pct = n > 1 ? ((n - rank) / (n - 1)) * 100 : 100;
      const percentile = Number(pct.toFixed(2));
      return { ...result, rank, percentile };
    });
  }, [competitionResults]);

  const handleDownload = () => {
    const rows = rankedResults.map((result) => ({
      studentId: result.studentId || '—',
      name: result.name || 'Unknown',
      marks: result.marks || 0,
      totalMarks: result.totalMarks || 0,
      percentage: result.percentage || 0
    }));
    downloadCandidateMarksPdf(rows, {
      reportTitle: competitionTitle,
      generatedAt: new Date().toLocaleString()
    });
  };

  const resultHistory = useMemo(() => {
    if (!resultAttempt) return [];
    const currentPercentage = resultAttempt.percentage ?? Math.round((resultAttempt.marks || 0) / Math.max(1, resultAttempt.totalMarks || 1) * 100);
    const current = {
      id: resultAttempt._id || resultAttempt.id || 'current',
      quizTitle: resultAttempt.quizId?.title || `Quiz ${resultAttempt.quizId?._id || 'Current'}`,
      percentage: currentPercentage,
      marks: resultAttempt.marks ?? 0,
      totalMarks: resultAttempt.totalMarks ?? 0,
      timeTaken: resultAttempt.timeTaken ?? 0,
      submittedAt: resultAttempt.createdAt || resultAttempt.submittedAt || null,
      status: getPerformanceStatus(currentPercentage).label,
    };
    return [current, ...resultPrevAttempts]
      .filter(Boolean)
      .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
  }, [resultAttempt, resultPrevAttempts]);

  const competitionTitle = competition?.title || 'Competition';
  const competitionStatus = competition && new Date(competition.endDate) < new Date() ? 'Completed' : 'Active';

  if (competitionLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-slate-600">Loading competition analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (competitionError) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Card className="max-w-md">
            <CardContent className="pt-6 text-center">
              <p className="text-red-600 mb-4">{competitionError}</p>
              <Button onClick={() => navigate('/admin/results')} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Results
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/results')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <div className="mb-2 inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600">
              {competitionStatus === 'Active' ? '🟢 Active' : '🔵 Completed'}
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{competitionTitle}</h1>
            {competition && (
              <p className="mt-2 text-sm text-slate-600">
                <span className="font-medium">Created:</span> {format(new Date(competition.createdAt), 'dd MMM yyyy')}
              </p>
            )}
          </div>
        </div>

        {/* Dashboard Content */}
        {resultsLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="inline-flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Loading competition analytics...</p>
            </div>
          </div>
        ) : resultsError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm">
            <p className="text-sm text-red-700">{resultsError}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-5 text-white shadow-sm">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-6 items-stretch">
                <div className="rounded-lg border-2 border-black bg-white/10 p-2 flex flex-col justify-between">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Students Attempted</div>
                  <div className="mt-1 text-lg font-semibold">{competitionStats.totalAttempted}</div>
                </div>
                <div className="rounded-lg border-2 border-black bg-white/10 p-2 flex flex-col justify-between">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Average Score</div>
                  <div className="mt-1 text-lg font-semibold">{competitionStats.averageScore}%</div>
                </div>
                <div className="rounded-lg border-2 border-black bg-white/10 p-2 flex flex-col justify-between">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Highest Score</div>
                  <div className="mt-1 text-lg font-semibold">{competitionStats.highestScore}%</div>
                </div>
                <div className="rounded-lg border-2 border-black bg-white/10 p-2 flex flex-col justify-between">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Lowest Score</div>
                  <div className="mt-1 text-lg font-semibold">{competitionStats.lowestScore}%</div>
                </div>
                <div className="rounded-lg border-2 border-black bg-white/10 p-2 flex flex-col justify-between">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Above Avg. (50%+)</div>
                  <div className="mt-1 text-lg font-semibold">{competitionStats.aboveAverageRate}%</div>
                </div>
                <div className="rounded-lg border-2 border-black bg-white/10 p-2 flex flex-col justify-between">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Total Questions</div>
                  <div className="mt-1 text-lg font-semibold">
                    {competitionResults.length > 0 ? competitionResults[0].totalMarks || 0 : 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Score Distribution + Topic Radar */}
            <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              {competitionStats.scoreDistribution.length > 0 && (
                <Card className="rounded-2xl border border-slate-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-slate-900">Score Distribution</CardTitle>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={competitionStats.scoreDistribution} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="label" stroke="#64748b" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #475569',
                            borderRadius: '6px',
                            color: '#fff'
                          }}
                          formatter={(value) => [value, 'Students']}
                        />
                        <Bar dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              <Card className="rounded-2xl border border-slate-200 shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle className="text-base font-semibold text-slate-900">Topic Radar</CardTitle>
                    {topicRadarLabel && <div className="text-sm text-slate-500">{topicRadarLabel}</div>}
                  </div>
                </CardHeader>
                <CardContent className="h-80">
                  {topicRadarLoading ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      Loading topic radar...
                    </div>
                  ) : topicRadarError ? (
                    <div className="flex h-full items-center justify-center text-sm text-red-600">
                      {topicRadarError}
                    </div>
                  ) : topicRadarData.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">
                      No topic radar data available.
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={topicRadarData} outerRadius="80%">
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" stroke="#475569" tick={{ fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                        <Radar name="Accuracy" dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.25} dot={<RadarDot />} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #475569',
                            borderRadius: '6px',
                            color: '#fff'
                          }}
                          formatter={(value) => [`${value}%`, 'Accuracy']}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Student Performance Table */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900">
                      Student Performance ({rankedResults.length})
                    </CardTitle>
                    <p className="text-sm text-slate-500">Review student results and export the current list.</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleDownload}>
                      <Download className="h-4 w-4" /> Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Rank</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Student ID</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Student</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Score</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Percentage</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Submitted</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankedResults.length > 0 ? (
                        rankedResults.map((result) => {
                          const status = getPerformanceStatus(result.percentage || 0);
                          return (
                            <tr key={result.studentId || result.name} className="border-b border-slate-100 hover:bg-slate-50">
                              <td className="px-4 py-3 font-semibold text-slate-900">#{result.rank}</td>
                              <td className="px-4 py-3 text-slate-900">{result.studentId || '—'}</td>
                              <td className="px-4 py-3 text-slate-900">{result.name || 'Unknown'}</td>
                              <td className="px-4 py-3 text-slate-600">
                                {result.marks}/{result.totalMarks}
                              </td>
                              <td className="px-4 py-3 font-medium text-slate-900">{result.percentage || 0}%</td>
                              <td className="px-4 py-3">
                                <Badge className={`${status.tone} border-0`}>{status.label}</Badge>
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-600">
                                {result.submittedAt
                                  ? format(new Date(result.submittedAt), 'dd MMM, HH:mm')
                                  : '—'}
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  onClick={() => openResultModal(result)}
                                >
                                  View
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-slate-600">
                            No student results yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            {/* Result modal for detailed analytics */}
            <Dialog open={resultModalOpen} onOpenChange={setResultModalOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="mb-6">
                    <DialogTitle>{selectedResult?.name || 'Student Report'}</DialogTitle>
                    <DialogDescription>Detailed performance report</DialogDescription>
                  </div>

                  {resultLoading && <p className="text-sm text-muted-foreground">Loading report...</p>}
                  {!resultLoading && resultAttempt && (
                    <div>
                      <div className="flex gap-2 mb-4">
                        {[1,2,3,4,5,6].map((tab) => (
                          <Button key={tab} variant={resultActiveTab===tab? 'default' : 'outline'} size="sm" onClick={() => setResultActiveTab(tab)}>
                            {tab === 1 && 'Score'}
                            {tab === 2 && 'Topic Analysis'}
                            {tab === 3 && 'Question Review'}
                            {tab === 4 && 'Strengths'}
                            {tab === 5 && 'Comparison'}
                            {tab === 6 && 'Previous'}
                          </Button>
                        ))}
                      </div>

                      {/* Tab 1 */}
                      {resultActiveTab === 1 && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="rounded-xl border p-4">
                            <div className="text-sm text-muted-foreground">Score</div>
                            <div className="text-2xl font-semibold">{selectedResult.marks}/{selectedResult.totalMarks}</div>
                          </div>
                          <div className="rounded-xl border p-4">
                            <div className="text-sm text-muted-foreground">Accuracy</div>
                            <div className="text-2xl font-semibold">{selectedResult.percentage}%</div>
                          </div>
                          <div className="rounded-xl border p-4">
                            <div className="text-sm text-muted-foreground">Rank</div>
                            <div className="text-2xl font-semibold">{selectedResult.rank ?? '—'}</div>
                          </div>
                          <div className="rounded-xl border p-4">
                            <div className="text-sm text-muted-foreground">Percentile</div>
                            <div className="text-2xl font-semibold">{selectedResult.percentile ?? '—'}%</div>
                          </div>
                          <div className="rounded-xl border p-4">
                            <div className="text-sm text-muted-foreground">Time Taken</div>
                            <div className="text-2xl font-semibold">{formatDuration(resultAttempt.timeTaken)}</div>
                          </div>
                          <div className="rounded-xl border p-4">
                            <div className="text-sm text-muted-foreground">Status</div>
                            <div className="text-2xl font-semibold">{getPerformanceStatus(selectedResult.percentage).label}</div>
                          </div>
                        </div>
                      )}

                      {/* Tab 2: Topic Analysis */}
                      {resultActiveTab === 2 && (
                        <div className="space-y-3">
                          {(() => {
                            const { topics } = computeTopicAnalysis(resultAttempt);
                            if (!topics.length) return <p className="text-sm text-muted-foreground">No topic data available.</p>;
                            return topics.map((t) => (
                              <div key={t.topic} className="rounded-md border p-3">
                                <div className="flex items-center justify-between">
                                  <div className="font-medium">{t.topic}</div>
                                  <div className="text-sm font-semibold">{t.accuracy}%</div>
                                </div>
                                <div className="mt-2 bg-slate-100 h-3 rounded overflow-hidden">
                                  <div style={{ width: `${t.accuracy}%` }} className="h-3 bg-blue-600" />
                                </div>
                              </div>
                            ));
                          })()}
                        </div>
                      )}

                      {/* Tab 3: Question Review */}
                      {resultActiveTab === 3 && (
                        <div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="border-b">
                                  <th className="px-2 py-2 text-left">#</th>
                                  <th className="px-2 py-2 text-left">Question</th>
                                  <th className="px-2 py-2">Student Answer</th>
                                  <th className="px-2 py-2">Correct</th>
                                  <th className="px-2 py-2">Result</th>
                                </tr>
                              </thead>
                              <tbody>
                                {resultAttempt.quizId.questions.map((q, idx) => {
                                  const ans = (resultAttempt.answers || []).find(a => Number(a.questionIndex) === idx) || {};
                                  const studentSel = Array.isArray(ans.selected) ? ans.selected[0] : ans.selected;
                                  const studentLetter = typeof studentSel === 'number' ? String.fromCharCode(65 + studentSel) : (studentSel || '—');
                                  const correctLetter = typeof q.correctAnswer === 'number' ? String.fromCharCode(65 + q.correctAnswer) : '—';
                                  return (
                                    <tr key={idx} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => setQuestionReviewIndex(idx)}>
                                      <td className="px-2 py-2">Q{idx+1}</td>
                                      <td className="px-2 py-2 truncate max-w-xs">{q.question}</td>
                                      <td className="px-2 py-2 text-center">{studentLetter}</td>
                                      <td className="px-2 py-2 text-center">{correctLetter}</td>
                                      <td className="px-2 py-2 text-center">{ans.correct ? '✅' : (ans.selected===undefined || ans.selected===null ? '⚪' : '❌')}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          {questionReviewIndex !== null && (
                            <div className="mt-4 rounded-lg border p-4">
                              <h4 className="font-semibold">Question</h4>
                              <p className="mb-2">{resultAttempt.quizId.questions[questionReviewIndex].question}</p>
                              <h4 className="font-semibold">Student Answer</h4>
                              <p className="mb-2">{(() => { const a = (resultAttempt.answers||[]).find(x=>Number(x.questionIndex)===questionReviewIndex) || {}; const sel = Array.isArray(a.selected)?a.selected[0]:a.selected; return typeof sel === 'number' ? resultAttempt.quizId.questions[questionReviewIndex].options[sel] : sel || 'Not Answered'; })()}</p>
                              <h4 className="font-semibold">Correct Answer</h4>
                              <p className="mb-2">{resultAttempt.quizId.questions[questionReviewIndex].options[resultAttempt.quizId.questions[questionReviewIndex].correctAnswer]}</p>
                              <h4 className="font-semibold">Explanation</h4>
                              <p className="text-sm text-muted-foreground">{resultAttempt.quizId.questions[questionReviewIndex].explanation || '—'}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tab 4: Strengths & Weaknesses */}
                      {resultActiveTab === 4 && (
                        <div>
                          {(() => {
                            const { topics } = computeTopicAnalysis(resultAttempt);
                            const strengths = topics.filter(t => t.accuracy >= 70).map(t => t.topic);
                            const weaknesses = topics.filter(t => t.accuracy < 70).map(t => t.topic);
                            return (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Strengths</h4>
                                  <ul className="list-disc ml-5">
                                    {strengths.length ? strengths.map(s => <li key={s}>{s}</li>) : <li>—</li>}
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="font-semibold mb-2">Weak Areas</h4>
                                  <ul className="list-disc ml-5">
                                    {weaknesses.length ? weaknesses.map(w => <li key={w}>{w}</li>) : <li>—</li>}
                                  </ul>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Tab 5: Comparison */}
                      {resultActiveTab === 5 && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-xl border p-4 text-center">
                              <div className="text-sm text-muted-foreground">Student</div>
                              <div className="text-2xl font-semibold">{selectedResult.percentage}%</div>
                            </div>
                            <div className="rounded-xl border p-4 text-center">
                              <div className="text-sm text-muted-foreground">Class Average</div>
                              <div className="text-2xl font-semibold">{competitionResults.length ? Math.round(competitionResults.reduce((s,r)=>s+(r.percentage||0),0)/competitionResults.length) : 0}%</div>
                            </div>
                            <div className="rounded-xl border p-4 text-center">
                              <div className="text-sm text-muted-foreground">Highest</div>
                              <div className="text-2xl font-semibold">{competitionResults.length ? Math.max(...competitionResults.map(r=>r.percentage||0)) : 0}%</div>
                            </div>
                          </div>
                          <div className="mt-4 space-y-3">
                            {(() => {
                              const highest = Math.max(...competitionResults.map(r=>r.percentage||0));
                              const avg = competitionResults.length ? Math.round(competitionResults.reduce((s,r)=>s+(r.percentage||0),0)/competitionResults.length) : 0;
                              const student = selectedResult.percentage || 0;
                              const renderBar = (label, value) => (
                                <div key={label} className="space-y-1">
                                  <div className="text-sm font-medium">{label}</div>
                                  <div className="bg-slate-100 h-4 rounded overflow-hidden">
                                    <div style={{ width: `${value}%` }} className="h-4 bg-blue-600" />
                                  </div>
                                  <div className="text-sm">{value}%</div>
                                </div>
                              );
                              return (
                                <div className="grid gap-4 md:grid-cols-3">
                                  {renderBar('Highest', highest)}
                                  {renderBar('Student', student)}
                                  {renderBar('Average', avg)}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Tab 6: Previous Performance */}
                      {resultActiveTab === 6 && (
                        <div>
                          {resultHistory.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No previous attempts available.</p>
                          ) : (
                            <div className="space-y-4">
                              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-slate-50">
                                <table className="min-w-full text-sm">
                                  <thead>
                                    <tr className="border-b bg-white">
                                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Attempt</th>
                                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Quiz</th>
                                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Score</th>
                                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Percentage</th>
                                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Time Taken</th>
                                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Submitted</th>
                                      <th className="px-3 py-3 text-left font-semibold text-slate-700">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {resultHistory.map((item, index) => (
                                      <tr key={item.id} className="border-b bg-white hover:bg-slate-50">
                                        <td className="px-3 py-3 font-medium text-slate-900">#{index + 1}</td>
                                        <td className="px-3 py-3 text-slate-900">{item.quizTitle}</td>
                                        <td className="px-3 py-3 text-slate-700">{item.marks}/{item.totalMarks}</td>
                                        <td className="px-3 py-3 text-slate-900">{item.percentage}%</td>
                                        <td className="px-3 py-3 text-slate-700">{formatDuration(item.timeTaken)}</td>
                                        <td className="px-3 py-3 text-slate-700">
                                          {item.submittedAt ? format(new Date(item.submittedAt), 'dd MMM yyyy, HH:mm') : '—'}
                                        </td>
                                        <td className="px-3 py-3 text-slate-900">{item.status}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionAnalytics;
