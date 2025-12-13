import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';

// Context
import { useAuth } from '../context/AuthContext';

// Screens
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { EmergencyTrackingScreen } from '../screens/EmergencyTrackingScreen';
import { BecomeResponderScreen } from '../screens/BecomeResponderScreen';
import { ResponderDashboardScreen } from '../screens/ResponderDashboardScreen';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { ResponderExamScreen } from '../screens/ResponderExamScreen';
import { NearbyResourcesScreen } from '../screens/NearbyResourcesScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EmergencyHistoryScreen } from '../screens/EmergencyHistoryScreen';
import { MedicalRecordsScreen } from '../screens/MedicalRecordsScreen'; 
import { PrivacySecurityScreen } from '../screens/PrivacySecurityScreen';
import { EmergencyContactsScreen } from '../screens/EmergencyContactsScreen';
import { HelpSupportScreen } from '../screens/HelpSupportScreen';
import { FirstAidScreen } from '../screens/FirstAidScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { state, authContext } = useAuth();

  // --- BIOMETRIC LOCK STATE ---
  const [isBiometricLocked, setIsBiometricLocked] = useState(false);
  const [isCheckingBio, setIsCheckingBio] = useState(false);

  // 1. Check Biometric Preference when App Loads or User Logs In
  useEffect(() => {
    const checkBiometricRequirement = async () => {
      if (state.user) {
        try {
          const enabled = await AsyncStorage.getItem('biometric_enabled');
          if (enabled === 'true') {
            setIsBiometricLocked(true); // Lock immediately
            authenticateUser(); // Trigger FaceID/Fingerprint
          }
        } catch (e) {
          console.log("Error checking biometric settings", e);
        }
      } else {
        // If user logs out, reset lock
        setIsBiometricLocked(false);
      }
    };

    if (!state.isLoading) {
      checkBiometricRequirement();
    }
  }, [state.user, state.isLoading]);

  // 2. Authenticate User Function
  const authenticateUser = async () => {
    setIsCheckingBio(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock NeighborCare',
          fallbackLabel: 'Log Out',
          disableDeviceFallback: false,
        });

        if (result.success) {
          setIsBiometricLocked(false); // ✅ Unlock
        }
      } else {
        // If hardware not available, unlock to prevent getting stuck
        setIsBiometricLocked(false);
      }
    } catch (err) {
      console.log("Biometric Error", err);
      setIsBiometricLocked(false);
    } finally {
      setIsCheckingBio(false);
    }
  };

  // 3. Loading Screen
  if (state.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </View>
    );
  }

  // 4. 🔒 LOCK SCREEN (If Locked)
  if (state.user && isBiometricLocked) {
    return (
      <View style={styles.lockContainer}>
        <Ionicons name="lock-closed" size={64} color="#DC2626" />
        <Text style={styles.lockTitle}>NeighborCare Locked</Text>
        <Text style={styles.lockSub}>Biometric authentication required</Text>
        
        <TouchableOpacity style={styles.unlockBtn} onPress={authenticateUser}>
          <Text style={styles.unlockText}>Tap to Unlock</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => authContext.signOut()}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 5. MAIN NAVIGATOR
  const getStackKey = () => {
    if (!state.user) return 'guest';
    if (state.user.is_admin) return 'admin';
    if (state.user.is_responder) return 'responder';
    return 'user';
  };

  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <Stack.Navigator
          key={getStackKey()}
          screenOptions={{ headerShown: false }}
        >
          {state.user ? (
            // === AUTHENTICATED STACK ===
            <Stack.Group>
              
              {/* --- ADMIN --- */}
              {state.user.is_admin ? (
                <>
                  <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                  <Stack.Screen name="UserProfile" component={ProfileScreen} />
                </>
              ) : state.user.is_responder ? (
                // --- RESPONDER ---
                <>
                  {state.user.exam_passed ? (
                    <Stack.Screen name="ResponderDashboard" component={ResponderDashboardScreen} />
                  ) : (
                    <Stack.Screen name="ResponderExam" component={ResponderExamScreen} options={{ gestureEnabled: false }} />
                  )}
                  <Stack.Screen name="Home" component={HomeScreen} />
                  
                  {/* Responder Placeholders */}
                  <Stack.Screen name="ResponseHistory" component={PlaceholderScreen} />
                  <Stack.Screen name="Certification" component={PlaceholderScreen} />
                  <Stack.Screen name="RespondingEmergency" component={PlaceholderScreen} />
                  
                  {!state.user.exam_passed && (
                     <Stack.Screen name="ResponderDashboard" component={ResponderDashboardScreen} />
                  )}
                </>
              ) : (
                // --- REGULAR USER ---
                <>
                  <Stack.Screen name="Home" component={HomeScreen} />
                  <Stack.Screen name="BecomeResponder" component={BecomeResponderScreen} />
                  <Stack.Screen name="FirstAid" component={FirstAidScreen} />
                  <Stack.Screen name="ResponderExam" component={ResponderExamScreen} />
                </>
              )}

              {/* --- SHARED SCREENS (Accessible by all roles) --- */}
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="EmergencyTracking" component={EmergencyTrackingScreen} />
              <Stack.Screen name="NearbyResources" component={NearbyResourcesScreen} />
              <Stack.Screen name="EmergencyHistory" component={EmergencyHistoryScreen} />
              
              {/* NEW SCREENS */}
              <Stack.Screen name="MedicalRecords" component={MedicalRecordsScreen} /> 
              <Stack.Screen name="PrivacySecurity" component={PrivacySecurityScreen} />
              <Stack.Screen name="EmergencyContacts" component={EmergencyContactsScreen} /> 
              <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />

              {/* Shared Placeholders */}
              <Stack.Screen name="EmergencyDetail" component={EmergencyTrackingScreen} />
              <Stack.Screen name="ConductExam" component={ResponderExamScreen} />

            </Stack.Group>
          ) : (
            // === GUEST STACK ===
            <Stack.Group>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </Stack.Group>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </NavigationIndependentTree>
  );
};

const PlaceholderScreen = () => {
  const { Text } = require('react-native');
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Coming Soon</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  lockContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20
  },
  lockTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 20
  },
  lockSub: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 5,
    marginBottom: 40
  },
  unlockBtn: {
    backgroundColor: '#DC2626',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 20,
    width: '80%',
    alignItems: 'center'
  },
  unlockText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  logoutBtn: {
    padding: 15,
  },
  logoutText: {
    color: '#DC2626',
    fontWeight: '600'
  }
});