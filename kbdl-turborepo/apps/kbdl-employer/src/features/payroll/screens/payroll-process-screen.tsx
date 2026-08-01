'use client';

import { ArrowRight, Banknote, Check, Edit3, ShieldCheck, Users, WalletCards } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { payrollDesignations, payrollStatuses } from '../data/payroll-data';
import { useFilteredPayrollWorkers } from '../hooks/use-payroll-hook';
import { type PayrollStage, usePayrollStore } from '../stores/use-payroll-store';
import { Card, EmployeeCell, money, OutlineButton, PageShell, PageTitle, Pagination, PrimaryButton, SearchAndFilters, SelectButton, StatCard } from './payroll-ui';

const stageTitles: Record<PayrollStage, string> = {
  attendance: 'VERIFY ATTENDANCE - OCTOBER 2026',
  wages: 'Review Wages - OCTOBER 2026',
  deductions: 'Apply Deductions - OCTOBER 2026',
  disburse: 'Approve & Disburse - OCTOBER 2026',
};

const stages: { key: PayrollStage; label: string }[] = [
  { key: 'attendance', label: 'Verify Attendance' },
  { key: 'wages', label: 'Review Wages' },
  { key: 'deductions', label: 'Apply Deductions' },
  { key: 'disburse', label: 'Approve & Disburse' },
];

export function PayrollProcessScreen({ stage = 'attendance' }: { stage?: PayrollStage }) {
  const { search, selectedDesignations, selectedStatuses, setSearch, setSelectedDesignations, setSelectedStatuses } = usePayrollStore();
  const [page, setPage] = useState(1);
  const [actionNotice, setActionNotice] = useState('');
  const workers = useFilteredPayrollWorkers({ search, selectedDesignations, selectedStatuses });
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(workers.length / pageSize));
  const paginatedWorkers = useMemo(() => workers.slice((page - 1) * pageSize, page * pageSize), [page, workers]);

  return (
    <PageShell>
      <PageTitle title={stageTitles[stage]} subtitle={`Payroll  >  Run Payroll  >  ${stages.find((item) => item.key === stage)?.label}`} gps />

      {stage === 'deductions' && <DeductionRules />}
      {stage === 'disburse' && <DisbursementMethod />}

      {stage !== 'deductions' && stage !== 'disburse' && (
        <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title={stage === 'attendance' ? 'Total Workers' : 'Total Gross Pay'} value={stage === 'attendance' ? '48' : 'Rs 1,48,115'} note={stage === 'wages' ? '48 workers' : undefined} icon={Users} />
          <StatCard title={stage === 'attendance' ? 'Attendance Verified' : 'Basic Wages'} value={stage === 'attendance' ? '48' : 'Rs 1,41,350'} note={stage === 'wages' ? 'Days worked x rate' : undefined} icon={ShieldCheck} color="green" />
          <StatCard title={stage === 'attendance' ? 'Flagged Workers' : 'Overtime Pay'} value={stage === 'attendance' ? '5' : 'Rs 3,015'} note={stage === 'wages' ? '23 hr total OT' : undefined} icon={Banknote} color="orange" />
          <StatCard title={stage === 'attendance' ? 'Payroll Ready' : 'Allowances'} value={stage === 'attendance' ? '98.5%' : 'Rs 3,750'} note={stage === 'wages' ? 'Transport, HRA etc.' : undefined} icon={WalletCards} color="violet" />
        </div>
      )}

      <Stepper stage={stage} />

      <Card className="mt-5 overflow-hidden p-5">
        <SearchAndFilters search={search} onSearch={(value) => { setSearch(value); setPage(1); }}>
          <SelectButton label="All Designations" selectedLabel="Designations" options={payrollDesignations} selected={selectedDesignations} onChange={(items) => { setSelectedDesignations(items); setPage(1); }} />
          {stage === 'attendance' && <SelectButton label="All Status" selectedLabel="Status" options={payrollStatuses} selected={selectedStatuses} onChange={(items) => { setSelectedStatuses(items); setPage(1); }} />}
        </SearchAndFilters>
        {actionNotice && <p className="mb-4 rounded-lg bg-[#DBEAFF] px-4 py-3 text-sm font-semibold text-[#0658C2]">{actionNotice}</p>}
        <div className="overflow-x-auto">{renderStageTable(stage, paginatedWorkers, setActionNotice)}</div>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#676767]">Step {stages.findIndex((item) => item.key === stage) + 1} of 4 - Next {nextLabel(stage)}</p>
          <div className="flex justify-end gap-4"><Pagination page={page} pageCount={pageCount} onPageChange={setPage} /></div>
        </div>
        <div className="mt-5 flex justify-end gap-4">
          {stage !== 'attendance' && <Link href={previousHref(stage)}><OutlineButton>Back</OutlineButton></Link>}
          {stage === 'disburse' && <OutlineButton onClick={() => setActionNotice('Payroll disbursement saved as draft.')}>Save as Draft</OutlineButton>}
          {nextHref(stage) ? (
            <Link href={nextHref(stage)!}>
              <PrimaryButton>{stage === 'attendance' ? 'Confirm Attendance & Proceed' : `Next ${nextLabel(stage)}`} <ArrowRight className="h-5 w-5" /></PrimaryButton>
            </Link>
          ) : (
            <PrimaryButton onClick={() => setActionNotice('Payroll confirmed and marked ready for disbursement.')}>Confirm & Disburse <ArrowRight className="h-5 w-5" /></PrimaryButton>
          )}
        </div>
      </Card>
    </PageShell>
  );
}

