import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({
  children,
  requireAdmin = false,
  allowFaculty = false,
  requireStudent = false,
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();
  const role = user?.role;
  const isAdmin = role === 'admin';
  const isFaculty = role === 'faculty';

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Admin-only or admin + faculty panel routes
  if (requireAdmin) {
    if (allowFaculty) {
      if (!isAdmin && !isFaculty) {
        return <Navigate to="/dashboard" replace />;
      }
    } else if (!isAdmin) {
      if (isFaculty) {
        return <Navigate to="/admin/quizzes" replace />;
      }
      return <Navigate to="/dashboard" replace />;
    }
  }

  // Student-only routes
  if (requireStudent && role !== 'student') {
    if (isAdmin) {
      return <Navigate to="/admin" replace />;
    }
    if (isFaculty) {
      return <Navigate to="/admin/quizzes" replace />;
    }
    return <Navigate to="/admin" replace />;
  }

  // Keep staff off student app pages (profile is allowed)
  if ((isAdmin || isFaculty) && !requireAdmin) {
    if (location.pathname === '/profile') {
      return children;
    }
    if (isFaculty) {
      return <Navigate to="/admin/quizzes" replace />;
    }
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;
