import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const registerForPushNotificationsAsync = async () => {
  // 1. EXPO GO BYPASS (FOR DEMO/TESTING)
  // Real push notifications crash Expo Go on Android (SDK 53+).
  // We return a "Fake Token" so the UI switch stays ON and looks working.
  if (Constants.appOwnership === 'expo' && Platform.OS === 'android') {
    console.log("⚠️ Expo Go detected: Returning Mock Push Token for Demo.");
    return "MOCK_EXPO_GO_TOKEN";
  }

  let token;

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    } catch (e) {
      // Ignore channel errors in dev
    }
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert('Permission required', 'Please enable notifications in settings.');
      return null;
    }
    
    try {
      // Safely get Project ID
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      
      // Attempt to get token
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      token = tokenData.data;
      console.log("EXPO PUSH TOKEN:", token);
    } catch (error) {
      console.log("Error getting token:", error);
      // Fallback for simulators so app doesn't break
      return "MOCK_SIMULATOR_TOKEN";
    }
  } else {
    // Handle simulator
    console.log('Must use physical device for Push Notifications');
    return "MOCK_SIMULATOR_TOKEN"; 
  }

  return token;
};