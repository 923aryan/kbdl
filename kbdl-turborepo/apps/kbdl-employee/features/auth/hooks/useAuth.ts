// src/features/auth/store/useAuthStore.ts
import { User } from "@repo/db/shared";
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

  // Actions
  signIn: (payload: { accessToken: string; refreshToken: string; user: User }) => Promise<void>;
  signOut: () => Promise<void>;
  hydrateAuth: () => Promise<void>;

  // Helper to update user profile locally (e.g., if they change their name or theme)
  updateUser: (updatedFields: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  status: 'loading',

  signIn: async ({ accessToken, refreshToken, user }) => {
    // 1. Save everything securely
    await SecureStore.setItemAsync('accessToken', accessToken);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await SecureStore.setItemAsync('userProfile', JSON.stringify(user)); // Store user object as a string

    // 2. Update Zustand state
    set({ accessToken, user, status: 'authenticated' });
  },

  signOut: async () => {
    // 1. Clear secure storage
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    await SecureStore.deleteItemAsync('userProfile');

    // 2. Reset Zustand state
    set({ accessToken: null, user: null, status: 'unauthenticated' });
  },

  hydrateAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      const userString = await SecureStore.getItemAsync('userProfile');

      if (token && userString) {
        // Parse the stored user string back into an object
        const user = JSON.parse(userString) as User;
        set({ accessToken: token, user, status: 'authenticated' });
      } else {
        // If either is missing, ensure clean slate and require login
        set({ status: 'unauthenticated', accessToken: null, user: null });
      }
    } catch (e) {
      console.error("Auth Hydration Failed:", e);
      set({ status: 'unauthenticated', accessToken: null, user: null });
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
}));