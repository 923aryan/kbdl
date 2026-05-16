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
      try {
        await savePushToken({
          token,
          platform: Platform.OS,
        });
        console.log('✅ Push token saved successfully:', token);
      } catch (error) {
        console.error('❌ Failed to save push token to backend:', error);
      }
    }

    init();
  }, [status]);
}