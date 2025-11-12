# 🚀 How to Run NeighborCare

## Quick Start (2 minutes)

### Step 1: Install Dependencies
```bash
cd neighborcare
npm install
```

### Step 2: Start Expo
```bash
npm start
```

### Step 3: Run on Your Device
- **iOS Simulator**: Press `i`
- **Android Emulator**: Press `a`  
- **Physical Device**: 
  - Install "Expo Go" app (iOS App Store or Google Play)
  - Scan QR code in terminal with your phone

## What You'll See

### First Launch
1. **LoginScreen** - Sign in with phone number
   - Don't have an account? Register
   
2. **RegisterScreen** - Create account
   - Enter phone + name
   - Auto-login happens after registration

### User Features
3. **HomeScreen** - Main Dashboard
   - Welcome message
   - **Large Red SOS Button** (tap to start emergency)
   - Your current GPS location
   - Emergency history
   - Quick action buttons

4. **Emergency Type Selection** (after SOS)
   - Choose: Cardiac, Bleeding, Choking, Fracture, Other
   - Tap to trigger emergency

5. **EmergencyTrackingScreen** - Real-time tracking
   - Status: "Finding nearby responders..."
   - When responder accepts: Shows their name, distance, ETA
   - Tap "Resolve Emergency" when done

### Responder Features
6. **Become Responder Screen**
   - Two options:
     - Upload certificate (for pre-certified)
     - Complete Basic Training (5 modules)
   
7. **Basic Training Modal**
   - Watch video (placeholder)
   - Answer quiz
   - Progress bar
   - Tap "Next Module" or "Finish & Get Certified"

8. **Responder Dashboard**
   - Online/Offline toggle (turns on location tracking)
   - Show stats: Successful responses, alerts received
   - **Emergency Alert** (when available responders online)
     - Shows emergency 300m away
     - Tap ACCEPT or DECLINE
   - Badges & achievements

## Test Scenarios

### Scenario 1: Simple User Flow
```
1. Launch app → RegisterScreen
2. Enter phone: +1-555-0123
3. Enter name: John Doe
4. Tap "Create Account"
5. Auto-login → HomeScreen
6. Verify location shown
7. Tap SOS button
8. Select "Cardiac"
9. Navigate to tracking screen
10. Status shows "Finding responders..."
```

### Scenario 2: Responder Training
```
1. Register as responder
2. HomeScreen → "Become Responder"
3. BecomeResponderScreen shown
4. Tap "Start Training"
5. See Module 1: CPR Basics
6. Read description & watch video
7. Answer quiz
8. Tap "Next Module" → Repeat 4x
9. After Module 5 → "Finish & Get Certified"
10. Success! You're certified
```

### Scenario 3: Responder Dashboard
```
1. Complete training (Scenario 2)
2. HomeScreen → "Become Responder" (or navigate)
3. ResponderDashboard opens
4. See stats: 0 responses, 0 alerts
5. Toggle "Online" (green switch)
6. Location card appears
7. Wait for emergency alert (simulated)
8. See emergency modal: "🚨 CARDIAC 300m"
9. Tap ACCEPT
10. See responder dashboard update
```

## Architecture Overview

### Three Main Components

**Frontend (React Native)**
- Located in: `neighborcare/`
- Runs on: Your phone via Expo Go
- Language: TypeScript + React Native

**Backend (Node.js)** - *Setup separately*
- Located in: `backend/`
- Runs on: Your computer/server
- Language: TypeScript + Express.js

**Real-Time Communication**
- WebSockets for live updates
- HTTP for API calls
- Location updates every 10 seconds

## File Structure to Explore

```
neighborcare/
├── src/screens/
│   ├── LoginScreen.tsx          # 📱 Tap here to see login UI
│   ├── RegisterScreen.tsx       # 📝 Tap here to create account
│   ├── HomeScreen.tsx           # 🏠 Main dashboard with SOS
│   ├── EmergencyTrackingScreen  # 📍 Real-time tracking
│   ├── BecomeResponderScreen    # 🚑 Training & certification
│   └── ResponderDashboard       # 📊 Responder mode
├── src/services/
│   ├── api.ts                   # 🌐 Backend communication
│   ├── geolocation.ts           # 📡 GPS tracking
│   └── websocket.ts             # ⚡ Real-time events
└── src/context/
    └── AuthContext.tsx          # 🔐 Authentication state
```

