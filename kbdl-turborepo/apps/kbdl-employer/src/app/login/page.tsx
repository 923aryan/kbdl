// src/app/login/page.tsx

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@repo/ui/button';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../features/auth/store/auth-store';

export default function LoginPage() {
  const router = useRouter();

  const setAuth = useAuthStore((state) => state.setAuth);

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // SEND OTP
  const handleSendOtp = async () => {
    if (!email) {
      alert('Please enter email');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/employer/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      console.log('SEND OTP RESPONSE:', data);

      if (response.ok) {
        setOtpSent(true);

        alert('OTP sent successfully');
      } else {
        alert(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.log(error);

      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // VERIFY OTP
  const handleVerifyOtp = async () => {
    if (!otp) {
      alert('Please enter OTP');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/employer/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          otp,
        }),
      });

      const data = await response.json();

      console.log('VERIFY OTP RESPONSE:', data);

      if (response.ok) {
        setAuth(
          data.token || 'dummy-token',
          data.user || {
            id: '1',
            name: 'Employer',
            email,
          },
        );

        alert('Login successful');

        router.replace('/');
      } else {
        alert(data.message || 'Invalid OTP');
      }
    } catch (error) {
      console.log(error);

      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F5F9FF] px-4">
      {/* Background Glow */}
      <div className="absolute left-[-100px] top-[-100px] h-72 w-72 rounded-full bg-blue-200 opacity-60 blur-3xl" />

      <div className="absolute bottom-[-100px] right-[-100px] h-72 w-72 rounded-full bg-blue-300 opacity-50 blur-3xl" />

      {/* Login Card */}
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-2xl">
        {/* Top Gradient */}
        <div className="h-2 w-full bg-gradient-to-r from-[#0057D9] via-blue-500 to-cyan-400" />

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

            <p className="mt-2 text-center text-sm text-zinc-500">Login with OTP verification</p>
          </div>

          {/* Email */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium text-[#0A2540]">Email Address</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={otpSent}
              className="w-full rounded-xl border border-blue-100 bg-[#F9FBFF] px-4 py-3 text-[#0A2540] outline-none transition-all placeholder:text-zinc-400 focus:border-[#0057D9] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
            />
          </div>

          {/* OTP INPUT */}
          {otpSent && (
            <div className="mb-5">
              <label className="mb-2 block text-sm font-medium text-[#0A2540]">Enter OTP</label>

              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full rounded-xl border border-blue-100 bg-[#F9FBFF] px-4 py-3 text-[#0A2540] outline-none transition-all placeholder:text-zinc-400 focus:border-[#0057D9] focus:ring-4 focus:ring-blue-100"
              />
            </div>
          )}

          {/* BUTTON */}
          {!otpSent ? (
            <Button
              children={loading ? 'Sending OTP...' : 'Send OTP'}
              onClick={handleSendOtp}
              className="w-full rounded-xl bg-[#0057D9] py-3 font-semibold text-white transition-all duration-300 hover:bg-[#0047B3]"
            />
          ) : (
            <Button
              children={loading ? 'Verifying...' : 'Verify & Login'}
              onClick={handleVerifyOtp}
              className="w-full rounded-xl bg-[#0057D9] py-3 font-semibold text-white transition-all duration-300 hover:bg-[#0047B3]"
            />
          )}

          {/* Resend OTP */}
          {otpSent && (
            <button
              onClick={handleSendOtp}
              className="mt-4 w-full text-center text-sm font-medium text-[#0057D9] hover:underline"
            >
              Resend OTP
            </button>
          )}

          {/* Signup Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              Don&apos;t have an account?{' '}
              <button
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
