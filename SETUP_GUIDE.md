# NeighborCare - Complete Setup Guide

## Project Overview

NeighborCare is a React Native mobile app that connects emergency callers (Users) with nearby trained responders in real-time, creating a life-saving bridge before professional ambulances arrive.

## Architecture

### Frontend (React Native with Expo)
- **Location**: `/neighborcare`
- **Technology**: React Native, Expo, TypeScript
- **Key Features**:
  - Phone-based authentication
  - Real-time emergency SOS system
  - GPS tracking and location sharing
  - WebSocket-based real-time communication
  - Responder dashboard with emergency alerts

### Backend (Node.js/Express)
- **Location**: `/backend`
- **Technology**: Express.js, TypeSocket.io, Prisma ORM, PostgreSQL
- **Key Features**:
  - User authentication & registration
  - Responder management and certification
  - Emergency creation and dispatch
  - Geospatial queries for nearby responders
  - Real-time communication via WebSockets
  - Location tracking and updates

## Quick Start

### Frontend Setup

1. **Install dependencies**:
```bash
cd neighborcare
npm install
```

2. **Required libraries**:
```bash
npm install @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context
npm install axios expo-location react-native-geolocation-service
npm install @react-native-async-storage/async-storage
npm install socket.io-client
```

3. **Run on Expo Go**:
```bash
npm start
```

Then scan the QR code with your phone using Expo Go app (available on iOS App Store and Google Play)

### Backend Setup

1. **Install dependencies**:
```bash
cd backend
npm install
```

2. **Setup PostgreSQL Database**:
   - Install PostgreSQL locally or use cloud services like:
     - AWS RDS
     - Azure Database
     - Supabase (PostgreSQL)
     - Railway.app

3. **Configure environment variables** (create `.env` file):
```
DATABASE_URL="postgresql://user:password@localhost:5432/neighborcare"
PORT=5000
JWT_SECRET="your_super_secret_key_here"
NODE_ENV="development"
```

4. **Initialize Prisma**:
```bash
npx prisma migrate dev --name init
```

5. **Start the server**:
```bash
npm run dev
```

The backend should be running on `http://localhost:5000`

## App Flow

### Act 1: Setup (Registration)

#### User Registration Flow:
1. Open app → **Login Screen**
2. Tap "Register" → **RegisterScreen**
3. Enter phone number and name
4. API call: `POST /api/auth/register`
5. User stored in **Users table**
6. App navigates to **HomeScreen**

#### Responder Registration Flow:
1. User in **HomeScreen** taps "Become Responder"
2. Navigates to **BecomeResponderScreen**
3. Two options:
   - **Option 1**: Upload existing certification (manual admin approval)
   - **Option 2**: Take Basic Training Module
     - Watches 5 training videos
     - Passes quiz
     - API call: `POST /api/responders/{id}/basic-training`
     - `is_certified` flag set to `true`
4. User goes **Online** using availability toggle
5. GPS tracking starts sending coordinates to backend

### Act 2: Emergency (SOS)

#### User Triggers SOS:
1. **HomeScreen** → Tap large **SOS button**
2. Modal appears: "What's the emergency?"
3. Select type: Cardiac, Bleeding, Choking, Fracture, Other
4. App captures current GPS location
5. API call: `POST /api/emergency/create` with:
   ```json
   {
     "user_id": "user123",
     "latitude": 40.7128,
     "longitude": -74.0060,
     "emergency_type": "Cardiac"
   }
   ```
6. Backend creates **Emergency record** with status: `pending`

### Act 3: Dispatch (Finding Responders)

#### Backend Magic - Geospatial Query:
```sql
-- Find responders within 500m, sorted by distance
SELECT * FROM users 
WHERE is_responder = true 
  AND is_certified = true 
  AND is_available = true 
  AND ST_Distance(
    ST_Point(latitude, longitude), 
    ST_Point(incoming_lat, incoming_lon)
  ) <= 500
ORDER BY ST_Distance(...) ASC
LIMIT 5
```

#### Push Notifications (Firebase Cloud Messaging):
1. Backend finds top 5 responders
2. Sends **high-priority push notification** to each
3. Responder phones receive loud alert: `"🚨 CARDIAC 300m Near You"`

### Act 4: Response (Responder Accepts)

#### In ResponderDashboard:
1. Responder sees **EmergencyAlertContainer** with:
   - Emergency type
   - Distance
   - Estimated arrival time
2. Taps **ACCEPT** button
3. API call: `POST /api/emergency/{id}/accept`
4. Backend:
   - Updates **Emergency** status: `in-progress`
   - Sets `responder_id`
   - Sends "stand-down" to other 4 responders
   - Opens **WebSocket connection**

### Act 5: Real-Time Tracking (The Golden Minutes)

#### WebSocket Communication:
1. User navigates to **EmergencyTrackingScreen**
2. Responder's **ResponderDashboard** shows route to user
3. **Continuous location updates** via WebSocket:
   ```
   User → App → Backend WebSocket → Responder's App
   ```
4. User sees:
   - Responder's name & certification
   - Distance (e.g., "300m away")
   - Estimated arrival: "2 mins"
   - Live map with responder icon moving toward them
   - Provides **reassurance** and **peace of mind**

### Act 6: Resolution

#### Responder Arrives:
1. Provides first aid/CPR to victim
2. Waits for ambulance
3. Hands over victim to paramedics

