import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Layout/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

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
  const [stats, setStats] = useState({
    quizzesCompleted: 15,
    totalQuizzes: 50,
    codingProblems: 8,
    totalCodingProblems: 30,
    studyMaterialsRead: 12,
    totalStudyMaterials: 25,
    interviewQuestionsAnswered: 25,
    totalInterviewQuestions: 100
  });

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Calculate overall progress
  const overallProgress = Math.round(
    ((stats.quizzesCompleted / stats.totalQuizzes) +
     (stats.codingProblems / stats.totalCodingProblems) +
     (stats.studyMaterialsRead / stats.totalStudyMaterials) +
     (stats.interviewQuestionsAnswered / stats.totalInterviewQuestions)) / 4 * 100
  );

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

  const recentActivities = [
    { action: 'Completed Quiz: Data Structures', time: '2 hours ago', icon: CheckCircle },
    { action: 'Read: Operating Systems Basics', time: '5 hours ago', icon: BookOpen },
    { action: 'Solved: Two Sum Problem', time: '1 day ago', icon: Code },
    { action: 'Practiced: HR Interview Questions', time: '2 days ago', icon: MessageSquare }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} onLogout={() => setUser(null)} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, Purv Kapuriya! 
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
                <Clock className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Study Hours</p>
                  <p className="text-2xl font-bold">45</p>
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
