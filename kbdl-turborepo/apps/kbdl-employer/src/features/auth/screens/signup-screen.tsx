'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { employerRegisterSchema } from '@repo/validator/shared';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { useRegisterEmployer, useVerifyRegisteredEmployer } from '../hooks/use-auth-hook';
import { useAuthStore } from '../stores/use-auth-store';
const formSchema = employerRegisterSchema.shape.body;
type FormData = z.input<typeof formSchema>;

export default function SignupPage() {
  const router = useRouter();

  const { mutate: registerEmployer, isPending: isRegistering } = useRegisterEmployer();
  const { mutate: verifyEmployer, isPending: isVerifying } = useVerifyRegisteredEmployer();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [message, setMessage] = useState({ type: '', text: '' });
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [emailForOtp, setEmailForOtp] = useState('');
  const [otp, setOtp] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      company_name: '',
      email: '',
      phone_no: '',
      company_address: '',
    },
  });

  const onSubmit = (data: FormData) => {
    setMessage({ type: '', text: '' });

    registerEmployer(data as any, {
      onSuccess: () => {
        toast.success('Registration successful. Please check your email for OTP.');
        setEmailForOtp(data.email);
        setStep('otp');
      },
      onError: (error: any) => {
        console.log('error is ', error);
        toast.error(error?.message);
      },
    });
  };

  const handleVerifyOtp = () => {
    if (!otp) {
      setMessage({ type: 'error', text: 'Please enter OTP' });
      return;
    }
    setMessage({ type: '', text: '' });

    verifyEmployer(
      { email: emailForOtp, otp },
      {
        onSuccess: (data) => {
          toast.success('OTP Verified Successfully!');
          setAuth(data.employer, {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          });
          router.replace('/verification-pending');
        },
        onError: (error: any) => {
          toast.error(error?.message || 'Invalid OTP');
        },
      },
    );
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F5F9FF] px-4 py-10">
      {/* Background Glow */}
      <div className="absolute -left-25 top-[-100px] h-72 w-72 rounded-full bg-blue-200 opacity-60 blur-3xl" />

      <div className="absolute -bottom-25 right-[-100px] h-72 w-72 rounded-full bg-blue-300 opacity-50 blur-3xl" />

      {/* Signup Card */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-2xl">
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

            <h1 className="mt-5 text-3xl font-bold text-[#0A2540]">Employer Registration</h1>

            <p className="mt-2 text-center text-sm text-zinc-500">
              {step === 'form'
                ? 'Register your company to access the dashboard'
                : 'Enter the OTP sent to your email'}
            </p>
          </div>

          {/* Message Box */}
          {message.text && (
            <div
              className={`mb-5 rounded-xl px-4 py-3 text-sm font-medium ${
                message.type === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Form Grid */}
          {step === 'form' ? (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Controller
                  control={control}
                  name="company_name"
                  render={({ field: { ref, ...field } }) => (
                    <Input
                      {...field}
                      label="Company Name *"
                      placeholder="Enter company name"
                      error={errors.company_name?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="email"
                  render={({ field: { ref, ...field } }) => (
                    <Input
                      {...field}
                      type="email"
                      label="Company Email *"
                      placeholder="Enter email"
                      error={errors.email?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="phone_no"
                  render={({ field: { ref, ...field } }) => (
                    <Input
                      {...field}
                      label="Phone Number *"
                      placeholder="Enter phone number"
                      error={errors.phone_no?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="company_address"
                  render={({ field: { ref, ...field } }) => (
                    <Input
                      {...field}
                      label="Company Address *"
                      placeholder="Enter company address"
                      error={errors.company_address?.message}
                    />
                  )}
                />
              </div>

              {/* Signup Button */}
              <Button
                type="submit"
                disabled={isRegistering}
                className="mt-8 w-full rounded-xl bg-[#0057D9] py-3 font-semibold text-white transition-all duration-300 hover:bg-[#0047B3]"
              >
                {isRegistering ? 'Submitting...' : 'Register Company'}
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
                />
              </div>

              <Button
                type="button"
                onClick={handleVerifyOtp}
                disabled={isVerifying}
                className="w-full rounded-xl bg-[#0057D9] py-3 font-semibold text-white transition-all duration-300 hover:bg-[#0047B3]"
              >
                {isVerifying ? 'Verifying...' : 'Verify & Login'}
              </Button>
            </div>
          )}

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="font-semibold text-[#0057D9] hover:underline"
              >
                Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
