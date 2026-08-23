'use client';

import { fetchEmployeesList } from '@/features/employees/api';
import {
  createEmployeeLeave,
  fetchEmployeeLeave,
  type EmployeeLeaveOverview,
} from '@/features/employees/api-leave';
import type { EmployerEmployeeListItem } from '@repo/types';
import { Loader2, Search } from 'lucide-react';
import { useState } from 'react';
import { FieldLabel, PageShell, PrimaryButton } from './leave-ui';

export const ApplyLeaveScreen = () => {
  const [search, setSearch] = useState('');
  const [matches, setMatches] = useState<EmployerEmployeeListItem[]>([]);
  const [employee, setEmployee] = useState<EmployerEmployeeListItem | null>(null);
  const [leave, setLeave] = useState<EmployeeLeaveOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    leave_type_id: '',
    from: '',
    to: '',
    reason: '',
    apply_as: 'hr' as 'hr' | 'manager',
  });

  const handleSearch = async () => {
    if (!search.trim()) {
      setError('Enter a name, phone, or employee ID');
      return;
    }
    setLoading(true);
    setError(null);
    setEmployee(null);
    setLeave(null);
    try {
      const result = await fetchEmployeesList({
        roster: 'active',
        search: search.trim(),
        limit: 8,
      });
      setMatches(result.data);
      if (result.data.length === 0) {
        setError('No active employee matched that search');
      } else if (result.data.length === 1) {
        await selectEmployee(result.data[0]!);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const selectEmployee = async (item: EmployerEmployeeListItem) => {
    setLoading(true);
    setError(null);
    try {
      const overview = await fetchEmployeeLeave(item.employment_id);
      setEmployee(item);
      setLeave(overview);
      setForm({
        leave_type_id: overview.leave_types[0]?.id ?? '',
        from: '',
        to: '',
        reason: '',
        apply_as: 'hr',
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load employee leave');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!employee) return;
    if (!form.leave_type_id || !form.from || !form.to || !form.reason.trim()) {
      setError('Leave type, dates, and reason are required');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const overview = await createEmployeeLeave(employee.employment_id, {
        leave_type_id: form.leave_type_id,
        from: form.from,
        to: form.to,
        reason: form.reason.trim(),
        apply_as: form.apply_as,
      });
      setLeave(overview);
      setForm((current) => ({ ...current, from: '', to: '', reason: '' }));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to apply leave');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell title="Apply Leaves" crumb="Leaves Apply">
      <section>
        <h2 className="text-xl font-bold text-black">Find Employee</h2>
        {error && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <label className="block text-sm font-semibold text-black">
            Search by name, phone, or employee ID
            <div className="mt-2 flex flex-col gap-4 lg:flex-row">
              <div className="relative flex-1">
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') void handleSearch();
                  }}
                  placeholder="Enter name, phone, or EMP ID"
                  className="h-11 w-full rounded-lg border border-gray-200 px-4 pr-10 text-sm outline-none focus:border-[#0658C2] focus:ring-2 focus:ring-blue-100"
                />
                <Search className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              </div>
              <PrimaryButton onClick={() => void handleSearch()} className="lg:min-w-36">
                Search
              </PrimaryButton>
            </div>
          </label>
          {matches.length > 1 && !employee && (
            <ul className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-200">
              {matches.map((item) => (
                <li key={item.employment_id}>
                  <button
                    type="button"
                    onClick={() => void selectEmployee(item)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
                  >
                    <span className="font-medium text-black">{item.name}</span>
                    <span className="text-sm text-gray-500">
                      {item.employee_no ?? '—'} · {item.phone_no}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {employee && leave && (
        <>
          <section className="mt-7 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-black">{employee.name}</h2>
                <p className="text-sm text-gray-500">
                  {employee.employee_no ?? '—'} · {employee.designation} · {employee.phone_no}
                </p>
              </div>
              <div className="rounded-2xl bg-green-100 px-6 py-3 text-center">
                <p className="text-xs text-gray-600">Available leave</p>
                <p className="text-2xl font-semibold text-green-700">{leave.balance.available}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-gray-500">
              The manager (or HR) selects a leave type from this company catalog
              {leave.leave_types.length === 0
                ? '. Add types under Leave → Leave Types first.'
                : ' — not a free-text reason only.'}
            </p>
          </section>

          <section className="mt-7">
            <h2 className="text-xl font-bold text-black">Leave Details</h2>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <FieldLabel label="Leave Type" required>
                <select
                  value={form.leave_type_id}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, leave_type_id: event.target.value }))
                  }
                  className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm"
                >
                  {leave.leave_types.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </FieldLabel>
              <FieldLabel label="Apply as" required>
                <select
                  value={form.apply_as}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      apply_as: event.target.value as 'hr' | 'manager',
                    }))
                  }
                  className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm"
                >
                  <option value="hr">HR / Employer (auto-approve)</option>
                  <option value="manager" disabled={!leave.permissions.can_apply_as_manager}>
                    Reporting manager (pending HR)
                  </option>
                </select>
              </FieldLabel>
              <FieldLabel label="From" required>
                <input
                  type="date"
                  value={form.from}
                  onChange={(event) => setForm((current) => ({ ...current, from: event.target.value }))}
                  className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm"
                />
              </FieldLabel>
              <FieldLabel label="To" required>
                <input
                  type="date"
                  value={form.to}
                  onChange={(event) => setForm((current) => ({ ...current, to: event.target.value }))}
                  className="h-11 w-full rounded-lg border border-gray-200 px-3 text-sm"
                />
              </FieldLabel>
              <div className="lg:col-span-2">
                <FieldLabel label="Reason" required>
                  <textarea
                    value={form.reason}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, reason: event.target.value }))
                    }
                    rows={4}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </FieldLabel>
              </div>
            </div>
            <div className="mt-5">
              <PrimaryButton onClick={() => void handleSubmit()}>Apply Leave</PrimaryButton>
            </div>
          </section>
        </>
      )}

      {loading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Working…
        </div>
      )}
    </PageShell>
  );
};
