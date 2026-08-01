'use client';

import { Download, Eye, FileText, Send, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { payrollDesignations, payrollStatuses, type PayrollWorker } from '../data/payroll-data';
import { useFilteredPayrollWorkers } from '../hooks/use-payroll-hook';
import { usePayrollStore } from '../stores/use-payroll-store';
import { Card, EmployeeCell, money, MonthSelect, PageShell, PageTitle, Pagination, SearchAndFilters, SelectButton, StatCard, StatusPill } from './payroll-ui';

export function PayslipsScreen() {
  const {
    search,
    selectedDesignations,
    selectedStatuses,
    payslipPreviewOpen,
    setSearch,
    setPayslipPreviewOpen,
    setSelectedDesignations,
    setSelectedStatuses,
  } = usePayrollStore();
  const [page, setPage] = useState(1);
  const [actionNotice, setActionNotice] = useState('');
  const workers = useFilteredPayrollWorkers({ search, selectedDesignations, selectedStatuses });
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(workers.length / pageSize));
  const paginatedWorkers = useMemo(() => workers.slice((page - 1) * pageSize, page * pageSize), [page, workers]);

  const downloadPayslip = (worker: PayrollWorker) => {
    const content = `Payslip - ${worker.name}\nEmployee ID: ${worker.id}\nGross Pay: ${money(worker.gross)}\nNet Pay: ${money(worker.net)}`;
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${worker.id}-payslip.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setActionNotice(`Payslip downloaded for ${worker.name}.`);
  };

  return (
    <PageShell>
      <PageTitle title="Payslips" subtitle="Payroll  >  Payslips" action={<MonthSelect />} />
      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Payslips" value="48" icon={FileText} />
        <StatCard title="Sent to Workers" value="31" icon={Send} color="green" />
        <StatCard title="Generated (Not Sent)" value="3,015" icon={FileText} color="violet" />
        <StatCard title="Pending Generation" value="8" icon={FileText} color="orange" />
      </div>

      <Card className="overflow-hidden p-5">
        <SearchAndFilters search={search} onSearch={(value) => { setSearch(value); setPage(1); }}>
          <SelectButton label="All Designations" selectedLabel="Designations" options={payrollDesignations} selected={selectedDesignations} onChange={(items) => { setSelectedDesignations(items); setPage(1); }} />
          <SelectButton label="All Status" selectedLabel="Status" options={payrollStatuses} selected={selectedStatuses} onChange={(items) => { setSelectedStatuses(items); setPage(1); }} />
        </SearchAndFilters>
        {actionNotice && <p className="mb-4 rounded-lg bg-[#DBEAFF] px-4 py-3 text-sm font-semibold text-[#0658C2]">{actionNotice}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[#FAFAFA] text-[#676767]"><tr>{['Employee', 'Department', 'Gross Pay', 'Deduction', 'Net Pay', 'Status', 'Action'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr></thead>
            <tbody>
              {paginatedWorkers.map((worker) => {
                const tone = worker.payslipStatus === 'Sent' ? 'green' : worker.payslipStatus === 'Pending' ? 'orange' : 'blue';
                const deduction = worker.gross - worker.net;
                return (
                  <tr key={worker.id} className="border-t border-[#D3D3D3]">
                    <td className="px-4 py-4"><EmployeeCell name={worker.name} designation={worker.designation} id={worker.id} /></td>
                    <td>{worker.department}</td>
                    <td className="font-bold">{money(worker.gross)}</td>
                    <td className="text-[#F54A4A]">-{money(deduction)}</td>
                    <td className="font-semibold">{money(worker.net)}</td>
                    <td><StatusPill tone={tone}>{worker.payslipStatus}</StatusPill></td>
                    <td>
                      <div className="flex gap-3 text-[#0658C2]">
                        <button type="button" onClick={() => setPayslipPreviewOpen(true)} className="cursor-pointer" aria-label="Preview payslip"><Eye className="h-5 w-5" /></button>
                        <button type="button" onClick={() => downloadPayslip(worker)} className="cursor-pointer" aria-label="Download payslip"><Download className="h-5 w-5" /></button>
                        <button type="button" onClick={() => setActionNotice(`Payslip sent to ${worker.name}.`)} className="cursor-pointer" aria-label="Send payslip"><Send className="h-5 w-5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginatedWorkers.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-[#676767]">No payslips found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex items-center justify-between"><p className="text-sm text-[#676767]">Showing {paginatedWorkers.length} of {workers.length} workers</p><Pagination page={page} pageCount={pageCount} onPageChange={setPage} /></div>
      </Card>

      {payslipPreviewOpen && <PayslipPreview onClose={() => setPayslipPreviewOpen(false)} />}
    </PageShell>
  );
}

function PayslipPreview({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-[840px] rounded-xl bg-white p-8 shadow-2xl">
        <button type="button" onClick={onClose} className="absolute right-4 top-4 cursor-pointer rounded-full p-1 hover:bg-gray-100" aria-label="Close preview"><X className="h-5 w-5" /></button>
        <div className="mb-8 flex items-start justify-between border-b border-[#D3D3D3] pb-6">
          <div className="flex gap-3">
            <div className="grid h-10 w-10 place-items-center rounded bg-[#1E40AF] font-bold text-white">KB</div>
            <div>
              <h2 className="font-bold text-[#1E40AF]">KAAM BADLO PVT. LTD.</h2>
              <p className="text-sm text-[#7C98C0]">GIDC Electronic Estate, Sector 26, Gandhinagar, Gujarat - 382028</p>
            </div>
          </div>
          <div className="text-right"><h2 className="text-xl font-bold">PAYSLIP PREVIEW</h2><p className="text-sm font-semibold text-[#617EA8]">Month: October 2026</p></div>
        </div>

        <div className="mb-6 grid gap-4 rounded-xl border border-[#D3D3D3] bg-[#FAFCFF] p-5 md:grid-cols-2">
          {[
            ['Employee Name:', 'Jagjeet Singh'],
            ['Bank Account No:', '********4512'],
            ['Employee ID:', 'EMP-1082'],
            ['IFSC Code:', 'SBIN0001234'],
            ['Designation:', 'Senior Operator'],
            ['Paid Days:', '31 Days'],
            ['Department:', 'Operations Team'],
            ['PAN Number:', 'ABCDE1234F'],
          ].map(([label, value]) => <p key={label} className="flex justify-between gap-4 text-sm"><span className="text-[#7C98C0]">{label}</span><b>{value}</b></p>)}
        </div>

        <div className="mb-6 grid gap-6 md:grid-cols-2">
          <PayslipBox title="EARNINGS" rows={[['Basic Salary', 'Rs 25,000.00'], ['House Rent Allowance (HRA)', 'Rs 10,000.00'], ['Conveyance Allowance', 'Rs 2,500.00'], ['Medical Reimbursement', 'Rs 1,250.00'], ['Special Allowance', 'Rs 4,750.00']]} totalLabel="Gross Earnings" total="Rs 43,500.00" />
          <PayslipBox title="DEDUCTIONS" rows={[['Provident Fund (EPF)', 'Rs 1,800.00'], ['Employee State Insurance (ESI)', 'Rs 325.00'], ['Professional Tax (PT)', 'Rs 200.00'], ['TDS / Income Tax', 'Rs 2,713.00']]} totalLabel="Total Deductions" total="Rs 5,038.00" />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-[#CFE2FF] bg-[#F2F7FF] p-6">
          <div><p className="font-bold text-[#1E40AF]">NET PAYABLE SALARY</p><p className="text-xs text-[#0658C2]">In Words: Thirty Eight Thousand Four Hundred Sixty-Two Rupees Only</p></div>
          <p className="text-3xl font-bold text-[#0658C2]">Rs 38,462.00</p>
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
