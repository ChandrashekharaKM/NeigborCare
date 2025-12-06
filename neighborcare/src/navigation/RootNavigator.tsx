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
import { MedicalRecordsScreen } from '../screens/MedicalRecordsScreen'; 
import { PrivacySecurityScreen } from '../screens/PrivacySecurityScreen';

// --- ADD THESE IMPORTS ---
import { EmergencyContactsScreen } from '../screens/EmergencyContactsScreen';
import { HelpSupportScreen } from '../screens/HelpSupportScreen';

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