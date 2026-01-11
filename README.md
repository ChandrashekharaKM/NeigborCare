# NeighborCare 🏥🚑

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.74.5-blue)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~51.0.28-black)](https://expo.dev/)

NeighborCare is a revolutionary React Native mobile application that bridges the critical gap between emergency callers and nearby trained responders. In life-threatening situations, every second counts—NeighborCare provides immediate, real-time assistance before professional emergency services arrive.

## 🌟 Key Features

### 🚨 Emergency Response System
- **One-Tap SOS**: Large emergency button for instant distress signals
- **Real-Time Tracking**: Live GPS location sharing with responders
- **Smart Dispatch**: Automatic assignment of nearest available responders
- **Status Updates**: Real-time emergency progress tracking

### 👥 User Management
- **Phone Authentication**: Simple, secure login with phone numbers
- **Dual Roles**: Support for both regular users and certified responders
- **Emergency History**: Complete log of past emergencies and responses

### 🏃 Responder Network
- **Certification System**: In-app training modules and certificate validation
- **Availability Control**: Online/offline status management
- **Response Dashboard**: Comprehensive responder interface with statistics

### 🗺️ Location & Mapping
- **GPS Integration**: Precise location tracking and sharing
- **Geospatial Queries**: Find nearest responders using advanced algorithms
- **Live Updates**: Real-time location broadcasting for active responders

## 🏗️ Architecture

### Frontend (React Native + Expo)
- **Framework**: React Native with Expo SDK
- **Language**: TypeScript for type safety
- **Navigation**: React Navigation for seamless UX
- **Real-Time**: Socket.io client for WebSocket communication
- **Storage**: AsyncStorage for local data persistence

### Backend (Node.js + Express)
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Prisma ORM
- **Real-Time**: Socket.io for bidirectional communication
- **Authentication**: JWT-based secure authentication
- **Geospatial**: Advanced location-based queries

## 📋 Prerequisites

Before running this project, ensure you have the following installed:

- **Node.js** (>= 18.0.0)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g @expo/cli`)
- **PostgreSQL** (for backend database)
- **Git**

### Mobile Requirements
- **iOS**: Xcode (for iOS Simulator)
- **Android**: Android Studio (for Android Emulator)
- **Physical Device**: Expo Go app from App Store/Play Store

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/ChandrashekharaKM/NeigborCare.git
cd NeigborCare
```

### 2. Backend Setup
```bash
cd backend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Initialize database
npx prisma generate
npx prisma db push

# Start the backend server
npm run dev
```

### 3. Frontend Setup
```bash
cd ../neighborcare
npm install

# Start Expo development server
npm start
```

### 4. Run on Device
- **iOS Simulator**: Press `i` in Expo terminal
- **Android Emulator**: Press `a` in Expo terminal
- **Physical Device**: Scan QR code with Expo Go app

## 📱 Usage

### For Users
1. **Register/Login**: Use your phone number to create an account
2. **Access Home**: View dashboard with emergency options
3. **Trigger SOS**: Tap the large red button in emergencies
4. **Select Type**: Choose emergency category (Cardiac, Bleeding, etc.)
5. **Track Response**: Monitor responder approach in real-time
6. **Resolve**: Mark emergency as resolved when help arrives

### For Responders
1. **Become Responder**: Complete certification training
2. **Go Online**: Toggle availability in dashboard
3. **Receive Alerts**: Get notified of nearby emergencies
4. **Respond**: Accept or decline emergency requests
5. **Navigate**: Use GPS to reach emergency location
6. **Provide Aid**: Assist until professional help arrives

## 📁 Project Structure

```
NeighborCare/
├── backend/                    # Node.js/Express backend
│   ├── prisma/
│   │   └── schema.prisma      # Database schema
│   ├── src/
│   │   ├── routes/            # API endpoints
│   │   ├── data/              # Data access layer
│   │   └── server.ts          # Main server file
│   └── package.json
├── neighborcare/               # React Native Expo app
│   ├── src/
│   │   ├── components/        # Reusable UI components
│   │   ├── screens/           # App screens
│   │   ├── services/          # API and utility services
│   │   ├── context/           # React context providers
│   │   └── types/             # TypeScript type definitions
│   ├── app/                   # Expo Router pages
│   └── package.json
├── HOW_TO_RUN.md              # Quick start guide
├── SETUP_GUIDE.md             # Detailed setup instructions
├── IMPLEMENTATION_SUMMARY.md  # Feature overview
└── README.md                  # This file
```

## 🛠️ Tech Stack & Dependencies

### Frontend Dependencies
- `@react-navigation/native` - Navigation framework
- `expo-location` - GPS and location services
- `socket.io-client` - Real-time communication
- `@react-native-async-storage/async-storage` - Local storage
- `axios` - HTTP client

### Backend Dependencies
- `express` - Web framework
- `@prisma/client` - Database ORM
- `socket.io` - Real-time communication
- `jsonwebtoken` - Authentication
- `bcryptjs` - Password hashing

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/AmazingFeature`
3. **Commit** your changes: `git commit -m 'Add some AmazingFeature'`
4. **Push** to the branch: `git push origin feature/AmazingFeature`
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write meaningful commit messages
- Test on both iOS and Android
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

**Chandrashekhara KM**
- GitHub: [@ChandrashekharaKM](https://github.com/ChandrashekharaKM)
- Project Link: [https://github.com/ChandrashekharaKM/NeigborCare](https://github.com/ChandrashekharaKM/NeigborCare)

## 🙏 Acknowledgments

- React Native and Expo communities
- Open source contributors
- Emergency response professionals who inspired this project

---

**Note**: This application is designed to supplement, not replace, professional emergency services. Always call emergency services (911) for life-threatening situations.