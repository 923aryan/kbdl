// app/(protected)/_layout.tsx
import { useAuthStore } from '@/features/auth/hooks/useAuth';
import { Redirect, Stack } from 'expo-router';

export default function ProtectedLayout() {
  const status = useAuthStore((s) => s.status);

  if (status === 'loading') {
    return null;
  }

  if (status !== 'authenticated') {
    return <Redirect href="/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
