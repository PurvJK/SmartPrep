import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Users, 
  LogOut, 
  Menu, 
  X,
  Brain,
  FileText,
  Code,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">SmartPrep</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {user && (
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/dashboard">
                <Button variant="ghost" className="flex items-center space-x-2">
                  <BookOpen className="h-4 w-4" />
                  <span>Dashboard</span>
                </Button>
              </Link>
              
              <Link to="/study-materials">
                <Button variant="ghost" className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Study Materials</span>
                </Button>
              </Link>
              
              <Link to="/quizzes">
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Brain className="h-4 w-4" />
                  <span>Quizzes</span>
                </Button>
              </Link>
              
              <Link to="/coding-practice">
                <Button variant="ghost" className="flex items-center space-x-2">
                  <Code className="h-4 w-4" />
                  <span>Coding</span>
                </Button>
              </Link>
              
              <Link to="/interview-prep">
                <Button variant="ghost" className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4" />
                  <span>Interviews</span>
                </Button>
              </Link>

              {user.role === 'admin' && (
                <Link to="/admin">
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <Users className="h-4 w-4" />
                    <span>Admin</span>
                  </Button>
                </Link>
              )}

              <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-border">
                <span className="text-sm text-muted-foreground">Hi, {user?.name || 'User'}</span>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          )}

          {/* Mobile menu button */}
          {user && (
            <div className="md:hidden flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        {user && isMenuOpen && (
          <div className="md:hidden py-4 space-y-2">
            <Link to="/dashboard" className="block">
              <Button variant="ghost" className="w-full justify-start">
                <BookOpen className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <Link to="/study-materials" className="block">
              <Button variant="ghost" className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Study Materials
              </Button>
            </Link>
            <Link to="/quizzes" className="block">
              <Button variant="ghost" className="w-full justify-start">
                <Brain className="h-4 w-4 mr-2" />
                Quizzes
              </Button>
            </Link>
            <Link to="/coding-practice" className="block">
              <Button variant="ghost" className="w-full justify-start">
                <Code className="h-4 w-4 mr-2" />
                Coding Practice
              </Button>
            </Link>
            <Link to="/interview-prep" className="block">
              <Button variant="ghost" className="w-full justify-start">
                <MessageSquare className="h-4 w-4 mr-2" />
                Interview Prep
              </Button>
            </Link>
            {user.role === 'admin' && (
              <Link to="/admin" className="block">
                <Button variant="ghost" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  Admin Panel
                </Button>
              </Link>
            )}
            <div className="pt-2 border-t border-border">
              <Button variant="outline" className="w-full" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
