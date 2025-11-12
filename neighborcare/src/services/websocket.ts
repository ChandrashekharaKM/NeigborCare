import { io, Socket } from 'socket.io-client';
import { LocationData } from '../types';

class WebSocketService {
  private socket: Socket | null = null;
  private baseURL = 'http://192.168.1.100:5000'; // Change to your backend URL
  private listeners: Map<string, Set<Function>> = new Map();

  connect(userId: string) {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io(this.baseURL, {
      query: { userId },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.emit('disconnected');
    });

    this.socket.on('emergency_alert', (data) => {
      console.log('Emergency alert received:', data);
      this.emit('emergency_alert', data);
    });

    this.socket.on('responder_accepted', (data) => {
      console.log('Responder accepted:', data);
      this.emit('responder_accepted', data);
    });

    this.socket.on('emergency_resolved', (data) => {
      console.log('Emergency resolved:', data);
      this.emit('emergency_resolved', data);
    });

    this.socket.on('responder_location_update', (data) => {
      console.log('Responder location update:', data);
      this.emit('responder_location_update', data);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // Emergency events
  createEmergency(
    userId: string,
    latitude: number,
    longitude: number,
    emergencyType: string
  ) {
    if (!this.socket?.connected) {
      console.warn('WebSocket not connected');
      return;
    }

    this.socket.emit('create_emergency', {
      user_id: userId,
      latitude,
      longitude,
      emergency_type: emergencyType,
    });
  }

  acceptEmergency(emergencyId: string, responderId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('accept_emergency', {
      emergency_id: emergencyId,
      responder_id: responderId,
    });
  }

  declineEmergency(emergencyId: string, responderId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('decline_emergency', {
      emergency_id: emergencyId,
      responder_id: responderId,
    });
  }

  resolveEmergency(emergencyId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('resolve_emergency', {
      emergency_id: emergencyId,
    });
  }

  // Location tracking
  updateLocation(userId: string, location: LocationData) {
    if (!this.socket?.connected) return;
    this.socket.emit('update_location', {
      user_id: userId,
      latitude: location.latitude,
      longitude: location.longitude,
      timestamp: location.timestamp,
    });
  }

  setResponderAvailable(userId: string, isAvailable: boolean, location?: LocationData) {
    if (!this.socket?.connected) return;
    this.socket.emit('set_responder_available', {
      user_id: userId,
      is_available: isAvailable,
      latitude: location?.latitude,
      longitude: location?.longitude,
    });
  }

  // Listener management
  on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    this.listeners.get(event)?.delete(callback);
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data));
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

export default new WebSocketService();
