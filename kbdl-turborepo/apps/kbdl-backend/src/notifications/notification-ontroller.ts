import {
  ClearPushTokenRequest,
  MarkNotificationReadRequest,
  SavePushTokenRequest,
} from '@repo/types';
import {
  clearPushTokenSchema,
  markNotificationReadSchema,
  savePushTokenSchema,
} from '@repo/validator/shared';
import { Request, Response } from 'express';
import { sendSuccess } from '../utils/send-success';
import { validate } from '../utils/validate';
import {
  clearPushTokenService,
  getUserNotificationsService,
  markNotificationAsReadService,
  savePushTokenService,
} from './notification-service';

const savePushToken = async (req: Request, res: Response) => {
  const userId = req.payload.user.id;
  const input: SavePushTokenRequest = validate(savePushTokenSchema, req);

  const pushToken = await savePushTokenService(userId, input.body);
  sendSuccess(res, 'Push token saved', pushToken, 201);
};

const clearPushToken = async (req: Request, res: Response) => {
  const userId = req.payload.user.id;
  const input: ClearPushTokenRequest = validate(clearPushTokenSchema, req);

  await clearPushTokenService(userId, input.body.token);

  sendSuccess(res, 'Push token cleared', null, 200);
};

const getNotifications = async (req: Request, res: Response) => {
  const userId = req.payload.user.id;

  const notifications = await getUserNotificationsService(userId);
  sendSuccess(res, 'Notifications fetched', notifications, 200);
};

const markNotificationRead = async (req: Request, res: Response) => {
  const userId = req.payload.user.id;
  const input: MarkNotificationReadRequest = validate(markNotificationReadSchema, req);

  const notification = await markNotificationAsReadService(input.body.notificationIds, userId);
  sendSuccess(res, 'Notification marked as read', notification, 200);
};

export { clearPushToken, getNotifications, markNotificationRead, savePushToken };
