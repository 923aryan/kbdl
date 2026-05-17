import * as Notifications from 'expo-notifications';

import * as Device from 'expo-device';

import Constants from 'expo-constants';

export async function registerPushToken() {
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device. They will not work on a simulator/emulator.');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notification! Permissions not granted.');
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;

    if (!projectId) {
      console.warn('Project ID not found. Ensure EAS is configured in app.json.');
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return token.data;
  } catch (error) {
    console.error('Error fetching Expo Push Token:', error);
    return null;
  }
}
