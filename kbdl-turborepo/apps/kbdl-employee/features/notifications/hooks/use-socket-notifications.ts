import { useEffect } from 'react';
import { Socket } from 'socket.io-client';

import { useNotificationStore } from '../store/notification-store';

import { NotificationTypes } from '@/constants/constants';
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

      if (
        notification.type === NotificationTypes.publicShiftSwap ||
        notification.type === NotificationTypes.shiftSwapRequest
      ) {
        queryClient.invalidateQueries({
          queryKey: ['employee-open-shifts'],
        });
      } else if (notification.type === NotificationTypes.onboardRequest) {
        queryClient.invalidateQueries({
          queryKey: ['employee-pending-employments'],
        });
      }
    };

    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('notification:new', handleNewNotification);
    };
  }, [socket, addNotification, queryClient]);
}
