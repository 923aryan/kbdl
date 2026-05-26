'use client';

import { Button } from '@repo/ui/button';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useLogout } from '../hooks/use-auth-hook';
import { useAuthStore } from '../stores/use-auth-store';

export default function VerificationPendingScreen() {
  const router = useRouter();
  const logoutAction = useAuthStore((state) => state.logout);
  const { mutate: logout, isPending } = useLogout();

  const handleLogout = () => {
    logout(undefined, {
      onSuccess: () => {
        logoutAction();
        router.replace('/login');
      },
      onError: () => {
        // Even if API fails, clear local state and redirect
        logoutAction();
        router.replace('/login');
      },
    });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F5F9FF] px-4">
      {/* Background Glow */}
      <div className="absolute -left-25 top-[-100px] h-72 w-72 rounded-full bg-blue-200 opacity-60 blur-3xl" />
      <div className="absolute -bottom-25 right-[-100px] h-72 w-72 rounded-full bg-blue-300 opacity-50 blur-3xl" />

      {/* Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-2xl p-8 text-center">
        {/* Top Gradient */}
        <div className="absolute left-0 top-0 h-2 w-full bg-linear-to-r from-[#0057D9] via-blue-500 to-cyan-400" />

        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#F5F9FF] p-3">
            <Image
              src="/assets/logo.png"
              alt="Logo"
              width={150}
              height={150}
              className="h-full w-full object-contain"
            />
          </div>
        </div>

        <h1 className="mt-5 text-2xl font-bold text-[#0A2540]">Verification Pending</h1>

        <p className="mt-4 text-sm leading-relaxed text-zinc-500">
          Your employer account is currently under review by our administration team. You will be
          notified once your account is verified and approved.
        </p>

        <div className="mt-8">
          <Button
            type="button"
            disabled={isPending}
            onClick={handleLogout}
            className="w-full rounded-xl bg-[#0057D9] py-3 font-semibold text-white transition-all duration-300 hover:bg-[#0047B3]"
          >
            {isPending ? 'Logging out...' : 'Logout'}
          </Button>
        </div>
      </div>
    </div>
  );
}