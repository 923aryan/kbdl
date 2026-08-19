'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { employerloginSchema } from '@repo/validator/shared';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useSendEmployerOtp, useVerifyEmployerOtp } from '../hooks/use-auth-hook';
import { useAuthStore } from '../stores/use-auth-store';

const formSchema = employerloginSchema.shape.body;
type FormData = z.input<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();

  const { mutate: sendOtp, isPending: isSending } = useSendEmployerOtp();
  const { mutate: verifyOtp, isPending: isVerifying } = useVerifyEmployerOtp();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [emailForOtp, setEmailForOtp] = useState('');
  const [otp, setOtp] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
    },
  });

  // SEND OTP
  const onSendOtp = (data: FormData) => {
    sendOtp(data, {
      onSuccess: () => {
        toast.success('OTP sent successfully');
        setEmailForOtp(data.email);
        setStep('otp');
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Failed to send OTP');
      },
    });
  };

  // VERIFY OTP
  const handleVerifyOtp = () => {
    if (!otp) {
      toast.error('Please enter OTP');
      return;
    }

    verifyOtp(
      { email: emailForOtp, otp },
      {
        onSuccess: (data) => {
          toast.success('Login successful');
          setAuth(data.employer, {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          });
          if (!data.employer.is_verified) {
            router.replace('/verification-pending');
          } else {
            router.replace('/');
          }
          return;
        },
        onError: (error: any) => {
          toast.error(error?.message || 'Invalid OTP');
        },
      },
    );
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F5F9FF] px-4">
      {/* Background Glow */}
      <div className="absolute -left-25 top-[-100px] h-72 w-72 rounded-full bg-blue-200 opacity-60 blur-3xl" />

      <div className="absolute -bottom-25 right-[-100px] h-72 w-72 rounded-full bg-blue-300 opacity-50 blur-3xl" />

      {/* Login Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-2xl">
        {/* Top Gradient */}
        <div className="h-2 w-full bg-linear-to-r from-[#0057D9] via-blue-500 to-cyan-400" />

        <div className="p-8">
          {/* Logo */}
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

            <h1 className="mt-5 text-3xl font-bold text-[#0A2540]">Welcome Back</h1>

            <p className="mt-2 text-center text-sm text-zinc-500">
              {step === 'email'
                ? 'Login with OTP verification'
                : 'Enter the OTP sent to your email'}
            </p>
          </div>

          {step === 'email' ? (
            <form onSubmit={handleSubmit(onSendOtp)}>
              <div className="mb-5">
                <Controller
                  control={control}
                  name="email"
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="email"
                      label="Email Address *"
                      placeholder="Enter your email"
                      error={errors.email?.message}
                    />
                  )}
                />
              </div>

              <Button
                type="submit"
                disabled={isSending}
                className="w-full rounded-xl bg-[#0057D9] py-3 font-semibold text-white cursor-pointer transition-all duration-200 hover:bg-[#054A9F] hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSending ? 'Sending OTP...' : 'Send OTP'}
              </Button>
            </form>
          ) : (
            <div>
              <div className="mb-5">
                <Input
                  type="text"
                  label="Enter OTP *"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isVerifying) {
                      e.preventDefault();
                      handleVerifyOtp();
                    }
                  }}
                />
              </div>

              <Button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isVerifying}
                className="w-full rounded-xl bg-[#0057D9] py-3 font-semibold text-white cursor-pointer transition-all duration-300 hover:bg-[#0047B3] transition-all duration-200 hover:bg-[#054A9F] hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isVerifying ? 'Verifying...' : 'Verify & Login'}
              </Button>

              <button
                type="button"
                disabled={isSending}
                onClick={() => sendOtp({ email: emailForOtp })}
                className="mt-4 w-full text-center text-sm font-medium text-[#0057D9] hover:underline disabled:opacity-50"
              >
                {isSending ? 'Resending...' : 'Resend OTP'}
              </button>
            </div>
          )}

          {/* Signup Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              Don&apos;t have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/signup')}
                className="font-semibold text-[#0057D9] hover:underline"
              >
                Sign Up
              </button>
            </p>
          </div>

          {/* Bottom Text */}
          <div className="mt-3 text-center">
            <p className="text-sm text-zinc-500">OTP will be sent to your registered email</p>
          </div>
        </div>
      </div>
    </div>
  );
}
