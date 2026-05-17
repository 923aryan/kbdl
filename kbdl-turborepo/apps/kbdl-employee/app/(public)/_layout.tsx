// app/(public)/_layout.tsx

import { useAuthStore } from '@/features/auth/hooks/useAuth';
import { Stack } from 'expo-router';

export default function PublicLayout() {
  const status = useAuthStore((s) => s.status);

  if (status === 'loading') {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
