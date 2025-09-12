# SmartPrep Backend API

A comprehensive backend API for SmartPrep - A placement preparation platform built with Node.js, Express, MongoDB, and JWT authentication.

## Features

- 🔐 JWT Authentication & Authorization
- 👤 User Management (Registration, Login, Profile)
- 🛡️ Role-based Access Control (Student/Admin)
- 📊 User Progress Tracking
- 🔒 Password Security with bcrypt
- 🚀 Rate Limiting & Security Headers
- 📝 Input Validation & Error Handling
- 🗄️ MongoDB Database Integration

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt, helmet, cors, rate-limiting
- **Validation**: express-validator

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smartprep/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the backend directory:
   ```env
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/smartprep
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_secure
   JWT_EXPIRE=7d
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Frontend URL (for CORS)
   CLIENT_URL=http://localhost:5173
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/register` | Register new user | Public |
| POST | `/login` | User login | Public |
| GET | `/me` | Get current user | Private |
| POST | `/logout` | User logout | Private |
| GET | `/verify` | Verify JWT token | Private |

### User Routes (`/api/users`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| PUT | `/profile` | Update user profile | Private |
| PUT | `/change-password` | Change password | Private |
| PUT | `/progress` | Update user progress | Private |
| GET | `/` | Get all users | Admin |
| GET | `/:id` | Get user by ID | Admin |
| PUT | `/:id/role` | Update user role | Admin |
| PUT | `/:id/deactivate` | Deactivate user | Admin |

## Request/Response Examples

### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### Login User
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

### Update Profile
```bash
PUT /api/users/profile
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "John Smith",
  "phone": "+1234567890",
  "college": "ABC University",
  "branch": "Computer Science",
  "year": "4th",
  "skills": ["JavaScript", "React", "Node.js"]
}
```

## Database Schema

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
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

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure authentication with expiration
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS**: Configured for frontend domain
- **Helmet**: Security headers
- **Input Validation**: express-validator middleware
- **Error Handling**: Comprehensive error responses

## Development

### Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests (to be implemented)

### Project Structure
```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   ├── authController.js    # Authentication logic
│   └── userController.js    # User management logic
├── middleware/
│   ├── auth.js             # JWT authentication
│   └── validation.js       # Input validation
├── models/
│   └── User.js             # User schema
├── routes/
│   ├── auth.js             # Authentication routes
│   └── users.js            # User routes
├── utils/
│   └── generateToken.js    # JWT token generation
├── server.js               # Main server file
├── package.json            # Dependencies
└── README.md              # Documentation
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/smartprep` |
| `JWT_SECRET` | Secret key for JWT signing | Required |
| `JWT_EXPIRE` | JWT token expiration time | `7d` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `CLIENT_URL` | Frontend URL for CORS | `http://localhost:5173` |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.
