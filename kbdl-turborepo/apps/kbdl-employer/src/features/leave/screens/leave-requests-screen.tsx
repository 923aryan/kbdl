'use client';

import { DataPagination } from '@/components/ui/pagination';
import {
  fetchEmployeeLeave,
  updateLeaveRequest,
  type EmployeeLeaveOverview,
} from '@/features/employees/api-leave';
import { useEffect, useState } from 'react';
import {
  fetchCompanyLeaveRequests,
  type CompanyLeaveRequestView,
} from '../api';
import {
  PageShell,
  PrimaryButton,
  RequestSearch,
  StatusBadge,
  StatusSelect,
} from './leave-ui';

const ROWS_PER_PAGE = 10;

const LeaveReview = ({
  request,
  onBack,
  onUpdated,
}: {
  request: CompanyLeaveRequestView;
  onBack: () => void;
  onUpdated: () => void;
}) => {
  const [overview, setOverview] = useState<EmployeeLeaveOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchEmployeeLeave(request.employment_id)
      .then(setOverview)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load employee leave'),
      );
  }, [request.employment_id]);

  const decide = async (status: 'approved' | 'rejected') => {
    setBusy(true);
    setError(null);
    try {
      await updateLeaveRequest(request.id, status);
      onUpdated();
      onBack();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update leave');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell title="Review Leave Requests" crumb="Leaves Request > Review Leaves Request">
      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-black">{request.employee_name}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {request.employee_no ?? '—'} · {request.leave_type} · {request.from} to {request.to} (
          {request.days} days)
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Supervisor: {request.supervisor_name ?? '—'} · Applied: {request.applied_on} ·{' '}
          {request.applied_by_label}
        </p>
        <p className="mt-4 text-base text-gray-700">{request.reason}</p>
      </div>

      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-black">Company leave balances for this employee</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(overview?.type_balances ?? []).map((item) => (
            <div key={item.leave_type} className="rounded-lg bg-[#F8FAFF] p-4">
              <p className="text-sm font-semibold text-[#26324F]">{item.leave_type}</p>
              <p className="mt-2 text-sm text-gray-500">
                Used {item.used} / {item.earned}
              </p>
              <p className="text-lg font-bold text-green-700">{item.total_balance} remaining</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onBack}
          className="h-11 self-start rounded-lg px-2 text-sm font-semibold text-[#0658C2]"
        >
          Back to requests
        </button>
        {request.status === 'pending' && (
          <div className="flex gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={() => void decide('rejected')}
              className="h-11 rounded-lg border border-red-200 px-6 text-sm font-semibold text-red-600"
            >
              Reject
            </button>
            <PrimaryButton onClick={() => void decide('approved')} className="h-11 px-6 text-sm">
              Approve
            </PrimaryButton>
          </div>
        )}
      </div>
    </PageShell>
  );
};

export const LeaveRequestsScreen = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState<CompanyLeaveRequestView | null>(null);
  const [rows, setRows] = useState<CompanyLeaveRequestView[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = (page = currentPage) => {
    setLoading(true);
    setError(null);
    fetchCompanyLeaveRequests({
      search,
      status,
      from: from || undefined,
      to: to || undefined,
      page,
      limit: ROWS_PER_PAGE,
    })
      .then((result) => {
        setRows(result.data);
        setTotal(result.meta.total);
        setCurrentPage(result.meta.page);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load leave requests'),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (selected) {
    return (
      <LeaveReview
        request={selected}
        onBack={() => setSelected(null)}
        onUpdated={() => load(currentPage)}
      />
    );
  }

  return (
    <PageShell
      title="Leave Requests"
      crumb="Leaves Request"
      action={
        <PrimaryButton onClick={() => (window.location.href = '/leave/apply')} className="w-full sm:w-44">
          Apply Leave
        </PrimaryButton>
      }
    >
      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <RequestSearch
          value={search}
          onChange={(value) => {
            setSearch(value);
            setCurrentPage(1);
          }}
        />
        <div className="flex flex-col gap-4 sm:flex-row">
          <input
            type="date"
            value={from}
            onChange={(event) => setFrom(event.target.value)}
            className="h-11 rounded-lg border border-gray-200 px-3 text-sm"
          />
          <input
            type="date"
            value={to}
            onChange={(event) => setTo(event.target.value)}
            className="h-11 rounded-lg border border-gray-200 px-3 text-sm"
          />
          <StatusSelect
            value={status}
            onChange={(value) => {
              setStatus(value);
              setCurrentPage(1);
            }}
          />
          <PrimaryButton onClick={() => load(1)} className="h-11 px-5 text-sm">
            Search
          </PrimaryButton>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="bg-[#FAFAFA] text-sm font-semibold text-gray-500">
              <tr>
                <th className="px-5 py-3">Employee</th>
                <th className="px-5 py-3">Supervisor</th>
                <th className="px-5 py-3">Leave Type</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Applied On</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {rows.map((request) => (
                <tr key={request.id} className="transition hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-black">{request.employee_name}</p>
                    <p className="text-xs text-gray-500">ID: {request.employee_no ?? '—'}</p>
                  </td>
                  <td className="px-5 py-3 font-medium text-black">
                    {request.supervisor_name ?? '—'}
                  </td>
                  <td className="px-5 py-3 font-medium text-black">{request.leave_type}</td>
                  <td className="px-5 py-3 font-medium text-black">
                    {request.from} - {request.to}
                  </td>
                  <td className="px-5 py-3 font-medium text-black">{request.applied_on}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={request.status as 'pending' | 'approved' | 'rejected'} />
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => setSelected(request)}
                      className="text-sm font-semibold text-[#0658C2]"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && rows.length === 0 && (
          <div className="border-t border-gray-200 py-14 text-center">
            <p className="text-sm font-semibold text-gray-900">No leave requests found</p>
            <p className="mt-1 text-sm text-gray-500">Try another keyword or status.</p>
          </div>
        )}

        <DataPagination
          currentPage={currentPage}
          pageSize={ROWS_PER_PAGE}
          totalItems={total}
          onPageChange={(page) => load(page)}
          showSummary={false}
        />
      </div>
    </PageShell>
  );
};
