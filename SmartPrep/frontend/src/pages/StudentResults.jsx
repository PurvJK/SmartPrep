import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import api from '@/services/api';
import { Trophy, CalendarDays, Eye } from 'lucide-react';

const getCompetitionStatus = (startDate, endDate) => {
  const now = new Date();
  if (endDate && new Date(endDate) < now) return 'Completed';
  if (startDate && new Date(startDate) > now) return 'Upcoming';
  return 'Active';
};

const StudentResults = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.getMyCompetitionResults();
        const data = res?.data || res || [];
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Failed to load competition results');
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Your Results</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">Competitions You Appeared In</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span>{results.length} competition{results.length === 1 ? '' : 's'}</span>
          </div>
        </div>

        <Card className="rounded-3xl border border-slate-200 shadow-sm">
          <CardContent className="p-6">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="text-slate-600">Loading your competition history...</span>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-16 text-sm text-rose-700">{error}</div>
            ) : results.length === 0 ? (
              <div className="text-center py-16 text-slate-600">
                You have not appeared in any competitions yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Competition</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Score</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Percentage</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Submitted</th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result) => (
                      <tr key={result.competitionId || result.submittedAt} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 text-slate-900">
                          <div className="font-medium">{result.competitionTitle || 'Unknown competition'}</div>
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {result.startDate ? format(new Date(result.startDate), 'dd MMM yyyy') : 'Date not available'}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="rounded-full border-0 py-1 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 bg-slate-100">
                            {getCompetitionStatus(result.startDate, result.endDate)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-900">
                          {result.resultAvailable ? `${result.score}/${result.totalQuestions}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-900">
                          {result.resultAvailable ? `${result.percentage}%` : 'Pending'}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{result.submittedAt ? format(new Date(result.submittedAt), 'dd MMM, HH:mm') : '—'}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              if (result.resultAvailable) {
                                navigate(`/results/${result.competitionId}`);
                              }
                            }}
                            disabled={!result.resultAvailable}
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${result.resultAvailable ? 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50' : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            {result.resultAvailable ? 'View result' : 'Pending'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Link to="/dashboard">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentResults;
