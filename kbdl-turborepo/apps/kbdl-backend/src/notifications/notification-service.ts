import { Notification, prisma, PushToken } from '@repo/db/server';
import { SavePushTokenPayload } from '@repo/types';
import { notificationQueue } from '../config/queues/notification-queue';

interface CreateNotificationPayload {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

export const createNotificationService = async (
  payload: CreateNotificationPayload,
): Promise<Notification> => {
  const notification = await prisma.notification.create({
    data: {
      user_id: payload.userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data,
    },
  });

  const pushTokens = await prisma.pushToken.findMany({
    where: {
      user_id: payload.userId,
      isActive: true,
    },
    select: {
      token: true,
    },
  });

  await notificationQueue.add('send-notification', {
    userId: payload.userId,
    pushTokens: pushTokens.map((t) => t.token),
    notification,
  });

  return notification;
};

export const savePushTokenService = async (
  userId: string,
  payload: SavePushTokenPayload,
): Promise<PushToken> => {
  const pushToken = await prisma.pushToken.upsert({
    where: { token: payload.token },
    update: { isActive: true },
    create: {
      user_id: userId,
      token: payload.token,
      platform: payload.platform,
      deviceId: payload.deviceId,
    },
  });

  return pushToken;
};

export const getUserNotificationsService = async (userId: string): Promise<Notification[]> => {
  return prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
};

export const markNotificationAsReadService = async (
  notificationId: string,
  userId: string,
): Promise<Notification> => {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      user_id: userId,
    },
  });

  if (!notification) {
    throw new Error('Notification not found');
  }

  return prisma.notification.update({
    where: {
      id: notificationId,
    },
    data: {
      isRead: true,
    },
  });
};
