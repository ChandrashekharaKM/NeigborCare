# NeighborCare - React Native Mobile App

🚑 A real-time emergency response app that connects users in distress with trained community responders within a 500-meter radius.

## � Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Expo Go app (on your phone)

### Installation & Running

```bash
# Navigate to the app directory
cd neighborcare

# Install dependencies
npm install

# Start the development server
npm start

# Scan the QR code with Expo Go app on your phone
# Or press 'i' for iOS simulator, 'a' for Android emulator
```

## 📱 Core Features

### For Users
- ✅ Phone-based authentication
- ✅ One-tap SOS emergency button
- ✅ Real-time emergency type selection (Cardiac, Bleeding, Choking, Fracture, Other)
- ✅ Live responder tracking with distance & ETA
- ✅ Emergency history log
- ✅ Nearby resources (hospitals, pharmacies)

### For Responders  
- ✅ Certification management (upload or in-app training)
- ✅ Availability toggle with location tracking
- ✅ Real-time emergency alerts
- ✅ One-tap accept/decline response
- ✅ Response statistics & badges
- ✅ Live route navigation

## 📁 Project Structure

```
neighborcare/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.tsx              # Phone authentication
│   │   ├── RegisterScreen.tsx           # User registration
│   │   ├── HomeScreen.tsx               # Main dashboard with SOS
│   │   ├── EmergencyTrackingScreen.tsx  # Real-time emergency tracking
│   │   ├── BecomeResponderScreen.tsx    # Responder onboarding & training
│   │   └── ResponderDashboardScreen.tsx # Responder mode & alerts
│   ├── context/
│   │   └── AuthContext.tsx              # Global authentication state
│   ├── services/
│   │   ├── api.ts                       # HTTP API client
│   │   ├── geolocation.ts               # GPS & location services
│   │   └── websocket.ts                 # Real-time WebSocket
│   ├── navigation/
│   │   └── RootNavigator.tsx            # Navigation setup
│   └── types/
│       └── index.ts                     # TypeScript interfaces
└── app/
    ├── _layout.tsx                      # Root layout
    └── (tabs)/                          # Tab-based routes
```

## 🔑 Key Screens

### LoginScreen & RegisterScreen
- Clean phone-based authentication
- Form validation
- Auto-login after registration

### HomeScreen
- User greeting & quick status
- Large SOS emergency button
- Current location display
- Ongoing emergency tracker
- Emergency history
- Quick action buttons (Resources, Become Responder)

### EmergencyTrackingScreen  
- Live emergency status (pending/in-progress/resolved)
- Responder information card
  - Name and certification
  - Real-time distance
  - Estimated arrival time
- Location details
- Resolve emergency button

### BecomeResponderScreen
- Benefits & requirements overview
- Two certification paths:
  1. Upload existing certificate
  2. Complete in-app Basic Training
- Interactive training modules (5 videos + quizzes)

### ResponderDashboardScreen
- Online/Offline availability toggle
- Live location broadcasting
- Response statistics dashboard
- Emergency alert notifications
- Quick action buttons

## 🔧 Services

### API Service (`src/services/api.ts`)
HTTP client for backend communication
```typescript
// Auth
registerUser(phone, name)
loginUser(phone)

// Emergency Management
createEmergency(userId, lat, lon, type, description)
acceptEmergency(emergencyId, responderId)
resolveEmergency(emergencyId)

// Responder Management  
becomeResponder(userId)
setResponderAvailability(userId, isAvailable, lat, lon)
updateResponderLocation(userId, lat, lon)

// And more...
```

### Geolocation Service (`src/services/geolocation.ts`)
GPS tracking and distance calculations
```typescript
requestLocationPermissions()
getCurrentLocation()
startLocationTracking(callback, intervalMs)
calculateDistance(lat1, lon1, lat2, lon2)
calculateETA(distanceMeters)
```

### WebSocket Service (`src/services/websocket.ts`)
Real-time two-way communication
```typescript
connect(userId)
createEmergency(userId, lat, lon, type)
acceptEmergency(emergencyId, responderId)
updateLocation(userId, location)
on(event, callback)
```

