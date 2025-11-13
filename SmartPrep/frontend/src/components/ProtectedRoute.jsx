import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, requireAdmin = false, requireStudent = false }) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

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

  // Check admin requirement
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Check student requirement - redirect admins to admin panel
  if (requireStudent && user?.role !== 'student') {
    return <Navigate to="/admin" replace />;
  }

  // Prevent admins from accessing student pages
  if (user?.role === 'admin' && !requireAdmin) {
    // Allow access to profile page for admins
    if (location.pathname === '/profile') {
      return children;
    }
    // Redirect all other non-admin pages to admin panel
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;
