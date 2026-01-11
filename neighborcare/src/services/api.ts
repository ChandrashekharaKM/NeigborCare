import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';

// --- CONFIGURATION ---
const getApiBaseUrl = () => {
  // ✅ YOUR IP ADDRESS
  const MANUAL_IP = '192.168.1.121'; 
  return `http://${MANUAL_IP}:5000`;
};

const API_BASE_URL = getApiBaseUrl();
console.log('🔗 API Base URL:', API_BASE_URL);

class APIService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // --- AUTH ---
  async requestOTP(phone: string) {
    try {
      const response = await this.api.post('/api/auth/request-otp', { phone_number: phone });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to send OTP');
    }
  }

  async registerUser(name: string, email: string, phone: string, password: string, userType: 'user' | 'responder' | 'admin') {
    try {
      const response = await this.api.post('/api/auth/register', {
        name,
        email,
        phone_number: phone,
        password,
        is_responder: userType === 'responder',
        is_admin: userType === 'admin',
      });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  }

  async loginUser(phone: string, otp: string) {
    try {
      const response = await this.api.post('/api/auth/login', { phone_number: phone, otp });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to login');
    }
  }

  async loginWithPassword(phone: string, password: string) {
    try {
      const response = await this.api.post('/api/auth/login-password', { phone_number: phone, password });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to login');
    }
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    try {
      const response = await this.api.post('/api/auth/change-password', { userId, oldPassword, newPassword });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to change password');
    }
  }

  setAuthToken(token: string) {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken() {
    delete this.api.defaults.headers.common['Authorization'];
  }

  // --- USER PROFILE ---
  async getUserProfile(userId: string) {
    try {
      const response = await this.api.get(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Fetch Profile Error", error);
      throw error;
    }
  }

  async updateUserProfile(userId: string, data: any) {
    try {
      const response = await this.api.put(`/api/users/${userId}`, data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to update profile');
    }
  }

  async updatePushToken(userId: string, token: string) {
    try {
      console.log(`Push token for ${userId}: ${token}`);
    } catch (error) {
      console.error("Push Token Error", error);
    }
  }

  // --- ADMIN ---
  async getAllUsers() {
    try {
      const response = await this.api.get('/api/admin/users');
      return response.data;
    } catch (error: any) {
      return { users: [] };
    }
  }

  async getResponders() {
    try {
      const response = await this.api.get('/api/admin/responders');
      return response.data;
    } catch (error: any) {
      return { responders: [] };
    }
  }

  async approveResponder(userId: string) {
    try {
      const response = await this.api.post(`/api/admin/approve-responder/${userId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to approve responder');
    }
  }

  async getExamQuestions() {
    try {
      const response = await this.api.get('/api/admin/exam-questions');
      return response.data.questions || [];
    } catch (error) {
      return [];
    }
  }

  async addExamQuestion(question: string, option: string) {
    try {
      const response = await this.api.post('/api/admin/exam-questions', { question, option });
      return response.data.questions;
    } catch (error) {
      throw new Error('Failed to add question');
    }
  }

  async deleteExamQuestion(questionId: string) {
    try {
      const response = await this.api.delete(`/api/admin/exam-questions/${questionId}`);
      return response.data.questions;
    } catch (error) {
      throw new Error('Failed to delete question');
    }
  }

  // --- RESPONDER ---
  async setResponderAvailability(userId: string, isAvailable: boolean, latitude?: number, longitude?: number) {
    try {
      const response = await this.api.put(`/api/responders/${userId}/availability`, {
        is_available: isAvailable,
        latitude,
        longitude,
      });
      return response.data;
    } catch (error: any) {
      console.error("Set Status Error:", error.message);
      throw error;
    }
  }

  async checkForResponderAlerts(responderId: string) {
    try {
      const response = await this.api.get(`/api/responders/${responderId}/alerts`);
      return response.data;
    } catch (error) {
      return { hasAlert: false };
    }
  }

  // --- EXAMS ---
  async submitExam(examData: any) {
    try {
      const response = await this.api.post('/api/exams/submit', examData);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to submit exam');
    }
  }

  // --- EMERGENCY (CRITICAL FOR TRACKING) ---
  
  async createEmergency(userId: string, latitude: number, longitude: number, emergencyType: string, description?: string) {
    try {
      const response = await this.api.post('/api/emergency/create', {
        user_id: userId,
        latitude,
        longitude,
        emergency_type: emergencyType,
        description,
      });
      return response.data;
    } catch (error: any) {
      console.error("API SOS Error:", error.response?.data || error.message);
      throw error;
    }
  }

  // ✅ THIS WAS MISSING
  async getEmergencyStatus(emergencyId: string) {
    try {
      const response = await this.api.get(`/api/emergency/${emergencyId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Failed to get status');
    }
  }

  // ✅ THIS WAS MISSING
  async resolveEmergency(emergencyId: string) {
    try {
      const response = await this.api.post(`/api/emergency/${emergencyId}/resolve`);
      return response.data;
    } catch (error: any) {
      throw new Error('Failed to resolve emergency');
    }
  }

  // ✅ THIS WAS MISSING
  async acceptEmergency(emergencyId: string, responderId: string) {
    try {
        const response = await this.api.post(`/api/emergency/${emergencyId}/accept`, {
            responder_id: responderId
        });
        return response.data;
    } catch (error: any) {
        throw new Error('Failed to accept');
    }
  }

  // --- RESOURCES ---
  async getNearbyResources(latitude: number, longitude: number, radiusInMeters: number = 5000) {
    try {
      const response = await this.api.get('/api/resources/nearby', {
        params: { latitude, longitude, radius: radiusInMeters },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new APIService();