function Stepper({ stage }: { stage: PayrollStage }) {
  const activeIndex = stages.findIndex((item) => item.key === stage);

  return (
    <Card className="p-4">
      <div className="relative grid gap-4 md:grid-cols-4">
        <div className="absolute left-4 right-4 top-4 hidden h-1 rounded-full bg-[#E5E7EB] md:block" />
        <div
          className="absolute left-4 top-4 hidden h-1 rounded-full bg-[#4CAF50] transition-all md:block"
          style={{ width: `calc((100% - 32px) * ${activeIndex / (stages.length - 1)})` }}
        />
        {stages.map((item, index) => {
          const done = index < activeIndex;
          const active = index === activeIndex;
          return (
            <Link key={item.key} href={stageHref(item.key)} className="relative z-10 flex cursor-pointer items-center gap-3 rounded-lg bg-white p-1 hover:bg-[#FAFAFA]">
              <span className={`grid h-8 w-8 place-items-center rounded-full border text-sm font-bold ${done ? 'border-[#4CAF50] bg-[#4CAF50] text-white' : active ? 'border-[#4CAF50] bg-[#4CAF50] text-white' : 'border-[#A3A3A3] bg-white text-[#676767]'}`}>{done ? <Check className="h-5 w-5" /> : index + 1}</span>
              <div>
                <p className={`text-sm font-semibold ${done ? 'text-[#4CAF50]' : 'text-[#676767]'}`}>{item.label}</p>
                {active && <p className="text-xs text-[#676767]">In Progress</p>}
              </div>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}

function stageHref(stage: PayrollStage) {
  if (stage === 'attendance') return '/payroll/run';
  if (stage === 'wages') return '/payroll/run/review-wages';
  if (stage === 'deductions') return '/payroll/run/apply-deductions';
  return '/payroll/run/approve-disburse';
}

function renderStageTable(stage: PayrollStage, workers: ReturnType<typeof useFilteredPayrollWorkers>, onAction: (message: string) => void) {
  if (stage === 'attendance') {
    return (
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="bg-[#FAFAFA] text-[#676767]"><tr>{['Employee', 'Present', 'Leave', 'Absent', 'OT Hours', 'Payable Days', 'Action'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr></thead>
        <tbody>{workers.map((worker) => <tr key={worker.id} className="border-t border-[#D3D3D3]"><td className="px-4 py-4"><EmployeeCell name={worker.name} designation={worker.designation} id={worker.id} /></td><td>{worker.days}</td><td>{worker.leave}</td><td>{worker.absent}</td><td>+{worker.otHours}h</td><td>{worker.days} days</td><td><button type="button" onClick={() => onAction(`Editing attendance for ${worker.name}.`)} className="inline-flex cursor-pointer items-center gap-1 text-[#0658C2]"><Edit3 className="h-4 w-4" /> Edit</button></td></tr>)}{workers.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-[#676767]">No workers found</td></tr>}</tbody>
      </table>
    );
  }

  if (stage === 'wages') {
    return (
      <table className="w-full min-w-[1000px] text-left text-sm">
        <thead className="bg-[#FAFAFA] text-[#676767]"><tr>{['Employee', 'Days', 'Rate/Day', 'Basic', 'OT Pay', 'Allowances', 'Gross Pay', 'Action'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr></thead>
        <tbody>{workers.map((worker) => <tr key={worker.id} className="border-t border-[#D3D3D3]"><td className="px-4 py-4"><EmployeeCell name={worker.name} designation={worker.designation} id={worker.id} /></td><td>{worker.days}</td><td>{money(worker.ratePerDay)}</td><td>{money(worker.basic)}</td><td className="text-[#0658C2]">+{money(worker.otRate * worker.otHours)}</td><td className="text-[#4CAF50]">+{money(worker.allowance)}</td><td className="font-bold">{money(worker.gross)}</td><td><button type="button" onClick={() => onAction(`Editing wages for ${worker.name}.`)} className="inline-flex cursor-pointer items-center gap-1 text-[#0658C2]"><Edit3 className="h-4 w-4" /> Edit</button></td></tr>)}{workers.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-[#676767]">No workers found</td></tr>}</tbody>
      </table>
    );
  }

  if (stage === 'deductions') {
    return (
      <table className="w-full min-w-[1080px] text-left text-sm">
        <thead className="bg-[#FAFAFA] text-[#676767]"><tr>{['Employee', 'Gross', 'EPF', 'ESIC', 'TDS', 'LWF', 'Advance', 'Total Deduction', 'Net Pay', 'Action'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr></thead>
        <tbody>{workers.map((worker) => { const total = worker.epf + worker.esic + worker.tds + worker.lwf + worker.advance; return <tr key={worker.id} className="border-t border-[#D3D3D3]"><td className="px-4 py-4"><EmployeeCell name={worker.name} designation={worker.designation} id={worker.id} /></td><td className="font-bold">{money(worker.gross)}</td><td className="text-[#F54A4A]">{money(worker.epf)}</td><td className="text-[#F54A4A]">{money(worker.esic)}</td><td className="text-[#F54A4A]">{money(worker.tds)}</td><td>{money(worker.lwf)}</td><td className="text-[#F54A4A]">{money(worker.advance)}</td><td className="text-[#F54A4A]">{money(total)}</td><td className="font-bold">{money(worker.net)}</td><td><button type="button" onClick={() => onAction(`Adding deduction for ${worker.name}.`)} className="cursor-pointer text-[#0658C2]">+ Add Deduction</button></td></tr>; })}{workers.length === 0 && <tr><td colSpan={10} className="px-4 py-8 text-center text-[#676767]">No workers found</td></tr>}</tbody>
      </table>
    );
  }

  return (
    <table className="w-full min-w-[1000px] text-left text-sm">
      <thead className="bg-[#FAFAFA] text-[#676767]"><tr>{['Employee', 'Days', 'Rate/Day', 'OT hrs', 'Gross', 'EPF', 'ESIC', 'Net Pay', 'Bank'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr></thead>
      <tbody>{workers.map((worker) => <tr key={worker.id} className="border-t border-[#D3D3D3]"><td className="px-4 py-4"><EmployeeCell name={worker.name} designation={worker.designation} id={worker.id} /></td><td>{worker.days}</td><td>{money(worker.ratePerDay)}</td><td className="text-[#FFA000]">+{worker.otHours}h</td><td className="font-bold">{money(worker.gross)}</td><td className="text-[#F54A4A]">-{money(worker.epf)}</td><td className="text-[#F54A4A]">-{money(worker.esic)}</td><td className="font-bold">{money(worker.net)}</td><td>{worker.bank}</td></tr>)}{workers.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-[#676767]">No workers found</td></tr>}</tbody>
    </table>
  );
}

function nextLabel(stage: PayrollStage) {
  if (stage === 'attendance') return 'Review Wages';
  if (stage === 'wages') return 'Apply Deductions';
  if (stage === 'deductions') return 'Approve';
  return 'Completed';
}

function nextHref(stage: PayrollStage) {
  if (stage === 'attendance') return '/payroll/run/review-wages';
  if (stage === 'wages') return '/payroll/run/apply-deductions';
  if (stage === 'deductions') return '/payroll/run/approve-disburse';
  return '';
}

function previousHref(stage: PayrollStage) {
  if (stage === 'wages') return '/payroll/run';
  if (stage === 'deductions') return '/payroll/run/review-wages';
  if (stage === 'disburse') return '/payroll/run/apply-deductions';
  return '/payroll/run';
}

function DeductionRules() {
  return (
    <Card className="mb-5 border-[#9BC2FF] bg-[#EEF5FF] p-5">
      <div className="flex flex-wrap items-center gap-8 text-sm">
        <p className="font-semibold">Auto - applied statutory rules</p>
        {['EPF Employee : 12% of Basic', 'EPF Employer : 12% of Basic', 'ESIC Employee : 0.75% of Basic', 'EPF Employer : 3.25% of Basic', 'LWF: Rs 24 / Month'].map((item) => <span key={item} className="rounded-lg bg-[#DBEAFF] px-3 py-2 font-semibold text-[#0658C2]">{item}</span>)}
        <button type="button" onClick={() => window.alert('Statutory deduction rules are ready to edit.')} className="ml-auto cursor-pointer rounded-lg bg-black px-5 py-3 text-white">Edit</button>
      </div>
    </Card>
  );
}

function DisbursementMethod() {
  const [selectedMethod, setSelectedMethod] = useState('NEFT Bank');

  return (
    <div className="mb-5 grid gap-4 xl:grid-cols-2">
      <Card className="p-5">
        <h2 className="mb-3 text-base font-semibold">Disbursement Method</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {['NEFT Bank', 'UPI Instant Pay', 'Cash (Manual)'].map((item) => <button key={item} type="button" onClick={() => setSelectedMethod(item)} className={`h-9 cursor-pointer rounded-lg border px-3 text-left text-xs ${item === selectedMethod ? 'border-[#0658C2] bg-[#DBEAFF]' : 'border-[#D3D3D3] bg-white text-[#676767]'}`}>{item}</button>)}
        </div>
      </Card>
      <Card className="p-5">
        <div className="h-full min-h-[62px]" />
      </Card>
    </div>
  );
}
