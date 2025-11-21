import axios, { AxiosInstance } from 'axios';
import { Platform } from 'react-native';

// Determine the correct API URL based on platform
// For Android emulator: use 10.0.2.2 (special IP that maps to host machine's localhost)
// For iOS simulator: use localhost
// For physical devices: use your computer's IP address (e.g., 192.168.0.174)
const getApiBaseUrl = () => {
  // You can manually set this to your computer's IP if testing on physical device
  // Find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)
  const MANUAL_IP = '192.168.0.174'; // Change this to your computer's IP if needed
  
  if (__DEV__) {
    if (Platform.OS === 'android') {
      // Android emulator uses 10.0.2.2 to access host machine's localhost
      // For physical Android device, use your computer's IP
      return `http://${MANUAL_IP}:5000`;
    } else {
      // iOS simulator can use localhost
      // For physical iOS device, use your computer's IP
      return `http://${MANUAL_IP}:5000`;
    }
  }
  // For production
  return `http://${MANUAL_IP}:5000`;
};

const API_BASE_URL = getApiBaseUrl();

// Log the API URL for debugging
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('📱 Platform:', Platform.OS);

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

  // Auth endpoints
  async requestOTP(phone: string) {
    try {
      const response = await this.api.post('/api/auth/request-otp', {
        phone_number: phone,
      });
      return response.data;
    } catch (error: any) {
      console.error('OTP Request Error:', error);
      // Extract error message from response
      const errorMessage = error.response?.data?.error || error.message || 'Failed to send OTP';
      throw new Error(errorMessage);
    }
  }

  async registerUser(
    name: string,
    email: string,
    phone: string,
    password: string,
    userType: 'user' | 'responder' | 'admin'
  ) {
    try {
      console.log('Registering user with API URL:', API_BASE_URL);
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
      console.error('Registration Error Details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      });
      
      // Provide more helpful error messages
      if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
        throw new Error(`Cannot connect to server at ${API_BASE_URL}. Please check if the backend is running.`);
      }
      
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  }

  async loginUser(phone: string, otp: string) {
    try {
      const response = await this.api.post('/api/auth/login', {
        phone_number: phone,
        otp,
      });
      return response.data;
    } catch (error: any) {
      console.error('Login Error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to login';
      throw new Error(errorMessage);
    }
  }

  async loginWithPassword(phone: string, password: string) {
    try {
      const response = await this.api.post('/api/auth/login-password', {
        phone_number: phone,
        password,
      });
      return response.data;
    } catch (error: any) {
      console.error('Password Login Error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to login';
      throw new Error(errorMessage);
    }
  }

  // Responder endpoints
  async becomeResponder(userId: string) {
    try {
      const response = await this.api.post(`/api/responders/${userId}`, {
        is_responder: true,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async uploadCertification(userId: string, certificateData: FormData) {
    try {
      const response = await this.api.post(
        `/api/responders/${userId}/certification`,
        certificateData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async completeBaiscTraining(userId: string) {
    try {
      const response = await this.api.post(
        `/api/responders/${userId}/basic-training`,
        { completed: true }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async setResponderAvailability(userId: string, isAvailable: boolean, latitude?: number, longitude?: number) {
    try {
      const response = await this.api.put(`/api/responders/${userId}/availability`, {
        is_available: isAvailable,
        latitude,
        longitude,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async updateResponderLocation(userId: string, latitude: number, longitude: number) {
    try {
      const response = await this.api.put(`/api/responders/${userId}/location`, {
        latitude,
        longitude,
        timestamp: new Date().toISOString(),
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Emergency endpoints
  async createEmergency(
    userId: string,
    latitude: number,
    longitude: number,
    emergencyType: string,
    description?: string
  ) {
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

  async getEmergencyAlerts(emergencyId: string) {
    try {
      const response = await this.api.get(`/api/emergency/${emergencyId}/alerts`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async acceptEmergency(emergencyId: string, responderId: string) {
    try {
      const response = await this.api.post(`/api/emergency/${emergencyId}/accept`, {
        responder_id: responderId,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async declineEmergency(emergencyId: string, responderId: string) {
    try {
      const response = await this.api.post(`/api/emergency/${emergencyId}/decline`, {
        responder_id: responderId,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async resolveEmergency(emergencyId: string) {
    try {
      const response = await this.api.post(`/api/emergency/${emergencyId}/resolve`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getEmergencyStatus(emergencyId: string) {
    try {
      const response = await this.api.get(`/api/emergency/${emergencyId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // Resources endpoints
  async getNearbyResources(latitude: number, longitude: number, radiusInMeters: number = 5000) {
    try {
      const response = await this.api.get('/api/resources/nearby', {
        params: {
          latitude,
          longitude,
          radius: radiusInMeters,
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // User endpoints
  async getUserProfile(userId: string) {
    try {
      const response = await this.api.get(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async getUserEmergencyHistory(userId: string) {
    try {
      const response = await this.api.get(`/api/users/${userId}/emergencies`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  setAuthToken(token: string) {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken() {
    delete this.api.defaults.headers.common['Authorization'];
  }

  // Admin endpoints
  async getAllUsers() {
    try {
      const response = await this.api.get('/api/admin/users');
      return response.data;
    } catch (error: any) {
      console.error('Get users error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to get users';
      throw new Error(errorMessage);
    }
  }

  async getResponders() {
    try {
      const response = await this.api.get('/api/admin/responders');
      return response.data;
    } catch (error: any) {
      console.error('Get responders error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to get responders';
      throw new Error(errorMessage);
    }
  }

  async approveResponder(userId: string) {
    try {
      const response = await this.api.post(`/api/admin/responders/${userId}/approve`);
      return response.data;
    } catch (error: any) {
      console.error('Approve responder error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to approve responder';
      throw new Error(errorMessage);
    }
  }

  // Exam endpoints
  async getExam(examId: string) {
    try {
      const response = await this.api.get(`/api/exams/${examId}`);
      return response.data;
    } catch (error: any) {
      console.error('Get exam error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to get exam';
      throw new Error(errorMessage);
    }
  }

  async submitExam(examData: {
    userId: string;
    examId: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    answers: { questionId: string; selectedAnswer: number }[];
    passed: boolean;
    location: { latitude: number; longitude: number } | null;
  }) {
    try {
      const response = await this.api.post('/api/exams/submit', examData);
      return response.data;
    } catch (error: any) {
      console.error('Submit exam error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to submit exam';
      throw new Error(errorMessage);
    }
  }
}

export default new APIService();
