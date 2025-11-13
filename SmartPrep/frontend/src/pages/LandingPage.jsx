import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Brain, 
  BookOpen, 
  Code, 
  MessageSquare, 
  FileText, 
  BarChart, 
  Users,
  CheckCircle 
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const LandingPage = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  
  const features = [
    {
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      title: "Study Materials",
      description: "Comprehensive study materials for Aptitude, DSA, OS, DBMS, and more"
    },
    {
      icon: <Brain className="h-8 w-8 text-primary" />,
      title: "MCQ Quizzes",
      description: "Practice with categorized quizzes and track your performance"
    },
    {
      icon: <Code className="h-8 w-8 text-primary" />,
      title: "Coding Practice",
      description: "Online coding editor with multiple programming languages"
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-primary" />,
      title: "Interview Prep",
      description: "HR and technical interview questions to boost confidence"
    },
    {
      icon: <FileText className="h-8 w-8 text-primary" />,
      title: "Resume Analyzer",
      description: "AI-powered resume analysis with improvement suggestions"
    },
    {
      icon: <BarChart className="h-8 w-8 text-primary" />,
      title: "Performance Analytics",
      description: "Track your progress with detailed analytics and insights"
    }
  ];

  const benefits = [
    "Personalized learning experience",
    "Comprehensive placement preparation", 
    "Track progress and performance",
    "Practice coding in real-time",
    "Expert-curated content",
    "Interview preparation support"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">SmartPrep</span>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-muted-foreground">Hi, {user?.name || 'User'}</span>
                  <Link to="/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button variant="ghost">Login</Button>
                  </Link>
                  <Link to="/register">
                    <Button>Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
            Ace Your Campus
            <span className="text-primary block">Placements</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            SmartPrep is your comprehensive platform for placement preparation. 
            Study, practice, and track your progress with AI-powered personalization.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <>
                <Link to="/dashboard">
                  <Button size="lg" className="text-lg px-8 py-3">
                    Go to Dashboard
                  </Button>
                </Link>
                <Link to="/study-materials">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                    Start Learning
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg" className="text-lg px-8 py-3">
                    Start Learning Today
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                    Login to Continue
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive tools and resources designed specifically for campus placement preparation
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center p-6 hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Why Choose SmartPrep?
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                    <span className="text-lg text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <div className="text-center">
                <Users className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-foreground mb-2">
                  Join 1000+ Students
                </h3>
                <p className="text-muted-foreground mb-6">
                  Students are already using SmartPrep to prepare for their dream jobs
                </p>
                <Link to="/register">
                  <Button size="lg" className="w-full">
                    Start Your Journey
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Brain className="h-8 w-8" />
              <span className="text-xl font-bold">SmartPrep</span>
            </div>
            <p className="text-background/80 mb-4">
              Empowering students to achieve their placement goals
            </p>
            <div className="flex justify-center space-x-6">
              {isAuthenticated ? (
                <>
                  <Link to="/dashboard" className="text-background/80 hover:text-background">
                    Dashboard
                  </Link>
                  <Link to="/study-materials" className="text-background/80 hover:text-background">
                    Study Materials
                  </Link>
                  <Link to="/quizzes" className="text-background/80 hover:text-background">
                    Quizzes
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-background/80 hover:text-background">
                    Login
                  </Link>
                  <Link to="/register" className="text-background/80 hover:text-background">
                    Register
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;