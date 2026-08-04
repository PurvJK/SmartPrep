import { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          // Verify token with backend
          const response = await apiService.verifyToken();
          if (response.success) {
            setToken(storedToken);
            setUser(JSON.parse(storedUser));
          } else {
            // Token is invalid, clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await apiService.login(credentials);
      
      if (response.success) {
        const { token: newToken, user: userData } = response.data;
        
        // Store in localStorage
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Update state
        setToken(newToken);
        setUser(userData);
        
        return { success: true, user: userData };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { 
        success: false, 
        message: error.message || 'Login failed. Please try again.' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData);
      
      if (response.success) {
        const { token: newToken, user: newUser } = response.data;
        
        // Store in localStorage
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        
        // Update state
        setToken(newToken);
        setUser(newUser);
        
        return { success: true, user: newUser };
      }
    } catch (error) {
      console.error('Registration failed:', error);
      return { 
        success: false, 
        message: error.message || 'Registration failed. Please try again.' 
      };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint
      await apiService.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear storage and state regardless of API call result
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await apiService.updateProfile(profileData);
      
      if (response.success) {
        updateUser(response.data.user);
        return { success: true, user: response.data.user };
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      return { 
        success: false, 
        message: error.message || 'Profile update failed. Please try again.' 
      };
    }
  };

  const changePassword = async (passwordData) => {
    try {
      const response = await apiService.changePassword(passwordData);
      return { success: response.success, message: response.message };
    } catch (error) {
      console.error('Password change failed:', error);
      return { 
        success: false, 
        message: error.message || 'Password change failed. Please try again.' 
      };
    }
  };

  const updateProgress = async (progressData) => {
    try {
      const response = await apiService.updateProgress(progressData);
      
      if (response.success) {
        // Update user progress in state
        const updatedUser = { ...user, progress: response.data.progress };
        updateUser(updatedUser);
        return { success: true, progress: response.data.progress };
      }
    } catch (error) {
      console.error('Progress update failed:', error);
      return { 
        success: false, 
        message: error.message || 'Progress update failed. Please try again.' 
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    updateProfile,
    changePassword,
    updateProgress,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'admin',
    isFaculty: user?.role === 'faculty',
    isStudent: user?.role === 'student',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
