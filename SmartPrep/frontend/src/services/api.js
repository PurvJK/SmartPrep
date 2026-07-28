const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get auth token from localStorage
  getToken() {
    return localStorage.getItem('token');
  }

  // Get headers with auth token
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = this.getToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: this.getHeaders(options.includeAuth !== false),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async register(userData) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      includeAuth: false,
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      includeAuth: false,
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  async verifyToken() {
    return this.request('/auth/verify');
  }

  // User methods
  async getProfile() {
    return this.request('/users/profile');
  }

  async updateProfile(profileData) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async changePassword(passwordData) {
    return this.request('/users/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  async updateProgress(progressData) {
    return this.request('/users/progress', {
      method: 'PUT',
      body: JSON.stringify(progressData),
    });
  }

  // Study materials methods
  // Deprecated legacy study materials API removed

  // Study theory methods
  // Placement-theory style theory APIs
  async listTheory(category) {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.request(`/theory${query}`, { includeAuth: false });
  }

  // Quiz methods
  async listQuizzes({ category, difficulty, includeUnpublished } = {}) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (difficulty) params.set('difficulty', difficulty);
    if (includeUnpublished) params.set('includeUnpublished', includeUnpublished);
    const query = params.toString();
    return this.request(`/quizzes${query ? `?${query}` : ''}`, {
      includeAuth: includeUnpublished ? true : false
    });
  }

  async getQuizById(id) {
    return this.request(`/quizzes/${id}`);
  }

  async createQuiz(quizData) {
    return this.request('/quizzes', {
      method: 'POST',
      body: JSON.stringify(quizData),
    });
  }

  async updateQuiz(id, quizData) {
    return this.request(`/quizzes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(quizData),
    });
  }

  async deleteQuiz(id) {
    return this.request(`/quizzes/${id}`, {
      method: 'DELETE',
    });
  }

  async listCompetitions({ includeUnpublished } = {}) {
    const params = new URLSearchParams();
    if (includeUnpublished) params.set('includeUnpublished', includeUnpublished);
    return this.request(`/competitions${params.toString() ? `?${params.toString()}` : ''}`, {
      includeAuth: includeUnpublished ? true : false
    });
  }

  async getCompetitionById(id) {
    return this.request(`/competitions/${id}`, {
      includeAuth: true
    });
  }

  async createCompetition(competitionData) {
    return this.request('/competitions', {
      method: 'POST',
      body: JSON.stringify(competitionData),
    });
  }

  async updateCompetition(id, competitionData) {
    return this.request(`/competitions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(competitionData),
    });
  }

  async deleteCompetition(id) {
    return this.request(`/competitions/${id}`, {
      method: 'DELETE',
    });
  }

  async getTheoryById(id) {
    return this.request(`/theory/${id}`, { includeAuth: false });
  }

  async createTheory({ category, title, description, difficulty, content }) {
    return this.request('/theory', {
      method: 'POST',
      body: JSON.stringify({ category, title, description, difficulty, content }),
    });
  }

  async updateTheory(id, { category, title, description, difficulty, content }) {
    return this.request(`/theory/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ category, title, description, difficulty, content }),
    });
  }

  async deleteTheory(id) {
    return this.request(`/theory/${id}`, {
      method: 'DELETE',
    });
  }

  async uploadTheoryImages(files) {
    const url = `${this.baseURL}/upload`;
    const formData = new FormData();
    for (const file of files) {
      formData.append('images', file);
    }
    const headers = this.getHeaders();
    delete headers['Content-Type'];
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data; // { urls: [] }
  }

  // Coding problems methods
  async getCodingProblems({ difficulty, category, q, page = 1, limit = 10 } = {}) {
    const params = new URLSearchParams();
    if (difficulty) params.set('difficulty', difficulty);
    if (category) params.set('category', category);
    if (q) params.set('q', q);
    params.set('page', page);
    params.set('limit', limit);
    return this.request(`/coding-problems?${params.toString()}`);
  }

  async getCodingProblemById(id) {
    return this.request(`/coding-problems/${id}`);
  }

  async createCodingProblem(problem) {
    return this.request('/coding-problems', {
      method: 'POST',
      body: JSON.stringify(problem),
    });
  }

  async updateCodingProblem(id, updates) {
    return this.request(`/coding-problems/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteCodingProblem(id) {
    return this.request(`/coding-problems/${id}`, {
      method: 'DELETE',
    });
  }

  async runCode(problemId, { code, language, stdin = '' }) {
    return this.request(`/coding-problems/${problemId}/run`, {
      method: 'POST',
      body: JSON.stringify({ code, language, stdin }),
    });
  }

  async submitSolution(problemId, { code, language }) {
    return this.request(`/coding-problems/${problemId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ code, language }),
    });
  }

  async getSubmissions(problemId) {
    return this.request(`/coding-problems/${problemId}/submissions`);
  }

  // Quiz attempt methods
  async saveQuizAttempt({ quizId, answers, timeTaken }) {
    return this.request('/attempts', {
      method: 'POST',
      body: JSON.stringify({ quizId, answers, timeTaken })
    });
  }

  async getAttemptById(id) {
    return this.request(`/attempts/${id}`);
  }

  async getMyAttempts() {
    return this.request('/attempts/my');
  }

  // Admin methods
  async getAllUsers(page = 1, limit = 10) {
    return this.request(`/users?page=${page}&limit=${limit}`);
  }

  async getUserById(userId) {
    return this.request(`/users/${userId}`);
  }

  async updateUserRole(userId, role) {
    return this.request(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async updateUserProfile(userId, profileData) {
    return this.request(`/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async deactivateUser(userId) {
    return this.request(`/users/${userId}/deactivate`, {
      method: 'PUT',
    });
  }

  async deleteUser(userId) {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    });
  }

  // Resume analysis methods
  async analyzeResume(resumeText, jobDescription = '') {
    return this.request('/resume/analyze', {
      method: 'POST',
      body: JSON.stringify({ resumeText, jobDescription }),
    });
  }

  async getResumeSuggestions(resumeText, focusArea) {
    return this.request('/resume/suggestions', {
      method: 'POST',
      body: JSON.stringify({ resumeText, focusArea }),
    });
  }

  async getResumeHistory() {
    return this.request('/resume/history');
  }

  async uploadResumeFile(file) {
    const url = `${this.baseURL}/resume/upload`;
    const formData = new FormData();
    formData.append('file', file);

    const headers = this.getHeaders();
    delete headers['Content-Type']; // Let browser set multipart boundary

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
  }

  async analyzeResumeStructured({ text, jobDescription, originalFileName }) {
    return this.request('/resume/analyze-structured', {
      method: 'POST',
      body: JSON.stringify({ text, jobDescription, originalFileName }),
    });
  }

  async updateJobDescriptionVisibility(withJobDescription = true) {
    return this.request('/resume/jobdesc-visibility', {
      method: 'POST',
      body: JSON.stringify({ withJobDescription }),
    });
  }

  async processResumeWithHF(file) {
    const url = `${this.baseURL}/resume/process-hf`;
    const formData = new FormData();
    formData.append('file', file);

    const headers = this.getHeaders();
    delete headers['Content-Type'];

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    return data;
  }

  async generateCoverLetter(resumeText, jobDescription = '', { temperature, max_tokens } = {}) {
    return this.request('/resume/cover-letter', {
      method: 'POST',
      body: JSON.stringify({ resumeText, jobDescription, temperature, max_tokens }),
    });
  }

  async generateInterviewQuestions(jobDescription, { temperature, max_tokens } = {}) {
    return this.request('/resume/interview-questions', {
      method: 'POST',
      body: JSON.stringify({ jobDescription, temperature, max_tokens }),
    });
  }

  async listAnalyses({ q, minScore, maxScore, skill, page = 1, limit = 10 } = {}) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (minScore) params.set('minScore', minScore);
    if (maxScore) params.set('maxScore', maxScore);
    if (skill) params.set('skill', skill);
    params.set('page', page);
    params.set('limit', limit);
    return this.request(`/resume/analyses?${params.toString()}`);
  }

  // Interview questions methods
  async listInterviewQuestions({ category, difficulty, includeUnpublished } = {}) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (difficulty) params.set('difficulty', difficulty);
    if (includeUnpublished) params.set('includeUnpublished', includeUnpublished);
    const query = params.toString();
    return this.request(`/interview-questions${query ? `?${query}` : ''}`, {
      includeAuth: includeUnpublished ? true : false
    });
  }

  async getInterviewQuestionById(id) {
    return this.request(`/interview-questions/${id}`, { includeAuth: false });
  }

  async createInterviewQuestion(questionData) {
    return this.request('/interview-questions', {
      method: 'POST',
      body: JSON.stringify(questionData),
    });
  }

  async updateInterviewQuestion(id, questionData) {
    return this.request(`/interview-questions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(questionData),
    });
  }

  async deleteInterviewQuestion(id) {
    return this.request(`/interview-questions/${id}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health', {
      includeAuth: false,
    });
  }
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;
