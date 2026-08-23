'use client';

import { ArrowRight, Banknote, Check, Edit3, ShieldCheck, Users, WalletCards } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import type { PayrollLineView, PayrollRunView } from '../api';
import {
  confirmPayrollStage,
  disbursePayrollRun,
  fetchPayrollRun,
  patchPayrollLine,
} from '../api';
import { payrollStatuses, type PayrollStage } from '../data/payroll-data';
import { useFilteredPayrollLines } from '../hooks/use-payroll-hook';
import { usePayrollStore } from '../stores/use-payroll-store';
import { Card, EmployeeCell, LoadState, money, OutlineButton, PageShell, PageTitle, Pagination, PrimaryButton, RefreshIconButton, SearchAndFilters, SelectButton, StatCard, errMessage } from './payroll-ui';

const stages: { key: PayrollStage; label: string }[] = [
  { key: 'attendance', label: 'Verify Attendance' },
  { key: 'wages', label: 'Review Wages' },
  { key: 'deductions', label: 'Apply Deductions' },
  { key: 'disburse', label: 'Approve & Disburse' },
];

function stageTitle(stage: PayrollStage, period: string) {
  if (stage === 'attendance') return `VERIFY ATTENDANCE - ${period.toUpperCase()}`;
  if (stage === 'wages') return `Review Wages - ${period.toUpperCase()}`;
  if (stage === 'deductions') return `Apply Deductions - ${period.toUpperCase()}`;
  return `Approve & Disburse - ${period.toUpperCase()}`;
}

