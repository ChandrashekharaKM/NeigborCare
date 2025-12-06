import io, { Socket } from 'socket.io-client';
import { Platform } from 'react-native';

// ⚠️ REPLACE WITH YOUR COMPUTER'S EXACT IP ADDRESS
const MANUAL_IP = '192.168.0.174'; 
const SOCKET_URL = `http://${MANUAL_IP}:5000`;

class WebSocketService {
  socket: Socket | null = null;

  connect(userId?: string) {
    if (this.socket?.connected) return;

    console.log(`🔌 Connecting to Socket: ${SOCKET_URL}`);
    
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      query: userId ? { userId } : {},
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket Connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket Disconnected');
    });

    this.socket.on('connect_error', (err) => {
        console.log('⚠️ Socket Connection Error:', err.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // --- EMITTERS (Sending Data) ---

  // User sends SOS
  emitCreateEmergency(data: any) {
    this.socket?.emit('create_emergency', data);
  }

  // Responder goes Online/Offline
  emitResponderAvailability(userId: string, isAvailable: boolean) {
    this.socket?.emit('set_responder_available', { userId, is_available: isAvailable });
  }

  // Responder Accepts
  emitAcceptEmergency(emergencyId: string, responderId: string) {
    this.socket?.emit('accept_emergency', { emergency_id: emergencyId, responder_id: responderId });
  }

  // Responder updates GPS
  emitLocationUpdate(emergencyId: string, latitude: number, longitude: number) {
    this.socket?.emit('update_location', { emergency_id: emergencyId, latitude, longitude });
  }

  // --- LISTENERS (Receiving Data) ---

  // Responder listens for new SOS
  onEmergencyAlert(callback: (data: any) => void) {
    this.socket?.on('emergency_alert', callback);
  }

  // User listens for Responder Acceptance
  onResponderAccepted(callback: (data: any) => void) {
    this.socket?.on('responder_accepted', callback);
  }

  // User listens for Responder Movement
  onResponderLocationUpdate(callback: (data: any) => void) {
    this.socket?.on('responder_location_update', callback);
  }

  // Cleanup listeners
  off(event: string) {
    this.socket?.off(event);
  }
}

export default new WebSocketService();