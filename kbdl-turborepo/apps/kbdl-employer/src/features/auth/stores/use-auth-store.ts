'use client';

import { GetCurrentEmployerProfileResponse } from '@repo/types';
import { create } from 'zustand';
import { api } from '../../../lib/api-client';
import { clearAuthTokens, setAuthTokens } from '../../../lib/auth-tokens';

type AuthState = {
  employer: GetCurrentEmployerProfileResponse | null;
  isHydrated: boolean;

  setAuth: (
    employer: GetCurrentEmployerProfileResponse,
    tokens?: { accessToken: string; refreshToken: string },
  ) => void;
  logout: () => void;
  hydrateAuth: () => Promise<void>;
};

let hydrateInFlight: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  employer: null,
  isHydrated: false,

  setAuth: (employer, tokens) => {
    if (tokens?.accessToken && tokens?.refreshToken) {
      setAuthTokens(tokens.accessToken, tokens.refreshToken);
    }
    localStorage.setItem('employer', JSON.stringify(employer));
    set({ employer });
  },

  logout: () => {
    clearAuthTokens();
    localStorage.removeItem('employer');
    set({ employer: null });
  },

  hydrateAuth: async () => {
    if (typeof window === 'undefined') return;
    if (get().isHydrated) return;
    if (hydrateInFlight) return hydrateInFlight;

    hydrateInFlight = (async () => {
      try {
        const response = await api.get<GetCurrentEmployerProfileResponse>('/profile/employers/me');
        set({
          employer: response.data || null,
          isHydrated: true,
        });
      } catch {
        clearAuthTokens();
        localStorage.removeItem('employer');
        set({ employer: null, isHydrated: true });
      } finally {
        hydrateInFlight = null;
      }
    })();

    return hydrateInFlight;
  },
}));
