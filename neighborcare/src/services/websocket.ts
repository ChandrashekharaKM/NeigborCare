import io, { Socket } from 'socket.io-client';

// ✅ Correct IP for your current setup
const MANUAL_IP = '192.168.1.121'; 
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

  // --- EMITTERS (Sending Data to Server) ---

  // Used in HomeScreen.tsx
  emitCreateEmergency(data: any) {
    this.socket?.emit('create_emergency', data);
  }

  // Used in ResponderDashboardScreen.tsx
  emitResponderAvailability(userId: string, isAvailable: boolean) {
    this.socket?.emit('set_responder_available', { userId, is_available: isAvailable });
  }

  // Used in ResponderDashboardScreen.tsx
  emitAcceptEmergency(emergencyId: string, responderId: string) {
    this.socket?.emit('accept_emergency', { emergency_id: emergencyId, responder_id: responderId });
  }

  // Used in ResponderDashboardScreen.tsx (Tracking)
  emitLocationUpdate(emergencyId: string, latitude: number, longitude: number) {
    this.socket?.emit('update_location', { emergency_id: emergencyId, latitude, longitude });
  }

  // --- LISTENERS (Receiving Data from Server) ---

  // Responder sees this (ResponderDashboardScreen.tsx)
  onEmergencyAlert(callback: (data: any) => void) {
    this.socket?.on('emergency_alert', callback);
  }

  // User sees this (EmergencyTrackingScreen.tsx)
  onResponderAccepted(callback: (data: any) => void) {
    this.socket?.on('responder_accepted', callback);
  }

  // User sees this (EmergencyTrackingScreen.tsx)
  onResponderLocationUpdate(callback: (data: any) => void) {
    this.socket?.on('responder_location_update', callback);
  }

  // Cleanup listeners to prevent duplicates
  off(event: string) {
    this.socket?.off(event);
  }
}

export default new WebSocketService();