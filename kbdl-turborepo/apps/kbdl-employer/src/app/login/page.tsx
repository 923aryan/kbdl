// src/app/login/page.tsx

'use client';
import { Button } from '@repo/ui/button';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../features/auth/store/auth-store';

export default function LoginPage() {
  const router = useRouter();

  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = () => {
    setAuth('dummy-token', {
      id: '1',
      name: 'Admin',
      email: 'admin@test.com',
    });

    router.replace('/');
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Button children={'Login'} onClick={handleLogin} />
    </div>
  );
}
