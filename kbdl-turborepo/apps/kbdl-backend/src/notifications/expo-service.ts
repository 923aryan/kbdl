import { Expo } from 'expo-server-sdk';

const expo = new Expo();

interface SendPushPayload {
  pushTokens: string[];

  title: string;

  body: string;

  data?: Record<string, any>;
}

export async function sendExpoPushNotification({ pushTokens, title, body, data }: SendPushPayload) {
  const messages = [];

  for (const token of pushTokens) {
    if (!Expo.isExpoPushToken(token)) {
      continue;
    }

    messages.push({
      to: token,

      sound: 'default',

      title,

      body,

      data,
    });
  }

  if (messages.length === 0) {
    return;
  }

  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (error) {
      console.error('Expo push error:', error);
    }
  }
}
