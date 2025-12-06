import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants'; // Import this

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const registerForPushNotificationsAsync = async () => {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    
    // --- FIX IS HERE ---
    // If you haven't run 'eas init', you can paste your Project ID string directly here.
    // Ideally, getting it from Constants is cleaner if 'eas init' was run.
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

    try {
      token = (await Notifications.getExpoPushTokenAsync({
        projectId: projectId // Pass the ID explicitly if found
      })).data;
      console.log("EXPO PUSH TOKEN:", token);
    } catch (e) {
      console.error("Error fetching token:", e);
      alert("Error: Could not get Push Token. Make sure you run 'npx eas init' first.");
    }
    // -------------------

  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
};