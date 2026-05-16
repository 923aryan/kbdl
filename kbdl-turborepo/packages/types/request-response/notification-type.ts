import { Notification, PushToken } from '@repo/db/server';
import { markNotificationReadSchema, savePushTokenSchema } from '@repo/validator/shared';
import z from 'zod';

export type SavePushTokenRequest = z.infer<typeof savePushTokenSchema>;
export type SavePushTokenPayload = z.infer<typeof savePushTokenSchema>['body'];
export type SavePushTokenResponse = PushToken;

export type MarkNotificationReadRequest = z.infer<typeof markNotificationReadSchema>;
export type MarkNotificationReadPayload = z.infer<typeof markNotificationReadSchema>['params'];
export type MarkNotificationReadResponse = Notification;

export type GetNotificationsResponse = Notification[];
