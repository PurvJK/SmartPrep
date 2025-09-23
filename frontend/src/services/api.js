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
  async listStudyMaterials({ q, category, difficulty } = {}) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (difficulty) params.set('difficulty', difficulty);
    const query = params.toString();
    return this.request(`/study-materials${query ? `?${query}` : ''}`);
  }

  async getStudyMaterialById(id) {
    return this.request(`/study-materials/${id}`);
  }

  async createStudyMaterial(material) {
    return this.request('/study-materials', {
      method: 'POST',
      body: JSON.stringify(material),
    });
  }

  async updateStudyMaterial(id, updates) {
    return this.request(`/study-materials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteStudyMaterial(id) {
    return this.request(`/study-materials/${id}`, {
      method: 'DELETE',
    });
  }

  // Study theory methods
  async getStudyTheory(category) {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.request(`/study-theory${query}`, { includeAuth: false });
  }

  async listStudyTopics(category) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    return this.request(`/study-theory/topics?${params.toString()}`, { includeAuth: false });
  }

  async getStudyTopic(category, topicId) {
    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (topicId) params.set('topicId', topicId);
    return this.request(`/study-theory/topic?${params.toString()}`, { includeAuth: false });
  }

  async upsertStudyTheory({ category, title, description, content, sections }) {
    return this.request('/study-theory', {
      method: 'POST',
      body: JSON.stringify({ category, title, description, content, sections }),
    });
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

  async deactivateUser(userId) {
    return this.request(`/users/${userId}/deactivate`, {
      method: 'PUT',
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
