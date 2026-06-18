'use client';

import { useEffect, useState } from 'react';
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
import {
  getApprovalStatus,
  type EmployerShift,
  type ShiftApplicationSummary,
} from './shift-list-screen';
import {
  useApproveShift,
  useCompleteShift,
  useGetEmployerShifts,
  useGetPublicUserProfile,
  useRateShift,
  useRejectShift,
  useReportShiftNoShow,
} from '../hooks/use-shift-hook';

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

const getEmployeeName = (
  employee?: { name?: string | null; phone_no?: string | null } | null,
  fallback = 'Not assigned',
) => employee?.name || employee?.phone_no || fallback;

const completionTimeStorageKey = (shiftId: string) => `kbdl-shift-completion-times:${shiftId}`;

type CompletionTimes = {
  checkInTime: string;
  checkOutTime: string;
};

const readCompletionTimes = (shiftId: string): CompletionTimes => {
  if (typeof window === 'undefined') return { checkInTime: '', checkOutTime: '' };

  try {
    const stored = window.localStorage.getItem(completionTimeStorageKey(shiftId));
    if (!stored) return { checkInTime: '', checkOutTime: '' };
    const parsed = JSON.parse(stored) as Partial<CompletionTimes>;
    return {
      checkInTime: parsed.checkInTime || '',
      checkOutTime: parsed.checkOutTime || '',
    };
  } catch {
    return { checkInTime: '', checkOutTime: '' };
  }
};

const saveCompletionTimes = (shiftId: string, times: CompletionTimes) => {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(completionTimeStorageKey(shiftId), JSON.stringify(times));
};

