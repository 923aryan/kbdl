'use client';

import { useState } from 'react';
import {
  BriefcaseBusiness,
  Calendar,
  Clock,
  IndianRupee,
  Loader2,
  Star,
  UserRound,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/features/auth/stores/use-auth-store';
import { getApprovalStatus, type EmployerShift } from './shift-list-screen';
import { useApproveShift, useGetEmployerShifts, useRejectShift } from '../hooks/use-shift-hook';

interface ShiftDetailsModalProps {
  shiftId: string | null;
  onClose: () => void;
}

const titleCase = (value: string) =>
  value
    .toLowerCase()
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

const getEmployeeName = (employee?: { name?: string | null; phone_no?: string | null } | null) =>
  employee?.name || employee?.phone_no || 'Not assigned';

const getApplicantCount = (shift: EmployerShift) => {
  if (typeof shift.applicant_count === 'number') return shift.applicant_count;
  if (Array.isArray(shift.applications)) return shift.applications.length;
  if (Array.isArray(shift.requests)) return shift.requests.length;
  return shift.replacement_employee ? 1 : 0;
};

const ShiftSummary = ({ shift, companyName }: { shift: EmployerShift; companyName: string }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4">
    <div className="flex items-center gap-3 border-b border-gray-200 pb-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-600">
        <BriefcaseBusiness className="h-4 w-4" />
      </span>
      <div>
        <p className="text-sm font-semibold text-gray-900">
          {titleCase(shift.skill_required || 'Shift')}
        </p>
        <p className="text-xs text-gray-500">Building Maintenance</p>
      </div>
    </div>

    <div className="space-y-3 py-4 text-sm">
      <div className="flex gap-3">
        <Calendar className="h-4 w-4 text-gray-500" />
        <p className="font-medium text-gray-900">{formatDate(shift.shift_date)}</p>
      </div>
      <div className="flex gap-3">
        <Clock className="h-4 w-4 text-gray-500" />
        <p className="font-medium text-gray-900">
          {formatTime(shift.shift_start)} - {formatTime(shift.shift_end)}
        </p>
      </div>
      <div className="flex gap-3">
        <IndianRupee className="h-4 w-4 text-gray-500" />
        <p className="font-medium text-gray-900">{String(shift.shift_pay)} / Pay Per Shift</p>
      </div>
    </div>

    <div className="border-t border-gray-200 pt-4">
      <p className="text-xs text-gray-500">Created By</p>
      <p className="mt-1 text-sm font-semibold text-gray-900">
        {shift.created_by === 'user' ? 'Worker' : companyName}
      </p>
    </div>

    <div className="mt-4 border-t border-gray-200 pt-4">
      <p className="text-xs text-gray-500">Assigned Worker</p>
      <div className="mt-2 flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-700">
          <UserRound className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {getEmployeeName(shift.replacement_employee)}
          </p>
          <p className="text-xs text-gray-500">{shift.replacement_employee?.phone_no || '-'}</p>
        </div>
      </div>
    </div>
  </div>
);

const RatingStars = ({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
}) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        disabled={readonly}
        onClick={() => onChange?.(star)}
        className="rounded text-lime-400 disabled:cursor-default"
        aria-label={`Set rating ${star}`}
      >
        <Star className={`h-5 w-5 ${value >= star ? 'fill-current' : 'fill-none'}`} />
      </button>
    ))}
  </div>
);

