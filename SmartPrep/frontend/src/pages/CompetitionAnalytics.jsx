import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';
import api from '@/services/api';
import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
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
  if (value >= 80) return { label: '🟢 Pass', tone: 'bg-emerald-100 text-emerald-700' };
  if (value >= 60) return { label: '🟡 Borderline', tone: 'bg-amber-100 text-amber-700' };
  return { label: '🔴 Needs work', tone: 'bg-rose-100 text-rose-700' };
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
    const passed = scores.filter(s => s >= 60).length;
    
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
      passRate: Math.round((passed / competitionResults.length) * 100),
      scoreDistribution: buckets
    };
  }, [competitionResults]);

  const rankedResults = useMemo(() => {
    const sorted = [...competitionResults].sort((a, b) => {
      const scoreDiff = (b.percentage ?? 0) - (a.percentage ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return (a.name || '').localeCompare(b.name || '');
    });

    return sorted.map((result, index) => ({ ...result, rank: index + 1 }));
  }, [competitionResults]);
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
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Students Attempted</div>
                  <div className="mt-2 text-2xl font-semibold">{competitionStats.totalAttempted}</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Average Score</div>
                  <div className="mt-2 text-2xl font-semibold">{competitionStats.averageScore}%</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Highest Score</div>
                  <div className="mt-2 text-2xl font-semibold">{competitionStats.highestScore}%</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Lowest Score</div>
                  <div className="mt-2 text-2xl font-semibold">{competitionStats.lowestScore}%</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Pass Rate (60%+)</div>
                  <div className="mt-2 text-2xl font-semibold">{competitionStats.passRate}%</div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/10 p-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-300">Total Questions</div>
                  <div className="mt-2 text-2xl font-semibold">
                    {competitionResults.length > 0 ? competitionResults[0].totalMarks || 0 : 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Score Distribution Chart */}
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

            {/* Student Performance Table */}
            <Card className="rounded-2xl border border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Student Performance ({rankedResults.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="px-4 py-3 text-left font-semibold text-slate-700">Rank</th>
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
                                  onClick={() => {
                                    // Navigate to attempt details or open modal
                                    console.log('View attempt:', result);
                                  }}
                                >
                                  👁 View
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
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionAnalytics;
