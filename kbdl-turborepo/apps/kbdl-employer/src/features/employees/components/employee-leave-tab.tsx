'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Info, Loader2, Plus } from 'lucide-react';
import {
  createEmployeeLeave,
  fetchEmployeeLeave,
  updateLeaveRequest,
  type EmployeeLeaveOverview,
} from '../api-leave';
import { formatUiDate } from '@/features/attendance/api';

export function EmployeeLeaveTab({ employmentId }: { employmentId: string }) {
  const [rangeOpen, setRangeOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [appliedRange, setAppliedRange] = useState<{ from?: string; to?: string }>({});
  const [data, setData] = useState<EmployeeLeaveOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    leave_type_id: '',
    from: '',
    to: '',
    reason: '',
    apply_as: 'hr' as 'hr' | 'manager',
  });

  const load = (range?: { from?: string; to?: string }) => {
    setLoading(true);
    setError(null);
    fetchEmployeeLeave(employmentId, range)
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Failed to load leave'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(appliedRange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employmentId, appliedRange.from, appliedRange.to]);

  const handleDecide = async (id: string, status: 'approved' | 'rejected') => {
    setBusyId(id);
    try {
      setData(await updateLeaveRequest(id, status));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update leave');
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async () => {
    if (!form.leave_type_id || !form.from || !form.to || !form.reason.trim()) {
      setError('Leave type, dates, and reason are required');
      return;
    }
    setBusyId('create');
    setError(null);
    try {
      setData(
        await createEmployeeLeave(employmentId, {
          leave_type_id: form.leave_type_id,
          from: form.from,
          to: form.to,
          reason: form.reason.trim(),
          apply_as: form.apply_as,
        }),
      );
      setForm({
        leave_type_id: data?.leave_types[0]?.id ?? '',
        from: '',
        to: '',
        reason: '',
        apply_as: 'hr',
      });
      setFormOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create leave');
    } finally {
      setBusyId(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#676767]">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading leave…
      </div>
    );
  }

  const balance = data?.balance;
  const policy = data?.policy;

  return (
    <div className="space-y-5">
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>
      )}
      <p className="text-sm text-[#676767]">
        Leave types and policy are company-wide (same as departments). Manage them under Leave → Leave
        Types.
      </p>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-xl border border-[#D3D3D3] p-5 shadow-sm">
          <h3 className="text-2xl font-semibold">Leave Balance</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <BalanceCard
              title="Available Leave Balance"
              value={String(balance?.available ?? 0)}
              note={`As on ${balance?.as_on ?? '-'}`}
              color="green"
            />
            <BalanceCard
              title="Unused Leaves (This Year)"
              value={String(balance?.unused_this_year ?? 0)}
              note={balance?.year_label ?? ''}
              color="violet"
            />
            <BalanceCard
              title="Pending Leaves"
              value={String(balance?.pending ?? 0)}
              note="Approval Pending"
              color="orange"
            />
          </div>
        </div>
        <div className="rounded-xl border border-[#D3D3D3] p-5 shadow-sm">
          <h3 className="text-2xl font-semibold">Leave Policy</h3>
          <ul className="mt-4 space-y-3 text-sm text-[#676767]">
            {(policy?.lines ?? []).map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-[#0658C2]">▸</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-2xl font-semibold">Leave Request</h3>
        <p className="text-sm text-[#676767] sm:w-full">
          Employees cannot apply. Reporting manager apply needs HR approval. HR/employer apply is auto-approved.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setFormOpen((v) => !v);
              setForm((prev) => ({
                ...prev,
                leave_type_id: prev.leave_type_id || data?.leave_types[0]?.id || '',
              }));
            }}
            className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#0658C2] px-4 font-semibold text-white"
          >
            <Plus className="h-4 w-4" /> Add leave
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setRangeOpen((value) => !value)}
              className="inline-flex h-12 items-center justify-center gap-6 rounded-lg border border-gray-300 px-6 font-semibold"
            >
              Date Range {rangeOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </button>
            {rangeOpen && (
              <div className="absolute right-0 z-30 mt-2 grid w-[320px] gap-3 rounded-xl border border-[#D3D3D3] bg-white p-4 shadow-xl">
                <label className="grid gap-1 text-sm font-semibold">
                  From
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(event) => setDateRange((value) => ({ ...value, from: event.target.value }))}
                    className="h-11 rounded-lg border border-[#D3D3D3] px-3 outline-none focus:border-[#0658C2]"
                  />
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  To
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(event) => setDateRange((value) => ({ ...value, to: event.target.value }))}
                    className="h-11 rounded-lg border border-[#D3D3D3] px-3 outline-none focus:border-[#0658C2]"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setAppliedRange({
                      from: dateRange.from || undefined,
                      to: dateRange.to || undefined,
                    });
                    setRangeOpen(false);
                  }}
                  className="h-10 rounded-lg bg-[#0658C2] text-sm font-semibold text-white"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDateRange({ from: '', to: '' });
                    setAppliedRange({});
                    setRangeOpen(false);
                  }}
                  className="justify-self-end text-sm font-semibold text-[#0658C2]"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {formOpen && (
        <div className="grid gap-3 rounded-xl border border-[#D3D3D3] p-4 sm:grid-cols-4">
          <label className="grid gap-1 text-sm font-semibold">
            Type
            <select
              value={form.leave_type_id}
              onChange={(e) => setForm((f) => ({ ...f, leave_type_id: e.target.value }))}
              className="h-11 rounded-lg border border-[#D3D3D3] px-3"
            >
              {(data?.leave_types ?? []).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Applied by
            <select
              value={form.apply_as}
              onChange={(e) => setForm((f) => ({ ...f, apply_as: e.target.value as 'hr' | 'manager' }))}
              className="h-11 rounded-lg border border-[#D3D3D3] px-3"
            >
              <option value="hr">HR / Employer (auto-approve)</option>
              <option value="manager" disabled={!data?.permissions.can_apply_as_manager}>
                Reporting manager
                {data?.reporting_manager ? ` (${data.reporting_manager.name})` : ' — none assigned'}
              </option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            From
            <input
              type="date"
              value={form.from}
              onChange={(e) => setForm((f) => ({ ...f, from: e.target.value }))}
              className="h-11 rounded-lg border border-[#D3D3D3] px-3"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            To
            <input
              type="date"
              value={form.to}
              onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))}
              className="h-11 rounded-lg border border-[#D3D3D3] px-3"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold sm:col-span-4">
            Reason
            <div className="flex gap-2">
              <input
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                className="h-11 flex-1 rounded-lg border border-[#D3D3D3] px-3"
              />
              <button
                type="button"
                disabled={busyId === 'create'}
                onClick={() => void handleCreate()}
                className="h-11 rounded-lg bg-[#0658C2] px-4 font-semibold text-white disabled:opacity-50"
              >
                {form.apply_as === 'hr' ? 'Apply & approve' : 'Submit for HR'}
              </button>
            </div>
          </label>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[#D3D3D3] shadow-sm">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr className="bg-[#FAFAFA] text-[#676767]">
              {['Leave Type', 'From', 'To', 'Days', 'Reason', 'Applied by', 'Status', 'Applied On', ''].map((head) => (
                <th key={head || 'actions'} className="px-5 py-4">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.requests ?? []).length === 0 ? (
              <tr>
                <td colSpan={9} className="px-5 py-8 text-center text-[#676767]">
                  No leave requests in this range.
                </td>
              </tr>
            ) : (
              (data?.requests ?? []).map((row) => (
                <tr key={row.id} className="border-b border-[#D3D3D3] text-[#676767]">
                  <td className="px-5 py-4">{row.leave_type}</td>
                  <td className="px-5 py-4">{formatUiDate(row.from)}</td>
                  <td className="px-5 py-4">{formatUiDate(row.to)}</td>
                  <td className="px-5 py-4">{row.days}</td>
                  <td className="px-5 py-4">{row.reason}</td>
                  <td className="px-5 py-4">{row.applied_by_label}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-md border px-4 py-1.5 text-xs font-semibold ${
                        row.status === 'approved'
                          ? 'border-[#4CAF50] bg-[#E5FFEB] text-[#4CAF50]'
                          : row.status === 'rejected'
                            ? 'border-red-500 bg-[#FEE9E5] text-red-600'
                            : 'border-[#FFA000] bg-[#FFF4E3] text-[#EA580C]'
                      }`}
                    >
                      {row.status_label}
                    </span>
                  </td>
                  <td className="px-5 py-4">{row.applied_on}</td>
                  <td className="px-5 py-4">
                    {row.status === 'pending' && data?.permissions.can_approve && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => void handleDecide(row.id, 'approved')}
                          className="text-xs font-semibold text-[#4CAF50]"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => void handleDecide(row.id, 'rejected')}
                          className="text-xs font-semibold text-red-600"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h3 className="text-2xl font-semibold">Leave Type Balance</h3>
      <div className="overflow-x-auto rounded-xl border border-[#D3D3D3] shadow-sm">
        <table className="w-full min-w-[850px] text-left text-sm">
          <thead>
            <tr className="bg-[#FAFAFA] text-[#676767]">
              {[
                'Leave Type',
                'Earned This year',
                'Used',
                'Pending',
                'Current Year Balance',
                'Carry Forward',
                'Total Balance',
              ].map((head) => (
                <th key={head} className="px-5 py-4">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(data?.type_balances ?? []).map((row) => (
              <tr key={row.leave_type} className="border-b border-[#D3D3D3]">
                <td className="px-5 py-4">{row.leave_type}</td>
                <td className="px-5 py-4">{row.earned} Days</td>
                <td className="px-5 py-4">{row.used} Days</td>
                <td className="px-5 py-4">{row.pending} Days</td>
                <td className="px-5 py-4">{row.current_year_balance} Days</td>
                <td className="px-5 py-4">{row.carry_forward} Days</td>
                <td className="px-5 py-4">{row.total_balance} Days</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-start gap-3 rounded-xl bg-[#DBEAFF] p-4 text-blue-950">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#0658C2]" />
        <p className="text-sm">
          <strong>Note:</strong> Casual, Sick, and Earned leave only. Employees cannot apply.
          Reporting-manager requests stay pending until HR/employer approve or reject.
          HR/employer apply is auto-approved. Up to {policy?.max_carry_forward ?? 12} unused leaves can be carried forward.
        </p>
      </div>
    </div>
  );
}

function BalanceCard({
  title,
  value,
  note,
  color,
}: {
  title: string;
  value: string;
  note: string;
  color: 'green' | 'violet' | 'orange';
}) {
  const border =
    color === 'green'
      ? 'border-[#4CAF50]'
      : color === 'violet'
        ? 'border-[#8B5CF6]'
        : 'border-[#EA580C]';
  return (
    <div className={`rounded-xl border ${border} p-4`}>
      <p className="text-sm text-[#676767]">{title}</p>
      <p className="mt-2 text-3xl font-medium">{value}</p>
      <p className="text-xs text-[#676767]">Days</p>
      <p className="mt-4 text-xs text-[#676767]">{note}</p>
    </div>
  );
}
