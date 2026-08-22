'use client';

import { Banknote, Building2, Edit3, Shield, WalletCards } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { fetchWorkerWages, patchWorkerWage, type WorkerWageView, type WorkerWagesPage } from '../api';
import { payrollCoverageOptions, payrollTypes } from '../data/payroll-data';
import { useFilteredPayrollLines } from '../hooks/use-payroll-hook';
import { usePayrollStore } from '../stores/use-payroll-store';
import { Card, EmployeeCell, LoadState, money, MonthSelect, OutlineButton, PageShell, PageTitle, Pagination, PrimaryButton, RefreshIconButton, SearchAndFilters, SelectButton, StatCard, errMessage } from './payroll-ui';

export function WorkerWagesScreen() {
  const {
    search,
    selectedCoverage,
    selectedDesignations,
    selectedTypes,
    setSearch,
    setSelectedCoverage,
    setSelectedDesignations,
    setSelectedTypes,
  } = usePayrollStore();
  const [page, setPage] = useState(1);
  const [data, setData] = useState<WorkerWagesPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<WorkerWageView | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchWorkerWages({ search, page, limit: 10 }));
    } catch (err) {
      setError(errMessage(err, 'Failed to load worker wages'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page]);

  const designations = useMemo(
    () => Array.from(new Set((data?.items ?? []).map((row) => row.designation).filter((name) => name && name !== '—'))),
    [data],
  );
  const workers = useFilteredPayrollLines({
    items: data?.items ?? [],
    search,
    selectedDesignations,
    selectedTypes,
    selectedCoverage,
  });

  return (
    <PageShell>
      <PageTitle title="Worker Wages & Pay Configuration" subtitle="Payroll  >  Worker Wages" action={<><MonthSelect /><RefreshIconButton loading={loading} onClick={() => void load()} /></>} />
      <LoadState loading={loading} error={error} hasData={Boolean(data)} onRetry={() => void load()} label="Loading worker wages...">
      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Workers" value={String(data?.stats.total_workers ?? 0)} note="Active on Payroll" icon={WalletCards} />
        <StatCard title="EPF Covered" value={String(data?.stats.epf_covered ?? 0)} note={`of ${data?.stats.total_workers ?? 0} workers`} icon={Shield} color="green" />
        <StatCard title="ESIC Covered" value={String(data?.stats.esic_covered ?? 0)} note="Gross < Rs 21,000" icon={Banknote} color="orange" />
        <StatCard title="Bank Verified" value={String(data?.stats.bank_verified ?? 0)} note={`${Math.max(0, (data?.stats.total_workers ?? 0) - (data?.stats.bank_verified ?? 0))} pending verification`} icon={Building2} color="violet" />
      </div>

      <Card className="overflow-hidden p-5">
        <SearchAndFilters search={search} onSearch={(value) => { setSearch(value); setPage(1); }}>
          <SelectButton label="All Designations" selectedLabel="Designations" options={designations} selected={selectedDesignations} onChange={(items) => { setSelectedDesignations(items); setPage(1); }} />
          <SelectButton label="All Types" selectedLabel="Types" options={payrollTypes} selected={selectedTypes} onChange={(items) => { setSelectedTypes(items); setPage(1); }} />
          <SelectButton label="EPF/ESIC" selectedLabel="Coverage" options={payrollCoverageOptions} selected={selectedCoverage} onChange={(items) => { setSelectedCoverage(items); setPage(1); }} />
        </SearchAndFilters>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-[#FAFAFA] text-[#676767]"><tr>{['Employee', 'Contract', 'Daily Rate', 'OT Rate', 'Payment Mode', 'EPF', 'ESIC', 'Action'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr></thead>
            <tbody>
              {workers.map((worker) => (
                <tr key={worker.employment_id} className="border-t border-[#D3D3D3]">
                  <td className="px-4 py-4"><EmployeeCell name={worker.full_name} designation={worker.designation} id={worker.employee_no ?? worker.employment_id.slice(0, 8)} /></td>
                  <td>{worker.contract}</td>
                  <td><b>{money(worker.daily_rate)}</b>/day</td>
                  <td><b>{money(worker.ot_rate)}</b>/hr</td>
                  <td>{worker.payment_label}</td>
                  <td className={worker.epf_covered ? 'text-[#4CAF50]' : 'text-[#F54A4A]'}>{worker.epf_covered ? 'Yes' : 'NO'}</td>
                  <td className={worker.esic_covered ? 'text-[#4CAF50]' : 'text-[#F54A4A]'}>{worker.esic_covered ? 'Yes' : 'NO'}</td>
                  <td><button type="button" onClick={() => setEditing(worker)} className="inline-flex cursor-pointer items-center gap-1 text-[#0658C2]"><Edit3 className="h-4 w-4" /> Edit</button></td>
                </tr>
              ))}
              {workers.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-[#676767]">No workers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex items-center justify-between"><p className="text-sm text-[#676767]">Showing {workers.length} of {data?.meta.total ?? 0} workers</p><Pagination page={page} pageCount={data?.meta.totalPages ?? 1} onPageChange={setPage} /></div>
      </Card>
      {editing && (
        <WageEditModal
          worker={editing}
          onClose={() => setEditing(null)}
          onSave={async (body) => {
            await patchWorkerWage(editing.employment_id, body);
            setEditing(null);
            await load();
          }}
        />
      )}
      </LoadState>
    </PageShell>
  );
}

function WageEditModal({
  worker,
  onClose,
  onSave,
}: {
  worker: WorkerWageView;
  onClose: () => void;
  onSave: (body: { daily_rate: number; ot_rate: number; payment_method: 'NEFT' | 'UPI' | 'CASH'; pf_applicable: boolean; esi_applicable: boolean }) => Promise<void>;
}) {
  const [dailyRate, setDailyRate] = useState(worker.daily_rate);
  const [otRate, setOtRate] = useState(worker.ot_rate);
  const [method, setMethod] = useState<'NEFT' | 'UPI' | 'CASH'>(
    worker.payment_mode === 'UPI' ? 'UPI' : worker.payment_mode === 'Cash' ? 'CASH' : 'NEFT',
  );
  const [epf, setEpf] = useState(worker.epf_covered);
  const [esic, setEsic] = useState(worker.esic_covered);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/35 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Edit {worker.full_name}</h2>
        <div className="mt-4 space-y-3 text-sm">
          <label className="block"><span className="mb-1 block font-semibold">Daily rate</span><input type="number" min={0} value={dailyRate} onChange={(e) => setDailyRate(Number(e.target.value))} className="h-11 w-full rounded-lg border px-3" /></label>
          <label className="block"><span className="mb-1 block font-semibold">OT rate / hour</span><input type="number" min={0} value={otRate} onChange={(e) => setOtRate(Number(e.target.value))} className="h-11 w-full rounded-lg border px-3" /></label>
          <label className="block"><span className="mb-1 block font-semibold">Payment method</span>
            <select value={method} onChange={(e) => setMethod(e.target.value as 'NEFT' | 'UPI' | 'CASH')} className="h-11 w-full rounded-lg border px-3">
              <option value="NEFT">NEFT</option>
              <option value="UPI">UPI</option>
              <option value="CASH">Cash</option>
            </select>
          </label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={epf} onChange={(e) => setEpf(e.target.checked)} /> EPF covered</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={esic} onChange={(e) => setEsic(e.target.checked)} /> ESIC covered</label>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-3">
          <OutlineButton onClick={onClose}>Cancel</OutlineButton>
          <PrimaryButton
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await onSave({ daily_rate: dailyRate, ot_rate: otRate, payment_method: method, pf_applicable: epf, esi_applicable: esic });
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