export function PayrollProcessScreen({ stage = 'attendance' }: { stage?: PayrollStage }) {
  const router = useRouter();
  const {
    search,
    selectedDesignations,
    selectedStatuses,
    selectedPeriod,
    setSearch,
    setSelectedDesignations,
    setSelectedStatuses,
  } = usePayrollStore();
  const [page, setPage] = useState(1);
  const [actionNotice, setActionNotice] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<PayrollRunView | null>(null);
  const [editLine, setEditLine] = useState<PayrollLineView | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPayrollRun(selectedPeriod.year, selectedPeriod.month, {
        search,
        page,
        limit: 10,
      });
      setView(data);
    } catch (err) {
      setError(errMessage(err, 'Failed to load payroll run'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod.year, selectedPeriod.month, search, page]);

  const designations = useMemo(
    () => Array.from(new Set((view?.employees ?? []).map((row) => row.designation).filter((name) => name && name !== '—'))),
    [view],
  );
  const workers = useFilteredPayrollLines({
    items: view?.employees ?? [],
    search,
    selectedDesignations,
    selectedStatuses,
  });
  const run = view?.run;
  const pageCount = view?.meta.totalPages ?? 1;

  const advance = async () => {
    if (!run) return;
    setBusy(true);
    setError('');
    try {
      if (stage === 'attendance' && run.status === 'draft') {
        await confirmPayrollStage(run.id, 'attendance');
      } else if (stage === 'wages' && run.status === 'attendance_confirmed') {
        await confirmPayrollStage(run.id, 'wages');
      } else if (stage === 'deductions' && run.status === 'wages_confirmed') {
        await confirmPayrollStage(run.id, 'deductions');
      } else if (stage === 'disburse') {
        await disbursePayrollRun(run.id, { method: run.disbursement_method as 'NEFT' | 'UPI' | 'CASH', confirm: true });
        setActionNotice('Payroll confirmed and marked ready for disbursement.');
        await load();
        setBusy(false);
        return;
      }
      const href = nextHref(stage);
      if (href) router.push(href);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not confirm this stage');
    } finally {
      setBusy(false);
    }
  };

  const saveDraft = async () => {
    if (!run) return;
    setBusy(true);
    try {
      await disbursePayrollRun(run.id, { method: run.disbursement_method as 'NEFT' | 'UPI' | 'CASH', confirm: false });
      setActionNotice('Payroll disbursement saved as draft.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save draft');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell>
      <PageTitle title={stageTitle(stage, selectedPeriod.label)} subtitle={`Payroll  >  Run Payroll  >  ${stages.find((item) => item.key === stage)?.label}`} gps action={<RefreshIconButton loading={loading} onClick={() => void load()} title="Refresh payroll run" />} />
      <LoadState loading={loading} error={error} hasData={Boolean(view)} onRetry={() => void load()} label="Loading payroll...">

      {stage === 'deductions' && view && <DeductionRules rules={view.statutory_rules} />}
      {stage === 'disburse' && run && (
        <DisbursementMethod
          selected={run.disbursement_method}
          disabled={run.status === 'disbursed'}
          onChange={async (method) => {
            try {
              await disbursePayrollRun(run.id, { method, confirm: false });
              await load();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Could not save method');
            }
          }}
        />
      )}

      {stage !== 'deductions' && stage !== 'disburse' && run && (
        <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard title={stage === 'attendance' ? 'Total Workers' : 'Total Gross Pay'} value={stage === 'attendance' ? String(run.worker_count) : money(run.total_gross)} note={stage === 'wages' ? `${run.worker_count} workers` : undefined} icon={Users} />
          <StatCard title={stage === 'attendance' ? 'Attendance Verified' : 'Basic Wages'} value={stage === 'attendance' ? String(run.attendance_verified) : money(run.total_basic)} note={stage === 'wages' ? 'Days worked x rate' : undefined} icon={ShieldCheck} color="green" />
          <StatCard title={stage === 'attendance' ? 'Flagged Workers' : 'Overtime Pay'} value={stage === 'attendance' ? String(run.flagged_count) : money(run.total_ot_pay)} note={stage === 'wages' ? `${run.total_ot_hours} hr total OT` : undefined} icon={Banknote} color="orange" />
          <StatCard title={stage === 'attendance' ? 'Payroll Ready' : 'Allowances'} value={stage === 'attendance' ? `${run.payroll_ready_pct}%` : money(run.total_allowance)} note={stage === 'wages' ? 'Transport, HRA etc.' : undefined} icon={WalletCards} color="violet" />
        </div>
      )}

      <Stepper stage={stage} runStatus={run?.status} />

      <Card className="mt-5 overflow-hidden p-5">
        <SearchAndFilters search={search} onSearch={(value) => { setSearch(value); setPage(1); }}>
          <SelectButton label="All Designations" selectedLabel="Designations" options={designations} selected={selectedDesignations} onChange={(items) => { setSelectedDesignations(items); setPage(1); }} />
          {stage === 'attendance' && <SelectButton label="All Status" selectedLabel="Status" options={payrollStatuses} selected={selectedStatuses} onChange={(items) => { setSelectedStatuses(items); setPage(1); }} />}
        </SearchAndFilters>
        {actionNotice && <p className="mb-4 rounded-lg bg-[#DBEAFF] px-4 py-3 text-sm font-semibold text-[#0658C2]">{actionNotice}</p>}
        <div className="overflow-x-auto">{renderStageTable(stage, workers, (line) => setEditLine(line))}</div>
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#676767]">Step {stages.findIndex((item) => item.key === stage) + 1} of 4 - Next {nextLabel(stage)}</p>
          <div className="flex justify-end gap-4"><Pagination page={page} pageCount={pageCount} onPageChange={setPage} /></div>
        </div>
        <div className="mt-5 flex justify-end gap-4">
          {stage !== 'attendance' && <Link href={previousHref(stage)}><OutlineButton>Back</OutlineButton></Link>}
          {stage === 'disburse' && run?.status !== 'disbursed' && <OutlineButton onClick={() => void saveDraft()}>Save as Draft</OutlineButton>}
          {stage !== 'disburse' ? (
            <PrimaryButton disabled={busy || !run} onClick={() => void advance()}>
              {stage === 'attendance' ? 'Confirm Attendance & Proceed' : `Next ${nextLabel(stage)}`} <ArrowRight className="h-5 w-5" />
            </PrimaryButton>
          ) : (
            <PrimaryButton disabled={busy || !run || run.status === 'disbursed'} onClick={() => void advance()}>
              Confirm & Disburse <ArrowRight className="h-5 w-5" />
            </PrimaryButton>
          )}
        </div>
      </Card>
      {editLine && run && (
        <EditLineModal
          stage={stage}
          line={editLine}
          onClose={() => setEditLine(null)}
          onSave={async (payload) => {
            await patchPayrollLine(run.id, editLine.id, payload);
            setEditLine(null);
            setActionNotice(`Updated ${editLine.full_name}.`);
            await load();
          }}
        />
      )}
      </LoadState>
    </PageShell>
  );
}

function Stepper({ stage, runStatus }: { stage: PayrollStage; runStatus?: string }) {
  const activeIndex = stages.findIndex((item) => item.key === stage);
  const statusIndex =
    runStatus === 'disbursed' ? 3
      : runStatus === 'deductions_confirmed' ? 3
        : runStatus === 'wages_confirmed' ? 2
          : runStatus === 'attendance_confirmed' ? 1
            : 0;

  return (
    <Card className="p-4">
      <div className="relative grid gap-4 md:grid-cols-4">
        <div className="absolute left-4 right-4 top-4 hidden h-1 rounded-full bg-[#E5E7EB] md:block" />
        <div
          className="absolute left-4 top-4 hidden h-1 rounded-full bg-[#4CAF50] transition-all md:block"
          style={{ width: `calc((100% - 32px) * ${Math.max(activeIndex, statusIndex) / (stages.length - 1)})` }}
        />
        {stages.map((item, index) => {
          const done = index < Math.max(activeIndex, statusIndex);
          const active = index === activeIndex;
          return (
            <Link key={item.key} href={stageHref(item.key)} className="relative z-10 flex cursor-pointer items-center gap-3 rounded-lg bg-white p-1 hover:bg-[#FAFAFA]">
              <span className={`grid h-8 w-8 place-items-center rounded-full border text-sm font-bold ${done || active ? 'border-[#4CAF50] bg-[#4CAF50] text-white' : 'border-[#A3A3A3] bg-white text-[#676767]'}`}>{done ? <Check className="h-5 w-5" /> : index + 1}</span>
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

function renderStageTable(stage: PayrollStage, workers: PayrollLineView[], onEdit: (line: PayrollLineView) => void) {
  if (stage === 'attendance') {
    return (
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="bg-[#FAFAFA] text-[#676767]"><tr>{['Employee', 'Present', 'Leave', 'Absent', 'OT Hours', 'Payable Days', 'Action'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr></thead>
        <tbody>{workers.map((worker) => <tr key={worker.id} className="border-t border-[#D3D3D3]"><td className="px-4 py-4"><EmployeeCell name={worker.full_name} designation={worker.designation} id={worker.employee_no ?? worker.id.slice(0, 8)} /></td><td>{worker.present_days}</td><td>{worker.leave_days}</td><td>{worker.absent_days || '-'}</td><td>+{worker.ot_hours}h</td><td>{worker.payable_days} days</td><td><button type="button" onClick={() => onEdit(worker)} className="inline-flex cursor-pointer items-center gap-1 text-[#0658C2]"><Edit3 className="h-4 w-4" /> Edit</button></td></tr>)}{workers.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-[#676767]">No workers found</td></tr>}</tbody>
      </table>
    );
  }

  if (stage === 'wages') {
    return (
      <table className="w-full min-w-[1000px] text-left text-sm">
        <thead className="bg-[#FAFAFA] text-[#676767]"><tr>{['Employee', 'Days', 'Rate/Day', 'Basic', 'OT Pay', 'Allowances', 'Gross Pay', 'Action'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr></thead>
        <tbody>{workers.map((worker) => <tr key={worker.id} className="border-t border-[#D3D3D3]"><td className="px-4 py-4"><EmployeeCell name={worker.full_name} designation={worker.designation} id={worker.employee_no ?? worker.id.slice(0, 8)} /></td><td>{worker.payable_days}</td><td>{money(worker.rate_per_day)}</td><td>{money(worker.basic)}</td><td className="text-[#0658C2]">+{money(worker.ot_pay)}</td><td className="text-[#4CAF50]">+{money(worker.allowance)}</td><td className="font-bold">{money(worker.gross)}</td><td><button type="button" onClick={() => onEdit(worker)} className="inline-flex cursor-pointer items-center gap-1 text-[#0658C2]"><Edit3 className="h-4 w-4" /> Edit</button></td></tr>)}{workers.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-[#676767]">No workers found</td></tr>}</tbody>
      </table>
    );
  }

  if (stage === 'deductions') {
    return (
      <table className="w-full min-w-[1080px] text-left text-sm">
        <thead className="bg-[#FAFAFA] text-[#676767]"><tr>{['Employee', 'Gross', 'EPF', 'ESIC', 'TDS', 'LWF', 'Advance', 'Total Deduction', 'Net Pay', 'Action'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr></thead>
        <tbody>{workers.map((worker) => <tr key={worker.id} className="border-t border-[#D3D3D3]"><td className="px-4 py-4"><EmployeeCell name={worker.full_name} designation={worker.designation} id={worker.employee_no ?? worker.id.slice(0, 8)} /></td><td className="font-bold">{money(worker.gross)}</td><td className="text-[#F54A4A]">{money(worker.epf)}</td><td className="text-[#F54A4A]">{money(worker.esic)}</td><td className="text-[#F54A4A]">{money(worker.tds)}</td><td>{money(worker.lwf)}</td><td className="text-[#F54A4A]">{money(worker.advance)}</td><td className="text-[#F54A4A]">{money(worker.total_deduction)}</td><td className="font-bold">{money(worker.net)}</td><td><button type="button" onClick={() => onEdit(worker)} className="cursor-pointer text-[#0658C2]">+ Add Deduction</button></td></tr>)}{workers.length === 0 && <tr><td colSpan={10} className="px-4 py-8 text-center text-[#676767]">No workers found</td></tr>}</tbody>
      </table>
    );
  }

  return (
    <table className="w-full min-w-[1000px] text-left text-sm">
      <thead className="bg-[#FAFAFA] text-[#676767]"><tr>{['Employee', 'Days', 'Rate/Day', 'OT hrs', 'Gross', 'EPF', 'ESIC', 'Net Pay', 'Bank'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr></thead>
      <tbody>{workers.map((worker) => <tr key={worker.id} className="border-t border-[#D3D3D3]"><td className="px-4 py-4"><EmployeeCell name={worker.full_name} designation={worker.designation} id={worker.employee_no ?? worker.id.slice(0, 8)} /></td><td>{worker.payable_days}</td><td>{money(worker.rate_per_day)}</td><td className="text-[#FFA000]">+{worker.ot_hours}h</td><td className="font-bold">{money(worker.gross)}</td><td className="text-[#F54A4A]">-{money(worker.epf)}</td><td className="text-[#F54A4A]">-{money(worker.esic)}</td><td className="font-bold">{money(worker.net)}</td><td>{worker.bank_label}</td></tr>)}{workers.length === 0 && <tr><td colSpan={9} className="px-4 py-8 text-center text-[#676767]">No workers found</td></tr>}</tbody>
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

function DeductionRules({ rules }: { rules: PayrollRunView['statutory_rules'] }) {
  return (
    <Card className="mb-5 border-[#9BC2FF] bg-[#EEF5FF] p-5">
      <div className="flex flex-wrap items-center gap-8 text-sm">
        <p className="font-semibold">Auto - applied statutory rules</p>
        {[
          `EPF Employee : ${rules.employee_pf_rate}% of Basic`,
          `EPF Employer : ${rules.employer_pf_rate}% of Basic`,
          `ESIC Employee : ${rules.employee_esic_rate}% of Gross`,
          `ESIC Employer : ${rules.employer_esic_rate}% of Gross`,
          `LWF: Rs ${rules.labour_welfare_fund} / Month`,
        ].map((item) => <span key={item} className="rounded-lg bg-[#DBEAFF] px-3 py-2 font-semibold text-[#0658C2]">{item}</span>)}
        <Link href="/payroll/settings" className="ml-auto cursor-pointer rounded-lg bg-black px-5 py-3 text-white">Edit</Link>
      </div>
    </Card>
  );
}

function DisbursementMethod({
  selected,
  disabled,
  onChange,
}: {
  selected: string;
  disabled?: boolean;
  onChange: (method: 'NEFT' | 'UPI' | 'CASH') => void;
}) {
  return (
    <div className="mb-5 grid gap-4 xl:grid-cols-2">
      <Card className="p-5">
        <h2 className="mb-3 text-base font-semibold">Disbursement Method</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {([
            ['NEFT', 'NEFT Bank'],
            ['UPI', 'UPI Instant Pay'],
            ['CASH', 'Cash (Manual)'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              disabled={disabled}
              onClick={() => onChange(value)}
              className={`h-9 cursor-pointer rounded-lg border px-3 text-left text-xs ${selected === value ? 'border-[#0658C2] bg-[#DBEAFF]' : 'border-[#D3D3D3] bg-white text-[#676767]'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </Card>
      <Card className="p-5">
        <div className="h-full min-h-[62px]" />
      </Card>
    </div>
  );
}

function EditLineModal({
  stage,
  line,
  onClose,
  onSave,
}: {
  stage: PayrollStage;
  line: PayrollLineView;
  onClose: () => void;
  onSave: (payload: Record<string, number>) => Promise<void>;
}) {
  const [form, setForm] = useState({
    present_days: line.present_days,
    leave_days: line.leave_days,
    absent_days: line.absent_days,
    ot_hours: line.ot_hours,
    rate_per_day: line.rate_per_day,
    allowance: line.allowance,
    tds: line.tds,
    advance: line.advance,
    custom_deduction: line.custom_deduction,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const fields =
    stage === 'attendance'
      ? (['present_days', 'leave_days', 'absent_days', 'ot_hours'] as const)
      : stage === 'wages'
        ? (['rate_per_day', 'allowance'] as const)
        : (['tds', 'advance', 'custom_deduction'] as const);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Edit {line.full_name}</h2>
        <div className="mt-4 space-y-3">
          {fields.map((key) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block font-semibold capitalize">{key.replaceAll('_', ' ')}</span>
              <input
                type="number"
                min={0}
                value={form[key]}
                onChange={(event) => setForm((current) => ({ ...current, [key]: Number(event.target.value) }))}
                className="h-11 w-full rounded-lg border border-[#D3D3D3] px-3 outline-none focus:border-[#0658C2]"
              />
            </label>
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-3">
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              setError('');
              try {
                const payload: Record<string, number> = {};
                for (const key of fields) payload[key] = form[key];
                await onSave(payload);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Save failed');
                setBusy(false);
              }
            }}
          >
            Save
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
