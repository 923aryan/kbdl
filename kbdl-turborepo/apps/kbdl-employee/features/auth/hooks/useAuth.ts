// src/features/auth/hooks/useAuth.ts
import { clearPushToken } from '@/features/notifications/api';
import { registerPushToken } from '@/features/notifications/services/push-token-service';
import { AppUser, UserRegisterPayload } from '@repo/types';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { queryClient } from '../../../lib/api/query-client';
import { useShiftSwapStore } from '../../shift-swap/hooks/use-shift-swap';
import { getMe } from '../api';

interface AuthState {
  accessToken: string | null;
  user: Partial<AppUser> | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';
  registerData: UserRegisterPayload;

  // Actions
  signIn: (payload: { accessToken: string; refreshToken: string; user: AppUser }) => Promise<void>;
  signOut: () => Promise<void>;
  hydrateAuth: () => Promise<void>;

  // Helper to update user profile locally (e.g., if they change their name or theme)
  updateUser: (updatedFields: Partial<AppUser>) => void;
  updateRegisterData: (updatedFields: UserRegisterPayload) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: 'loading',
  registerData: {
    name: '',
    phone_no: '',
    preferences: { theme: 'system', language: 'en-IN' },
  },

  signIn: async ({ accessToken, refreshToken, user }) => {
    // 1. Save everything securely
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await SecureStore.setItemAsync('userProfile', JSON.stringify(user)); // Store user object as a string

    // 2. Update Zustand state
    set({ accessToken, user, status: 'authenticated' });
  },

  signOut: async () => {
    try {
      // Deactivate current device token
      const token = await registerPushToken();

      if (token) {
        await clearPushToken({ token });
      }
    } catch (error) {
      console.error('Failed to clear push token:', error);
    }
    // 1. Clear secure storage
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('userProfile');
    await SecureStore.deleteItemAsync('shift-swap-storage'); // Wipe the persisted shift-swap key

    // Clear out shifts from memory and sync the empty state
    useShiftSwapStore.getState().clearShifts();

    // Clear out TanStack Query cache
    queryClient.clear();

    // 2. Reset Zustand state
    set({ accessToken: null, user: null, status: 'unauthenticated' });
  },

  hydrateAuth: async () => {
    try {
      set({ status: 'loading' });

      // Check if token exists
      const token = await SecureStore.getItemAsync('accessToken');

      if (!token) {
        set({
          accessToken: null,
          user: null,
          status: 'unauthenticated',
        });

        return;
      }

      // Fetch latest profile
      const response = await getMe();

      const user = response;

      set({
        accessToken: token,
        user,
        status: 'authenticated',
      });

      // Cache latest profile
      await SecureStore.setItemAsync('userProfile', JSON.stringify(user));
    } catch (error) {
      console.error('Auth hydration failed:', error);

      // Clear invalid session
      await Promise.all([
        SecureStore.deleteItemAsync('accessToken'),
        SecureStore.deleteItemAsync('refreshToken'),
        SecureStore.deleteItemAsync('userProfile'),
        SecureStore.deleteItemAsync('shift-swap-storage'),
      ]);

      useShiftSwapStore.getState().clearShifts();

      // Clear out TanStack Query cache on hydration failure
      queryClient.clear();

      set({
        accessToken: null,
        user: null,
        status: 'unauthenticated',
      });
    }
  },

  updateUser: (updatedFields) =>
    set((state) => {
      if (!state.user) return state;

      const updatedUser = { ...state.user, ...updatedFields };

      // Update storage asynchronously in the background so UI doesn't block
      SecureStore.setItemAsync('userProfile', JSON.stringify(updatedUser));

      return { user: updatedUser };
    }),

  updateRegisterData: (updatedFields) =>
    set((state) => {
      const updatedRegisterData = { ...state.registerData, ...updatedFields };
      return { registerData: updatedRegisterData };
    }),
}));
