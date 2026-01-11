import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Register for push notifications with proper Expo Go handling
 * Returns token string or null
 */
export const registerForPushNotificationsAsync = async (): Promise<string | null> => {
  // ===== 1. EXPO GO DETECTION =====
  // Check if running in Expo Go (not a standalone/development build)
  const isExpoGo = Constants.appOwnership === 'expo';
  
  if (isExpoGo) {
    console.warn('⚠️ Running in Expo Go - Push notifications have limitations');
    
    // Android in Expo Go (SDK 53+) doesn't support remote notifications
    if (Platform.OS === 'android') {
      console.log('📱 Expo Go on Android: Returning mock token for demo purposes');
      return 'EXPO_GO_MOCK_TOKEN_ANDROID';
    }
    
    // iOS in Expo Go has partial support but may fail
    console.log('📱 Expo Go on iOS: Limited notification support');
  }

  // ===== 2. SIMULATOR/EMULATOR CHECK =====
  if (!Device.isDevice) {
    console.log('🖥️ Running on simulator/emulator - Push notifications not available');
    Alert.alert(
      'Simulator Detected',
      'Push notifications require a physical device. Using mock token for demo.',
      [{ text: 'OK' }]
    );
    return 'MOCK_SIMULATOR_TOKEN';
  }

  // ===== 3. ANDROID NOTIFICATION CHANNEL SETUP =====
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default Notifications',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
        sound: 'default',
        enableVibrate: true,
      });
      console.log('✅ Android notification channel created');
    } catch (error) {
      console.error('❌ Error creating notification channel:', error);
      // Continue anyway - not critical for Expo Go
    }
  }

  // ===== 4. PERMISSION CHECK =====
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      console.log('🔔 Requesting notification permissions...');
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('❌ Notification permissions denied');
      Alert.alert(
        'Permissions Required',
        'Please enable notifications in your device settings to receive alerts.',
        [{ text: 'OK' }]
      );
      return null;
    }
    
    console.log('✅ Notification permissions granted');
  } catch (error) {
    console.error('❌ Error checking permissions:', error);
    return null;
  }

  // ===== 5. GET EXPO PUSH TOKEN =====
  try {
    // Try to get project ID from multiple sources
    const projectId = 
      Constants.expoConfig?.extra?.eas?.projectId ?? 
      Constants.easConfig?.projectId ??
      undefined;
    
    if (!projectId && !isExpoGo) {
      console.warn('⚠️ No EAS project ID found - token generation may fail');
    }

    console.log('📡 Getting Expo push token...');
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });
    
    const token = tokenData.data;
    console.log('✅ Expo Push Token:', token);
    
    return token;
    
  } catch (error: any) {
    console.error('❌ Error getting push token:', error);
    
    // Handle specific Expo Go errors
    if (error?.message?.includes('Expo Go')) {
      console.log('⚠️ Expo Go limitation detected - returning mock token');
      return isExpoGo ? 'EXPO_GO_LIMITED_TOKEN' : null;
    }
    
    // Show user-friendly error
    if (!isExpoGo) {
      Alert.alert(
        'Push Notification Error',
        'Failed to register for push notifications. Please try again later.',
        [{ text: 'OK' }]
      );
    }
    
    return null;
  }
};

/**
 * Schedule a local notification (works in Expo Go)
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  seconds: number = 5
) => {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { timestamp: Date.now() },
        sound: true,
      },
      trigger: {
        seconds,
      },
    });
    
    console.log('✅ Local notification scheduled:', id);
    return id;
  } catch (error) {
    console.error('❌ Error scheduling notification:', error);
    return null;
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ All notifications cancelled');
  } catch (error) {
    console.error('❌ Error cancelling notifications:', error);
  }
};

/**
 * Add notification received listener
 */
export const addNotificationReceivedListener = (
  callback: (notification: Notifications.Notification) => void
) => {
  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Add notification response listener (when user taps notification)
 */
export const addNotificationResponseListener = (
  callback: (response: Notifications.NotificationResponse) => void
) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};