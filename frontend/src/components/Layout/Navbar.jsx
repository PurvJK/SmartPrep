import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  MessageSquare,
  User,
  Plus,
  Settings,
  BarChart3,
  Database
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const isActive = (path) => pathname === path;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Brain className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">SmartPrep</span>
            </Link>
          </div>

          {/* Centered Desktop Navigation */}
          {user && (
            <div className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center space-x-2">
              {/* Student Navigation */}
              {user.role === 'student' && (
                <>
                  <Link to="/dashboard">
                    <Button size="sm" variant={isActive('/dashboard') ? 'default' : 'ghost'} className="flex items-center space-x-2">
                      <BookOpen className="h-4 w-4" />
                      <span>Dashboard</span>
                    </Button>
                  </Link>
                  <Link to="/study-materials">
                    <Button size="sm" variant={isActive('/study-materials') ? 'default' : 'ghost'} className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Study Materials</span>
                    </Button>
                  </Link>
                  <Link to="/resume-analyzer">
                    <Button size="sm" variant={isActive('/resume-analyzer') ? 'default' : 'ghost'} className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Resume Analyzer</span>
                    </Button>
                  </Link>
                  <Link to="/quizzes">
                    <Button size="sm" variant={isActive('/quizzes') ? 'default' : 'ghost'} className="flex items-center space-x-2">
                      <Brain className="h-4 w-4" />
                      <span>Quizzes</span>
                    </Button>
                  </Link>
                  <Link to="/coding-practice">
                    <Button size="sm" variant={isActive('/coding-practice') ? 'default' : 'ghost'} className="flex items-center space-x-2">
                      <Code className="h-4 w-4" />
                      <span>Coding</span>
                    </Button>
                  </Link>
                  <Link to="/interview-prep">
                    <Button size="sm" variant={isActive('/interview-prep') ? 'default' : 'ghost'} className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>Interviews</span>
                    </Button>
                  </Link>
                </>
              )}
              {/* Admin Navigation */}
              {user.role === 'admin' && (
                <>
                  {[
                    { to: '/admin', label: 'Dashboard', icon: BarChart3 },
                    { to: '/admin/users', label: 'Users', icon: Users },
                    { to: '/admin/content', label: 'Add Content', icon: Plus },
                    { to: '/admin/quizzes', label: 'Quizzes', icon: Brain },
                    { to: '/admin/coding', label: 'Set Code', icon: Code },
                    { to: '/admin/settings', label: 'Settings', icon: Settings },
                  ].map(item => (
                    <Link key={item.to} to={item.to}>
                      <Button size="sm" variant={isActive(item.to) ? 'default' : 'ghost'} className="flex items-center space-x-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Button>
                    </Link>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Right-side Profile/Logout */}
          {user && (
            <div className="hidden md:flex items-center space-x-3 ml-auto">
              <Link to="/profile">
                <Button size="sm" variant={isActive('/profile') ? 'default' : 'ghost'} className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                 
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
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
            {/* Student Mobile Navigation */}
            {user.role === 'student' && (
              <>
                <Link to="/dashboard" className="block">
                  <Button variant={isActive('/dashboard') ? 'default' : 'ghost'} className="w-full justify-start">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link to="/study-materials" className="block">
                  <Button variant={isActive('/study-materials') ? 'default' : 'ghost'} className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Study Materials
                  </Button>
                </Link>
                <Link to="/resume-analyzer" className="block">
                  <Button variant={isActive('/resume-analyzer') ? 'default' : 'ghost'} className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Resume Analyzer
                  </Button>
                </Link>
                <Link to="/quizzes" className="block">
                  <Button variant={isActive('/quizzes') ? 'default' : 'ghost'} className="w-full justify-start">
                    <Brain className="h-4 w-4 mr-2" />
                    Quizzes
                  </Button>
                </Link>
                <Link to="/coding-practice" className="block">
                  <Button variant={isActive('/coding-practice') ? 'default' : 'ghost'} className="w-full justify-start">
                    <Code className="h-4 w-4 mr-2" />
                    Coding Practice
                  </Button>
                </Link>
                <Link to="/interview-prep" className="block">
                  <Button variant={isActive('/interview-prep') ? 'default' : 'ghost'} className="w-full justify-start">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Interview Prep
                  </Button>
                </Link>
              </>
            )}

            {/* Admin Mobile Navigation */}
            {user.role === 'admin' && (
              <>
                <Link to="/admin" className="block">
                  <Button variant={isActive('/admin') ? 'default' : 'ghost'} className="w-full justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Link to="/admin/users" className="block">
                  <Button variant={isActive('/admin/users') ? 'default' : 'ghost'} className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Users
                  </Button>
                </Link>
                <Link to="/admin/content" className="block">
                  <Button variant={isActive('/admin/content') ? 'default' : 'ghost'} className="w-full justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Content
                  </Button>
                </Link>
                <Link to="/admin/quizzes" className="block">
                  <Button variant={isActive('/admin/quizzes') ? 'default' : 'ghost'} className="w-full justify-start">
                    <Brain className="h-4 w-4 mr-2" />
                    Quizzes
                  </Button>
                </Link>
                <Link to="/admin/coding" className="block">
                  <Button variant={isActive('/admin/coding') ? 'default' : 'ghost'} className="w-full justify-start">
                    <Code className="h-4 w-4 mr-2" />
                    Set Code
                  </Button>
                </Link>
                <Link to="/admin/settings" className="block">
                  <Button variant={isActive('/admin/settings') ? 'default' : 'ghost'} className="w-full justify-start">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                </Link>
              </>
            )}

            {/* Common Navigation */}
            <Link to="/profile" className="block">
              <Button variant={isActive('/profile') ? 'default' : 'ghost'} className="w-full justify-start">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </Link>
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