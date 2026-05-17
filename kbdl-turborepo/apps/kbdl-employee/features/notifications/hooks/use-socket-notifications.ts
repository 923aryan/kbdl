import { useEffect } from 'react';
import { Socket } from 'socket.io-client';

import { useNotificationStore } from '../store/notification-store';

import { RealtimeNotification } from '../types/notification-types';

export function useSocketNotifications(socket: Socket | null) {
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: RealtimeNotification) => {
      console.log('Realtime notification:', notification);
      addNotification(notification);
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, addNotification]);
}