const formatOptionalTime = (value: string) => {
  if (!value) return '-';
  const [hourValue, minuteValue] = value.split(':').map(Number);
  if (Number.isNaN(hourValue) || Number.isNaN(minuteValue)) return '-';

  return new Date(2000, 0, 1, hourValue, minuteValue).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

const formatExperience = (value?: number | null) => {
  if (typeof value !== 'number') return '-';
  if (value <= 0) return 'Fresher';
  return `${value}+ Experience`;
};

const formatAverageRating = (value?: number | string | null) => {
  if (value === null || value === undefined || value === '') return '-';
  const numericValue = Number(value);
  if (Number.isNaN(numericValue) || numericValue <= 0) return '-';
  return numericValue.toFixed(1);
};

const getApplicantCount = (shift: EmployerShift) => {
  if (typeof shift.applicant_count === 'number') return shift.applicant_count;
  if (Array.isArray(shift.pendingApplications)) return shift.pendingApplications.length;
  if (Array.isArray(shift.shiftApplications)) {
    return shift.shiftApplications.filter((application) => application.status !== 'rejected')
      .length;
  }
  if (Array.isArray(shift.applications)) return shift.applications.length;
  if (Array.isArray(shift.requests)) return shift.requests.length;
  return shift.replacement_employee ? 1 : 0;
};

const isWorkerCreatedPrivateShift = (shift: EmployerShift) =>
  shift.created_by === 'user' && Boolean(shift.replacement_employee_id || shift.replacement_employee);

const getPrivateInviteApplication = (shift: EmployerShift) =>
  Array.isArray(shift.shiftApplications)
    ? shift.shiftApplications.find(
        (application) =>
          application.type?.toLowerCase() === 'invited' &&
          (!shift.replacement_employee_id || application.user_id === shift.replacement_employee_id),
      )
    : undefined;

const getPendingApplications = (shift: EmployerShift): ShiftApplicationSummary[] => {
  if (isWorkerCreatedPrivateShift(shift) && !shift.request_accepted) {
    return [];
  }

  if (Array.isArray(shift.pendingApplications) && shift.pendingApplications.length > 0) {
    return shift.pendingApplications;
  }

  if (Array.isArray(shift.shiftApplications)) {
    return shift.shiftApplications.filter((application) => application.status === 'pending');
  }

  if (shift.replacement_employee_id || shift.replacement_employee) {
    return [
      {
        id: '',
        shift_id: shift.id,
        user_id: shift.replacement_employee_id || '',
        status: 'pending',
        user: shift.replacement_employee || undefined,
      },
    ];
  }

  return [];
};

// const getCancellationMessage = (shift: EmployerShift, displayStatus: string) => {
//   if (displayStatus === 'rejected') {
//     return 'This private shift request was rejected by the employer.';
//   }

//   if (displayStatus !== 'cancelled') {
//     return 'This shift is no longer active. You can review the shift details only.';
//   }

//   // Worker-created private shift
//   if (isWorkerCreatedPrivateShift(shift)) {
//     const privateInvite = getPrivateInviteApplication(shift);
//     const assignedWorker = getEmployeeName(shift.replacement_employee, 'assigned worker');
//     const creator = getEmployeeName(shift.original_employee, 'worker');
//     const approvalTiming = shift.organization_approved ? 'after approval' : 'before employer approval';

//     const privateInviteStatus = privateInvite?.status?.toLowerCase();
//     const assignedWorkerCancelled =
//       privateInviteStatus === 'withdrawn' ||
//       (privateInviteStatus === 'rejected' && shift.status !== 'cancelled' && !shift.request_accepted);

//     if (assignedWorkerCancelled) {
//       return `This shift was cancelled by ${assignedWorker} ${approvalTiming}.`;
//     }

//     return `This shift was cancelled by ${creator} ${approvalTiming}.`;
//   }

//   // Employer-created private shift
//   if (shift.created_by === 'employer' && shift.replacement_employee_id) {
//     const privateInvite = getPrivateInviteApplication(shift);
//     const assignedWorker = getEmployeeName(shift.replacement_employee, 'assigned worker');

//     if (privateInvite?.status?.toLowerCase() === 'withdrawn') {
//       const approvalTiming = shift.organization_approved ? 'after approval' : 'before employer approval';
//       return `This shift was cancelled by ${assignedWorker} ${approvalTiming}.`;
//     }

//     return `This private shift was cancelled by the employer.`;
//   }

//   // Worker cancelled their own shift
//   if (shift.created_by === 'user') {
//     const creator = getEmployeeName(shift.original_employee, 'worker');
//     const approvalTiming = shift.organization_approved ? 'after approval' : 'before employer approval';

//     return `This shift was cancelled by ${creator} ${approvalTiming}.`;
//   }

//   return 'This shift is no longer active. You can review the shift details only.';
// };
const getCancellationMessage = (shift: EmployerShift): { title: string; detail: string } => {
  const originalWorkerName = getEmployeeName(shift.original_employee, 'the shift creator');
  const assignedWorkerName = getEmployeeName(shift.replacement_employee, 'the assigned worker');
  const shiftStatus = shift.status.toLowerCase();

  // ── Helper: find who withdrew from shiftApplications ─────────────────────
  const withdrawnApp = shift.shiftApplications?.find(
    (app) => app.status === 'withdrawn' && app.type === 'invited',
  );
  const withdrawnWorkerName =
    withdrawnApp?.user?.name || withdrawnApp?.user?.phone_no || assignedWorkerName;

  const rejectedApp = shift.shiftApplications?.find(
    (app) => app.status === 'rejected' && app.type === 'invited',
  );
  const rejectedWorkerName =
    rejectedApp?.user?.name || rejectedApp?.user?.phone_no || assignedWorkerName;

  // ── Worker-created private shift ──────────────────────────────────────────
  if (shift.created_by === 'user') {

    // shift.status is 'cancelled' or 'rejected' from backend
    // After employer approved → worker withdrew post-approval
    if (shift.organization_approved) {
      return {
        title: 'Shift Cancelled After Approval',
        detail: `${withdrawnWorkerName} cancelled this shift after it was approved by employer.`,
      };
    }

    // Before employer approved — invited worker rejected the request
    if (rejectedApp) {
      return {
        title: 'Shift Request Declined',
        detail: `${rejectedWorkerName} declined the shift swap request before employer approval.`,
      };
    }

    // Before employer approved — invited worker withdrew after accepting
    if (withdrawnApp) {
      return {
        title: 'Shift Cancelled Before Approval',
        detail: `${withdrawnWorkerName} withdrew from this shift after accepting, before employer approval.`,
      };
    }

    // Original worker (creator) cancelled — no invited app activity
    return {
      title: 'Shift Cancelled by Creator',
      detail: `${originalWorkerName} cancelled this shift swap request before employer approval.`,
    };
  }

  // ── Employer-created private shift ────────────────────────────────────────
  // if (shift.created_by === 'employer' && shift.replacement_employee_id) {
  //   if (shift.request_accepted) {
  //     return {
  //       title: 'Shift Cancelled After Acceptance',
  //       detail: `${assignedWorkerName} withdrew from this shift after accepting the request.`,
  //     };
  //   }
  //   return {
  //     title: 'Shift Request Declined',
  //     detail: `${assignedWorkerName} declined this shift request.`,
  //   };
  // }

  // ── Fallback ──────────────────────────────────────────────────────────────
  if (
    shift.created_by === 'employer' &&
    shift.replacement_employee_id &&
    ['cancelled', 'cancelledwa', 'rejected'].includes(shiftStatus)
  ) {
    return {
      title: 'Shift Request Rejected',
      detail: 'This shift request was cancelled by the employer.',
    };
  }

  return {
    title: 'Shift No Longer Active',
    detail: 'This shift is no longer active. You can review the shift details only.',
  };
};

const getLatestRating = (shift: EmployerShift) =>
  Array.isArray(shift.ratings) && shift.ratings.length > 0 ? shift.ratings[0] : null;

const getRatingLabel = (value: number) => {
  if (value >= 5) return 'Excellent';
  if (value >= 4) return 'Great';
  if (value >= 3) return 'Good';
  if (value >= 2) return 'Needs Work';
  return 'Poor';
};
const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'pending':
      return 'border-amber-300 bg-amber-50 text-amber-600';

    case 'open':
      return 'border-blue-300 bg-blue-50 text-blue-600';

    case 'approved':
      return 'border-blue-300 bg-blue-50 text-blue-600';

    case 'completed':
      return 'border-green-300 bg-green-50 text-green-600';

    case 'absent':
      return 'border-red-300 bg-red-50 text-red-600';

    case 'rejected':
    case 'cancelled':
      return 'border-gray-300 bg-gray-50 text-gray-600';

    default:
      return 'border-gray-300 bg-gray-50 text-gray-600';
  }
};

