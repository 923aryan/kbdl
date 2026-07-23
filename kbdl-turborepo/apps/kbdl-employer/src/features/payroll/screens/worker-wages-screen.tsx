'use client';

import { Banknote, Building2, Edit3, Shield, WalletCards } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useFilteredPayrollWorkers } from '../hooks/use-payroll-hook';
import { payrollCoverageOptions, payrollDesignations, payrollTypes, payrollWorkers, usePayrollStore } from '../stores/use-payroll-store';
import { Card, EmployeeCell, money, MonthSelect, PageShell, PageTitle, Pagination, SearchAndFilters, SelectButton, StatCard } from './payroll-ui';

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
  const [editingWorker, setEditingWorker] = useState<string | null>(null);
  const workers = useFilteredPayrollWorkers({ search, selectedDesignations, selectedTypes, selectedCoverage });
  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(workers.length / pageSize));
  const paginatedWorkers = useMemo(() => workers.slice((page - 1) * pageSize, page * pageSize), [page, workers]);

  return (
    <PageShell>
      <PageTitle title="Worker Wages & Pay Configuration" subtitle="Payroll  >  Worker Wages" action={<MonthSelect />} />
      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Workers" value="48" note="Active on Payroll" icon={WalletCards} />
        <StatCard title="EPF Covered" value="38" note="of 48 workers" icon={Shield} color="green" />
        <StatCard title="ESIC Covered" value="35" note="Gross < Rs 21,000" icon={Banknote} color="orange" />
        <StatCard title="Bank Verified" value="46" note="2 pending verification" icon={Building2} color="violet" />
      </div>

      <Card className="overflow-hidden p-5">
        <SearchAndFilters search={search} onSearch={(value) => { setSearch(value); setPage(1); }}>
          <SelectButton label="All Designations" selectedLabel="Designations" options={payrollDesignations} selected={selectedDesignations} onChange={(items) => { setSelectedDesignations(items); setPage(1); }} />
          <SelectButton label="All Types" selectedLabel="Types" options={payrollTypes} selected={selectedTypes} onChange={(items) => { setSelectedTypes(items); setPage(1); }} />
          <SelectButton label="EPF/ESIC" selectedLabel="Coverage" options={payrollCoverageOptions} selected={selectedCoverage} onChange={(items) => { setSelectedCoverage(items); setPage(1); }} />
        </SearchAndFilters>
        {editingWorker && <p className="mb-4 rounded-lg bg-[#DBEAFF] px-4 py-3 text-sm font-semibold text-[#0658C2]">Editing pay configuration for {editingWorker}. Changes can be connected to the payroll API from here.</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left text-sm">
            <thead className="bg-[#FAFAFA] text-[#676767]"><tr>{['Employee', 'Contract', 'Daily Rate', 'OT Rate', 'Payment Mode', 'EPF', 'ESIC', 'Action'].map((head) => <th key={head} className="px-4 py-3">{head}</th>)}</tr></thead>
            <tbody>
              {paginatedWorkers.map((worker) => (
                <tr key={worker.id} className="border-t border-[#D3D3D3]">
                  <td className="px-4 py-4"><EmployeeCell name={worker.name} designation={worker.designation} id={worker.id} /></td>
                  <td>{worker.contract}</td>
                  <td><b>{money(worker.ratePerDay)}</b>/day</td>
                  <td><b>{money(worker.otRate)}</b>/hr</td>
                  <td>{worker.paymentMode === 'UPI' ? 'UPI ****1204' : 'SBI****8823'}</td>
                  <td className={worker.epfCovered ? 'text-[#4CAF50]' : 'text-[#F54A4A]'}>{worker.epfCovered ? 'Yes' : 'NO'}</td>
                  <td className={worker.esicCovered ? 'text-[#4CAF50]' : 'text-[#F54A4A]'}>{worker.esicCovered ? 'Yes' : 'NO'}</td>
                  <td><button type="button" onClick={() => setEditingWorker(worker.name)} className="inline-flex cursor-pointer items-center gap-1 text-[#0658C2]"><Edit3 className="h-4 w-4" /> Edit</button></td>
                </tr>
              ))}
              {paginatedWorkers.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-[#676767]">No workers found</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex items-center justify-between"><p className="text-sm text-[#676767]">Showing {paginatedWorkers.length} of {workers.length} workers</p><Pagination page={page} pageCount={pageCount} onPageChange={setPage} /></div>
      </Card>
    </PageShell>
  );
}
