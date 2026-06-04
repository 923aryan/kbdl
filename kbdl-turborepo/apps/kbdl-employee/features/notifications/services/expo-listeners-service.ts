import { NotificationTypes } from '@/constants/constants';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

let foregroundSubscription: Notifications.EventSubscription;

let responseSubscription: Notifications.EventSubscription;

let isRouterReady = false;

export function setNotificationRouterReady(ready: boolean) {
  isRouterReady = ready;
}

export function registerExpoListeners() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  foregroundSubscription = Notifications.addNotificationReceivedListener((notification) => {
    console.log(
      'Foreground notification ARRIVED:',
      JSON.stringify(notification.request.content, null, 2),
    );
  });

  responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    console.log('response was ', response.notification.request.content);
    if (isRouterReady) {
      if (
        data.type === NotificationTypes.publicShiftSwap ||
        data.type === NotificationTypes.shiftSwapRequest ||
        data.shiftId // <-- Fallback in case backend misses 'type' in the payload
      ) {
        router.push({
          pathname: '/shift-swap/[id]',
          params: { id: data.shiftId as string, buttonTitle: 'Notification' },
        });
      } else if (data.type === NotificationTypes.onboardRequest) {
        router.push({
          pathname: '/(tabs)/notifications',
          params: { tab: 'jobs' },
        });
      }
    }
  });
}

export function cleanupExpoListeners() {
  foregroundSubscription?.remove();

  responseSubscription?.remove();
}
