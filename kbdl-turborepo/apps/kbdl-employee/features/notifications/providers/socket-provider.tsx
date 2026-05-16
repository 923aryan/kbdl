import { PropsWithChildren, useEffect } from 'react';

import { useAuthStore } from '@/features/auth/hooks/useAuth';

import { socketService } from '../services/socket-service';

import { usePushNotifications } from '../hooks/use-push-notifications';

import { useSocketNotifications } from '../hooks/use-socket-notifications';
import { cleanupExpoListeners, registerExpoListeners } from '../services/expo-listeners-service';

export function SocketProvider({ children }: PropsWithChildren) {
  const status = useAuthStore((state) => state.status);

  usePushNotifications();

  useSocketNotifications();

  useEffect(() => {
    registerExpoListeners();

    return () => {
      cleanupExpoListeners();
    };
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      socketService.connect();
    }

    if (status === 'unauthenticated') {
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [status]);

  return children;
}
