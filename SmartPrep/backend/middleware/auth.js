import jwt from 'jsonwebtoken';

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  let token;

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token and avoid a DB round-trip for every authenticated request
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id || decoded._id || decoded.userId;

      req.user = {
        id: userId?.toString?.() || userId,
        _id: userId,
        role: decoded.role || 'student',
        isActive: decoded.isActive !== false,
        email: decoded.email || ''
      };

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account has been deactivated'
        });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token'
    });
  }
};

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Optional auth - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id || decoded._id || decoded.userId;

      req.user = {
        id: userId?.toString?.() || userId,
        _id: userId,
        role: decoded.role || 'student',
        isActive: decoded.isActive !== false,
        email: decoded.email || ''
      };
    } catch (error) {
      // Token is invalid, but we don't fail the request
      console.log('Optional auth token invalid:', error.message);
    }
  }

  next();
};
