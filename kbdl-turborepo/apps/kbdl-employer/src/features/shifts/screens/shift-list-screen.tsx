'use client';

import { DataPagination } from '@/components/ui/pagination';
import { useAuthStore } from '@/features/auth/stores/use-auth-store';
import { Eye } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useGetEmployerShifts } from '../hooks/use-shift-hook';

// ... other code will remain the same but I should provide the full replacement or I can use update for specific lines.
import { type ShiftStatus, useShiftStore } from '../stores/use-shift-store';

type EmployeeSummary = {
  name?: string | null;
  phone_no?: string | null;
  experience?: number | null;
  rating_avg?: number | string | null;
  skills?: string[] | null;
};

type RatingSummary = {
  score: number;
  flagged_issue?: boolean | null;
  created_at?: string | Date;
};

export type ShiftApplicationSummary = {
  id: string;
  shift_id: string;
  user_id: string;
  type?: string;
  status?: string;
  user?: EmployeeSummary;
  shift?: {
    created_by?: string;
    replacement_employee_id?: string | null;
    request_accepted?: boolean;
  };
};

export const getCancelledByName = (shift: EmployerShift): string | null => {
  return getShiftDisplayState(shift).cancellation?.cancelledBy || null;
};

// Tells us if the cancellation happened before or after employer approval
export const getCancelledContext = (shift: EmployerShift): 'before_approval' | 'after_approval' | null => {
  return getShiftDisplayState(shift).cancellation?.context || null;
};

export type EmployerShift = {
  id: string;
  shift_pay: unknown;
  shift_date: string;
  shift_start: string;
  shift_end: string;
  skill_required: string;
  status: string;
  created_by?: string;
  organization_approved?: boolean;
  no_show_reported?: boolean;
  request_accepted?: boolean;
  original_employee_id?: string;
  replacement_employee_id?: string | null;
  original_employee?: EmployeeSummary;
  replacement_employee?: EmployeeSummary | null;
  employer?: { company_name?: string | null };
  pendingApplications?: ShiftApplicationSummary[];
  shiftApplications?: ShiftApplicationSummary[];
  applications?: unknown[];
  requests?: unknown[];
  applicant_count?: number;
  ratings?: RatingSummary[];
};

const normalizeStatusForDisplay = (status?: string | null) => {
  const normalizedStatus = status?.toLowerCase();

  if (!normalizedStatus) return 'approved';
  if (normalizedStatus === 'cancelledwa') return 'cancelled';

  return normalizedStatus;
};
const statusStyles: Record<string, string> = {
  pending: 'border-orange-300 bg-orange-50 text-orange-600',
  open: 'border-blue-300 bg-blue-50 text-blue-600',
  approved: 'border-violet-300 bg-violet-50 text-violet-600',
  rejected: 'border-red-300 bg-red-50 text-red-600',
  completed: 'border-green-300 bg-green-50 text-green-600',
  absent: 'border-red-300 bg-red-50 text-red-600',
  cancelled: 'border-red-300 bg-red-50 text-red-600',
};

const ROWS_PER_PAGE = 10;

type ApprovalStatus = 'open' | 'pending' | 'approved' | 'rejected' | 'completed' | 'absent' | 'cancelled';
type CancellationContext = 'before_approval' | 'after_approval';
type ShiftStatusInput = {
  created_by?: string;
  organization_approved?: boolean;
  status: string;
  no_show_reported?: boolean;
  request_accepted?: boolean;
  replacement_employee_id?: string | null;
  replacement_employee?: EmployeeSummary | null;
  applicant_count?: number;
  pendingApplications?: unknown[];
  shiftApplications?: unknown[];
  applications?: unknown[];
  requests?: unknown[];
  original_employee?: EmployeeSummary;
};

export type ShiftDisplayState = {
  status: ApprovalStatus;
  cancellation?: {
    cancelledBy: string;
    context: CancellationContext;
    title: string;
    detail: string;
  };
};

const getEmployeeDisplayName = (employee?: EmployeeSummary | null, fallback = 'Worker') =>
  employee?.name || employee?.phone_no || fallback;

