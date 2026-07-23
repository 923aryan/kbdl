'use client';

import { CheckCircle2, Download, FileDown, Send } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Card, money, MonthSelect, PageShell, PageTitle, PrimaryButton, StatusPill } from './payroll-ui';

type FilingStatus = 'Pending' | 'Filed';

type Obligation = {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  employerShare: number | null;
  employeeShare: number | null;
  total: number;
  dueDate: string;
  status: FilingStatus;
};

const initialObligations: Obligation[] = [
  { id: 'epf', code: 'EPF', title: 'EPF Contribution', subtitle: 'Employees Provident Fund', employerShare: 28440, employeeShare: 28440, total: 56880, dueDate: '15 Nov 2026', status: 'Pending' },
  { id: 'esic', code: 'ESIC', title: 'ESIC Contribution', subtitle: 'Employees State Insurance', employerShare: 9126, employeeShare: 2880, total: 12006, dueDate: '15 Nov 2026', status: 'Pending' },
  { id: 'lwf', code: 'LWF', title: 'Labour Welfare Fund', subtitle: 'Labour Welfare Fund', employerShare: 480, employeeShare: 480, total: 960, dueDate: '31 Dec 2026', status: 'Pending' },
  { id: 'pt', code: 'PT', title: 'Professional Tax', subtitle: 'Professional Tax (CH)', employerShare: null, employeeShare: 1200, total: 1200, dueDate: '31 Oct 2026', status: 'Filed' },
  { id: 'tds', code: 'TDS', title: 'TDS (194J)', subtitle: 'Tax Deducted at Source', employerShare: 1000, employeeShare: null, total: 1000, dueDate: '07 Nov 2026', status: 'Filed' },
];

const filingHistory = [
  ['September 2026', 54220, 11480, 1200, 1000, '12 Oct 2026'],
  ['August 2026', 53840, 10920, 1200, 1000, '10 Sep 2026'],
  ['July 2026', 52110, 10360, 1200, 950, '11 Aug 2026'],
  ['June 2026', 50980, 9980, 1200, 900, '09 Jul 2026'],
];

