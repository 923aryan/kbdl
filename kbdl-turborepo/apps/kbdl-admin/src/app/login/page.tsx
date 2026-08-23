'use client';

import { api } from '@/lib/api-client';
import { setAuthTokens } from '@/lib/auth-tokens';
import type { AdminLoginResponse } from '@repo/types';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('mdarif@kbdl.dev');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await api.post<AdminLoginResponse>('/auth/admin/login', { email, password });
      setAuthTokens(res.data.accessToken, res.data.refreshToken);
      localStorage.setItem('kbdl_admin', JSON.stringify(res.data.admin));
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={(e) => void submit(e)} className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold text-[#0658C2]">KBDL product owner</p>
        <h1 className="mt-1 text-2xl font-bold">Admin login</h1>
        <label className="mt-6 block text-sm font-semibold">
          Email or phone
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="mdarif@kbdl.dev or +919876540001"
            className="mt-2 h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm"
          />
        </label>
        <label className="mt-4 block text-sm font-semibold">
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm" />
        </label>
        {error && <p className="mt-3 text-sm text-[#B91C1C]">{error}</p>}
        <button type="submit" disabled={busy} className="mt-6 h-11 w-full rounded-xl bg-[#0658C2] font-semibold text-white disabled:opacity-60">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
