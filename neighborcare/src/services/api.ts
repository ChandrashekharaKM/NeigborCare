import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';

// --- CONFIGURATION ---
const getApiBaseUrl = () => {
  // Replace with your actual computer IP found via ipconfig/ifconfig
  const MANUAL_IP = '192.168.0.174'; 
  
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return `http://${MANUAL_IP}:5000`;
    } else {
      return `http://${MANUAL_IP}:5000`;
    }
  }
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

  // --- TOKEN MANAGEMENT ---
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
      console.error("Update Profile Error", error);
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
      console.error('Get users error:', error);
      return { users: [] };
    }
  }

  async getResponders() {
    try {
      const response = await this.api.get('/api/admin/responders');
      return response.data;
    } catch (error: any) {
      console.error('Get responders error:', error);
      return { responders: [] };
    }
  }

  async approveResponder(userId: string) {
    try {
      const response = await this.api.post(`/api/admin/approve-responder/${userId}`);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to approve responder';
      throw new Error(errorMessage);
    }
  }

  // --- EXAMS (This is the critical part missing) ---
  async submitExam(examData: {
    userId: string;
    examId: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    answers: any[];
    passed: boolean;
    location: any;
  }) {
    try {
      const response = await this.api.post('/api/exams/submit', examData);
      return response.data;
    } catch (error: any) {
      console.error('Submit exam error:', error);
      throw new Error(error.response?.data?.error || 'Failed to submit exam');
    }
  }

  // --- EMERGENCY ---
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
    } catch (error) {
      throw error;
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