#### Complete Emergency:
1. Responder taps "Resolve Emergency" button
2. API call: `POST /api/emergency/{id}/resolve`
3. Backend:
   - Updates status: `resolved`
   - Increments responder's `successful_responses` counter
   - Closes WebSocket connection
   - Logs incident
4. App returns to **HomeScreen** or **ResponderDashboard**

## File Structure

### Frontend (`/neighborcare/src`)
```
src/
├── screens/
│   ├── LoginScreen.tsx              # Phone-based login
│   ├── RegisterScreen.tsx           # User registration
│   ├── HomeScreen.tsx               # User dashboard with SOS
│   ├── EmergencyTrackingScreen.tsx  # Real-time emergency tracking
│   ├── BecomeResponderScreen.tsx    # Responder onboarding
│   └── ResponderDashboardScreen.tsx # Responder mode
├── context/
│   └── AuthContext.tsx              # Auth state management
├── services/
│   ├── api.ts                       # HTTP API calls
│   ├── geolocation.ts               # GPS tracking
│   └── websocket.ts                 # Real-time WebSocket
├── navigation/
│   └── RootNavigator.tsx            # Navigation stack setup
└── types/
    └── index.ts                     # TypeScript interfaces
```

### Backend (`/backend/src`)
```
src/
├── models/                          # Prisma models
├── routes/
│   ├── auth.ts                      # Auth endpoints
│   ├── responders.ts                # Responder management
│   ├── emergencies.ts               # Emergency operations
│   ├── resources.ts                 # Nearby resources
│   └── users.ts                     # User profile
├── controllers/                     # Request handlers
├── services/                        # Business logic
│   ├── emergency.service.ts         # Emergency dispatch logic
│   └── geolocation.service.ts       # Geospatial queries
├── middleware/                      # Auth, validation
└── server.ts                        # Main server file
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login with phone number

### Responders
- `POST /api/responders/{userId}` - Become a responder
- `PUT /api/responders/{userId}/availability` - Set availability
- `PUT /api/responders/{userId}/location` - Update location
- `POST /api/responders/{userId}/basic-training` - Complete training
- `POST /api/responders/{userId}/certification` - Upload certification

### Emergencies
- `POST /api/emergency/create` - Create emergency (trigger SOS)
- `GET /api/emergency/{id}` - Get emergency status
- `GET /api/emergency/{id}/alerts` - Get responder alerts
- `POST /api/emergency/{id}/accept` - Accept emergency
- `POST /api/emergency/{id}/decline` - Decline emergency
- `POST /api/emergency/{id}/resolve` - Resolve emergency

### Resources
- `GET /api/resources/nearby?latitude=X&longitude=Y&radius=5000` - Get nearby hospitals, pharmacies

### Users
- `GET /api/users/{id}` - Get user profile
- `GET /api/users/{id}/emergencies` - Get emergency history

## Key Technologies

### Frontend
- **React Native**: Cross-platform mobile development
- **Expo**: Simplified React Native development
- **React Navigation**: Screen navigation
- **Axios**: HTTP client
- **Expo Location**: GPS access
- **Socket.io Client**: Real-time communication
- **AsyncStorage**: Local storage

### Backend
- **Express.js**: Web framework
- **Socket.io**: WebSocket server
- **Prisma**: ORM for database
- **PostgreSQL**: Relational database
- **JWT**: Token-based authentication
- **Bcryptjs**: Password hashing

## Configuration

### Update API Base URL

**Frontend** (`src/services/api.ts`):
```typescript
const API_BASE_URL = 'http://YOUR_BACKEND_URL:5000';
```

**Frontend** (`src/services/websocket.ts`):
```typescript
private baseURL = 'http://YOUR_BACKEND_URL:5000';
```

### Environment Variables

**Backend** (`.env`):
```
DATABASE_URL=postgresql://user:pass@localhost:5432/neighborcare
PORT=5000
JWT_SECRET=your_secret_key
NODE_ENV=development
```

## Testing the App

1. **On Android/iOS Simulator**:
   - Run `npm start` in frontend directory
   - Scan QR code or use `a`/`i` shortcuts

2. **On Physical Device**:
   - Install Expo Go app
   - Run `npm start`
   - Scan QR code

3. **Test Emergency Flow**:
   - Register 2+ users
   - Make one a responder (take training)
   - User 1: Go online as responder
   - User 2: Tap SOS button, select emergency type
   - Responder should see alert
   - Test accept/decline/complete flow

## Deployment

### Frontend (Expo)
1. Create Expo account: `expo login`
2. Build: `eas build --platform ios --platform android`
3. Submit: `eas submit`
4. App appears on App Store and Google Play

### Backend (Heroku/Railway/AWS)
1. Create account on hosting platform
2. Connect Git repository
3. Set environment variables
4. Deploy with: `git push heroku main`

## Next Steps

- [ ] Implement push notifications (Firebase Cloud Messaging)
- [ ] Add real map component (react-native-maps)
- [ ] Implement video calling (Twilio/Agora)
- [ ] Add payment system for premium features
- [ ] Create admin dashboard for verification
- [ ] Add gamification system (badges, leaderboards)
- [ ] Implement offline mode
- [ ] Add multi-language support

## Support & Contributing

For issues, questions, or contributions, please refer to the main README.md

---

**Made with ❤️ for community safety**
