'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@repo/ui/button';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState({
    type: '',
    text: '',
  });

  const [formData, setFormData] = useState({
    company_name: '',
    email: '',
    phone_no: '',
    company_address: '',
    gst_number: '',
    latitude: '',
    longitude: '',
    subscription_tier: 'premium',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setMessage({
        type: 'error',
        text: 'Geolocation is not supported by your browser',
      });

      return;
    }

    setMessage({
      type: '',
      text: '',
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString(),
        }));

        setMessage({
          type: 'success',
          text: 'Location fetched successfully',
        });
      },
      () => {
        setMessage({
          type: 'error',
          text: 'Unable to fetch location',
        });
      },
    );
  };

  const handleSignup = async () => {
    const {
      company_name,
      email,
      phone_no,
      company_address,
      gst_number,
      latitude,
      longitude,
      subscription_tier,
    } = formData;

    if (!company_name || !email || !phone_no || !company_address || !latitude || !longitude) {
      setMessage({
        type: 'error',
        text: 'Please fill all required fields',
      });

      return;
    }

    try {
      setLoading(true);

      setMessage({
        type: '',
        text: '',
      });

      const response = await fetch(`${API_URL}/register/employer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company_name,
          email,
          phone_no,
          company_address,
          gst_number,
          company_location: {
            latitude: Number(latitude),
            longitude: Number(longitude),
          },
          subscription_tier,
        }),
      });

      const data = await response.json();

      console.log('REGISTER RESPONSE:', data);

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'Registration submitted successfully. Waiting for admin approval.',
        });

        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        console.log('REGISTER RESPONSE:', JSON.stringify(data, null, 2));

        setMessage({
          type: 'error',
          text: data?.error?.message || 'Registration failed',
        });
      }
    } catch (error) {
      console.log(error);

      setMessage({
        type: 'error',
        text: 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F5F9FF] px-4 py-10">
      {/* Background Glow */}
      <div className="absolute left-[-100px] top-[-100px] h-72 w-72 rounded-full bg-blue-200 opacity-60 blur-3xl" />

      <div className="absolute bottom-[-100px] right-[-100px] h-72 w-72 rounded-full bg-blue-300 opacity-50 blur-3xl" />

      {/* Signup Card */}
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-2xl">
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

            <h1 className="mt-5 text-3xl font-bold text-[#0A2540]">Employer Registration</h1>

            <p className="mt-2 text-center text-sm text-zinc-500">
              Register your company to access the dashboard
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
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Company Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[#0A2540]">
                Company Name *
              </label>

              <input
                type="text"
                name="company_name"
                placeholder="Enter company name"
                value={formData.company_name}
                onChange={handleChange}
                className="w-full rounded-xl border border-blue-100 bg-[#F9FBFF] px-4 py-3 outline-none transition-all focus:border-[#0057D9] focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[#0A2540]">
                Company Email *
              </label>

              <input
                type="email"
                name="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-blue-100 bg-[#F9FBFF] px-4 py-3 outline-none transition-all focus:border-[#0057D9] focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[#0A2540]">
                Phone Number *
              </label>

              <input
                type="text"
                name="phone_no"
                placeholder="Enter phone number"
                value={formData.phone_no}
                onChange={handleChange}
                className="w-full rounded-xl border border-blue-100 bg-[#F9FBFF] px-4 py-3 outline-none transition-all focus:border-[#0057D9] focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* GST */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[#0A2540]">GST Number *</label>

              <input
                type="text"
                name="gst_number"
                placeholder="Enter GST number"
                value={formData.gst_number}
                onChange={handleChange}
                className="w-full rounded-xl border border-blue-100 bg-[#F9FBFF] px-4 py-3 uppercase outline-none transition-all focus:border-[#0057D9] focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Subscription */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[#0A2540]">
                Subscription Tier
              </label>

              <select
                name="subscription_tier"
                value={formData.subscription_tier}
                onChange={handleChange}
                className="w-full rounded-xl border border-blue-100 bg-[#F9FBFF] px-4 py-3 outline-none transition-all focus:border-[#0057D9] focus:ring-4 focus:ring-blue-100"
              >
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[#0A2540]">
                Company Address *
              </label>

              <input
                type="text"
                name="company_address"
                placeholder="Enter company address"
                value={formData.company_address}
                onChange={handleChange}
                className="w-full rounded-xl border border-blue-100 bg-[#F9FBFF] px-4 py-3 outline-none transition-all focus:border-[#0057D9] focus:ring-4 focus:ring-blue-100"
              />
            </div>

            {/* Location Fetch */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-[#0A2540]">
                Company Location *
              </label>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={
                    formData.latitude && formData.longitude
                      ? `${formData.latitude}, ${formData.longitude}`
                      : ''
                  }
                  placeholder="Fetch your current location"
                  readOnly
                  className="w-full rounded-xl border border-blue-100 bg-[#F9FBFF] px-4 py-3 outline-none"
                />

                <button
                  type="button"
                  onClick={handleGetLocation}
                  className="rounded-xl bg-[#0057D9] px-5 py-3 font-medium text-white transition-all hover:bg-[#0047B3]"
                >
                  Fetch
                </button>
              </div>
            </div>
          </div>

          {/* Signup Button */}
          <Button
            children={loading ? 'Submitting...' : 'Register Company'}
            onClick={handleSignup}
            className="mt-8 w-full rounded-xl bg-[#0057D9] py-3 font-semibold text-white transition-all duration-300 hover:bg-[#0047B3]"
          />

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500">
              Already have an account?{' '}
              <button
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
