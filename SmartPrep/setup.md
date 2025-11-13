# SmartPrep MERN Stack Setup Guide

## Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   Create a `.env` file in the backend directory with the following content:
   ```env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/smartprep
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_secure_123456789
   JWT_EXPIRE=7d
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Frontend URL (for CORS)
   CLIENT_URL=http://localhost:5173
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system:
   ```bash
   # For local MongoDB
   mongod
   
   # Or if using MongoDB as a service
   sudo systemctl start mongod
   ```

5. **Start the backend server**
   ```bash
   npm run dev
   ```

## Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Create environment file**
   Create a `.env` file in the frontend directory with the following content:
   ```env
   # Backend API URL
   VITE_API_URL=http://localhost:5000/api
   ```

3. **Install dependencies** (if not already done)
   ```bash
   npm install
   ```

4. **Start the frontend development server**
   ```bash
   npm run dev
   ```

## Testing the Setup

1. **Backend Health Check**
   Visit: http://localhost:5000/api/health
   You should see a JSON response with server status.

2. **Frontend Application**
   Visit: http://localhost:5173
   You should see the SmartPrep application.

3. **Test Registration**
   - Go to the register page
   - Create a new account
   - You should be redirected to the dashboard

4. **Test Login**
   - Go to the login page
   - Use your registered credentials
   - You should be logged in successfully

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify JWT token

### User Management
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/change-password` - Change password
- `PUT /api/users/progress` - Update user progress
- `GET /api/users` - Get all users (Admin only)
- `GET /api/users/:id` - Get user by ID (Admin only)
- `PUT /api/users/:id/role` - Update user role (Admin only)
- `PUT /api/users/:id/deactivate` - Deactivate user (Admin only)

## Database Schema

The application uses MongoDB with the following main collections:

### Users Collection
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum: ['student', 'admin']),
  avatar: String,
  isActive: Boolean,
  lastLogin: Date,
  profile: {
    phone: String,
    college: String,
    branch: String,
    year: String,
    skills: [String],
    resume: String
  },
  progress: {
    totalQuizzes: Number,
    completedQuizzes: Number,
    totalCodingProblems: Number,
    solvedCodingProblems: Number,
    studyMaterialsRead: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

## Security Features

- JWT Authentication with expiration
- Password hashing using bcrypt
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Input validation
- Role-based access control
- Security headers with Helmet

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check the MONGODB_URI in .env file
   - Verify MongoDB is accessible on the specified port

2. **CORS Error**
   - Check CLIENT_URL in backend .env file
   - Ensure frontend is running on the correct port

3. **JWT Token Error**
   - Check JWT_SECRET in backend .env file
   - Ensure token is being sent in Authorization header

4. **Port Already in Use**
   - Change PORT in backend .env file
   - Kill existing processes using the port

### Development Tips

1. **Backend Logs**
   - Check console output for detailed error messages
   - Use `npm run dev` for development with auto-restart

2. **Frontend Debugging**
   - Check browser console for API errors
   - Use React DevTools for component debugging

3. **Database Management**
   - Use MongoDB Compass for database visualization
   - Check database connection in backend logs

## Production Deployment

For production deployment:

1. **Backend**
   - Set NODE_ENV=production
   - Use a secure JWT_SECRET
   - Configure MongoDB Atlas or production MongoDB
   - Set up proper CORS origins

2. **Frontend**
   - Build the application: `npm run build`
   - Serve static files with a web server
   - Update VITE_API_URL to production backend URL

3. **Security**
   - Use HTTPS in production
   - Implement proper rate limiting
   - Set up monitoring and logging
   - Regular security updates
