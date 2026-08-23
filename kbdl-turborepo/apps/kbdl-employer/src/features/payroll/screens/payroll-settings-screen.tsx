'use client';

import { Building2, CalendarDays, ChevronDown, Edit3, Landmark, Save, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchPayrollSettings, savePayrollSettings, type PayrollSettingsView } from '../api';
import { Card, LoadState, PageShell, PageTitle, PrimaryButton, RefreshIconButton, errMessage } from './payroll-ui';

const payFrequencies = ['monthly', 'bi-weekly', 'weekly'];
const payDays = ['last_working_day', '1st_of_month', '7th_of_month', '15th_of_month'];
const cutoffDates = [28, 26, 25, 31];
const financialYears = ['april', 'january', 'july'];
const overtimeRates = [1.5, 2, 1.25];
const maxOtHours = [4, 6, 8];
const absentDeductions = ['per_day_rate', 'half_day_rate', 'none'];
const halfDayPolicies = [50, 60];
const disbursementMethods = [
  { value: 'NEFT', title: 'NEFT / IMPS Transfer', subtitle: 'Via employer bank account' },
  { value: 'UPI', title: 'UPI Instant Pay', subtitle: 'Recorded as UPI (live payout later)' },
  { value: 'CASH', title: 'Cash Payment (Manual)', subtitle: 'Marked manually by HR' },
];

