import { useEffect } from 'react';

import { getNotifications } from '../api';

import { useNotificationStore } from '../store/notification-store';

export function useNotifications() {
  const notifications = useNotificationStore((state) => state.notifications);

  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const response = await getNotifications();

        response.data.forEach((notification: any) => {
          addNotification(notification);
        });
      } catch (error) {
        console.error('Failed to load notifications', error);
      }
    }

    loadNotifications();
  }, []);

  return {
    notifications,
  };
}
