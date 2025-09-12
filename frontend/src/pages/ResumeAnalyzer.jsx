import { useState, useEffect } from 'react';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const ResumeAnalyzer = () => {
  const [user, setUser] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const analyzeResume = () => {
    if (!resumeText.trim()) {
      toast({
        title: "Error",
        description: "Please paste your resume content",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    
    setTimeout(() => {
      setAnalysis({
        score: 78,
        strengths: ["Good technical skills", "Clear formatting", "Relevant experience"],
        improvements: ["Add more quantified achievements", "Include relevant keywords", "Improve summary section"],
        keywords: ["JavaScript", "React", "Node.js", "Database", "Problem-solving"]
      });
      setIsAnalyzing(false);
      toast({
        title: "Analysis Complete",
        description: "Your resume has been analyzed successfully"
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={() => setUser(null)} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Resume Analyzer</h1>
          <p className="text-muted-foreground">Get AI-powered feedback on your resume</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

          {analysis && (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">{analysis.score}/100</div>
                  <p className="text-muted-foreground">Overall Score</p>
                </div>

                <div>
                  <h3 className="font-semibold text-green-600 flex items-center mb-3">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {analysis.strengths.map((strength, index) => (
                      <li key={index} className="text-sm text-muted-foreground">• {strength}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-orange-600 flex items-center mb-3">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-2">
                    {analysis.improvements.map((improvement, index) => (
                      <li key={index} className="text-sm text-muted-foreground">• {improvement}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Key Skills Detected</h3>
                  <div className="flex flex-wrap gap-2">
                    {analysis.keywords.map((keyword, index) => (
                      <span key={index} className="px-2 py-1 bg-primary/10 text-primary rounded-md text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResumeAnalyzer;
