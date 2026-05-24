import { useEffect } from 'react';
import { Socket } from 'socket.io-client';

import { useNotificationStore } from '../store/notification-store';

import { useQueryClient } from '@tanstack/react-query';
import { RealtimeNotification } from '../types/notification-types';

export function useSocketNotifications(socket: Socket | null) {
  const addNotification = useNotificationStore((state) => state.addNotification);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notification: RealtimeNotification) => {
      console.log('Realtime notification:', notification);

      addNotification(notification);

      if (notification.type === 'public_shift' || notification.type === 'shift_swap_request') {
        queryClient.invalidateQueries({
          queryKey: ['employee-open-shifts'],
        });
      }
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, addNotification, queryClient]);
}
