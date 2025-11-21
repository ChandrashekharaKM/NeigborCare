import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = 'http://192.168.1.100:5000'; // Change to your backend URL

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
    } catch (error) {
      throw error;
    }
  }

  async registerUser(
    name: string,
    email: string,
    phone: string,
    password: string,
    userType: 'user' | 'responder'
  ) {
    try {
      const response = await this.api.post('/api/auth/register', {
        name,
        email,
        phone_number: phone,
        password,
        is_responder: userType === 'responder',
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  async loginUser(phone: string, otp: string) {
    try {
      const response = await this.api.post('/api/auth/login', {
        phone_number: phone,
        otp,
      });
      return response.data;
    } catch (error) {
      throw error;
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
}

export default new APIService();
