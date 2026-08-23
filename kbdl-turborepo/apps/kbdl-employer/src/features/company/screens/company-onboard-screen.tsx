'use client';

import { api } from '@/lib/api-client';
import { useAuthStore } from '@/features/auth/stores/use-auth-store';
import type { CompanyProfileView, HrInviteView, UpsertCompanyProfilePayload } from '@repo/types';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function CompanyOnboardScreen() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const employer = useAuthStore((s) => s.employer);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (isHydrated && !employer) router.replace('/login');
  }, [employer, isHydrated, router]);
  const isOwner = employer?.role_code === 'OWNER';
  const isHr = employer?.role_code === 'HR';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyStatus, setCompanyStatus] = useState(employer?.status || 'onboarding');
  const [form, setForm] = useState({
    company_name: '',
    company_address: '',
    state: '',
    gst_number: '',
    pan: '',
    epf_registration_no: '',
    esic_code: '',
    hr_full_name: '',
    hr_email: '',
    hr_phone: '',
    hr_date_of_birth: '',
    hr_gender: '',
    hr_address: '',
  });

  useEffect(() => {
    api
      .get<CompanyProfileView>('/operations/employer/company')
      .then((res) => {
        setCompanyStatus(res.data.status || employer?.status || 'onboarding');
        setForm({
          company_name: res.data.company_name || employer?.company_name || '',
          company_address: res.data.company_address || '',
          state: res.data.state || '',
          gst_number: res.data.gst_number || '',
          pan: res.data.pan || '',
          epf_registration_no: res.data.epf_registration_no || '',
          esic_code: res.data.esic_code || '',
          hr_full_name: res.data.hr_profile?.full_name || '',
          hr_email: res.data.hr_profile?.email || employer?.email || '',
          hr_phone: res.data.hr_profile?.phone_no || employer?.phone_no || '',
          hr_date_of_birth: res.data.hr_profile?.date_of_birth || '',
          hr_gender: res.data.hr_profile?.gender || '',
          hr_address: res.data.hr_profile?.address || '',
        });
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [employer?.company_name]);

  const setField = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
  };

  const save = async (submitForReview: boolean) => {
    setSaving(true);
    try {
      const payload: UpsertCompanyProfilePayload = {
        company_name: form.company_name,
        company_address: form.company_address,
        state: form.state,
        gst_number: form.gst_number || '',
        pan: form.pan || '',
        epf_registration_no: form.epf_registration_no || '',
        esic_code: form.esic_code || '',
        submit_for_review: submitForReview,
        hr_full_name: form.hr_full_name || undefined,
        hr_date_of_birth: form.hr_date_of_birth || undefined,
        hr_gender: form.hr_gender || undefined,
        hr_address: form.hr_address || undefined,
      };
      const res = await api.put<{
        profile: CompanyProfileView;
        employer: typeof employer;
        accessToken: string;
        refreshToken: string;
      }>('/operations/employer/company', payload);
      if (res.data.employer && res.data.accessToken) {
        setAuth(res.data.employer, {
          accessToken: res.data.accessToken,
          refreshToken: res.data.refreshToken,
        });
      }
      const nextStatus = res.data.profile?.status || companyStatus;
      setCompanyStatus(nextStatus);
      toast.success(
        nextStatus === 'active'
          ? 'Company details saved'
          : submitForReview
            ? 'Company submitted for KBDL review'
            : 'Draft saved',
      );
      if (submitForReview && nextStatus !== 'active') {
        router.replace('/verification-pending');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save company');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-[#676767]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading company form...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F7F9] px-4 py-10">
      <div className="mx-auto max-w-3xl rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-[#0658C2]">
          {isOwner ? 'Company owner' : 'HR'} · company details
        </p>
        <h1 className="mt-1 text-2xl font-bold">
          {companyStatus === 'active' ? 'Company details' : 'Set up your company'}
        </h1>
        <p className="mt-2 text-sm text-[#676767]">
          {companyStatus === 'active'
            ? 'This company is live. Departments (General, HR), a General shift, payroll settings, and leave types (Casual, Sick, Earned) are already created. You can add more anytime from Employees and Leave.'
            : companyStatus === 'pending_review'
              ? 'Details are with KBDL for review. You can still edit and invite HR. Payroll stays closed until a product admin sets Active.'
              : isOwner
                ? 'Fill company details, then invite HR. Save draft anytime. Submit for review when details are ready.'
                : 'Complete your HR employee profile and the same company details. Submit for review when ready so KBDL can activate payroll and attendance.'}
        </p>

        {companyStatus === 'active' ? (
          <div className="mt-5 grid gap-3 rounded-xl border border-[#DBEAFF] bg-[#F5F9FF] p-4 text-sm">
            <p className="font-semibold text-[#0658C2]">Ready for HR work</p>
            <p className="text-[#676767]">
              First add catalogs and punch GPS under Catalogs & locations, then onboard employees.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/company/organization" className="inline-flex h-10 items-center rounded-lg bg-[#0658C2] px-4 text-sm font-semibold text-white">
                Catalogs & locations
              </Link>
              <Link href="/employees/onboard" className="inline-flex h-10 items-center rounded-lg border border-[#0658C2] px-4 text-sm font-semibold text-[#0658C2]">
                Onboard employee
              </Link>
              <Link href="/employees" className="inline-flex h-10 items-center rounded-lg border border-[#0658C2] px-4 text-sm font-semibold text-[#0658C2]">
                Employees
              </Link>
              <Link href="/leave/types" className="inline-flex h-10 items-center rounded-lg border border-[#D3D3D3] px-4 text-sm font-semibold text-[#0F172A]">
                Leave types
              </Link>
              <Link href="/leave/requests" className="inline-flex h-10 items-center rounded-lg border border-[#D3D3D3] px-4 text-sm font-semibold text-[#0F172A]">
                Leave requests
              </Link>
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4">
          {isHr && (
            <>
          <p className="text-sm font-bold">Your HR profile</p>
          <Field label="Full name" required>
            <input value={form.hr_full_name} onChange={setField('hr_full_name')} className="h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm outline-none focus:border-[#0658C2]" />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Email">
              <input value={form.hr_email} disabled className="h-11 w-full rounded-lg border border-[#D3D3D3] bg-[#F6F7F9] px-4 text-sm" />
            </Field>
            <Field label="Phone">
              <input value={form.hr_phone} disabled className="h-11 w-full rounded-lg border border-[#D3D3D3] bg-[#F6F7F9] px-4 text-sm" />
            </Field>
            <Field label="Date of birth">
              <input type="date" value={form.hr_date_of_birth} onChange={setField('hr_date_of_birth')} className="h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm outline-none focus:border-[#0658C2]" />
            </Field>
            <Field label="Gender">
              <input value={form.hr_gender} onChange={setField('hr_gender')} placeholder="Male / Female / Other" className="h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm outline-none focus:border-[#0658C2]" />
            </Field>
          </div>
          <Field label="Address">
            <textarea value={form.hr_address} onChange={setField('hr_address')} className="h-20 w-full rounded-lg border border-[#D3D3D3] px-4 py-3 text-sm outline-none focus:border-[#0658C2]" />
          </Field>
            </>
          )}

          <p className="mt-4 text-sm font-bold">Company</p>
          <Field label="Company name" required>
            <input value={form.company_name} onChange={setField('company_name')} placeholder="e.g. Acme Pvt Ltd" className="h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm outline-none focus:border-[#0658C2]" />
          </Field>
          <Field label="Registered address" required>
            <textarea value={form.company_address} onChange={setField('company_address')} placeholder="Registered office address" className="h-24 w-full rounded-lg border border-[#D3D3D3] px-4 py-3 text-sm outline-none focus:border-[#0658C2]" />
          </Field>
          <Field label="State" required>
            <input value={form.state} onChange={setField('state')} placeholder="e.g. Uttar Pradesh" className="h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm outline-none focus:border-[#0658C2]" />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="GSTIN">
              <input value={form.gst_number} onChange={setField('gst_number')} placeholder="15 characters e.g. 09ABCDE1234F1Z5" className="h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm uppercase outline-none focus:border-[#0658C2]" />
            </Field>
            <Field label="PAN">
              <input value={form.pan} onChange={setField('pan')} placeholder="10 characters e.g. ABCDE1234F" className="h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm uppercase outline-none focus:border-[#0658C2]" />
            </Field>
            <Field label="EPF registration no.">
              <input value={form.epf_registration_no} onChange={setField('epf_registration_no')} placeholder="e.g. UP/12345/1234567" className="h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm outline-none focus:border-[#0658C2]" />
            </Field>
            <Field label="ESIC code">
              <input value={form.esic_code} onChange={setField('esic_code')} placeholder="e.g. 12345678901234567" className="h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm outline-none focus:border-[#0658C2]" />
            </Field>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <p className="mr-auto max-w-sm text-xs capitalize text-[#676767]">
            Status: {companyStatus.replaceAll('_', ' ')}
            {companyStatus === 'onboarding'
              ? ' — submit for review when details are ready. KBDL then activates payroll.'
              : companyStatus === 'pending_review'
                ? ' — waiting for KBDL to activate. No need to submit again.'
                : ' — live. Save changes if you edit details.'}
          </p>
          <button type="button" disabled={saving} onClick={() => void save(false)} className="h-11 rounded-xl border border-[#0658C2] px-6 text-sm font-semibold text-[#0658C2] disabled:opacity-60">
            {companyStatus === 'onboarding' ? 'Save draft' : 'Save changes'}
          </button>
          {companyStatus === 'onboarding' ? (
          <button type="button" disabled={saving} onClick={() => void save(true)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#0658C2] px-6 text-sm font-semibold text-white disabled:opacity-60">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Submit for review
          </button>
          ) : null}
        </div>
      </div>

      {isOwner ? <OwnerInviteHr /> : null}
    </div>
  );
}

function OwnerInviteHr() {
  const [form, setForm] = useState({ full_name: '', email: '', phone_no: '' });
  const [invites, setInvites] = useState<HrInviteView[]>([]);
  const [busy, setBusy] = useState(false);

  const load = () => {
    api
      .get<HrInviteView[]>('/operations/employer/hr-invites')
      .then((res) => setInvites(res.data))
      .catch(() => undefined);
  };

  useEffect(() => {
    load();
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await api.post('/operations/employer/hr-invites', form);
      setForm({ full_name: '', email: '', phone_no: '' });
      toast.success('HR invite sent. They log in on this app with email OTP.');
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not invite HR');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold">Invite HR</h2>
      <p className="mt-1 text-sm text-[#676767]">
        HR joins this company as an employee with role HR. They can fill company details and onboard employees.
      </p>
      <form onSubmit={(e) => void submit(e)} className="mt-4 grid gap-3 md:grid-cols-2">
        <input required value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="HR full name" className="h-11 rounded-lg border border-[#D3D3D3] px-4 text-sm" />
        <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="HR email" className="h-11 rounded-lg border border-[#D3D3D3] px-4 text-sm" />
        <input required value={form.phone_no} onChange={(e) => setForm({ ...form, phone_no: e.target.value })} placeholder="HR phone +91..." className="h-11 rounded-lg border border-[#D3D3D3] px-4 text-sm" />
        <button type="submit" disabled={busy} className="h-11 rounded-xl bg-[#0658C2] text-sm font-semibold text-white disabled:opacity-60">
          {busy ? 'Sending…' : 'Send HR invite'}
        </button>
      </form>
      {invites.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm">
          {invites.map((row) => (
            <li key={row.id} className="flex justify-between rounded-lg bg-[#F6F7F9] px-3 py-2">
              <span>
                {row.full_name} · {row.email}
              </span>
              <span className="text-[#676767]">{row.status}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-2 block font-semibold">
        {label} {required ? <span className="text-[#F54A4A]">*</span> : null}
      </span>
      {children}
    </label>
  );
}
