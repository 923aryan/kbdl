'use client';

import { api } from '@/lib/api-client';
import { clearAuthTokens, getAccessToken } from '@/lib/auth-tokens';
import type { AdminCompanyListItem, HrInviteView } from '@repo/types';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

const STATUSES = ['onboarding', 'pending_review', 'active', 'suspended', 'rejected'] as const;

function adminStatusOptions(current: (typeof STATUSES)[number]): Array<{
  value: (typeof STATUSES)[number];
  disabled?: boolean;
}> {
  if (current === 'onboarding') {
    return [
      { value: 'onboarding' },
      { value: 'pending_review', disabled: true },
      { value: 'active', disabled: true },
      { value: 'rejected' },
    ];
  }
  if (current === 'pending_review') {
    return [
      { value: 'pending_review' },
      { value: 'active' },
      { value: 'rejected' },
    ];
  }
  if (current === 'active') {
    return [{ value: 'active' }, { value: 'suspended' }];
  }
  if (current === 'suspended') {
    return [{ value: 'suspended' }, { value: 'active' }];
  }
  return [{ value: 'rejected' }, { value: 'onboarding', disabled: true }];
}

export default function AdminHomePage() {
  const router = useRouter();
  const [tab, setTab] = useState<'companies' | 'invites'>('companies');
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [companies, setCompanies] = useState<AdminCompanyListItem[]>([]);
  const [invites, setInvites] = useState<HrInviteView[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [founderForm, setFounderForm] = useState({
    company_name: '',
    company_address: '',
    state: '',
    founder_name: '',
    founder_email: '',
    founder_phone: '',
  });
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadCompanies = useCallback(async () => {
    const query = new URLSearchParams();
    if (status) query.set('status', status);
    if (search.trim()) query.set('search', search.trim());
    const res = await api.get<AdminCompanyListItem[]>(`/admin/companies?${query.toString()}`);
    setCompanies(res.data);
  }, [status, search]);

  const loadInvites = useCallback(async () => {
    const res = await api.get<HrInviteView[]>('/admin/hr-invites');
    setInvites(res.data);
  }, []);

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/login');
      return;
    }
    setLoading(true);
    Promise.allSettled([loadCompanies(), loadInvites()])
      .then((results) => {
        const failed = results.find((item) => item.status === 'rejected');
        if (failed && failed.status === 'rejected') {
          const message = failed.reason instanceof Error ? failed.reason.message : 'Failed to load';
          if (message.toLowerCase().includes('unauthor') || message.toLowerCase().includes('token')) {
            clearAuthTokens();
            router.replace('/login');
            return;
          }
          setError(message);
        }
      })
      .finally(() => setLoading(false));
  }, [loadCompanies, loadInvites, router]);

  const setCompanyStatus = async (id: string, next: (typeof STATUSES)[number]) => {
    setError(null);
    try {
      await api.patch<AdminCompanyListItem>(`/admin/companies/${id}/status`, { status: next });
      await loadCompanies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update status');
      await loadCompanies();
    }
  };

  const onboardFounder = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      await api.post('/admin/companies', founderForm);
      setFounderForm({
        company_name: '',
        company_address: '',
        state: '',
        founder_name: '',
        founder_email: '',
        founder_phone: '',
      });
      setNotice('Company and founder created. They can log in on the employer app with email OTP 123456.');
      await loadCompanies();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not onboard company');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-[#E5E7EB] bg-white px-6 py-4">
        <div>
          <p className="text-xs font-semibold text-[#0658C2]">KBDL</p>
          <h1 className="text-lg font-bold">Product owner console</h1>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => setTab('companies')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === 'companies' ? 'bg-[#DBEAFF] text-[#0658C2]' : 'text-[#676767]'}`}>
            Companies
          </button>
          <button type="button" onClick={() => setTab('invites')} className={`rounded-lg px-4 py-2 text-sm font-semibold ${tab === 'invites' ? 'bg-[#DBEAFF] text-[#0658C2]' : 'text-[#676767]'}`}>
            HR invites
          </button>
          <button
            type="button"
            onClick={() => {
              clearAuthTokens();
              router.replace('/login');
            }}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-red-600"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {notice && <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}
        {loading && <p className="text-sm text-[#676767]">Loading…</p>}

        {tab === 'companies' && (
          <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
            <form
              onSubmit={(e) => void onboardFounder(e)}
              className="rounded-2xl border border-[#E5E7EB] bg-white p-5"
            >
              <h2 className="text-lg font-semibold">Onboard company / founder</h2>
              <p className="mt-1 text-sm text-[#676767]">
                Creates the company and a company-owner login. Owner uses the employer app (email OTP).
              </p>
              <input required value={founderForm.company_name} onChange={(e) => setFounderForm({ ...founderForm, company_name: e.target.value })} placeholder="Company name" className="mt-4 h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm" />
              <input value={founderForm.company_address} onChange={(e) => setFounderForm({ ...founderForm, company_address: e.target.value })} placeholder="Address (optional)" className="mt-3 h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm" />
              <input value={founderForm.state} onChange={(e) => setFounderForm({ ...founderForm, state: e.target.value })} placeholder="State (optional)" className="mt-3 h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm" />
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-[#676767]">Founder login</p>
              <input required value={founderForm.founder_name} onChange={(e) => setFounderForm({ ...founderForm, founder_name: e.target.value })} placeholder="Founder full name" className="mt-2 h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm" />
              <input required type="email" value={founderForm.founder_email} onChange={(e) => setFounderForm({ ...founderForm, founder_email: e.target.value })} placeholder="Founder email" className="mt-3 h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm" />
              <input required value={founderForm.founder_phone} onChange={(e) => setFounderForm({ ...founderForm, founder_phone: e.target.value })} placeholder="Founder phone +91..." className="mt-3 h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm" />
              <button
                type="submit"
                disabled={submitting}
                className="mt-4 h-11 w-full rounded-xl bg-[#0658C2] font-semibold text-white disabled:opacity-60"
              >
                {submitting ? 'Creating…' : 'Create company & founder'}
              </button>
            </form>
            <div>
            <div className="mb-4 flex flex-wrap gap-3">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search company, GST, HR email" className="h-11 min-w-[240px] flex-1 rounded-lg border border-[#D3D3D3] px-4 text-sm" />
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 rounded-lg border border-[#D3D3D3] px-3 text-sm">
                <option value="">All statuses</option>
                {STATUSES.map((item) => (
                  <option key={item} value={item}>{item.replaceAll('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto rounded-2xl border border-[#E5E7EB] bg-white">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="bg-[#FAFAFA] text-[#676767]">
                  <tr>
                    {['Company', 'Founder', 'HR', 'Status', 'Employees', 'Created', 'Control'].map((head) => (
                      <th key={head} className="px-4 py-3 font-semibold">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {companies.map((row) => (
                    <tr key={row.id} className="border-t border-[#E5E7EB]">
                      <td className="px-4 py-3">
                        <p className="font-semibold">{row.company_name}</p>
                        <p className="text-xs text-[#676767]">{row.gst_number || row.state || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p>{row.founder_name || '—'}</p>
                        <p className="text-xs text-[#676767]">{row.founder_email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p>{row.hr_name || '—'}</p>
                        <p className="text-xs text-[#676767]">{row.hr_email}</p>
                      </td>
                      <td className="px-4 py-3 capitalize">{row.status.replaceAll('_', ' ')}</td>
                      <td className="px-4 py-3">{row.employee_count}</td>
                      <td className="px-4 py-3">{row.created_at.slice(0, 10)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={row.status}
                          title={
                            row.status === 'onboarding'
                              ? 'Wait until the company owner submits for review'
                              : undefined
                          }
                          onChange={(e) => void setCompanyStatus(row.id, e.target.value as (typeof STATUSES)[number])}
                          className="h-9 rounded-lg border border-[#D3D3D3] px-2 text-xs"
                        >
                          {adminStatusOptions(row.status as (typeof STATUSES)[number]).map((item) => (
                            <option key={item.value} value={item.value} disabled={item.disabled}>
                              {item.value.replaceAll('_', ' ')}
                              {item.value === 'active' && row.status === 'onboarding'
                                ? ' (wait for review)'
                                : ''}
                            </option>
                          ))}
                        </select>
                        {row.status === 'onboarding' ? (
                          <p className="mt-1 text-[11px] text-[#676767]">Owner has not submitted yet</p>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                  {companies.length === 0 && (
                    <tr><td colSpan={7} className="px-4 py-8 text-center text-[#676767]">No companies yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            </div>
          </section>
        )}

        {tab === 'invites' && (
          <section>
            <h2 className="mb-2 text-lg font-semibold">HR invites</h2>
            <p className="mb-4 text-sm text-[#676767]">
              Product admin does not invite HR. Company owners invite HR from the employer app. This list is read-only.
            </p>
            <div className="overflow-x-auto rounded-2xl border border-[#E5E7EB] bg-white">
              <table className="w-full min-w-[700px] text-left text-sm">
                <thead className="bg-[#FAFAFA] text-[#676767]">
                  <tr>
                    {['HR', 'Email', 'Status', 'Company', 'Expires'].map((head) => (
                      <th key={head} className="px-4 py-3 font-semibold">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invites.map((row) => (
                    <tr key={row.id} className="border-t border-[#E5E7EB]">
                      <td className="px-4 py-3">{row.full_name}</td>
                      <td className="px-4 py-3">{row.email}</td>
                      <td className="px-4 py-3">{row.status}</td>
                      <td className="px-4 py-3">{row.company_name || '—'}</td>
                      <td className="px-4 py-3">{row.expires_at.slice(0, 10)}</td>
                    </tr>
                  ))}
                  {invites.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[#676767]">
                        No HR invites yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
