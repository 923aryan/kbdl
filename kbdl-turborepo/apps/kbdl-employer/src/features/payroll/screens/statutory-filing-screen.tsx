'use client';

import { CheckCircle2, Download, FileDown, Send } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  fetchStatutoryHistory,
  fetchStatutoryMonth,
  fileAllStatutory,
  fileStatutory,
  type StatutoryHistoryRow,
  type StatutoryMonthView,
} from '../api';
import { usePayrollStore } from '../stores/use-payroll-store';
import { Card, LoadState, money, MonthSelect, PageShell, PageTitle, PrimaryButton, RefreshIconButton, StatusPill, errMessage } from './payroll-ui';

export function StatutoryFilingScreen() {
  const { selectedPeriod } = usePayrollStore();
  const [monthView, setMonthView] = useState<StatutoryMonthView | null>(null);
  const [history, setHistory] = useState<StatutoryHistoryRow[] | null>(null);
  const [monthLoading, setMonthLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [monthError, setMonthError] = useState<string | null>(null);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const loadMonth = useCallback(async () => {
    setMonthLoading(true);
    setMonthError(null);
    try {
      setMonthView(await fetchStatutoryMonth(selectedPeriod.year, selectedPeriod.month));
    } catch (err) {
      setMonthError(errMessage(err, 'Failed to load statutory obligations'));
    } finally {
      setMonthLoading(false);
    }
  }, [selectedPeriod.year, selectedPeriod.month]);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      setHistory(await fetchStatutoryHistory());
    } catch (err) {
      setHistoryError(errMessage(err, 'Failed to load filing history'));
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  const loadAll = useCallback(async () => {
    setMonthLoading(true);
    setHistoryLoading(true);
    setMonthError(null);
    setHistoryError(null);
    const settled = await Promise.allSettled([
      fetchStatutoryMonth(selectedPeriod.year, selectedPeriod.month),
      fetchStatutoryHistory(),
    ]);
    if (settled[0].status === 'fulfilled') {
      setMonthView(settled[0].value);
      setMonthError(null);
    } else {
      setMonthError(errMessage(settled[0].reason, 'Failed to load statutory obligations'));
    }
    if (settled[1].status === 'fulfilled') {
      setHistory(settled[1].value);
      setHistoryError(null);
    } else {
      setHistoryError(errMessage(settled[1].reason, 'Failed to load filing history'));
    }
    setMonthLoading(false);
    setHistoryLoading(false);
  }, [selectedPeriod.year, selectedPeriod.month]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const fileNow = async (id: string) => {
    setActionError(null);
    try {
      setMonthView(await fileStatutory(id));
      setNotice('Filing marked as completed.');
      const historyResult = await Promise.allSettled([fetchStatutoryHistory()]);
      if (historyResult[0].status === 'fulfilled') setHistory(historyResult[0].value);
    } catch (err) {
      setActionError(errMessage(err, 'Could not file obligation'));
    }
  };

  const fileAllPending = async () => {
    setActionError(null);
    try {
      setMonthView(await fileAllStatutory(selectedPeriod.year, selectedPeriod.month));
      setNotice('All pending statutory filings have been marked as filed.');
      const historyResult = await Promise.allSettled([fetchStatutoryHistory()]);
      if (historyResult[0].status === 'fulfilled') setHistory(historyResult[0].value);
    } catch (err) {
      setActionError(errMessage(err, 'Could not file obligations'));
    }
  };

  const obligations = monthView?.obligations ?? [];
  const pending = obligations.filter((item) => item.status === 'Pending');
  const filed = obligations.filter((item) => item.status === 'Filed');

  return (
    <PageShell>
      <PageTitle
        title="Statutory Filing"
        subtitle="Payroll  >  Statutory Filing"
        action={
          <>
            <MonthSelect />
            <RefreshIconButton loading={monthLoading || historyLoading} onClick={() => void loadAll()} />
            <PrimaryButton onClick={() => void fileAllPending()}><Send className="h-5 w-5" /> File All Pending</PrimaryButton>
          </>
        }
      />

      {notice && <p className="mb-5 rounded-lg bg-[#DBEAFF] px-4 py-3 text-sm font-semibold text-[#0658C2]">{notice}</p>}
      {actionError && <p className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{actionError}</p>}

      <LoadState loading={monthLoading} error={monthError} hasData={Boolean(monthView)} onRetry={() => void loadMonth()} label="Loading statutory obligations...">
        <Card className="mb-5 p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
            <div className="flex items-center gap-4 lg:min-w-[320px]">
              <div className="grid h-16 w-16 place-items-center rounded-full border-[7px] border-[#DBEAFF] border-t-[#0658C2] border-r-[#0658C2] text-xs font-bold text-[#0658C2]">{monthView?.compliance_score ?? 0}%</div>
              <div>
                <h2 className="text-lg font-semibold text-black">Compliance Score</h2>
                <p className="text-sm text-[#676767]">{filed.length} of {obligations.length} obligations filed for {monthView?.period_label ?? selectedPeriod.label}</p>
                <div className="mt-2 flex gap-2">
                  <StatusPill tone="green">{filed.length} Filed</StatusPill>
                  <StatusPill tone="orange">{pending.length} Pending</StatusPill>
                </div>
              </div>
            </div>
            <div className="hidden h-14 w-px bg-[#D3D3D3] lg:block" />
            <SummaryMetric label="Total Statutory Due" value={money(monthView?.total_due ?? 0)} />
            <SummaryMetric label="Filed This Month" value={money(monthView?.filed_total ?? 0)} tone="green" />
            <SummaryMetric label="Pending Payment" value={money(monthView?.pending_total ?? 0)} tone="orange" />
            <SummaryMetric label="Deadline: EPF/ESIC" value={monthView?.deadline_label ?? '—'} tone="red" />
          </div>
        </Card>

        <h2 className="mb-4 text-2xl font-semibold text-black">{monthView?.period_label ?? selectedPeriod.label} - Statutory Obligations</h2>
        <div className="space-y-4">
          {obligations.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="grid gap-4 lg:grid-cols-[240px_repeat(4,1fr)_190px] lg:items-center">
                <div className="flex items-center gap-4">
                  <span className={`grid h-14 w-14 place-items-center rounded-full text-sm font-semibold ${item.status === 'Filed' ? 'bg-[#E5FFEB] text-[#4CAF50]' : 'bg-[#FFF4E3] text-[#FFA000]'}`}>{item.kind}</span>
                  <div>
                    <h3 className="font-semibold text-black">{item.title}</h3>
                    <p className="text-sm text-[#676767]">{item.subtitle}</p>
                    <p className="text-sm text-[#676767]">{monthView?.period_label}</p>
                  </div>
                </div>
                <Amount label="Employer Share" value={item.employer_share} />
                <Amount label="Employee Share" value={item.employee_share} />
                <Amount label="Total Challan" value={item.total} strong />
                <div><p className="text-sm text-[#676767]">Due Date</p><p className={item.status === 'Pending' ? 'font-semibold text-[#FFA000]' : 'font-semibold text-black'}>{item.due_date}</p></div>
                <div className="flex flex-wrap justify-start gap-3 lg:justify-end">
                  {item.status === 'Pending' ? (
                    <>
                      <StatusPill tone="orange">Pending</StatusPill>
                      <button type="button" onClick={() => void fileNow(item.id)} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-[#0658C2] px-4 text-sm font-semibold text-white hover:bg-blue-700"><Send className="h-4 w-4" /> File Now</button>
                    </>
                  ) : (
                    <>
                      <StatusPill tone="green"><CheckCircle2 className="mr-1 h-4 w-4" /> Filed</StatusPill>
                      <button type="button" onClick={() => setNotice(`${item.title} marked filed.`)} className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-[#D3D3D3] px-4 text-sm font-semibold text-[#676767] hover:bg-[#FAFAFA]"><Download className="h-4 w-4" /> Challan</button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}
          {obligations.length === 0 && <p className="text-sm text-[#676767]">No statutory obligations yet for this month.</p>}
        </div>
      </LoadState>

      <Card className="mt-5 overflow-hidden">
        <div className="flex items-center justify-between p-5">
          <h2 className="text-2xl font-semibold text-black">Filing History</h2>
          <div className="flex items-center gap-3">
            <RefreshIconButton loading={historyLoading} onClick={() => void loadHistory()} title="Refresh filing history" />
            <button type="button" onClick={() => setNotice('Filing history is available on this page.')} className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#0658C2]"><FileDown className="h-4 w-4" /> Export</button>
          </div>
        </div>
        <div className="p-5 pt-0">
          <LoadState loading={historyLoading} error={historyError} hasData={history !== null} onRetry={() => void loadHistory()} label="Loading filing history...">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-[#FAFAFA] text-[#676767]"><tr>{['Period', 'EPF', 'ESIC', 'Prof. Tax', 'TDS', 'Filed On', 'Status'].map((head) => <th key={head} className="px-8 py-3">{head}</th>)}</tr></thead>
                <tbody>
                  {(history ?? []).map((row) => (
                    <tr key={`${row.year}-${row.month}`} className="border-t border-[#D3D3D3]">
                      <td className="px-8 py-4">{row.period_label}</td>
                      <td>{money(row.epf)}</td>
                      <td>{money(row.esic)}</td>
                      <td>{money(row.professional_tax)}</td>
                      <td>{money(row.tds)}</td>
                      <td>{row.filed_on ?? '—'}</td>
                      <td><StatusPill tone={row.status === 'Filed' ? 'green' : 'orange'}>{row.status}</StatusPill></td>
                    </tr>
                  ))}
                  {(history ?? []).length === 0 && (
                    <tr><td colSpan={7} className="px-8 py-8 text-center text-[#676767]">No filing history yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </LoadState>
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
