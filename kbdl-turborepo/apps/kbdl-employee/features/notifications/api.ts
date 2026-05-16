import { api } from '@/lib/api/api-client';
import { RealtimeNotification } from './types/notification-types';
export async function savePushToken(payload: {
  token: string;
  platform: string;
  deviceId?: string;
}) {
  return api.post('/notifications/push-token', payload);
}

export async function getNotifications() {
  return api.get<RealtimeNotification[]>('/notifications');
}

export async function markNotificationRead(notificationId: string) {
  return api.patch(`/notifications/${notificationId}/read`, {});
}
