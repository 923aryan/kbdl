// src/app/providers.tsx

'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, useEffect, useState } from 'react';
import { useAuthStore } from '../features/auth/stores/use-auth-store';

export default function Providers({ children }: { children: ReactNode }) {
  console.log("this is src/app/providers.tsx")

  const hydrateAuth = useAuthStore((state) => state.hydrateAuth);

  // Run once on mount to load data from localStorage
  useEffect(() => {
    hydrateAuth();
  }, [hydrateAuth]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}