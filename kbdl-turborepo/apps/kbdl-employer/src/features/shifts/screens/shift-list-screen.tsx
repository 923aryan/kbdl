'use client';

import { Briefcase, Calendar, CheckCircle, Clock, MapPin, User, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useApproveShift, useGetEmployerShifts, useRejectShift } from '../hooks/use-shift-hook';
import { useShiftStore } from '../stores/use-shift-store';

type EmployerShift = {
  id: string;
  shift_pay: unknown;
  shift_date: string;
  shift_start: string;
  shift_end: string;
  skill_required: string;
  status: string;
  created_by?: string;
  organization_approved?: boolean;
  original_employee?: {
    name?: string | null;
    phone_no?: string | null;
  };
  replacement_employee?: {
    name?: string | null;
    phone_no?: string | null;
  } | null;
};

const getApprovalStatus = (shift: EmployerShift) => {
  if (shift.created_by === 'user' && !shift.organization_approved && shift.status === 'cancelled') {
    return 'rejected';
  }

  if (shift.created_by === 'user' && !shift.organization_approved) {
    return 'pending';
  }

  return 'approved';
};

const getStatusBadge = (status: string) => {
  const statusStyles: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    open: 'bg-green-100 text-green-800',
    matched: 'bg-blue-100 text-blue-800',
    approved: 'bg-indigo-100 text-indigo-800',
    rejected: 'bg-red-100 text-red-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-medium ${
        statusStyles[status] || 'bg-gray-100 text-gray-800'
      }`}
    >
      {status}
    </span>
  );
};

const formatDate = (value: string) => {
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatTime = (value: string) => {
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

interface ShiftListScreenProps {
  onSelectShift: (id: string) => void;
}

export const ShiftListScreen = ({ onSelectShift }: ShiftListScreenProps) => {
  const { filters } = useShiftStore();
  const { data: shifts = [], isLoading, error } = useGetEmployerShifts();
  const approveShift = useApproveShift();
  const rejectShift = useRejectShift();
  const employerShifts = shifts as unknown as EmployerShift[];

  const filteredShifts = employerShifts.filter((shift) => {
    const approvalStatus = getApprovalStatus(shift);
    const normalizedStatus = shift.status === 'matched' ? 'filled' : shift.status;
    const workerName = shift.original_employee?.name || shift.original_employee?.phone_no || '';

    if (
      filters.status !== 'all' &&
      approvalStatus !== filters.status &&
      normalizedStatus !== filters.status
    ) {
      return false;
    }

    if (
      filters.search &&
      !shift.skill_required.toLowerCase().includes(filters.search.toLowerCase()) &&
      !workerName.toLowerCase().includes(filters.search.toLowerCase())
    ) {
      return false;
    }

    return true;
  });

  const handleApprove = (shiftId: string) => {
    approveShift.mutate(shiftId, {
      onSuccess: () => toast.success('Shift approved'),
      onError: (mutationError) =>
        toast.error(getErrorMessage(mutationError, 'Failed to approve shift')),
    });
  };

  const handleReject = (shiftId: string) => {
    rejectShift.mutate(shiftId, {
      onSuccess: () => toast.success('Shift rejected'),
      onError: (mutationError) =>
        toast.error(getErrorMessage(mutationError, 'Failed to reject shift')),
    });
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
        <p className="text-gray-500">Loading shifts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 py-12 text-center">
        <p className="text-red-600">{error.message || 'Failed to load shifts'}</p>
      </div>
    );
  }

  if (filteredShifts.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
        <Calendar className="mx-auto mb-3 h-12 w-12 text-gray-300" />
        <p className="text-gray-500">No shifts found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {filteredShifts.map((shift) => {
        const workerName =
          shift.original_employee?.name || shift.original_employee?.phone_no || 'Assigned worker';
        const replacementName =
          shift.replacement_employee?.name || shift.replacement_employee?.phone_no;
        const approvalStatus = getApprovalStatus(shift);
        const isPending = approvalStatus === 'pending';
        const isMutating = approveShift.isPending || rejectShift.isPending;

        return (
          <div
            key={shift.id}
            onClick={() => onSelectShift(shift.id)}
            className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
          >
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-semibold uppercase text-gray-900">
                    {shift.skill_required}
                  </span>
                </div>
                <p className="mt-1 text-lg font-bold text-gray-900">
                  Rs. {String(shift.shift_pay)} / Shift
                </p>
              </div>
              {getStatusBadge(approvalStatus)}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <User className="h-4 w-4 text-gray-400" />
                <span>{workerName}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>{formatDate(shift.shift_date)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4 text-gray-400" />
                <span>
                  {formatTime(shift.shift_start)} - {formatTime(shift.shift_end)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="truncate">
                  {replacementName ? `Replacement: ${replacementName}` : 'Public replacement'}
                </span>
              </div>
            </div>

            {isPending && (
              <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleApprove(shift.id);
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approve
                </button>
                <button
                  type="button"
                  disabled={isMutating}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleReject(shift.id);
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <XCircle className="h-4 w-4" />
                  Reject
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
