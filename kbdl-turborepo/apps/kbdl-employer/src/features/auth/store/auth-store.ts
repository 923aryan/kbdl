// src/features/auth/store/auth.store.ts

'use client';

import { create } from 'zustand';

type User = {
  id: string;
  name: string;
  email: string;
};

type AuthState = {
  accessToken: string | null;
  user: User | null;

  setAuth: (token: string, user: User) => void;

  logout: () => void;

  hydrateAuth: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,

  setAuth: (token, user) => {
    localStorage.setItem('accessToken', token);

    localStorage.setItem('user', JSON.stringify(user));

    set({
      accessToken: token,
      user,
    });
  },

  logout: () => {
    localStorage.removeItem('accessToken');

    localStorage.removeItem('user');

    set({
      accessToken: null,
      user: null,
    });
  },

  hydrateAuth: () => {
    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('accessToken');

    const user = localStorage.getItem('user');

    set({
      accessToken: token,
      user: user ? JSON.parse(user) : null,
    });
  },
}));
