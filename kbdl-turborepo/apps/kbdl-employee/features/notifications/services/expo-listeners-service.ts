import * as Notifications from 'expo-notifications';

let foregroundSubscription: Notifications.EventSubscription;

let responseSubscription: Notifications.EventSubscription;

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
    console.log('Foreground notification:', notification);
  });

  responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('Notification tapped:', response);

    const data = response.notification.request.content.data;
    if (data.type === 'public_shift') {
      // router.push(`/shifts/${data.shiftId}`);
    } else if (data.type === 'shift_swap_request') {
      console.log('Notification data:', data);
      // router.push(`/shifts/${data.shiftId}`);
    }
    /*
          navigation logic here later

          Example:
          shift swap screen
          job details screen
        */

    console.log('Push Notification data:', data);
  });
}

export function cleanupExpoListeners() {
  foregroundSubscription?.remove();

  responseSubscription?.remove();
}
