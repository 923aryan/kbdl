import { PropsWithChildren, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

import { useAuthStore } from '@/features/auth/hooks/useAuth';

import { socketService } from '../services/socket-service';

import { usePushNotifications } from '../hooks/use-push-notifications';

import { useSocketNotifications } from '../hooks/use-socket-notifications';
import { cleanupExpoListeners, registerExpoListeners } from '../services/expo-listeners-service';

export function SocketProvider({ children }: PropsWithChildren) {
  const status = useAuthStore((state) => state.status);
  const [socket, setSocket] = useState<Socket | null>(null);

  usePushNotifications();

  useSocketNotifications(socket);

  useEffect(() => {
    registerExpoListeners();

    return () => {
      cleanupExpoListeners();
    };
  }, []);

  useEffect(() => {
    if (status === 'authenticated') {
      const newSocket = socketService.connect();
      setSocket(newSocket || null);
    }

    if (status === 'unauthenticated') {
      socketService.disconnect();
      setSocket(null);
    }

    return () => {
      socketService.disconnect();
      setSocket(null);
    };
  }, [status]);

  return children;
}
