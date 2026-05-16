import { create } from 'zustand';

import { RealtimeNotification } from '../types/notification-types';

interface NotificationState {
  notifications: RealtimeNotification[];

  unreadCount: number;

  addNotification: (notification: RealtimeNotification) => void;

  markAsRead: (id: string) => void;

  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  unreadCount: 0,

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],

      unreadCount: state.unreadCount + 1,
    })),

  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),

      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  clearNotifications: () =>
    set({
      notifications: [],
      unreadCount: 0,
    }),
}));
