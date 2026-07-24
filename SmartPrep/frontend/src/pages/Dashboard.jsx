import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import api from '@/services/api';

import { 
  BookOpen, 
  Brain, 
  Code, 
  MessageSquare, 
  FileText, 
  Trophy,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    quizzesCompleted: 0,
    totalQuizzes: 0,
    codingProblems: 0,
    totalCodingProblems: 0,
    studyMaterialsRead: 0,
    totalStudyMaterials: 0,
    interviewQuestionsAnswered: 0,
    totalInterviewQuestions: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Get user from localStorage first
        const userData = localStorage.getItem('user');
        if (userData) {
          setUser(JSON.parse(userData));
        }

        // Fetch user profile with progress
        try {
          const profileResponse = await api.getProfile();
          if (profileResponse.success && profileResponse.data?.user) {
            const userProfile = profileResponse.data.user;
            setUser(userProfile);
            
            // Update stats from user progress
            setStats(prev => ({
              ...prev,
              quizzesCompleted: userProfile.progress?.completedQuizzes || 0,
              codingProblems: userProfile.progress?.solvedCodingProblems || 0,
              studyMaterialsRead: userProfile.progress?.studyMaterialsRead || 0,
              totalQuizzes: userProfile.progress?.totalQuizzes || 0,
              totalCodingProblems: userProfile.progress?.totalCodingProblems || 0
            }));
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }

        // Fetch total counts
        try {
          // Get total quizzes
          const quizzesResponse = await api.listQuizzes({ includeUnpublished: false });
          const totalQuizzes = Array.isArray(quizzesResponse) 
            ? quizzesResponse.length 
            : (quizzesResponse.data?.length || quizzesResponse.length || 0);
          
          // Get total coding problems
          const codingResponse = await api.getCodingProblems({ limit: 1000 });
          const totalCoding = codingResponse.data?.problems?.length || codingResponse.data?.total || 0;
          
          // Get total study materials
          const theoryResponse = await api.listTheory();
          const totalTheory = Array.isArray(theoryResponse) 
            ? theoryResponse.length 
            : (theoryResponse.data?.length || theoryResponse.length || 0);
          
          // Get total interview questions
          const interviewResponse = await api.listInterviewQuestions({ includeUnpublished: false });
          const totalInterviews = Array.isArray(interviewResponse) 
            ? interviewResponse.length 
            : (interviewResponse.data?.length || interviewResponse.length || 0);

          setStats(prev => ({
            ...prev,
            totalQuizzes: totalQuizzes || prev.totalQuizzes,
            totalCodingProblems: totalCoding || prev.totalCodingProblems,
            totalStudyMaterials: totalTheory || prev.totalStudyMaterials,
            totalInterviewQuestions: totalInterviews || prev.totalInterviewQuestions
          }));
        } catch (error) {
          console.error('Error fetching totals:', error);
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Calculate overall progress
  const calculateOverallProgress = () => {
    const quizProgress = stats.totalQuizzes > 0 ? (stats.quizzesCompleted / stats.totalQuizzes) : 0;
    const codingProgress = stats.totalCodingProblems > 0 ? (stats.codingProblems / stats.totalCodingProblems) : 0;
    const studyProgress = stats.totalStudyMaterials > 0 ? (stats.studyMaterialsRead / stats.totalStudyMaterials) : 0;
    const interviewProgress = stats.totalInterviewQuestions > 0 ? (stats.interviewQuestionsAnswered / stats.totalInterviewQuestions) : 0;
    
    const totalProgress = quizProgress + codingProgress + studyProgress + interviewProgress;
    const averageProgress = totalProgress > 0 ? (totalProgress / 4) * 100 : 0;
    
    return Math.round(averageProgress);
  };

  const overallProgress = calculateOverallProgress();

  const modules = [
    {
      title: 'Study Materials',
      description: 'Access categorized study content',
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      progress: Math.round((stats.studyMaterialsRead / stats.totalStudyMaterials) * 100),
      link: '/study-materials',
      color: 'bg-blue-50 border-blue-200'
    },
    {
      title: 'MCQ Quizzes',
      description: 'Practice with timed quizzes',
      icon: <Brain className="h-8 w-8 text-primary" />,
      progress: Math.round((stats.quizzesCompleted / stats.totalQuizzes) * 100),
      link: '/quizzes',
      color: 'bg-green-50 border-green-200'
    },
    {
      title: 'Coding Practice',
      description: 'Solve programming problems',
      icon: <Code className="h-8 w-8 text-primary" />,
      progress: Math.round((stats.codingProblems / stats.totalCodingProblems) * 100),
      link: '/coding-practice',
      color: 'bg-purple-50 border-purple-200'
    },
    {
      title: 'Interview Prep',
      description: 'HR & Technical questions',
      icon: <MessageSquare className="h-8 w-8 text-primary" />,
      progress: Math.round((stats.interviewQuestionsAnswered / stats.totalInterviewQuestions) * 100),
      link: '/interview-prep',
      color: 'bg-orange-50 border-orange-200'
    },
    {
      title: 'Resume Analyzer',
      description: 'AI-powered resume review',
      icon: <FileText className="h-8 w-8 text-primary" />,
      progress: 0,
      link: '/resume-analyzer',
      color: 'bg-pink-50 border-pink-200'
    }
  ];

  // Recent activities - can be enhanced later with activity log API
  const recentActivities = [];
  
  // Show placeholder if no activities
  if (recentActivities.length === 0) {
    recentActivities.push({
      action: 'Start your learning journey!',
      time: 'Complete quizzes, solve problems, and read materials to see your activity here.',
      icon: CheckCircle
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={user} onLogout={() => setUser(null)} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={() => setUser(null)} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.name || 'Student'}! 
          </h1>
          <p className="text-muted-foreground">
            Continue your placement preparation journey
          </p>
        </div>

        {/* Progress Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Trophy className="h-8 w-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Overall Progress</p>
                  <p className="text-2xl font-bold">{overallProgress}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Quizzes Completed</p>
                  <p className="text-2xl font-bold">{stats.quizzesCompleted}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Code className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Problems Solved</p>
                  <p className="text-2xl font-bold">{stats.codingProblems}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Materials Read</p>
                  <p className="text-2xl font-bold">{stats.studyMaterialsRead}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Modules */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-foreground mb-6">Learning Modules</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modules.map((module, index) => (
                <Card key={index} className={`hover:shadow-lg transition-shadow ${module.color}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      {module.icon}
                      <span className="text-sm font-medium text-muted-foreground">
                        {module.progress}%
                      </span>
                    </div>
                    <CardTitle className="text-lg">{module.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{module.description}</p>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Progress value={module.progress} className="mb-4" />
                    <Link to={module.link}>
                      <Button className="w-full" variant="outline">
                        Continue Learning
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <activity.icon className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link to="/quizzes">
                  <Button variant="outline" className="w-full justify-start">
                    <Brain className="h-4 w-4 mr-2" />
                    Take a Quiz
                  </Button>
                </Link>
                <Link to="/coding-practice">
                  <Button variant="outline" className="w-full justify-start">
                    <Code className="h-4 w-4 mr-2" />
                    Practice Coding
                  </Button>
                </Link>
                <Link to="/resume-analyzer">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Analyze Resume
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