const getApplications = (shift: { shiftApplications?: unknown[] }) =>
  Array.isArray(shift.shiftApplications) ? (shift.shiftApplications as ShiftApplicationSummary[]) : [];

const getInvitedApplication = (shift: ShiftStatusInput) => {
  const applications = getApplications(shift);

  return (
    applications.find(
      (application) =>
        application.type?.toLowerCase() === 'invited' &&
        Boolean(shift.replacement_employee_id) &&
        application.user_id === shift.replacement_employee_id,
    ) || applications.find((application) => application.type?.toLowerCase() === 'invited')
  );
};
const getWithdrawnApplication = (shift: ShiftStatusInput) => {
  const applications = getApplications(shift);

  return (
    applications.find(
      (application) =>
        application.status?.toLowerCase() === 'withdrawn' &&
        Boolean(shift.replacement_employee_id) &&
        application.user_id === shift.replacement_employee_id,
    ) || applications.find((application) => application.status?.toLowerCase() === 'withdrawn')
  );
};

const isEmployerRejectedPrivateWorkerShift = (
  shift: ShiftStatusInput,
  shiftStatus: string,
  hasDirectAssignee: boolean,
) => {
  const invitedStatus = getInvitedApplication(shift)?.status?.toLowerCase();

  return (
    shift.created_by === 'user' &&
    hasDirectAssignee &&
    !shift.organization_approved &&
    shiftStatus === 'cancelled' &&
    Boolean(shift.request_accepted || invitedStatus === 'accepted') &&
    invitedStatus !== 'withdrawn'
  );
};

export const getShiftDisplayState = (shift: ShiftStatusInput): ShiftDisplayState => {
  
  const applicantCount = getApplicantCount(shift);
  const hasDirectAssignee = Boolean(shift.replacement_employee_id || shift.replacement_employee);
  const shiftStatus = normalizeStatusForDisplay(shift.status);
  const invitedApplication = getInvitedApplication(shift);
  const invitedStatus = invitedApplication?.status?.toLowerCase();
  const withdrawnApplication = getWithdrawnApplication(shift);
  const rejectedInvitedApplication =
    invitedStatus === 'rejected' ? invitedApplication : undefined;
  const approvedApplication = getApplications(shift).find(
    (application) => application.status?.toLowerCase() === 'approved',
  );
  // const isEmployerRejected =
  //   shift.created_by === 'user' &&
  //   hasDirectAssignee &&
  //   shiftStatus === 'rejected' &&
  //   shift.request_accepted === true;
  // const isCancelled =
  //   shiftStatus === 'cancelled' ||
  //   Boolean(withdrawnApplication) ||
  //   (shiftStatus === 'rejected' && shift.request_accepted === false);


    const isEmployerRejected =
  shift.created_by === 'user' &&
  hasDirectAssignee &&
  shiftStatus === 'rejected' &&
  invitedStatus === 'rejected';

const isCancelled =
  shiftStatus === 'cancelled' ||
  invitedStatus === 'withdrawn' ||
  (shiftStatus === 'rejected' && !isEmployerRejected);

  if (shift.no_show_reported) return { status: 'absent' };

  if (isEmployerRejected) {
    return {
      status: 'rejected',
    };
  }

  if (isCancelled) {
    const context = shift.organization_approved ? 'after_approval' : 'before_approval';
    // const cancelledByApplication =
    //   withdrawnApplication ||
    //   rejectedInvitedApplication ||
    //   approvedApplication;
    // const cancelledBy =
    //   cancelledByApplication?.user?.name ||
    //   cancelledByApplication?.user?.phone_no ||
    //   (shift.created_by === 'user' && !withdrawnApplication && !invitedApplication
    //     ? getEmployeeDisplayName(shift.original_employee)
    let cancelledBy: string;

    if (withdrawnApplication) {
      cancelledBy = getEmployeeDisplayName(shift.replacement_employee);
    } else if (shiftStatus === 'cancelled') {
      cancelledBy = getEmployeeDisplayName(shift.original_employee);
    } else {
      cancelledBy = getEmployeeDisplayName(shift.replacement_employee);
    }
    const timing =
      context === 'after_approval' ? 'after employer approval' : 'before employer approval';

    return {
      status: 'cancelled',
      cancellation: {
        cancelledBy,
        context,
        title:
          context === 'after_approval'
            ? 'Shift Cancelled After Approval'
            : 'Shift Cancelled Before Approval',
        detail: `${cancelledBy} cancelled this shift ${timing}.`,
      },
    };
  }

  if (shiftStatus === 'completed') return { status: 'completed' };
  if (shiftStatus === 'absent') return { status: 'absent' };

  if (shift.created_by === 'user' && hasDirectAssignee) {
    if (shift.organization_approved || shiftStatus === 'approved') return { status: 'approved' };
    if (shift.request_accepted || invitedStatus === 'accepted') return { status: 'pending' };
    return { status: 'open' };
  }

  if (shift.created_by === 'employer' && hasDirectAssignee) {
    if (shift.organization_approved || shift.request_accepted || shiftStatus === 'approved') {
      return { status: 'approved' };
    }

    return { status: 'open' };
  }

  if (shiftStatus === 'approved') return { status: 'approved' };
  if (shiftStatus === 'matched' || shiftStatus === 'pending') return { status: 'pending' };
  if (shiftStatus === 'open') return { status: applicantCount > 0 ? 'pending' : 'open' };

  return { status: 'approved' };
};