export const ShiftDetailsModal = ({ shiftId, onClose }: ShiftDetailsModalProps) => {
  const [attendance, setAttendance] = useState<'present' | 'absent' | 'late'>('present');
  const [rating, setRating] = useState(4);
  const { data: shifts = [] } = useGetEmployerShifts();
  const employer = useAuthStore((state) => state.employer);
  const approveShift = useApproveShift();
  const rejectShift = useRejectShift();
  const shift = (shifts as unknown as EmployerShift[]).find((item) => item.id === shiftId);

  if (!shiftId) return null;

  if (!shift) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 text-center text-sm text-gray-500">
          Shift details unavailable.
        </div>
      </div>
    );
  }

  const status = getApprovalStatus(shift);
  const companyName = shift.employer?.company_name || employer?.company_name || 'Employer';
  const assigneeName = getEmployeeName(shift.replacement_employee);
  const applicantCount = getApplicantCount(shift);
  const isMutating = approveShift.isPending || rejectShift.isPending;

  const approveSelectedShift = () => {
    approveShift.mutate(shift.id, {
      onSuccess: () => {
        toast.success('Shift approved');
        onClose();
      },
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : 'Failed to approve shift'),
    });
  };

  const rejectSelectedShift = () => {
    rejectShift.mutate(shift.id, {
      onSuccess: () => toast.success('Shift request rejected'),
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : 'Failed to reject shift'),
    });
  };

  const submitCompletion = () => {
    toast.success('Completion review captured');
    onClose();
  };

  const modalTitle =
    status === 'pending'
      ? 'Review Applicants'
      : status === 'approved'
        ? 'Mark Shift Completion'
        : status === 'completed'
          ? 'Shift Completion Review'
          : 'Shift Details';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center bg-black/40 p-4">
        <div className="relative w-full max-w-4xl rounded-xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">{modalTitle}</h2>
              <span className="rounded-md border border-green-300 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-600">
                {status === 'pending'
                  ? `${applicantCount} Applicant${applicantCount === 1 ? '' : 's'}`
                  : titleCase(status)}
              </span>
            </div>
            <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
              <X className="h-5 w-5 text-gray-900" />
            </button>
          </div>

          {status === 'pending' && (
            <div className="p-5">
              <div className="mb-4 grid grid-cols-4 gap-4 rounded-lg border border-gray-200 p-3 text-sm">
                <div className="col-span-2 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                    <BriefcaseBusiness className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {titleCase(shift.skill_required || 'Shift')}
                    </p>
                    <p className="text-xs text-gray-500">Building Maintenance</p>
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {formatTime(shift.shift_start)} - {formatTime(shift.shift_end)}
                  </p>
                  <p className="text-xs text-gray-500">{formatDate(shift.shift_date)}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Rs{String(shift.shift_pay)}</p>
                  <p className="text-xs text-gray-500">Pay Per Shift</p>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                <div className="grid grid-cols-[1.5fr_1fr_0.7fr_1.2fr] items-center gap-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                      <UserRound className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{assigneeName}</p>
                      <p className="text-xs text-gray-500">
                        {shift.replacement_employee?.phone_no}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-900">2+ Experience</p>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 fill-lime-400 text-lime-400" />
                    <span className="text-sm text-gray-900">4.2</span>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={rejectSelectedShift}
                      className="h-9 w-28 rounded-md border border-blue-600 text-sm font-medium text-gray-900 disabled:opacity-60"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      disabled={isMutating}
                      onClick={approveSelectedShift}
                      className="flex h-9 w-28 items-center justify-center gap-2 rounded-md bg-blue-600 text-sm font-medium text-white disabled:opacity-60"
                    >
                      {approveShift.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(status === 'approved' || status === 'completed') && (
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-[0.9fr_1.4fr]">
              <ShiftSummary shift={shift} companyName={companyName} />

              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <h3 className="text-center text-sm font-semibold text-gray-900">
                  Attendance & Performance
                </h3>

                {status === 'approved' ? (
                  <>
                    <div className="mt-5">
                      <p className="mb-2 text-sm text-gray-700">Attendance Status *</p>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: 'Present', value: 'present' as const },
                          { label: 'Absent', value: 'absent' as const },
                          { label: 'Late', value: 'late' as const },
                        ].map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setAttendance(option.value)}
                            className={`h-10 rounded-md border text-sm ${
                              attendance === option.value
                                ? 'border-green-500 bg-green-50 text-green-600'
                                : 'border-gray-200 text-gray-600'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <input
                        type="time"
                        className="h-11 rounded-lg border border-gray-200 px-3 text-sm"
                      />
                      <input
                        type="time"
                        className="h-11 rounded-lg border border-gray-200 px-3 text-sm"
                      />
                    </div>

                    <div className="mt-5">
                      <p className="mb-2 text-sm text-gray-700">Work Quality Rating *</p>
                      <div className="flex items-center gap-3">
                        <RatingStars value={rating} onChange={setRating} />
                        <span className="text-sm text-gray-900">{rating}.0</span>
                        <span className="rounded-md border border-green-400 bg-green-50 px-2 py-0.5 text-xs text-green-600">
                          Excellent
                        </span>
                      </div>
                    </div>

                    <textarea
                      rows={4}
                      placeholder="Employer Remarks (optional)"
                      className="mt-5 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
                    />

                    <div className="mt-5 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="h-10 w-32 rounded-md border border-blue-600 text-sm font-medium text-gray-900"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={submitCompletion}
                        className="h-10 w-32 rounded-md bg-blue-600 text-sm font-medium text-white"
                      >
                        Submit
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-500">Attendance Status</span>
                      <span className="rounded-md border border-green-400 bg-green-50 px-2 py-0.5 text-xs text-green-600">
                        Present
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-500">Check-in Time</span>
                      <span className="font-medium text-gray-900">09:55 AM</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-500">Check-out Time</span>
                      <span className="font-medium text-gray-900">05:15 PM</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-500">Work Quality Rating</span>
                      <span className="flex items-center gap-3">
                        <RatingStars value={4} readonly />
                        <span className="font-medium text-gray-900">4.0</span>
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500">Employer Remarks</p>
                      <p className="mt-2 font-medium text-gray-900">
                        Completed all the tasks on time with great quality.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {(status === 'open' || status === 'cancelled' || status === 'rejected') && (
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-[0.9fr_1.4fr]">
              <ShiftSummary shift={shift} companyName={companyName} />
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-semibold text-gray-900">
                  {status === 'open' ? 'Open Shift' : 'Shift Review'}
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  {status === 'open'
                    ? 'No worker has been approved yet. Applicants will appear here after workers apply.'
                    : 'This shift is no longer active. You can review the shift details only.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
