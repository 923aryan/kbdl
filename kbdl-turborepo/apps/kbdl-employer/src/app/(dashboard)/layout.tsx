// src/app/(dashboard)/layout.tsx

'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useAuthStore } from '../../features/auth/store/auth-store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const accessToken = useAuthStore((state) => state.accessToken);

  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);

  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  useEffect(() => {
    if (accessToken === null) {
      router.replace('/login');
    }
  }, [accessToken, router]);

  if (!accessToken) {
    return null;
  }

  return <div className="min-h-screen">{children}</div>;
}
