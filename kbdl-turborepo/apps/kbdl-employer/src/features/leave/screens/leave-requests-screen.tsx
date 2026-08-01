'use client';

import { DataPagination } from '@/components/ui/pagination';
import { useMemo, useState } from 'react';
import { type LeaveRequest, useLeaveStore } from '../stores/use-leave-store';
import {
  AttachmentRow,
  ChangeRequestModal,
  DateRangeButton,
  LeaveBalanceCards,
  PageShell,
  PrimaryButton,
  RequestSearch,
  RequestSummaryCard,
  ReviewActions,
  RowAction,
  StatusBadge,
  StatusSelect,
  formatDate,
  formatDateRange,
} from './leave-ui';

const ROWS_PER_PAGE = 10;

const LeaveReview = ({
  request,
  onBack,
}: {
  request: LeaveRequest;
  onBack: () => void;
}) => {
  const [isChanging, setIsChanging] = useState(false);

  return (
    <PageShell title="Review Leave Requests" crumb="Leaves Request > Review Leaves Request">
      <RequestSummaryCard request={request} />

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-black">Reason</h2>
            <p className="mt-4 text-base text-gray-600">{request.reason}</p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-black">Attachments</h2>
            <div className="mt-5">
              <AttachmentRow request={request} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-bold text-black">Leave Balance -</h2>
            <span className="text-base text-gray-500">Abhinav Barwal</span>
          </div>
          <div className="mt-5">
            <LeaveBalanceCards />
          </div>
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
        <ReviewActions request={request} onChange={() => setIsChanging(true)} />
      </div>

      {isChanging && <ChangeRequestModal request={request} onClose={() => setIsChanging(false)} />}
    </PageShell>
  );
};

export const LeaveRequestsScreen = () => {
  const { filters, requests, setFilters } = useLeaveStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      const searchText = [
        request.employee.name,
        request.employee.employeeId,
        request.supervisor.name,
        request.leaveType,
        request.status,
      ]
        .join(' ')
        .toLowerCase();

      if (filters.status !== 'all' && request.status !== filters.status) {
        return false;
      }

      if (filters.search && !searchText.includes(filters.search.toLowerCase())) {
        return false;
      }

      return true;
    });
  }, [filters.search, filters.status, requests]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ROWS_PER_PAGE));
  const visibleRequests = filteredRequests.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE,
  );
  const selectedRequest = requests.find((request) => request.id === selectedId) || null;

  if (selectedRequest) {
    return <LeaveReview request={selectedRequest} onBack={() => setSelectedId(null)} />;
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <RequestSearch
          value={filters.search}
          onChange={(search) => {
            setCurrentPage(1);
            setFilters({ search });
          }}
        />
        <div className="flex flex-col gap-4 sm:flex-row">
          <DateRangeButton label={filters.dateRange} />
          <StatusSelect
            value={filters.status}
            onChange={(status) => {
              setCurrentPage(1);
              setFilters({ status });
            }}
          />
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
              {visibleRequests.map((request) => (
                <tr key={request.id} className="transition hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <p className="font-medium text-black">{request.employee.name}</p>
                    <p className="text-xs text-gray-500">ID: {request.employee.employeeId}</p>
                  </td>
                  <td className="px-5 py-3 font-medium text-black">{request.supervisor.name}</td>
                  <td className="px-5 py-3 font-medium text-black">{request.leaveType}</td>
                  <td className="px-5 py-3 font-medium text-black">{formatDateRange(request)}</td>
                  <td className="px-5 py-3 font-medium text-black">{formatDate(request.appliedOn)}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={request.status} />
                  </td>
                  <td className="px-5 py-3">
                    <RowAction onClick={() => setSelectedId(request.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRequests.length === 0 && (
          <div className="border-t border-gray-200 py-14 text-center">
            <p className="text-sm font-semibold text-gray-900">No leave requests found</p>
            <p className="mt-1 text-sm text-gray-500">Try another keyword or status.</p>
          </div>
        )}

        <DataPagination
          currentPage={Math.min(currentPage, totalPages)}
          pageSize={ROWS_PER_PAGE}
          totalItems={filteredRequests.length}
          onPageChange={setCurrentPage}
          showSummary={false}
        />
      </div>
    </PageShell>
  );
};
