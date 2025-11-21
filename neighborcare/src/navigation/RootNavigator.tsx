import React from 'react';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { EmergencyTrackingScreen } from '../screens/EmergencyTrackingScreen';
import { BecomeResponderScreen } from '../screens/BecomeResponderScreen';
import { ResponderDashboardScreen } from '../screens/ResponderDashboardScreen';
import { useAuth } from '../context/AuthContext';
import { NearbyResourcesScreen } from '../screens/NearbyResourcesScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator: React.FC = () => {
  const { state } = useAuth();

  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
        {state.isLoading ? (
          // Loading screen can be added here
          <Stack.Screen name="Loading" component={LoadingScreen} />
        ) : state.user ? (
          // Authenticated stack
          <Stack.Group>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen
              name="EmergencyTracking"
              component={EmergencyTrackingScreen}
              options={{}}
            />
            <Stack.Screen
              name="Profile"
              component={PlaceholderScreen}
              options={{
                title: 'My Profile',
              }}
            />
            <Stack.Screen
              name="NearbyResources"
                component={NearbyResourcesScreen}
              options={{
                title: 'Nearby Resources',
              }}
            />
            <Stack.Screen
              name="EmergencyHistory"
              component={PlaceholderScreen}
              options={{
                title: 'Emergency History',
              }}
            />
            <Stack.Screen
              name="BecomeResponder"
              component={BecomeResponderScreen}
              options={{
                title: 'Become a Responder',
              }}
            />
            <Stack.Screen
              name="ResponderDashboard"
              component={ResponderDashboardScreen}
              options={{
                title: 'Responder Mode',
              }}
            />
            <Stack.Screen
              name="ResponseHistory"
              component={PlaceholderScreen}
              options={{
                title: 'Response History',
              }}
            />
            <Stack.Screen
              name="Certification"
              component={PlaceholderScreen}
              options={{
                title: 'My Certifications',
              }}
            />
            <Stack.Screen
              name="RespondingEmergency"
              component={PlaceholderScreen}
              options={{
                title: 'Responding to Emergency',
              }}
            />
          </Stack.Group>
        ) : (
          // Auth stack
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

const LoadingScreen = () => {
  const { ActivityIndicator, View } = require('react-native');
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#e74c3c" />
    </View>
  );
};

const PlaceholderScreen = () => {
  const { View, Text } = require('react-native');
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Coming Soon</Text>
    </View>
  );
};
