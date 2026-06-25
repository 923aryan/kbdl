import { Notification, PushToken } from '@repo/db/server';
import {
  clearPushTokenSchema,
  markNotificationReadSchema,
  savePushTokenSchema,
} from '@repo/validator/shared';
import z from 'zod';

export type SavePushTokenRequest = z.infer<typeof savePushTokenSchema>;
export type SavePushTokenPayload = z.infer<typeof savePushTokenSchema>['body'];
export type SavePushTokenResponse = PushToken;

export type ClearPushTokenRequest = z.infer<typeof clearPushTokenSchema>;
export type ClearPushTokenPayload = z.infer<typeof clearPushTokenSchema>['body'];
export type ClearPushTokenResponse = null;

export type MarkNotificationReadRequest = z.infer<typeof markNotificationReadSchema>;
export type MarkNotificationReadPayload = z.infer<typeof markNotificationReadSchema>['body'];
export type MarkNotificationReadResponse = Notification;

export type GetNotificationsResponse = Notification[];