const ratingBadgeStyles: Record<string, string> = {
  Excellent: 'border-green-400 bg-green-50 text-green-700',
  Great: 'border-blue-400 bg-blue-50 text-blue-700',
  Good: 'border-amber-400 bg-amber-50 text-amber-700',
  'Needs Work': 'border-orange-400 bg-orange-50 text-orange-700',
  Poor: 'border-red-400 bg-red-50 text-red-700',
};

const getRatingBadgeClass = (value: number) =>
  ratingBadgeStyles[getRatingLabel(value)] || 'border-gray-300 bg-gray-50 text-gray-700';

const getAttendanceBadgeClass = (status: string) =>
  status === 'absent'
    ? 'border-red-400 bg-red-50 text-red-700'
    : 'border-green-400 bg-green-50 text-green-700';

const ShiftSummary = ({
  shift,
  companyName,
  showAssignedWorker = true,
}: {
  shift: EmployerShift;
  companyName: string;
  showAssignedWorker?: boolean;
}) => (
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

    {showAssignedWorker && (
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
    )}
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
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const { data: shifts = [] } = useGetEmployerShifts();
  const employer = useAuthStore((state) => state.employer);
  const approveShift = useApproveShift();
  const rejectShift = useRejectShift();
  const completeShift = useCompleteShift();
  const rateShift = useRateShift();
  const reportNoShow = useReportShiftNoShow();
  const shift = (shifts as unknown as EmployerShift[]).find((item) => item.id === shiftId);
  const { data: applicantProfile } = useGetPublicUserProfile(shift?.replacement_employee_id);

  useEffect(() => {
    if (!shiftId) {
      setCheckInTime('');
      setCheckOutTime('');
      return;
    }

    const savedTimes = readCompletionTimes(shiftId);
    setCheckInTime(savedTimes.checkInTime);
    setCheckOutTime(savedTimes.checkOutTime);
  }, [shiftId]);

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
  const pendingApplications = getPendingApplications(shift);
  const latestRating = getLatestRating(shift);
  const completedRating = latestRating?.score ?? rating;
  const applicantDetails = {
    ...shift.replacement_employee,
    ...(applicantProfile as {
      experience?: number | null;
      rating_avg?: number | string | null;
      phone_no?: string | null;
    } | undefined),
  };
  const applicantExperience = formatExperience(applicantDetails.experience);
  const applicantRating = formatAverageRating(applicantDetails.rating_avg);
  const reviewCheckInTime = formatOptionalTime(checkInTime);
  const reviewCheckOutTime = formatOptionalTime(checkOutTime);
  const isMutating =
    approveShift.isPending ||
    rejectShift.isPending ||
    completeShift.isPending ||
    rateShift.isPending ||
    reportNoShow.isPending;

  const approveSelectedShift = (shiftApplicationId: string) => {
    if (!shiftApplicationId) {
      toast.error('Pending request id is missing. Please refresh the shift list.');
      return;
    }

    approveShift.mutate(shiftApplicationId, {
      onSuccess: () => {
        toast.success('Shift approved');
        onClose();
      },
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : 'Failed to approve shift'),
    });
  };

  const rejectSelectedShift = (shiftApplicationId: string) => {
    if (!shiftApplicationId) {
      toast.error('Pending request id is missing. Please refresh the shift list.');
      return;
    }

    rejectShift.mutate(shiftApplicationId, {
      onSuccess: () => {
        toast.success('Shift request rejected');
        onClose();
      },
      onError: (error) =>
        toast.error(error instanceof Error ? error.message : 'Failed to reject shift'),
    });
  };

  const submitCompletion = async () => {
    if (!shift.replacement_employee_id) {
      toast.error('No worker is assigned to this shift');
      return;
    }

    try {
      saveCompletionTimes(shift.id, { checkInTime, checkOutTime });

      await rateShift.mutateAsync({
        shift_id: shift.id,
        user_id: shift.replacement_employee_id,
        score: rating,
        flagged_issue: attendance === 'absent',
      });
      if (attendance === 'absent') {
        await reportNoShow.mutateAsync(shift.id);
        toast.success('Worker marked absent');
      } else {
        await completeShift.mutateAsync(shift.id);
        toast.success(
          attendance === 'late' ? 'Shift marked completed as late' : 'Shift marked completed',
        );
      }
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to complete shift');
    }
  };

  const modalTitle =
    status === 'pending'
      ? 'Review Applicants'
      : status === 'approved'
        ? 'Mark Shift Completion'
        : status === 'completed' || status === 'absent'
          ? 'Shift Completion Review'
          : 'Shift Details';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center bg-black/40 p-4">
        <div className="relative w-full max-w-4xl rounded-xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">{modalTitle}</h2>
              <span
                className={`rounded-md border px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(status)}`}
              >
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
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-[1fr_3fr]">
              <ShiftSummary shift={shift} companyName={companyName} showAssignedWorker={false} />

              <div className="max-h-[500px] overflow-hidden rounded-lg border border-gray-200 bg-white">
                <div className="grid grid-cols-[1.4fr_1fr_0.7fr_1.5fr] items-center bg-gray-50 px-4 pr-8 py-3 text-xs font-semibold text-gray-500">
                  <span>Applicant</span>
                  <span>Experience</span>
                  <span>Rating</span>
                  <span className="text-center">Decision</span>
                </div>

                {pendingApplications.length > 0 ? (
                  pendingApplications.map((application) => {
                    const isSelectedReplacement =
                      application.user_id === shift.replacement_employee_id;
                    const userDetails = {
                      ...application.user,
                      ...(isSelectedReplacement ? applicantDetails : {}),
                    };
                    const applicantName = getEmployeeName(userDetails, assigneeName);
                    const phoneNumber =
                      userDetails.phone_no || application.user?.phone_no || shift.replacement_employee?.phone_no;
                    const experience = isSelectedReplacement
                      ? applicantExperience
                      : formatExperience(application.user?.experience);
                    const averageRating = isSelectedReplacement
                      ? applicantRating
                      : formatAverageRating(application.user?.rating_avg);

                    return (
                      <div
                        key={application.id || application.user_id || shift.id}
                        className="grid grid-cols-[1.4fr_1fr_0.7fr_1.5fr] items-center gap-3 border-t border-gray-200 px-4 pr-8 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700">
                            <UserRound className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900">
                              {applicantName}
                            </p>
                            <p className="truncate text-xs text-gray-500">{phoneNumber || '-'}</p>
                          </div>
                        </div>

                        <p className="text-sm font-medium text-gray-900">{experience}</p>
                        <p className="flex items-center gap-2 text-sm font-medium text-gray-900">
                          {averageRating !== '-' && (
                            <Star className="h-4 w-4 fill-lime-400 text-lime-400" />
                          )}
                          {averageRating}
                        </p>

                        <div className="flex justify-end gap-2 pr-2">
                          <button
                            type="button"
                            disabled={isMutating}
                            onClick={() => rejectSelectedShift(application.id)}
                            className="flex h-9 flex-1 items-center justify-center rounded-md border border-blue-600 px-4 py-2.5 text-sm font-medium text-gray-900 disabled:opacity-60"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            disabled={isMutating}
                            onClick={() => approveSelectedShift(application.id)}
                            className="flex h-9 flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
                          >
                            {approveShift.isPending && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            Approve
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="border-t border-gray-200 px-4 py-8 text-center text-sm text-gray-500">
                    No pending requests found.
                  </div>
                )}
              </div>
            </div>
          )}

          {(status === 'approved' || status === 'completed' || status === 'absent') && (
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
                            className={`h-12 rounded-xl border text-sm font-medium transition-all ${attendance === option.value
                                ? option.value === 'present'
                                  ? 'border-green-500 bg-green-50 text-green-600'
                                  : option.value === 'absent'
                                    ? 'border-red-500 bg-red-50 text-red-600'
                                    : 'border-orange-500 bg-orange-50 text-orange-600'
                                : 'border-gray-300 bg-white text-black'
                              }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <label className="text-sm text-gray-700">
                        Check-in Time
                        <input
                          type="time"
                          value={checkInTime}
                          onChange={(event) => setCheckInTime(event.target.value)}
                          className="mt-2 h-11 w-full rounded-lg border border-gray-200 px-3 text-sm"
                        />
                      </label>
                      <label className="text-sm text-gray-700">
                        Check-out Time
                        <input
                          type="time"
                          value={checkOutTime}
                          onChange={(event) => setCheckOutTime(event.target.value)}
                          className="mt-2 h-11 w-full rounded-lg border border-gray-200 px-3 text-sm"
                        />
                      </label>
                    </div>

                    <div className="mt-5">
                      <p className="mb-2 text-sm text-gray-700">Work Quality Rating *</p>
                      <div className="flex items-center gap-3">
                        <RatingStars value={rating} onChange={setRating} />
                        <span className="text-sm text-gray-900">{rating}.0</span>
                        <span
                          className={`rounded-md border px-2 py-0.5 text-xs ${getRatingBadgeClass(
                            rating,
                          )}`}
                        >
                          {getRatingLabel(rating)}
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
                        disabled={isMutating}
                        onClick={submitCompletion}
                        className="flex h-10 w-32 items-center justify-center gap-2 rounded-md bg-blue-600 text-sm font-medium text-white disabled:opacity-60"
                      >
                        {completeShift.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Submit
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-5 space-y-3 text-sm">
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-500">Attendance Status</span>
                      <span
                        className={`rounded-md border px-2 py-0.5 text-xs ${getAttendanceBadgeClass(
                          status,
                        )}`}
                      >
                        {status === 'absent' ? 'Absent' : 'Present'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-500">Check-in Time</span>
                      <span className="font-medium text-gray-900">{reviewCheckInTime}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-500">Check-out Time</span>
                      <span className="font-medium text-gray-900">{reviewCheckOutTime}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-500">Work Quality Rating</span>
                      <span className="flex items-center gap-3">
                        <RatingStars value={completedRating} readonly />
                        <span className="font-medium text-gray-900">{completedRating}.0</span>
                      </span>
                    </div>
                    <div>
                      <p className="text-gray-500">Performance</p>
                      {/* <p
                        className={`mt-2 inline-flex rounded-md border px-2 py-0.5 text-xs font-medium ${getRatingBadgeClass(
                          completedRating,
                        )}`}
                      >
                        {getRatingLabel(completedRating)}
                      </p> */}
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

      {status === 'open' ? (
        <p className="mt-2 text-sm text-gray-500">
          {isWorkerCreatedPrivateShift(shift)
            ? 'Waiting for the assigned worker to accept this private shift request.'
            : 'No worker has been approved yet. Applicants will appear here after workers apply.'}
        </p>
      ) : (() => {
          const { title, detail } = getCancellationMessage(shift);
          const isWorkerCancelled = shift.created_by === 'user';
          return (
            <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-4">
              {/* Icon row */}
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500">
                  <X className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-red-700">{title}</p>
                  <p className="mt-1 text-sm text-red-600">{detail}</p>
                </div>
              </div>

              {/* Who was involved */}
              {/* <div className="mt-4 space-y-2 border-t border-red-100 pt-3 text-xs text-red-500">
                {shift.original_employee && (
                  <div className="flex items-center justify-between">
                    <span>Shift Creator</span>
                    <span className="font-medium text-red-700">
                      {getEmployeeName(shift.original_employee)}
                    </span>
                  </div>
                )}
                {shift.replacement_employee && (
                  <div className="flex items-center justify-between">
                    <span>Assigned Worker</span>
                    <span className="font-medium text-red-700">
                      {getEmployeeName(shift.replacement_employee)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>Approval Stage</span>
                  <span className="font-medium text-red-700">
                    {shift.organization_approved ? 'After employer approval' : 'Before employer approval'}
                  </span>
                </div>
              </div> */}
            </div>
          );
        })()
      }
    </div>
  </div>
)}
        </div>
      </div>
    </div>
  );
};
