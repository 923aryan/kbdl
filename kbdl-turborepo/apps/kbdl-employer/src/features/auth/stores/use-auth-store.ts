// src/features/auth/store/auth.store.ts

'use client';

import { GetCurrentEmployerProfileResponse } from '@repo/types';
import { create } from 'zustand';
import { api } from '../../../lib/api-client';
import { EmployerDTO } from '../types/employer';
type AuthState = {
  employer: EmployerDTO | null;
  isHydrated: boolean;

  setAuth: (employer: EmployerDTO) => void;
  logout: () => void;
  hydrateAuth: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  employer: null,
  isHydrated: false, // <-- Initial state

  setAuth: (employer) => {
    localStorage.setItem('employer', JSON.stringify(employer));
    set({ employer });
  },

  logout: () => {
    localStorage.removeItem('employer');
    set({ employer: null });
  },

  hydrateAuth: async () => {
    if (typeof window === 'undefined') return;

    try {
      const response = await api.get<GetCurrentEmployerProfileResponse>('/profile/employers/me');
      const employerData = response.data
      console.log("data is ", employerData)
      set({
        employer: employerData || null,
        isHydrated: true, // <-- Mark as done
      });
      console.log("in src/features/auth/store/auth.store.ts, its hydrated")
    } catch (error) {
      console.error('Failed to fetch employer profile', error);
      set({ employer: null, isHydrated: true }); // <-- Mark as done even on error
    }
  },
}));