## 🔐 Authentication

- Phone-number based (no password)
- JWT token storage
- AsyncStorage persistence
- Auto-login on app launch
- Logout capability

## 🌍 Real-Time Flow

### Emergency Creation:
```
User → SOS Button → Select Type → GPS Capture → API Call
       ↓
Backend → Geospatial Query → Find 5 Nearby Responders
       ↓
WebSocket → Send High-Priority Alerts → Responder Phones
       ↓
Responder → See Modal → Accept/Decline
```

### Accepted Response:
```
Responder Accepts → WebSocket Connection Opens
       ↓
User sees: Responder Name, Distance, ETA
Responder sees: Route to User Location
       ↓
Continuous GPS Updates → Real-Time Map Tracking
       ↓
Arrival → Tap "Resolve" → Emergency Logged
```

## 🎨 Design System

**Color Palette:**
- Primary (Emergency): #e74c3c (Red)
- Success: #4caf50 (Green)
- Warning: #ffc107 (Amber)
- Background: #f5f5f5 (Gray)

**Navigation:**
- Stack-based navigation
- Tab-based sections (for future expansion)
- Modal overlays for important actions

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - New user
- `POST /api/auth/login` - Login

### Emergency
- `POST /api/emergency/create` - Trigger SOS
- `GET /api/emergency/{id}` - Get status
- `POST /api/emergency/{id}/accept` - Accept response
- `POST /api/emergency/{id}/resolve` - Complete

### Responders
- `POST /api/responders/{id}` - Become responder
- `PUT /api/responders/{id}/availability` - Set status
- `PUT /api/responders/{id}/location` - Update position
- `POST /api/responders/{id}/basic-training` - Complete training

### Resources
- `GET /api/resources/nearby` - Find hospitals/pharmacies

### Users
- `GET /api/users/{id}` - Profile
- `GET /api/users/{id}/emergencies` - History

## ⚙️ Configuration

Update backend URL in services:
```typescript
// src/services/api.ts
const API_BASE_URL = 'http://YOUR_BACKEND_IP:5000';

// src/services/websocket.ts
private baseURL = 'http://YOUR_BACKEND_IP:5000';
```

## 🧪 Test Scenarios

**User Creating Emergency:**
1. Register user, go to HomeScreen
2. Tap SOS button → Select "Cardiac"
3. Should navigate to EmergencyTrackingScreen
4. Display "Finding nearby responders..."

**Responder Setup:**
1. Register user → Tap "Become Responder"
2. Select "Basic Training" → Complete 5 modules
3. Get certified → Go to ResponderDashboard
4. Toggle availability ON

**Emergency Response:**
1. Have User create emergency
2. As Responder, see emergency alert modal
3. Tap ACCEPT → Responder dashboard updates
4. User sees responder info in real-time

## 📦 Dependencies

- `react-native`: Mobile framework
- `expo`: Development & deployment
- `@react-navigation/*`: Navigation library
- `axios`: HTTP requests
- `socket.io-client`: WebSocket
- `expo-location`: GPS access
- `@react-native-async-storage/async-storage`: Local storage

## 🚀 Deployment

### Development
```bash
npm start
```

### Production
```bash
# Create production build
eas build --platform ios --platform android

# Submit to app stores
eas submit
```

## 📚 Documentation

- **SETUP_GUIDE.md**: Complete setup & architecture
- **Backend README**: Server setup & API docs
- **TypeScript Types**: Full interface definitions in `src/types/index.ts`

## 🤝 Contributing

Contributions welcome! Please refer to SETUP_GUIDE.md for development standards.

## ⚠️ Important Notes

- **Update Backend URL**: Change API base URL to your server
- **Database Setup**: Backend requires PostgreSQL setup
- **Permissions**: App requires location access on Android/iOS
- **Testing**: Use Expo Go or simulators for testing

## 📞 Support & Next Steps

See **SETUP_GUIDE.md** for:
- Backend setup instructions
- Database configuration
- Full API documentation
- Deployment guides
- Next feature implementations
