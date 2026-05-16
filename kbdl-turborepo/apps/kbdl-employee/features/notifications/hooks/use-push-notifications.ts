import { useEffect } from 'react';

import { Platform } from 'react-native';

import { registerPushToken } from '../services/push-token-service';

import { useAuthStore } from '@/features/auth/hooks/useAuth';
import { savePushToken } from '../api';

export function usePushNotifications() {
  const status = useAuthStore((s) => s.status);

  useEffect(() => {
    async function init() {
      if (status !== 'authenticated') {
        return;
      }

      const token = await registerPushToken();

      if (!token) return;

      await savePushToken({
        token,
        platform: Platform.OS,
      });
    }

    init();
  }, [status]);
}