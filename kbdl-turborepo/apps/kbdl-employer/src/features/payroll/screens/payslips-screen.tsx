'use client';

import { Download, Eye, FileText, Send, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  fetchPayslipPreview,
  fetchPayslips,
  sendPayslip,
  type PayrollLineView,
  type PayrollRunView,
  type PayslipPreviewView,
} from '../api';
import { payrollStatuses } from '../data/payroll-data';
import { useFilteredPayrollLines } from '../hooks/use-payroll-hook';
import { usePayrollStore } from '../stores/use-payroll-store';
import { Card, EmployeeCell, LoadState, money, MonthSelect, PageShell, PageTitle, Pagination, RefreshIconButton, SearchAndFilters, SelectButton, StatCard, StatusPill, errMessage } from './payroll-ui';

function payslipLabel(status: string) {
  if (status === 'sent') return 'Sent';
  if (status === 'generated') return 'Generated';
  return 'Pending';
}

export function PayslipsScreen() {
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
  const [view, setView] = useState<PayrollRunView | null>(null);
  const [preview, setPreview] = useState<PayslipPreviewView | null>(null);
  const [actionNotice, setActionNotice] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setView(await fetchPayslips(selectedPeriod.year, selectedPeriod.month, { search, page, limit: 10 }));
    } catch (err) {
      setError(errMessage(err, 'Failed to load payslips'));
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
  const sent = view?.employees.filter((row) => row.payslip_status === 'sent').length ?? 0;
  const generated = view?.employees.filter((row) => row.payslip_status === 'generated').length ?? 0;
  const pending = view?.employees.filter((row) => row.payslip_status === 'pending').length ?? 0;

  const downloadPayslip = async (worker: PayrollLineView) => {
    const data = await fetchPayslipPreview(worker.id);
    const content = `Payslip - ${data.line.full_name}\n${data.period_label}\nGross: ${money(data.line.gross)}\nNet: ${money(data.net)}\n${data.net_in_words}`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${data.line.employee_no ?? data.line.id}-payslip.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setActionNotice(`Payslip downloaded for ${data.line.full_name}.`);
  };

  return (
    <PageShell>
      <PageTitle title="Payslips" subtitle="Payroll  >  Payslips" action={<><MonthSelect /><RefreshIconButton loading={loading} onClick={() => void load()} /></>} />
      <LoadState loading={loading} error={error} hasData={Boolean(view)} onRetry={() => void load()} label="Loading payslips...">
      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Payslips" value={String(view?.run.worker_count ?? 0)} icon={FileText} />
        <StatCard title="Sent to Workers" value={String(sent)} icon={Send} color="green" />
        <StatCard title="Generated (Not Sent)" value={String(generated)} icon={FileText} color="violet" />
        <StatCard title="Pending Generation" value={String(pending)} icon={FileText} color="orange" />
      </div>

      <Card className="overflow-hidden p-5">
        <SearchAndFilters search={search} onSearch={(value) => { setSearch(value); setPage(1); }}>
          <SelectButton label="All Designations" selectedLabel="Designations" options={designations} selected={selectedDesignations} onChange={(items) => { setSelectedDesignations(items); setPage(1); }} />
          <SelectButton label="All Status" selectedLabel="Status" options={payrollStatuses} selected={selectedStatuses} onChange={(items) => { setSelectedStatuses(items); setPage(1); }} />
        </SearchAndFilters>
        {actionNotice && <p className="mb-4 rounded-lg bg-[#DBEAFF] px-4 py-3 text-sm font-semibold text-[#0658C2]">{actionNotice}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[#FAFAFA] text-[#676767]"><tr>{['Employee', 'Department', 'Gross Pay', 'Deduction', 'Net Pay', 'Status', 'Action'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr></thead>
            <tbody>
              {workers.map((worker) => {
                const label = payslipLabel(worker.payslip_status);
                const tone = label === 'Sent' ? 'green' : label === 'Pending' ? 'orange' : 'blue';
                return (
                  <tr key={worker.id} className="border-t border-[#D3D3D3]">
                    <td className="px-4 py-4"><EmployeeCell name={worker.full_name} designation={worker.designation} id={worker.employee_no ?? worker.id.slice(0, 8)} /></td>
                    <td>{worker.department}</td>
                    <td className="font-bold">{money(worker.gross)}</td>
                    <td className="text-[#F54A4A]">-{money(worker.total_deduction)}</td>
                    <td className="font-semibold">{money(worker.net)}</td>
                    <td><StatusPill tone={tone}>{label}</StatusPill></td>
                    <td>
                      <div className="flex gap-3 text-[#0658C2]">
                        <button type="button" onClick={async () => setPreview(await fetchPayslipPreview(worker.id))} className="cursor-pointer" aria-label="Preview payslip"><Eye className="h-5 w-5" /></button>
                        <button type="button" onClick={() => void downloadPayslip(worker)} className="cursor-pointer" aria-label="Download payslip"><Download className="h-5 w-5" /></button>
                        <button
                          type="button"
                          onClick={async () => {
                            await sendPayslip(worker.id);
                            setActionNotice(`Payslip sent to ${worker.full_name}.`);
                            await load();
                          }}
                          className="cursor-pointer"
                          aria-label="Send payslip"
                        >
                          <Send className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {workers.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[#676767]">No payslips found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex items-center justify-between"><p className="text-sm text-[#676767]">Showing {workers.length} of {view?.meta.total ?? 0} workers</p><Pagination page={page} pageCount={view?.meta.totalPages ?? 1} onPageChange={setPage} /></div>
      </Card>

      {preview && <PayslipPreview data={preview} onClose={() => setPreview(null)} />}
      </LoadState>
    </PageShell>
  );
}

function PayslipPreview({ data, onClose }: { data: PayslipPreviewView; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-[840px] rounded-xl bg-white p-8 shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 cursor-pointer rounded-full p-1 hover:bg-gray-100" aria-label="Close preview"><X className="h-5 w-5" /></button>
        <div className="mb-8 flex items-start justify-between border-b border-[#D3D3D3] pb-6">
          <div>
            <h2 className="font-bold text-[#1E40AF]">{data.company_name}</h2>
            <p className="text-sm text-[#7C98C0]">{data.company_address || '—'}</p>
          </div>
          <div className="text-right"><h2 className="text-xl font-bold">PAYSLIP PREVIEW</h2><p className="text-sm font-semibold text-[#617EA8]">Month: {data.period_label}</p></div>
        </div>
        <div className="mb-6 grid gap-4 rounded-xl border border-[#D3D3D3] bg-[#FAFCFF] p-5 md:grid-cols-2">
          {[
            ['Employee Name:', data.line.full_name],
            ['Bank:', data.line.bank_label],
            ['Employee ID:', data.line.employee_no ?? '—'],
            ['IFSC Code:', data.ifsc ?? '—'],
            ['Designation:', data.line.designation],
            ['Paid Days:', `${data.paid_days} Days`],
            ['Department:', data.line.department],
            ['PAN Number:', data.pan ?? '—'],
          ].map(([label, value]) => <p key={label} className="flex justify-between gap-4 text-sm"><span className="text-[#7C98C0]">{label}</span><b>{value}</b></p>)}
        </div>
        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <PayslipBox title="EARNINGS" rows={data.earnings.map((row) => [row.label, money(row.amount)])} totalLabel="Gross Earnings" total={money(data.line.gross)} />
          <PayslipBox title="DEDUCTIONS" rows={data.deductions.map((row) => [row.label, money(row.amount)])} totalLabel="Total Deductions" total={money(data.line.total_deduction)} />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-[#CFE2FF] bg-[#F2F7FF] p-6">
          <div><p className="font-bold text-[#1E40AF]">NET PAYABLE SALARY</p><p className="text-xs text-[#0658C2]">In Words: {data.net_in_words}</p></div>
          <p className="text-3xl font-bold text-[#0658C2]">{money(data.net)}</p>
        </div>
      </div>
    </div>
  );
}

function PayslipBox({ title, rows, totalLabel, total }: { title: string; rows: string[][]; totalLabel: string; total: string }) {
  return (
    <div className="rounded-xl border border-[#D3D3D3]">
      <div className="flex justify-between border-b border-[#D3D3D3] px-5 py-3 text-sm font-bold"><span>{title}</span><span>AMOUNT</span></div>
      <div className="space-y-3 p-5 text-sm">{rows.map(([label, value]) => <p key={label} className="flex justify-between"><span>{label}</span><b>{value}</b></p>)}</div>
      <div className="flex justify-between border-t border-[#D3D3D3] px-5 py-3 text-sm font-bold"><span>{totalLabel}</span><span>{total}</span></div>
    </div>
  );
}
