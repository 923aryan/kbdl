// src/app/(dashboard)/layout.tsx

'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useAuthStore } from '../../features/auth/stores/use-auth-store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  console.log('this is src/app/(dashboard)/layout.tsx');

  const router = useRouter();

  const employer = useAuthStore((state) => state.employer);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (!isHydrated) {
      hydrateAuth();
    }
    setIsMounted(true);
  }, [hydrateAuth, isHydrated]);

  useEffect(() => {
    if (isMounted && isHydrated && !employer) {
      console.log('navigating to login');
      router.replace('/login');
    }
  }, [employer, isMounted, isHydrated, router]);

  if (!isMounted || !isHydrated || !employer) {
    return null;
  }

  return <div className="min-h-screen">{children}</div>;
}
