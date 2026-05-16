import { z } from 'zod';

export const savePushTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    platform: z.string().optional(),
    deviceId: z.string().optional(),
  }),
});

export const markNotificationReadSchema = z.object({
  params: z.object({
    notificationId: z.string().uuid('Invalid notification ID format'),
  }),
});
