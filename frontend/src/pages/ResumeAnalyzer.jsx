import { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, CheckCircle, AlertCircle, Lightbulb, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import apiService from '@/services/api';

const ResumeAnalyzer = () => {
  const [user, setUser] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSection, setSelectedSection] = useState(null);
  const [suggestions, setSuggestions] = useState(null);
  const [hfParsed, setHfParsed] = useState(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [jobDescription, setJobDescription] = useState('');
  const [structured, setStructured] = useState(null);
  const [uploadName, setUploadName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const analyzeResume = async () => {
    if (!resumeText.trim()) {
      toast({
        title: "Error",
        description: "Please paste your resume content",
        variant: "destructive"
      });
      return;
    }

    if (resumeText.length < 50) {
      toast({
        title: "Error",
        description: "Resume content is too short. Please provide more details.",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    setSuggestions(null);
    
    try {
      const response = await apiService.analyzeResume(resumeText, jobDescription);
      
      if (response.success) {
        const a = response.data.analysis;
        setAnalysis(a);
        if (a.rawText) {
          const mp = /\*\*Match Percentage:\s*(\d+)%\*\*/i.exec(a.rawText)?.[1];
          const mkBlock = /\*\*Missing Keywords:\*\*([\s\S]*?)(\*\*|$)/i.exec(a.rawText)?.[1] || '';
          const mk = mkBlock
            .split(/\n|\r/) 
            .map(s => s.replace(/^\s*\d+\.?\s*/, '').trim())
            .filter(Boolean);
          const ft = /\*\*Final Thoughts:\*\*\s*([\s\S]*)/i.exec(a.rawText)?.[1]?.trim() || '';
          setHfParsed({ matchPercent: mp ? Number(mp) : null, missingKeywords: mk.slice(0, 20), finalThoughts: ft });
        } else {
          setHfParsed(null);
        }
        toast({
          title: "Analysis Complete",
          description: "Your resume has been analyzed successfully"
        });
      } else {
        throw new Error(response.message || 'Analysis failed');
      }
    } catch (error) {
      console.error('Resume analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze resume. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Parse HF final thoughts into structured bullets
  const parseAiDetails = (raw = '') => {
    const text = String(raw).replace(/\*\*/g, '').trim();
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

    let summaryLines = [];
    const recommendations = [];
    const examples = [];
    let inRecommendations = false;
    let inExamples = false;

    for (const line of lines) {
      if (/^Recommendations:?$/i.test(line)) { inRecommendations = true; inExamples = false; continue; }
      if (/^Example(s)? of how to add missing keywords:?$/i.test(line)) { inExamples = true; inRecommendations = false; continue; }

      if (/^\d+\./.test(line)) {
        if (inRecommendations) { recommendations.push(line.replace(/^\d+\.\s*/, '')); continue; }
      }
      if (/^[\-*]\s+/.test(line)) {
        if (inExamples) { examples.push(line.replace(/^[\-*]\s+/, '')); continue; }
      }
      if (!inRecommendations && !inExamples) {
        summaryLines.push(line);
      }
    }

    // Fallback: if we didn't detect sections, try heuristic grouping
    if (!recommendations.length) {
      for (const line of lines) {
        if (/^\d+\./.test(line)) recommendations.push(line.replace(/^\d+\.\s*/, ''));
      }
    }
    if (!examples.length) {
      for (const line of lines) {
        if (/^[\-*]\s+/.test(line)) examples.push(line.replace(/^[\-*]\s+/, ''));
      }
    }

    const summary = summaryLines.join(' ');
    return { summary, recommendations, examples };
  };

  const getSectionSuggestions = async (section) => {
    if (!resumeText.trim() || !analysis) return;

    setIsLoadingSuggestions(true);
    setSelectedSection(section);
    
    try {
      const response = await apiService.getResumeSuggestions(resumeText, section);
      
      if (response.success) {
        setSuggestions(response.data.suggestions);
      } else {
        throw new Error(response.message || 'Failed to get suggestions');
      }
    } catch (error) {
      console.error('Suggestions error:', error);
      toast({
        title: "Error",
        description: "Failed to get suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

 return (
  <div className="min-h-screen bg-background">
    <Navbar user={user} onLogout={() => setUser(null)} />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Resume Analyzer</h1>
        <p className="text-muted-foreground">Get AI-powered feedback on your resume</p>
      </div>

      {/* ✅ Layout wrapper */}
      <div className={`flex flex-col ${analysis ? "lg:flex-row gap-6" : ""}`}>
        
        {/* ---------------- Resume Content (30% when analysis, 100% otherwise) ---------------- */}
        <div className={`${analysis ? "lg:w-1/3" : "w-full"}`}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Resume Content
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste your resume content here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="min-h-[400px] mb-4"
              />
              <Textarea
                placeholder="Paste the Job Description (optional, improves scoring)"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="min-h-[160px] mb-4"
              />
              <div className="flex items-center gap-3 mb-4">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const res = await apiService.uploadResumeFile(file);
                      if (res.success && res.data?.text) {
                        setResumeText(res.data.text);
                        setUploadName(file.name);
                        setAnalysis(null);
                        setSuggestions(null);
                        toast({ title: 'File uploaded', description: 'Extracted text inserted into the editor.' });
                      } else {
                        throw new Error(res.message || 'Unable to extract text');
                      }
                    } catch (err) {
                      toast({ title: 'Upload failed', description: err.message || 'Could not process file', variant: 'destructive' });
                    }
                  }}
                />
              </div>
              <Button
                onClick={analyzeResume}
                disabled={isAnalyzing}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ---------------- AI Analysis (70%) ---------------- */}
        {analysis && (
          <div className="lg:w-2/3 space-y-6">
            
            {/* Overall Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Overall Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${getScoreColor(hfParsed?.matchPercent ?? analysis.score)}`}>
                    {hfParsed?.matchPercent ?? analysis.score}/100
                  </div>
                  <p className="text-muted-foreground">
                    {hfParsed?.matchPercent != null ? 'Match Percentage' : 'Overall Score'} {analysis.meta?.model ? `• ${analysis.meta.model}` : ''}
                  </p>
                </div>

                {/* Strengths */}
                {!analysis.meta?.model || analysis.meta?.model !== 'hf_resume_ats' ? (
                  <div>
                    <h3 className="font-semibold text-green-600 flex items-center mb-3">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Strengths
                    </h3>
                    <ul className="space-y-2">
                      {analysis.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {s}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {/* Improvements */}
                {!analysis.meta?.model || analysis.meta?.model !== 'hf_resume_ats' ? (
                  <div>
                    <h3 className="font-semibold text-orange-600 flex items-center mb-3">
                      <AlertCircle className="h-5 w-5 mr-2" />
                      Areas for Improvement
                    </h3>
                    <ul className="space-y-2">
                      {analysis.improvements.map((imp, i) => (
                        <li key={i} className="text-sm text-muted-foreground">• {imp}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {/* Skills */}
                <div>
                  <h3 className="font-semibold mb-3">Key Skills Detected</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.keywords.map((k, i) => (
                      <span key={i} className="px-2 py-1 bg-green-100 text-green-800 rounded-md text-sm">{k}</span>
                    ))}
                  </div>
                </div>

                {/* Missing Keywords */}
                {hfParsed?.missingKeywords?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3 mt-4">Missing Skills from Job Description</h3>
                    <div className="flex flex-wrap gap-2">
                      {hfParsed.missingKeywords.map((k, i) => (
                        <span key={i} className="px-2 py-1 bg-red-100 text-red-800 rounded-md text-sm">{k}</span>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* AI Details */}
            {hfParsed && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const { summary, recommendations, examples } = parseAiDetails(hfParsed.finalThoughts || '');
                    return (
                      <>
                        {summary && <p className="text-sm text-muted-foreground">{summary}</p>}
                        {recommendations.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Recommendations</h4>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                              {recommendations.map((r, i) => <li key={i}>{r}</li>)}
                            </ul>
                          </div>
                        )}
                        {examples.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Examples</h4>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                              {examples.map((e, i) => <li key={i}>{e}</li>)}
                            </ul>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {/* Suggestions */}
            {suggestions && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2" />
                    Suggestions for {selectedSection}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{suggestions}</p>
                </CardContent>
              </Card>
            )}

          </div>
        )}
      </div>
    </div>
  </div>
);

};

export default ResumeAnalyzer;