export function StatutoryFilingScreen() {
  const [obligations, setObligations] = useState(initialObligations);
  const [notice, setNotice] = useState('');

  const pending = obligations.filter((item) => item.status === 'Pending');
  const filed = obligations.filter((item) => item.status === 'Filed');
  const pendingTotal = pending.reduce((sum, item) => sum + item.total, 0);
  const filedTotal = filed.reduce((sum, item) => sum + item.total, 0);
  const totalDue = obligations.reduce((sum, item) => sum + item.total, 0);
  const complianceScore = useMemo(() => Math.round((filed.length / obligations.length) * 100), [filed.length, obligations.length]);

  const fileNow = (id: string) => {
    setObligations((items) => items.map((item) => (item.id === id ? { ...item, status: 'Filed' } : item)));
    setNotice('Filing marked as completed and challan is ready.');
  };

  const fileAllPending = () => {
    setObligations((items) => items.map((item) => ({ ...item, status: 'Filed' })));
    setNotice('All pending statutory filings have been marked as filed.');
  };

  return (
    <PageShell>
      <PageTitle
        title="Statutory Filing"
        subtitle="Payroll  >  Statutory Filing"
        action={
          <>
            <MonthSelect />
            <PrimaryButton onClick={fileAllPending}><Send className="h-5 w-5" /> File All Pending</PrimaryButton>
          </>
        }
      />

      {notice && <p className="mb-5 rounded-lg bg-[#DBEAFF] px-4 py-3 text-sm font-semibold text-[#0658C2]">{notice}</p>}

      <Card className="mb-5 p-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
          <div className="flex items-center gap-4 lg:min-w-[320px]">
            <div className="grid h-16 w-16 place-items-center rounded-full border-[7px] border-[#DBEAFF] border-t-[#0658C2] border-r-[#0658C2] text-xs font-bold text-[#0658C2]">{complianceScore}%</div>
            <div>
              <h2 className="text-lg font-semibold text-black">Compliance Score</h2>
              <p className="text-sm text-[#676767]">{filed.length} of {obligations.length} obligations filed for Oct 2026</p>
              <div className="mt-2 flex gap-2">
                <StatusPill tone="green">{filed.length} Filed</StatusPill>
                <StatusPill tone="orange">{pending.length} Pending</StatusPill>
              </div>
            </div>
          </div>
          <div className="hidden h-14 w-px bg-[#D3D3D3] lg:block" />
          <SummaryMetric label="Total Statutory Due" value={money(totalDue)} />
          <SummaryMetric label="Filed This Month" value={money(filedTotal)} tone="green" />
          <SummaryMetric label="Pending Payment" value={money(pendingTotal)} tone="orange" />
          <SummaryMetric label="Deadline: EPF/ESIC" value="Nov 15, 2026" tone="red" />
        </div>
      </Card>

      <h2 className="mb-4 text-2xl font-semibold text-black">October 2026 - Statutory Obligations</h2>
      <div className="space-y-4">
        {obligations.map((item) => (
          <Card key={item.id} className="p-5">
            <div className="grid gap-4 lg:grid-cols-[240px_repeat(4,1fr)_190px] lg:items-center">
              <div className="flex items-center gap-4">
                <span className={`grid h-14 w-14 place-items-center rounded-full text-sm font-semibold ${item.status === 'Filed' ? 'bg-[#E5FFEB] text-[#4CAF50]' : 'bg-[#FFF4E3] text-[#FFA000]'}`}>{item.code}</span>
                <div>
                  <h3 className="font-semibold text-black">{item.title}</h3>
                  <p className="text-sm text-[#676767]">{item.subtitle}</p>
                  <p className="text-sm text-[#676767]">October 2026</p>
                </div>
              </div>
              <Amount label="Employer Share" value={item.employerShare} />
              <Amount label="Employee Share" value={item.employeeShare} />
              <Amount label="Total Challan" value={item.total} strong />
              <div><p className="text-sm text-[#676767]">Due Date</p><p className={item.status === 'Pending' ? 'font-semibold text-[#FFA000]' : 'font-semibold text-black'}>{item.dueDate}</p></div>
              <div className="flex flex-wrap justify-start gap-3 lg:justify-end">
                {item.status === 'Pending' ? (
                  <>
                    <StatusPill tone="orange">Pending</StatusPill>
                    <button type="button" onClick={() => fileNow(item.id)} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-[#0658C2] px-4 text-sm font-semibold text-white hover:bg-blue-700"><Send className="h-4 w-4" /> File Now</button>
                  </>
                ) : (
                  <>
                    <StatusPill tone="green"><CheckCircle2 className="mr-1 h-4 w-4" /> Filed</StatusPill>
                    <button type="button" onClick={() => setNotice(`${item.title} challan downloaded.`)} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#D3D3D3] px-4 text-sm font-semibold text-[#676767] hover:bg-[#FAFAFA]"><Download className="h-4 w-4" /> Challan</button>
                  </>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-5 overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <h2 className="text-2xl font-semibold text-black">Filing History</h2>
          <button type="button" onClick={() => setNotice('Filing history export prepared.')} className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#0658C2]"><FileDown className="h-4 w-4" /> Export</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-[#FAFAFA] text-[#676767]"><tr>{['Period', 'EPF', 'ESIC', 'Prof. Tax', 'TDS', 'Filed On', 'Status', ''].map((head) => <th key={head} className="px-8 py-3">{head}</th>)}</tr></thead>
            <tbody>
              {filingHistory.map((row) => (
                <tr key={`${row[0]}-${row[5]}`} className="border-t border-[#D3D3D3]">
                  <td className="px-8 py-4">{row[0]}</td>
                  <td>{money(Number(row[1]))}</td>
                  <td>{money(Number(row[2]))}</td>
                  <td>{money(Number(row[3]))}</td>
                  <td>{money(Number(row[4]))}</td>
                  <td>{row[5]}</td>
                  <td><StatusPill tone="green"><CheckCircle2 className="mr-1 h-4 w-4" /> Filed</StatusPill></td>
                  <td className="pr-8 text-right"><button type="button" onClick={() => setNotice(`${row[0]} challan downloaded.`)} className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-[#D3D3D3] px-3 font-semibold text-[#676767] hover:bg-[#FAFAFA]"><Download className="h-4 w-4" /> Challan</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageShell>
  );
}

function SummaryMetric({ label, value, tone = 'black' }: { label: string; value: string; tone?: 'black' | 'green' | 'orange' | 'red' }) {
  const color = {
    black: 'text-black',
    green: 'text-[#4CAF50]',
    orange: 'text-[#FFA000]',
    red: 'text-[#F54A4A]',
  }[tone];

  return <div className="min-w-[140px]"><p className="text-sm text-[#676767]">{label}</p><p className={`mt-1 font-bold ${color}`}>{value}</p></div>;
}

function Amount({ label, value, strong }: { label: string; value: number | null; strong?: boolean }) {
  return <div><p className="text-sm text-[#676767]">{label}</p><p className={strong ? 'font-bold text-black' : 'font-semibold text-black'}>{value === null ? '-' : money(value)}</p></div>;
}
