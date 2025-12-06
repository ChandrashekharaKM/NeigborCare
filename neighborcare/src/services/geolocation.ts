import * as Location from 'expo-location';
import { Alert, Linking } from 'react-native';

// Variable to hold the tracking subscription
let locationSubscription: Location.LocationSubscription | null = null;

// 1. Request Permission
const requestLocationPermissions = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Allow NeighborCare to access your location to find nearby help.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
      return false;
    }
    return true;
  } catch (error) {
    console.log("Error requesting permission:", error);
    return false;
  }
};

// 2. Get Single Location
const getCurrentLocation = async () => {
  try {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      heading: location.coords.heading,
      speed: location.coords.speed,
    };

  } catch (error) {
    console.log("Error getting location:", error);
    return null;
  }
};

// 3. Start Live Tracking
const startLocationTracking = async (onUpdate: (location: any) => void) => {
  try {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) return;

    // Stop existing subscription if any
    if (locationSubscription) {
      locationSubscription.remove();
    }

    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Update every 10 meters
      },
      (location) => {
        const formattedLoc = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          heading: location.coords.heading,
          speed: location.coords.speed,
        };
        onUpdate(formattedLoc);
      }
    );
  } catch (error) {
    console.log("Error starting tracking:", error);
  }
};

// 4. Stop Live Tracking
const stopLocationTracking = () => {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
};

export default {
  requestLocationPermissions,
  getCurrentLocation,
  startLocationTracking,
  stopLocationTracking,
};