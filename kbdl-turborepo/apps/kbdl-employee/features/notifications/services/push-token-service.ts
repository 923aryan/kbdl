import * as Notifications from 'expo-notifications';

import * as Device from 'expo-device';

import Constants from 'expo-constants';

export async function registerPushToken() {
  if (!Device.isDevice) {
    return null;
  }

  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== 'granted') {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  });

  return token.data;
}
