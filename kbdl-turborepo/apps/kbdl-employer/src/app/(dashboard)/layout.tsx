// src/app/(dashboard)/layout.tsx

'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useAuthStore } from '../../features/auth/stores/use-auth-store';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {

  console.log("this is src/app/(dashboard)/layout.tsx")

  const router = useRouter();

  const employer = useAuthStore((state) => state.employer);

  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    hydrateAuth();
    setIsMounted(true);
  }, [hydrateAuth]);

  useEffect(() => {
    if (isMounted && !employer) {
      router.replace('/login');
    }
  }, [employer, isMounted, router]);

  if (!isMounted || !employer) {
    return null;
  }

  return <div className="min-h-screen">{children}</div>;
}
