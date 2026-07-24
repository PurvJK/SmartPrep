# SmartPrep - Complete Functionality Documentation

## 📋 Overview
SmartPrep is a comprehensive placement preparation platform built with MERN stack (MongoDB, Express.js, React, Node.js) that helps students prepare for technical interviews and placements.

---

## 🔐 Authentication & User Management

### User Authentication
- **User Registration**
  - Email validation
  - Password hashing (bcrypt)
  - Role assignment (Student/Admin)
  - JWT token generation

- **User Login**
  - Email/password authentication
  - JWT token-based session management
  - Token expiration (7 days)
  - Remember me functionality

- **User Profile Management**
  - View profile information
  - Update personal details (name, phone, college, branch, year)
  - Manage skills list
  - Change password with current password verification
  - Profile picture/avatar support

- **User Progress Tracking**
  - Track completed quizzes
  - Track solved coding problems
  - Track study materials read
  - Overall progress calculation
  - Progress statistics dashboard

### Admin Features
- **User Management**
  - View all users
  - Get user by ID
  - Update user roles (Student/Admin)
  - Deactivate users
  - **Delete users** (with self-deletion protection)
  - User pagination

---

## 📚 Study Materials

### Content Management
- **Categories Supported**
  - DSA (Data Structures & Algorithms)
  - Operating Systems (OS)
  - Database Management (DBMS)
  - Aptitude
  - Programming

- **DSA Topics Covered**
  - Array Data Structure
  - String Data Structure
  - Hashing Data Structure
  - Linked List Data Structure
  - Stack Data Structure
  - Queue Data Structure
  - Tree Data Structure
  - Graph Data Structure
  - Trie Data Structure

- **Features**
  - Categorized study content
  - Markdown support for rich text
  - Image upload and embedding
  - Difficulty levels (Easy, Medium, Hard)
  - Search and filter by category
  - Read time estimation

### Admin Study Materials Management
- Create new study materials
- Edit existing materials
- Delete materials
- Rich text editor with formatting toolbar
  - Bold, Italic, Underline
  - Headings (H1, H2, H3)
  - Lists (ordered/unordered)
  - Code blocks
- Image upload to Cloudinary
- Preview before publishing

---

## 🧠 MCQ Quizzes

### Student Features
- **Quiz Taking**
  - Browse available quizzes
  - Filter by category, difficulty
  - Timed quizzes with countdown timer
  - Multiple choice questions (MCQ)
  - Instant feedback on answers
  - Score calculation
  - Quiz completion tracking

- **Quiz Features**
  - Question explanations
  - Category-based organization
  - Difficulty levels
  - Time limit per quiz
  - Progress tracking

### Admin Quiz Management
- **Create Quizzes**
  - Add quiz title and description
  - Set category and difficulty
  - Configure time limit
  - Add multiple questions
  - Set correct answers
  - Add explanations for answers
  - Publish/Draft status

- **Quiz Management**
  - Edit existing quizzes
  - Delete quizzes
  - View all quizzes
  - Manage quiz questions
  - Bulk operations

---

## 💻 Coding Practice

### Student Features
- **Problem Solving**
  - Browse coding problems
  - Filter by difficulty (Easy, Medium, Hard)
  - Filter by category (Arrays, Strings, Trees, Graphs, etc.)
  - Search problems by title/description
  - Problem difficulty badges

- **Code Editor**
  - Monaco Editor integration
  - Multiple language support:
    - JavaScript
    - Python
    - Java
    - C++
  - Syntax highlighting
  - Auto-completion
  - Dark theme
  - Code formatting
  - Line numbers

- **Code Execution**
  - Run code with custom input
  - Submit solution for test cases
  - Real-time output display
  - Error handling and display
  - Test case results
  - Judge0 integration for code execution

- **Problem Details**
  - Problem description
  - Examples with explanations
  - Constraints
  - Test cases
  - Hints (show/hide)
  - **Solution code** (show/hide)
  - Starter code templates per language

- **Resizable Interface**
  - Split view: Problem description | Code editor
  - Drag to resize panels
  - Responsive layout

### Admin Coding Problems Management
- **Create Problems**
  - Add problem title and description
  - Set difficulty and category
  - Add examples with explanations
  - Define constraints
  - Add test cases (input/output)
  - Add hints
  - **Add solution code**
  - Create starter code templates for each language
  - Set time and memory limits

- **Problem Management**
  - Edit problems
  - Delete problems
  - View all problems
  - Manage test cases
  - Update solutions

---

## 💬 Interview Preparation

### Student Features
- **Interview Questions**
  - Browse interview questions
  - Filter by category:
    - HR Questions
    - Technical Questions
    - Behavioral Questions
  - Filter by difficulty
  - Search questions
  - View answers
  - Tips and examples
  - Tags for organization

- **Question Categories**
  - HR Interview Questions
  - Technical Interview Questions
  - Behavioral Questions
  - Company-specific questions