function labelize(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export function PayrollSettingsScreen() {
  const [notice, setNotice] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editingCompany, setEditingCompany] = useState(false);
  const [settings, setSettings] = useState<PayrollSettingsView | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setSettings(await fetchPayrollSettings());
    } catch (err) {
      setError(errMessage(err, 'Failed to load settings'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const saveChanges = async () => {
    if (!settings) return;
    setBusy(true);
    setError(null);
    try {
      const saved = await savePayrollSettings(settings);
      setSettings(saved);
      setEditingCompany(false);
      setNotice('Payroll settings saved.');
    } catch (err) {
      setError(errMessage(err, 'Failed to save settings'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <PageTitle title="Payroll Settings" subtitle="Payroll  >  Settings" action={<><RefreshIconButton loading={loading} onClick={() => void load()} /><PrimaryButton disabled={busy || !settings} onClick={() => void saveChanges()}><Save className="h-5 w-5" /> Save Changes</PrimaryButton></>} />
      {notice && <p className="mb-5 rounded-lg bg-[#DBEAFF] px-4 py-3 text-sm font-semibold text-[#0658C2]">{notice}</p>}
      <LoadState loading={loading} error={error} hasData={Boolean(settings)} onRetry={() => void load()} label="Loading payroll settings...">
      {settings && (
      <div className="space-y-5">
        <SettingsPanel icon={CalendarDays} title="Pay Cycle Configuration" subtitle="Set the recurring payroll schedule for all workers">
          <SelectField label="Pay Frequency" value={settings.pay_cycle.pay_frequency} options={payFrequencies} onChange={(value) => setSettings({ ...settings, pay_cycle: { ...settings.pay_cycle, pay_frequency: value } })} />
          <SelectField label="Pay Day" value={settings.pay_cycle.pay_day} options={payDays} onChange={(value) => setSettings({ ...settings, pay_cycle: { ...settings.pay_cycle, pay_day: value } })} />
          <SelectField label="Payroll Cutoff Date" value={String(settings.pay_cycle.payroll_cutoff_day)} options={cutoffDates.map(String)} onChange={(value) => setSettings({ ...settings, pay_cycle: { ...settings.pay_cycle, payroll_cutoff_day: Number(value) } })} />
          <SelectField label="Financial Year Start" value={settings.pay_cycle.financial_year_start} options={financialYears} onChange={(value) => setSettings({ ...settings, pay_cycle: { ...settings.pay_cycle, financial_year_start: value } })} />
          <Toggle label="Lock Payroll After Processing" note="Prevents edits once Payroll is marked as disbursed" enabled={settings.pay_cycle.lock_after_processing} onChange={(value) => setSettings({ ...settings, pay_cycle: { ...settings.pay_cycle, lock_after_processing: value } })} />
        </SettingsPanel>

        <SettingsPanel icon={ShieldCheck} title="Statutory Deduction Rates" subtitle="Configure EPF, ESIC, and other statutory contribution percentages">
          <EditableField label="EPF - Employee Contribution" value={String(settings.statutory.employee_pf_rate)} note="Of Basic Wage (mandatory)" onChange={(value) => setSettings({ ...settings, statutory: { ...settings.statutory, employee_pf_rate: Number(value) } })} />
          <EditableField label="EPF - Employer Contribution" value={String(settings.statutory.employer_pf_rate)} note="Of Basic Wage" onChange={(value) => setSettings({ ...settings, statutory: { ...settings.statutory, employer_pf_rate: Number(value) } })} />
          <EditableField label="ESIC - Employee Contribution" value={String(settings.statutory.employee_esic_rate)} note="If Gross is below Rs 21,000/mo" onChange={(value) => setSettings({ ...settings, statutory: { ...settings.statutory, employee_esic_rate: Number(value) } })} />
          <EditableField label="ESIC - Employer Contribution" value={String(settings.statutory.employer_esic_rate)} note="If Gross is below Rs 21,000/mo" onChange={(value) => setSettings({ ...settings, statutory: { ...settings.statutory, employer_esic_rate: Number(value) } })} />
          <EditableField label="Professional Tax" value={String(settings.statutory.professional_tax)} note="Applied when gross is above Rs 10,000" onChange={(value) => setSettings({ ...settings, statutory: { ...settings.statutory, professional_tax: Number(value) } })} />
          <EditableField label="Labour Welfare Fund" value={String(settings.statutory.labour_welfare_fund)} note="Employee share" onChange={(value) => setSettings({ ...settings, statutory: { ...settings.statutory, labour_welfare_fund: Number(value) } })} />
        </SettingsPanel>

        <SettingsPanel icon={ShieldCheck} title="Overtime & Attendance Rules" subtitle="Configure how overtime hours and leaves affect payroll calculation">
          <SelectField label="Overtime Rate Multiplier" value={String(settings.attendance.overtime_multiplier)} options={overtimeRates.map(String)} onChange={(value) => setSettings({ ...settings, attendance: { ...settings.attendance, overtime_multiplier: Number(value) } })} />
          <SelectField label="Max OT Hours / Day" value={String(settings.attendance.max_ot_hours_per_day)} options={maxOtHours.map(String)} onChange={(value) => setSettings({ ...settings, attendance: { ...settings.attendance, max_ot_hours_per_day: Number(value) } })} />
          <SelectField label="Absent Deduction" value={settings.attendance.absent_deduction_type} options={absentDeductions} onChange={(value) => setSettings({ ...settings, attendance: { ...settings.attendance, absent_deduction_type: value } })} />
          <SelectField label="Half-Day Policy %" value={String(settings.attendance.half_day_percentage)} options={halfDayPolicies.map(String)} onChange={(value) => setSettings({ ...settings, attendance: { ...settings.attendance, half_day_percentage: Number(value) } })} />
          <Toggle label="Auto-Calculate OT from Shift Logs" note="Use verified attendance OT minutes when creating a run" enabled={settings.attendance.auto_calculate_ot} onChange={(value) => setSettings({ ...settings, attendance: { ...settings.attendance, auto_calculate_ot: value } })} />
        </SettingsPanel>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card className="p-5">
            <SectionTitle icon={Landmark} title="Disbursement Method" />
            <div className="mt-4 space-y-3 border-t border-[#D3D3D3] pt-4">
              {disbursementMethods.map(({ value, title, subtitle }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSettings({
                    ...settings,
                    payment: { ...settings.payment, default_disbursement_method: value },
                  })}
                  className={`flex w-full cursor-pointer items-center gap-4 rounded-xl border px-4 py-3 text-left text-sm ${settings.payment.default_disbursement_method === value ? 'border-[#0658C2] bg-[#DBEAFF]' : 'border-[#D3D3D3] bg-white hover:bg-[#FAFAFA]'}`}
                >
                  <span className={`grid h-7 w-7 place-items-center rounded-md border ${settings.payment.default_disbursement_method === value ? 'border-[#0658C2] bg-[#0658C2] text-white' : 'border-[#D3D3D3] text-[#676767]'}`}><Landmark className="h-4 w-4" /></span>
                  <span className="flex-1"><b>{title}</b><span className="block text-xs text-[#676767]">{subtitle}</span></span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <SectionTitle icon={Building2} title="Company Details" />
              <button type="button" onClick={() => setEditingCompany((value) => !value)} className="inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-[#0658C2]"><Edit3 className="h-4 w-4" /> {editingCompany ? 'Done' : 'Edit'}</button>
            </div>
            <div className="border-t border-[#D3D3D3] pt-2">
              <CompanyField label="Company Name" value={settings.company_details.company_name} editing={editingCompany} onChange={(value) => setSettings({ ...settings, company_details: { ...settings.company_details, company_name: value } })} />
              <CompanyField label="EPF Registration No." value={settings.company_details.epf_registration_no ?? ''} editing={editingCompany} onChange={(value) => setSettings({ ...settings, company_details: { ...settings.company_details, epf_registration_no: value } })} />
              <CompanyField label="ESIC Code" value={settings.company_details.esic_code ?? ''} editing={editingCompany} onChange={(value) => setSettings({ ...settings, company_details: { ...settings.company_details, esic_code: value } })} />
              <CompanyField label="GSTIN" value={settings.company_details.gstin ?? ''} editing={editingCompany} onChange={(value) => setSettings({ ...settings, company_details: { ...settings.company_details, gstin: value } })} />
              <CompanyField label="State" value={settings.company_details.state ?? ''} editing={editingCompany} onChange={(value) => setSettings({ ...settings, company_details: { ...settings.company_details, state: value } })} />
            </div>
          </Card>
        </div>
      </div>
      )}
      </LoadState>
    </PageShell>
  );
}

function SettingsPanel({ icon: Icon, title, subtitle, children }: { icon: LucideIcon; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <SectionTitle icon={Icon} title={title} subtitle={subtitle} />
      <div className="mt-4 grid gap-4 border-t border-[#D3D3D3] pt-4 md:grid-cols-2">{children}</div>
    </Card>
  );
}

function SectionTitle({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[#DBEAFF] text-[#0658C2]"><Icon className="h-5 w-5" /></span>
      <div><h2 className="text-2xl font-semibold text-black">{title}</h2>{subtitle && <p className="text-sm text-[#676767]">{subtitle}</p>}</div>
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  const all = options.includes(value) ? options : [value, ...options];
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <span className="relative block">
        <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full cursor-pointer appearance-none rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-4 pr-10 text-sm text-[#676767] outline-none focus:border-[#0658C2]">
          {all.map((option) => <option key={option} value={option}>{labelize(option)}</option>)}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />
      </span>
    </label>
  );
}

function EditableField({ label, value, note, onChange }: { label: string; value: string; note: string; onChange: (value: string) => void }) {
  const [editing, setEditing] = useState(false);
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <span className="flex h-12 items-center justify-between rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-4 text-sm text-[#676767]">
        <input value={value} onChange={(event) => onChange(event.target.value)} readOnly={!editing} className="w-full bg-transparent outline-none read-only:cursor-default" />
        <button type="button" onClick={() => setEditing((open) => !open)} className="ml-3 cursor-pointer text-[#0658C2]" aria-label={`Edit ${label}`}><Edit3 className="h-4 w-4" /></button>
      </span>
      <span className="mt-2 block text-xs text-[#676767]">{note}</span>
    </label>
  );
}

function Toggle({ label, note, enabled, onChange }: { label: string; note: string; enabled: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between md:col-span-2">
      <div><p className="font-semibold">{label}</p><p className="text-xs text-[#676767]">{note}</p></div>
      <button type="button" onClick={() => onChange(!enabled)} className={`flex h-5 w-9 cursor-pointer items-center rounded-full p-1 ${enabled ? 'justify-end bg-[#0658C2]' : 'justify-start bg-[#D3D3D3]'}`} aria-pressed={enabled}>
        <span className="h-3 w-3 rounded-full bg-white" />
      </button>
    </div>
  );
}

function CompanyField({ label, value, editing, onChange }: { label: string; value: string; editing: boolean; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 border-b border-[#D3D3D3] py-3 text-sm">
      <span className="text-[#676767]">{label}</span>
      {editing ? (
        <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full max-w-[260px] rounded-md border border-[#D3D3D3] bg-white px-3 py-2 text-right font-semibold outline-none focus:border-[#0658C2]" />
      ) : (
        <b className="text-right">{value || '—'}</b>
      )}
    </label>
  );
}