export const getApprovalStatus = (shift: ShiftStatusInput) => getShiftDisplayState(shift).status;

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatDate = (value: string) => {
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatTime = (value: string) => {
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const getCreator = (shift: EmployerShift) => (shift.created_by === 'user' ? 'worker' : 'employer');

const getEmployeeName = (employee?: EmployeeSummary | null, fallback = 'Open Shift') =>
  employee?.name || employee?.phone_no || fallback;

const getApplicantCount = (shift: {
  applicant_count?: number;
  pendingApplications?: unknown[];
  shiftApplications?: unknown[];
  applications?: unknown[];
  requests?: unknown[];
}) => {
  if (Array.isArray(shift.pendingApplications)) return shift.pendingApplications.length;
  if (Array.isArray(shift.shiftApplications)) {
    return shift.shiftApplications.filter((application) => {
      if (!application || typeof application !== 'object') return true;
      return (application as { status?: string }).status === 'pending';
    }).length;
  }
  if (typeof shift.applicant_count === 'number') return shift.applicant_count;
  if (Array.isArray(shift.applications)) return shift.applications.length;
  if (Array.isArray(shift.requests)) return shift.requests.length;
  return 0;
};

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium ${
      statusStyles[status] || 'border-gray-300 bg-gray-50 text-gray-600'
    }`}
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {titleCase(status)}
  </span>
);

interface ShiftListScreenProps {
  onSelectShift: (id: string) => void;
}

export const ShiftListScreen = ({ onSelectShift }: ShiftListScreenProps) => {
  const { filters } = useShiftStore();
  const [currentPage, setCurrentPage] = useState(1);
  const employer = useAuthStore((state) => state.employer);
  const { data: shifts = [], isLoading, error } = useGetEmployerShifts();
  const employerShifts = shifts as unknown as EmployerShift[];
  const companyName = employer?.company_name || 'Employer';

  const filteredShifts = employerShifts.filter((shift) => {
    const status = getApprovalStatus(shift);
    const creator = getCreator(shift);
    const workerName = getEmployeeName(shift.original_employee, '');
    const assigneeName = getEmployeeName(shift.replacement_employee, '');
    const searchText = [
      shift.skill_required,
      workerName,
      assigneeName,
      String(shift.shift_pay),
      status,
      creator,
    ]
      .join(' ')
      .toLowerCase();

    if (!filters.statuses.includes('all') && !filters.statuses.includes(status as ShiftStatus)) {
      return false;
    }

    if (filters.createdBy !== 'all' && filters.createdBy !== creator) {
      return false;
    }

    if (filters.search && !searchText.includes(filters.search.toLowerCase())) {
      return false;
    }

    if (filters.dateFrom || filters.dateTo) {
      const shiftDate = new Date(shift.shift_date);
      const fromDate = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`) : null;
      const toDate = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59`) : null;

      if (fromDate && shiftDate < fromDate) {
        return false;
      }

      if (toDate && shiftDate > toDate) {
        return false;
      }
    }

    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredShifts.length / ROWS_PER_PAGE));
  const pageShifts = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredShifts.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [currentPage, filteredShifts]);
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.createdBy, filters.dateFrom, filters.dateTo, filters.search, filters.statuses]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  if (isLoading) {
    return (
      <div className="rounded-b-xl border border-t-0 border-gray-200 bg-white py-16 text-center">
        <p className="text-sm text-gray-500">Loading shifts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-b-xl border border-t-0 border-red-200 bg-red-50 py-16 text-center">
        <p className="text-sm text-red-600">{error.message || 'Failed to load shifts'}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-b-xl border border-t-0 border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead className="bg-gray-50 text-xs font-medium text-gray-500">
            <tr>
              <th className="px-5 py-3">Shift Details</th>
              <th className="px-5 py-3">Created By</th>
              <th className="px-5 py-3">Worker/Assignee</th>
              <th className="px-5 py-3">Shift Date</th>
              <th className="px-5 py-3">Shift Time</th>
              <th className="px-5 py-3">Pay</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm">
            {pageShifts.map((shift) => {
              const status = getApprovalStatus(shift);
              const creator = getCreator(shift);
              const createdByName =
                creator === 'worker'
                  ? getEmployeeName(shift.original_employee, 'Worker')
                  : shift.employer?.company_name || companyName;
              const assignee = shift.replacement_employee;
              const assigneeName = getEmployeeName(assignee);
              const applicantCount = getApplicantCount(shift);
              const applicantLabel =
                applicantCount > 0
                  ? `${applicantCount} worker request${applicantCount === 1 ? '' : 's'}`
                  : 'Publicly posted';

              return (
                <tr key={shift.id} className="bg-white transition hover:bg-gray-50/80">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {/* <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                        <Calendar className="h-4 w-4" />
                      </span> */}
                      <div>
                        <p className="font-medium text-gray-900">
                          {titleCase(shift.skill_required || 'Shift')}
                        </p>
                        {/* <p className="text-xs text-gray-500">
                          {creator === 'worker' ? 'Worker requested swap' : 'Employer created'}
                        </p> */}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{titleCase(creator)}</p>
                    <p className="text-xs text-gray-500">{createdByName}</p>
                  </td>
                          
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {/* <span
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          assignee ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <UserRound className="h-4 w-4" />
                      </span> */}
                      <div>
                        <p className="font-medium text-gray-900">
                          {assignee ? assigneeName : 'Open Shift'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {assignee ? assignee.phone_no || 'Assigned worker' : applicantLabel}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{formatDate(shift.shift_date)}</p>
                    {/* <p className="text-xs text-gray-500">
                      {formatTime(shift.shift_start)} - {formatTime(shift.shift_end)}
                    </p> */}
                  </td>
                                    <td className="px-5 py-3">
                    {/* <p className="font-medium text-gray-900">{formatDate(shift.shift_date)}</p> */}
                    <p className="font-medium text-gray-900">
                      {formatTime(shift.shift_start)} - {formatTime(shift.shift_end)}
                    </p>
                  </td>

                  <td className="px-5 py-3 font-medium text-gray-900">
                    {String(shift.shift_pay)}Rs
                  </td>

                  <td className="px-5 py-3">
                    <StatusBadge status={status} />
                  </td>

                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => onSelectShift(shift.id)}
                      className="mx-auto flex h-9 w-9 items-center justify-center rounded-full text-blue-600 transition hover:bg-blue-50"
                      aria-label="View shift details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredShifts.length === 0 && (
        <div className="border-t border-gray-200 py-16 text-center">
          <p className="text-sm font-medium text-gray-900">No shifts found</p>
          <p className="mt-1 text-sm text-gray-500">Try changing the filters or search keyword.</p>
        </div>
      )}

      <DataPagination
        currentPage={currentPage}
        pageSize={ROWS_PER_PAGE}
        totalItems={filteredShifts.length}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};


