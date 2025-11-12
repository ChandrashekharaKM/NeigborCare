import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
import authRoutes from './routes/auth';
import responderRoutes from './routes/responders';
import emergencyRoutes from './routes/emergencies';
import resourceRoutes from './routes/resources';
import userRoutes from './routes/users';

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/responders', responderRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket connections
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  const userId = socket.handshake.query.userId;

  // Join user-specific room
  if (userId) {
    socket.join(`user:${userId}`);
  }

  // Emergency events
  socket.on('create_emergency', async (data) => {
    console.log('Emergency created:', data);
    // The data object is flat: { user_id, latitude, longitude, emergency_type }
    // Broadcast to all available responders
    io.to('responders-available').emit('emergency_alert', data);
  });

  socket.on('accept_emergency', (data) => {
    console.log('Emergency accepted:', data);
    io.to(`emergency:${data.emergency_id}`).emit('responder_accepted', data);
  });

  socket.on('decline_emergency', (data) => {
    console.log('Emergency declined:', data);
    // Can be used for fallback alerts
  });

  socket.on('resolve_emergency', (data) => {
    console.log('Emergency resolved:', data);
    io.to(`emergency:${data.emergency_id}`).emit('emergency_resolved', data);
  });

  // Location tracking
  socket.on('update_location', (data) => {
    console.log('Location update:', data);
    io.to(`emergency:${data.emergency_id}`).emit('responder_location_update', data);
  });

  socket.on('set_responder_available', (data) => {
    console.log('Responder availability:', data);
    if (data.is_available) {
      socket.join(`responders-available`);
    } else {
      socket.leave(`responders-available`);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚑 NeighborCare Backend running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server running on ws://localhost:${PORT}`);
});
