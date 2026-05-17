import { Worker } from 'bullmq';

import { sendExpoPushNotification } from '../../notifications/expo-service';

import redis from '../redis';

import { emitNotification } from '../socket/socket-server';

new Worker(
  'notifications',

  async (job) => {
    try {
      const { userId, pushTokens, notification } = job.data;

      /*
        1. Push notification
      */

      if (pushTokens && pushTokens.length > 0) {
        await sendExpoPushNotification({
          pushTokens,
          title: notification.title,
          body: notification.body,
          data: notification.data,
        });
      }

      /*
        2. Realtime socket emit
      */

      emitNotification(userId, notification);
      console.log('sending is completed');
    } catch (error) {
      console.log('error is ', error);
      throw error;
    }
  },

  {
    connection: redis,
    lockDuration: 600000,
  },
);