## Key Features to Test

### ✅ Must Try Features:
- [ ] Phone-based registration
- [ ] Auto-login after registration
- [ ] SOS button (large red button)
- [ ] Emergency type selection
- [ ] Emergency tracking UI
- [ ] Responder training modules
- [ ] Certification completion
- [ ] Availability toggle
- [ ] Emergency alerts (simulated)
- [ ] Response acceptance
- [ ] Dashboard stats

## Common Issues & Solutions

### Issue: App won't start
**Solution:**
```bash
npm install
npm start
```

### Issue: Expo Go app not connecting
**Solution:**
1. Make sure phone & computer on same WiFi
2. Use `npm start` instead of `expo start`
3. Manually enter IP from terminal

### Issue: Location not working
**Solution:**
- Grant location permission when prompted
- Check your device's location settings

### Issue: Can't navigate between screens
**Solution:**
- Check internet connection
- Verify backend would be at: `http://192.168.X.X:5000`
- Frontend uses mock data for now

## What's Working vs. What's Mock

### ✅ Fully Working:
- UI and navigation between screens
- Local storage (AsyncStorage)
- Form validation
- Button interactions
- Location permission requests
- Local geolocation calculations

### 📋 Mock Data:
- API responses (will connect to backend)
- Emergency alerts (simulated)
- WebSocket events (demo events)
- User profiles (sample data)

## Next: Connect to Backend

When ready to connect real backend:

1. **Update API URL** in `src/services/api.ts`:
```typescript
const API_BASE_URL = 'http://192.168.1.100:5000';
```

2. **Start backend server** (separate terminal):
```bash
cd backend
npm run dev
```

3. **Restart frontend**:
```bash
npm start
```

## Useful Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `i` | Open iOS Simulator |
| `a` | Open Android Emulator |
| `w` | Open Web Version |
| `r` | Reload app |
| `m` | Toggle menu |
| `q` | Quit |

## Understanding the Flow

### Emergency Creation Flow:
```
User taps SOS
    ↓
Selects emergency type
    ↓
App captures location
    ↓
[Currently mock] Would call: POST /api/emergency/create
    ↓
Navigate to EmergencyTrackingScreen
    ↓
[Currently mock] Would show real responders
```

### Responder Response Flow:
```
Responder goes Online
    ↓
[Currently mock] Would start broadcasting location
    ↓
[Currently simulated] Receives emergency alert
    ↓
Taps ACCEPT
    ↓
[Currently mock] Would call: POST /api/emergency/{id}/accept
    ↓
Dashboard updates
```

## Real-Time Features

When backend is connected:

1. **GPS Tracking** (every 10 seconds)
   - Responder's location sent to server
   - User sees responder moving on map

2. **Emergency Alerts** (instant via WebSocket)
   - User triggers SOS
   - Server finds nearby responders
   - Responders get alert notifications

3. **Live Updates** (real-time)
   - Distance updates
   - ETA changes
   - Status changes
   - Automatic notifications

## Testing Checklist

- [ ] App opens without errors
- [ ] Can register new user
- [ ] Can login with phone
- [ ] User data persists on restart
- [ ] Location permission works
- [ ] SOS button opens modal
- [ ] Can select emergency type
- [ ] Can view emergency tracking
- [ ] Can complete responder training
- [ ] Can toggle responder availability
- [ ] Dashboard shows stats
- [ ] All buttons respond to taps
- [ ] No console errors
- [ ] Navigation between screens works

## Getting Help

**Check these files:**
- `README.md` - Frontend overview
- `SETUP_GUIDE.md` - Full architecture
- `IMPLEMENTATION_SUMMARY.md` - What's built
- `src/types/index.ts` - Type definitions

## 🎉 You're Ready!

The app is fully functional for testing! 

Next steps:
1. Play around with the UI
2. Test all the screens
3. Try the emergency flow
4. When ready → Setup backend
5. Connect real API
6. Deploy to app stores!

---

**Enjoy building NeighborCare! 🚑❤️**
