// lib/api/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // If the access token is missing, do not retry. Fail immediately to clear the pending state.
        if (error?.code === 'UNAUTHORIZED_NO_TOKEN') return false;

        // Otherwise, use the standard TanStack Query retry behavior (e.g., retry up to 3 times)
        return failureCount < 3;
      },
    },
  },
});
