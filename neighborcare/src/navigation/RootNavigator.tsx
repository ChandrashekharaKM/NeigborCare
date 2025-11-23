import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

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

import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { state } = useAuth();

  if (state.isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#e74c3c" />
      </View>
    );
  }

  // Generate a unique key to force re-render on role change
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
              
              {/* --- 1. ADMIN ROLE --- */}
              {state.user.is_admin ? (
                <>
                  {/* Start Screen for Admin */}
                  <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                  {/* Admin can also view profiles */}
                  <Stack.Screen name="UserProfile" component={ProfileScreen} />
                </>
              ) : state.user.is_responder ? (
                // --- 2. RESPONDER ROLE ---
                <>
                  {/* Check Certification Status */}
                  {state.user.exam_passed ? (
                    <Stack.Screen name="ResponderDashboard" component={ResponderDashboardScreen} />
                  ) : (
                    <Stack.Screen 
                      name="ResponderExam" 
                      component={ResponderExamScreen}
                      options={{ gestureEnabled: false }}
                    />
                  )}
                  
                  {/* Responders can also act as users (e.g. view history, resources) */}
                  <Stack.Screen name="Home" component={HomeScreen} />
                  <Stack.Screen name="ResponseHistory" component={PlaceholderScreen} />
                  <Stack.Screen name="Certification" component={PlaceholderScreen} />
                  <Stack.Screen name="RespondingEmergency" component={PlaceholderScreen} />
                  
                  {/* If they haven't passed, they might need to access this if forced */}
                  {!state.user.exam_passed && (
                     <Stack.Screen name="ResponderDashboard" component={ResponderDashboardScreen} />
                  )}
                </>
              ) : (
                // --- 3. REGULAR USER ROLE ---
                <>
                  <Stack.Screen name="Home" component={HomeScreen} />
                  <Stack.Screen name="BecomeResponder" component={BecomeResponderScreen} />
                  <Stack.Screen name="ResponderExam" component={ResponderExamScreen} />
                </>
              )}

              {/* --- 4. SHARED SCREENS (Available to Everyone) --- */}
              {/* These are screens anyone might need (Profile, Maps, etc.) */}
              {/* Note: Do NOT add AdminDashboard or ResponderDashboard here again */}
              
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="EmergencyTracking" component={EmergencyTrackingScreen} />
              <Stack.Screen name="NearbyResources" component={NearbyResourcesScreen} />
              <Stack.Screen name="EmergencyHistory" component={EmergencyHistoryScreen} />
              
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