### Admin Interview Questions Management
- **Create Questions**
  - Add question text
  - Add detailed answers
  - Set category and subcategory
  - Set difficulty level
  - Add tags
  - Add tips
  - Add examples
  - Publish/Draft status

- **Question Management**
  - Edit questions
  - Delete questions
  - View all questions
  - Bulk operations

---

## 📄 Resume Analyzer

### AI-Powered Resume Analysis
- **Resume Upload**
  - Upload PDF/DOCX files
  - Text extraction from documents
  - File size limit: 10MB

- **Resume Analysis**
  - **Structured Analysis**
    - Extract personal information (name, email, phone)
    - Extract skills
    - Extract education details
    - Extract work experience
    - Extract certifications
    - Calculate total experience

  - **Scoring System**
    - Overall resume score (0-100)
    - Component scores:
      - Skill match score
      - Experience fit
      - Title fit
      - Education fit
      - Achievements
      - Formatting
      - Keyword coverage

  - **Analysis Features**
    - Job description matching
    - Missing skills identification
    - Keyword coverage analysis
    - ATS (Applicant Tracking System) compatibility
    - Resume suggestions

- **Resume Suggestions**
  - Actionable improvement tips
  - ATS optimization tips
  - Rewrite ideas
  - Missing skills recommendations
  - Formatting suggestions

- **Resume History**
  - View past analyses
  - Filter by score range
  - Search by skills
  - View analysis details

---

## 📊 Dashboard & Analytics

### Student Dashboard
- **Welcome Section**
  - Personalized greeting with user name
  - Dynamic progress overview

- **Progress Cards**
  - Overall progress percentage
  - Quizzes completed count
  - Coding problems solved count
  - Study materials read count

- **Learning Modules**
  - Study Materials progress
  - MCQ Quizzes progress
  - Coding Practice progress
  - Interview Prep progress
  - Resume Analyzer access
  - Progress bars for each module
  - Quick access buttons

- **Recent Activity**
  - Activity feed (placeholder for future implementation)
  - Learning journey tracking

- **Quick Actions**
  - Take a Quiz
  - Practice Coding
  - Analyze Resume

- **Dynamic Data**
  - Real-time progress updates
  - Fetches data from backend
  - Calculates progress percentages
  - Shows actual completion statistics

---

## 👨‍💼 Admin Panel

### Navigation
- Single unified navigation bar
- Menu items:
  - Users
  - Add Content
  - Quizzes
  - Interview Questions
  - Set Code (Coding Problems)
  - (Settings removed)

### User Management
- View all users with pagination
- View user details
- Edit user information
- Change user roles
- Deactivate users
- **Delete users** (with confirmation)

### Content Management
- **Study Materials**
  - Create/Edit/Delete study materials
  - Rich text editor
  - Image upload
  - Category management
  - Difficulty levels
  - Resizable panels (form | list)

### Quiz Management
- **Quizzes**
  - Create/Edit/Delete quizzes
  - Add/Edit questions
  - Set correct answers
  - Add explanations
  - Publish/Draft management
  - Resizable panels (form | list)

### Interview Questions Management
- **Interview Questions**
  - Create/Edit/Delete questions
  - Category management
  - Add answers, tips, examples
  - Tag management
  - Resizable panels (form | list)

### Coding Problems Management
- **Coding Problems**
  - Create/Edit/Delete problems
  - Add test cases
  - Add solutions
  - Create starter code templates
  - Manage constraints
  - Resizable panels (form | list)

### Admin Panel Features
- **Resizable Interface**
  - All admin sections have resizable panels
  - Drag handle to adjust panel sizes
  - Form on left, list on right
  - Dynamic sizing (30-70% range)
  - Maintains size during session

---

## 🎨 UI/UX Features

### Design System
- **Component Library**
  - shadcn/ui components
  - Consistent design language
  - Dark mode support
  - Responsive design

### Navigation
- **Navbar**
  - Role-based navigation
  - Student menu items
  - Admin menu items
  - Mobile responsive menu
  - User profile access
  - Logout functionality

### User Experience
- **Loading States**
  - Spinner animations
  - Skeleton loaders
  - Progress indicators

- **Toast Notifications**
  - Success messages
  - Error messages
  - Info notifications
  - Auto-dismiss

- **Protected Routes**
  - Authentication required
  - Role-based access (Student/Admin)
  - Redirect to login if not authenticated

---

## 🔧 Technical Features

### Backend
- **API Architecture**
  - RESTful API design
  - Express.js framework
  - MongoDB database
  - Mongoose ODM

- **Security**
  - JWT authentication
  - Password hashing (bcrypt)
  - CORS protection
  - Rate limiting
  - Input validation
  - Role-based access control
  - Helmet security headers

- **Services Integration**
  - Judge0 API for code execution
  - Cloudinary for image uploads
  - Resume parsing service

