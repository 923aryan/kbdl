import { useEffect } from 'react';

import { socketService } from '../services/socket-service';

import { useNotificationStore } from '../store/notification-store';

import { RealtimeNotification } from '../types/notification-types';

export function useSocketNotifications() {
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    const socket = socketService.getSocket();

    if (!socket) return;

    socket.on('notification:new', (notification: RealtimeNotification) => {
      console.log('Realtime notification:', notification);
      addNotification(notification);
    });

    return () => {
      socket.off('notification:new');
    };
  }, []);
}
