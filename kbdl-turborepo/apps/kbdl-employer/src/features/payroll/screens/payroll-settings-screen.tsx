'use client';

import { Building2, CalendarDays, ChevronDown, Edit3, Landmark, Save, ShieldCheck, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { Card, PageShell, PageTitle, PrimaryButton } from './payroll-ui';

const payFrequencies = ['Monthly', 'Bi-weekly', 'Weekly'];
const payDays = ['Last Working Day', '1st of Month', '7th of Month', '15th of Month'];
const cutoffDates = ['26 of Month', '25 of Month', 'Last Friday', 'No cutoff'];
const financialYears = ['April', 'January', 'July'];
const overtimeRates = ['1.5x', '2x', '1.25x'];
const maxOtHours = ['4 Hours', '6 Hours', '8 Hours'];
const absentDeductions = ['Per-day Rate', 'Half-day Rate', 'No Auto Deduction'];
const halfDayPolicies = ['50% of Daily Rate', '60% of Daily Rate', 'Fixed Rs 300'];
const disbursementMethods = [
  { title: 'NEFT / IMPS Transfer', subtitle: 'Via employer bank account' },
  { title: 'UPI Instant Pay', subtitle: 'Razorpay / NPCI integration' },
  { title: 'Cash Payment (Manual)', subtitle: 'Marked manually by HR' },
];

export function PayrollSettingsScreen() {
  const [notice, setNotice] = useState('');
  const [settings, setSettings] = useState({
    payFrequency: 'Monthly',
    payDay: 'Last Working Day',
    cutoffDate: '26 of Month',
    financialYear: 'April',
    lockPayroll: true,
    overtimeRate: '1.5x',
    maxOt: '4 Hours',
    absentDeduction: 'Per-day Rate',
    halfDayPolicy: '50% of Daily Rate',
    autoOt: true,
  });
  const [rates, setRates] = useState({
    epfEmployee: '12%',
    epfEmployer: '12%',
    esicEmployee: '0.75%',
    esicEmployer: '3.25%',
    professionalTax: 'Rs 200/mo',
    labourWelfare: 'Rs 6/mo',
  });
  const [disbursementMethod, setDisbursementMethod] = useState('NEFT / IMPS Transfer');
  const [editingCompany, setEditingCompany] = useState(false);
  const [company, setCompany] = useState({
    companyName: 'Kaam Badlo Pvt. Ltd.',
    epfRegistration: 'CH/MUM/123456',
    esicCode: '31-000-1234567-000',
    gstin: '27AABCT1234E1Z5',
    state: 'Chandigarh',
  });

  const updateSetting = (key: keyof typeof settings, value: string | boolean) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const saveChanges = () => {
    setEditingCompany(false);
    setNotice('Payroll settings saved.');
  };

  return (
    <PageShell>
      <PageTitle title="Payroll Settings" subtitle="Payroll  >  Settings" action={<PrimaryButton onClick={saveChanges}><Save className="h-5 w-5" /> Save Changes</PrimaryButton>} />
      {notice && <p className="mb-5 rounded-lg bg-[#DBEAFF] px-4 py-3 text-sm font-semibold text-[#0658C2]">{notice}</p>}
      <div className="space-y-5">
        <SettingsPanel icon={CalendarDays} title="Pay Cycle Configuration" subtitle="Set the recurring payroll schedule for all workers">
          <SelectField label="Pay Frequency" value={settings.payFrequency} options={payFrequencies} onChange={(value) => updateSetting('payFrequency', value)} />
          <SelectField label="Pay Day" value={settings.payDay} options={payDays} onChange={(value) => updateSetting('payDay', value)} />
          <SelectField label="Payroll Cutoff Date" value={settings.cutoffDate} options={cutoffDates} onChange={(value) => updateSetting('cutoffDate', value)} />
          <SelectField label="Financial Year Start" value={settings.financialYear} options={financialYears} onChange={(value) => updateSetting('financialYear', value)} />
          <Toggle label="Lock Payroll After Processing" note="Prevents edits once Payroll is marked as disbursed" enabled={settings.lockPayroll} onChange={(value) => updateSetting('lockPayroll', value)} />
        </SettingsPanel>

        <SettingsPanel icon={ShieldCheck} title="Statutory Deduction Rates" subtitle="Configure EPF, ESIC, and other statutory contribution percentages">
          <EditableField label="EPF - Employee Contribution" value={rates.epfEmployee} note="Of Basic Wage (mandatory)" onChange={(value) => setRates((current) => ({ ...current, epfEmployee: value }))} />
          <EditableField label="EPF - Employer Contribution" value={rates.epfEmployer} note="Of Basic Wage" onChange={(value) => setRates((current) => ({ ...current, epfEmployer: value }))} />
          <EditableField label="ESIC - Employee Contribution" value={rates.esicEmployee} note="If Gross is below Rs 21,000/mo" onChange={(value) => setRates((current) => ({ ...current, esicEmployee: value }))} />
          <EditableField label="ESIC - Employer Contribution" value={rates.esicEmployer} note="If Gross is below Rs 21,000/mo" onChange={(value) => setRates((current) => ({ ...current, esicEmployer: value }))} />
          <EditableField label="Professional Tax (CH)" value={rates.professionalTax} note="Above Rs 10,000 salary" onChange={(value) => setRates((current) => ({ ...current, professionalTax: value }))} />
          <EditableField label="Labour Welfare Fund" value={rates.labourWelfare} note="Employee share" onChange={(value) => setRates((current) => ({ ...current, labourWelfare: value }))} />
        </SettingsPanel>

        <SettingsPanel icon={ShieldCheck} title="Overtime & Attendance Rules" subtitle="Configure how overtime hours and leaves affect payroll calculation">
          <SelectField label="Overtime Rate Multiplier" value={settings.overtimeRate} options={overtimeRates} onChange={(value) => updateSetting('overtimeRate', value)} />
          <SelectField label="Max OT Hours / Day" value={settings.maxOt} options={maxOtHours} onChange={(value) => updateSetting('maxOt', value)} />
          <SelectField label="Absent Deduction" value={settings.absentDeduction} options={absentDeductions} onChange={(value) => updateSetting('absentDeduction', value)} />
          <SelectField label="Half-Day Policy" value={settings.halfDayPolicy} options={halfDayPolicies} onChange={(value) => updateSetting('halfDayPolicy', value)} />
          <Toggle label="Auto-Calculate OT from Shift Logs" note="Pull verified shift durations from the Shifts module automatically" enabled={settings.autoOt} onChange={(value) => updateSetting('autoOt', value)} />
        </SettingsPanel>

        <div className="grid gap-5 xl:grid-cols-2">
          <Card className="p-5">
            <SectionTitle icon={Landmark} title="Disbursement Method" />
            <div className="mt-4 space-y-3 border-t border-[#D3D3D3] pt-4">
              {disbursementMethods.map(({ title, subtitle }) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => {
                    setDisbursementMethod(title);
                    setNotice(`${title} selected as disbursement method.`);
                  }}
                  className={`flex w-full cursor-pointer items-center gap-4 rounded-xl border px-4 py-3 text-left text-sm ${title === disbursementMethod ? 'border-[#0658C2] bg-[#DBEAFF]' : 'border-[#D3D3D3] bg-white hover:bg-[#FAFAFA]'}`}
                >
                  <span className={`grid h-7 w-7 place-items-center rounded-md border ${title === disbursementMethod ? 'border-[#0658C2] bg-[#0658C2] text-white' : 'border-[#D3D3D3] text-[#676767]'}`}><Landmark className="h-4 w-4" /></span>
                  <span className="flex-1"><b>{title}</b><span className="block text-xs text-[#676767]">{subtitle}</span></span>
                  <span className={`h-3 w-3 rounded-sm border ${title === disbursementMethod ? 'border-[#0658C2] bg-[#0658C2]' : 'border-[#D3D3D3]'}`} />
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
              <CompanyField label="Company Name" value={company.companyName} editing={editingCompany} onChange={(value) => setCompany((current) => ({ ...current, companyName: value }))} />
              <CompanyField label="EPF Registration No." value={company.epfRegistration} editing={editingCompany} onChange={(value) => setCompany((current) => ({ ...current, epfRegistration: value }))} />
              <CompanyField label="ESIC Code" value={company.esicCode} editing={editingCompany} onChange={(value) => setCompany((current) => ({ ...current, esicCode: value }))} />
              <CompanyField label="GSTIN" value={company.gstin} editing={editingCompany} onChange={(value) => setCompany((current) => ({ ...current, gstin: value }))} />
              <CompanyField label="State" value={company.state} editing={editingCompany} onChange={(value) => setCompany((current) => ({ ...current, state: value }))} />
            </div>
          </Card>
        </div>
      </div>
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
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      <span className="relative block">
        <select value={value} onChange={(event) => onChange(event.target.value)} className="h-12 w-full cursor-pointer appearance-none rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-4 pr-10 text-sm text-[#676767] outline-none focus:border-[#0658C2]">
          {options.map((option) => <option key={option}>{option}</option>)}
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
        <b className="text-right">{value}</b>
      )}
    </label>
  );
}