### Frontend
- **Technology Stack**
  - React 18
  - Vite build tool
  - React Router for navigation
  - TanStack Query for data fetching
  - Tailwind CSS for styling
  - Monaco Editor for code editing

- **State Management**
  - React Context API (AuthContext)
  - Local state management
  - React Query for server state

### Database Models
- **User Model**
  - Authentication data
  - Profile information
  - Progress tracking
  - Role management

- **Quiz Model**
  - Questions and answers
  - Categories and difficulty
  - Time limits
  - Publishing status

- **CodingProblem Model**
  - Problem details
  - Test cases
  - Solutions
  - Starter code templates
  - Constraints

- **InterviewQuestion Model**
  - Questions and answers
  - Categories
  - Tags and tips
  - Examples

- **Theory/StudyMaterial Model**
  - Content in Markdown
  - Categories
  - Images
  - Difficulty levels

- **ResumeAnalysis Model**
  - Extracted resume data
  - Scoring information
  - Suggestions
  - Analysis metadata

- **Submission Model**
  - Code submissions
  - Test results
  - Execution metrics

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify JWT token

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/change-password` - Change password
- `PUT /api/users/progress` - Update progress
- `GET /api/users` - Get all users (Admin)
- `GET /api/users/:id` - Get user by ID (Admin)
- `PUT /api/users/:id/role` - Update role (Admin)
- `PUT /api/users/:id/deactivate` - Deactivate user (Admin)
- `DELETE /api/users/:id` - Delete user (Admin)

### Study Materials
- `GET /api/theory` - List study materials
- `GET /api/theory/:id` - Get material by ID
- `POST /api/theory` - Create material (Admin)
- `PUT /api/theory/:id` - Update material (Admin)
- `DELETE /api/theory/:id` - Delete material (Admin)

### Quizzes
- `GET /api/quizzes` - List quizzes
- `GET /api/quizzes/:id` - Get quiz by ID
- `POST /api/quizzes` - Create quiz (Admin)
- `PUT /api/quizzes/:id` - Update quiz (Admin)
- `DELETE /api/quizzes/:id` - Delete quiz (Admin)

### Coding Problems
- `GET /api/coding-problems` - List problems
- `GET /api/coding-problems/:id` - Get problem by ID
- `POST /api/coding-problems` - Create problem (Admin)
- `PUT /api/coding-problems/:id` - Update problem (Admin)
- `DELETE /api/coding-problems/:id` - Delete problem (Admin)
- `POST /api/coding-problems/:id/run` - Run code
- `POST /api/coding-problems/:id/submit` - Submit solution
- `GET /api/coding-problems/:id/submissions` - Get submissions

### Interview Questions
- `GET /api/interview-questions` - List questions
- `GET /api/interview-questions/:id` - Get question by ID
- `POST /api/interview-questions` - Create question (Admin)
- `PUT /api/interview-questions/:id` - Update question (Admin)
- `DELETE /api/interview-questions/:id` - Delete question (Admin)

### Resume Analysis
- `POST /api/resume/upload` - Upload resume file
- `POST /api/resume/analyze` - Analyze resume (AI)
- `POST /api/resume/suggestions` - Get suggestions
- `POST /api/resume/analyze-structured` - Structured analysis
- `GET /api/resume/analyses` - List analyses

### File Upload
- `POST /api/upload` - Upload images

---

## 🚀 Key Features Summary

### For Students
1. ✅ User registration and authentication
2. ✅ Personalized dashboard with progress tracking
3. ✅ Study materials with multiple categories
4. ✅ MCQ quizzes with scoring
5. ✅ Coding practice with online editor
6. ✅ Interview question bank
7. ✅ AI-powered resume analyzer
8. ✅ Profile management
9. ✅ Progress tracking across all modules

### For Admins
1. ✅ Complete user management (view, edit, delete, deactivate)
2. ✅ Study materials CRUD operations
3. ✅ Quiz creation and management
4. ✅ Interview questions management
5. ✅ Coding problems management with solutions
6. ✅ Resizable admin panels for better workflow
7. ✅ Rich text editor for content creation
8. ✅ Image upload functionality
9. ✅ Bulk operations support

### Technical Highlights
1. ✅ MERN stack architecture
2. ✅ JWT-based authentication
3. ✅ Role-based access control
4. ✅ Real-time code execution (Judge0)
5. ✅ AI resume analysis
6. ✅ Responsive design
7. ✅ Dark mode support
8. ✅ Resizable UI components
9. ✅ Dynamic dashboard with real-time data
10. ✅ File upload and management

---

## 📝 Notes

- All admin sections now have resizable panels for better usability
- Dashboard is fully dynamic and fetches real-time data
- Solution display in coding practice is now functional
- User deletion feature added with safety checks
- Settings button removed from admin navigation
- Interview Questions added to admin navigation

---

*Last Updated: Based on current codebase analysis*

