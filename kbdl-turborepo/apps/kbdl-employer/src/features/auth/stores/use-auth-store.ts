'use client';

import { EmployerDTO, GetCurrentEmployerProfileResponse } from '@repo/types';
import { create } from 'zustand';
import { api } from '../../../lib/api-client';
import { clearAuthTokens, setAuthTokens } from '../../../lib/auth-tokens';

type AuthState = {
  employer: EmployerDTO | null;
  isHydrated: boolean;

  setAuth: (employer: EmployerDTO, tokens?: { accessToken: string; refreshToken: string }) => void;
  logout: () => void;
  hydrateAuth: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
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

    try {
      const response = await api.get<GetCurrentEmployerProfileResponse>('/profile/employers/me');
      const employerData = response.data;
      set({
        employer: employerData || null,
        isHydrated: true,
      });
    } catch {
      clearAuthTokens();
      localStorage.removeItem('employer');
      set({ employer: null, isHydrated: true });
    }
  },
}));
