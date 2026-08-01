'use client';

import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Download,
  Eye,
  FileText,
  Mail,
  Phone,
  Search,
  UploadCloud,
  X,
} from 'lucide-react';
import type React from 'react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import {
  employeeProfile,
  leaveBalances,
  type LeaveRequest,
  type LeaveSession,
  type LeaveStatus,
  type LeaveType,
  useLeaveStore,
} from '../stores/use-leave-store';

const leaveTypes: LeaveType[] = ['Casual Leave', 'Sick Leave', 'Earned Leave'];
const sessions: LeaveSession[] = ['Session 1', 'Session 2'];

export type LeaveFormValues = {
  leaveType: LeaveType;
  fromDate: string;
  toDate: string;
  sessionFrom: LeaveSession;
  sessionTo: LeaveSession;
  reason: string;
};

export const defaultLeaveForm: LeaveFormValues = {
  leaveType: 'Casual Leave',
  fromDate: '',
  toDate: '',
  sessionFrom: 'Session 1',
  sessionTo: 'Session 2',
  reason: 'Personal work for hometown',
};

const statusStyles: Record<LeaveStatus, string> = {
  approved: 'border-green-400 bg-green-50 text-green-600',
  rejected: 'border-red-400 bg-red-50 text-red-500',
  pending: 'border-orange-400 bg-orange-50 text-orange-500',
};

const balanceStyles = {
  blue: 'bg-blue-600',
  green: 'bg-emerald-600',
  amber: 'bg-amber-600',
};

const formatDate = (value: string) =>
  new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const formatDateRange = (request: LeaveRequest) =>
  `${formatDate(request.fromDate)} - ${formatDate(request.toDate)}`;

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

export const PageShell = ({
  title,
  crumb,
  action,
  children,
}: {
  title: string;
  crumb: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const { notification, clearNotification } = useLeaveStore();

  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(clearNotification, 3500);
    return () => window.clearTimeout(timer);
  }, [clearNotification, notification]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 lg:p-6">
      <div className="min-h-[calc(100vh-48px)] rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <button
              type="button"
              className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-900 transition hover:bg-gray-100"
              aria-label="Go back"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-black">{title}</h1>
              <p className="mt-1 text-sm text-gray-500">Leaves &gt; {crumb}</p>
            </div>
          </div>
          {action}
        </div>

        {notification && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
            <Mail className="h-4 w-4" />
            {notification}
          </div>
        )}

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
};

export const PrimaryButton = ({
  children,
  type = 'button',
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  type?: 'button' | 'submit';
  onClick?: () => void;
  className?: string;
}) => (
  <button
    type={type}
    onClick={onClick}
    className={`h-12 rounded-lg bg-[#0658C2] px-8 text-base font-semibold text-white transition hover:bg-blue-700 ${className}`}
  >
    {children}
  </button>
);

export const OutlineButton = ({
  children,
  type = 'button',
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  type?: 'button' | 'submit';
  onClick?: () => void;
  className?: string;
}) => (
  <button
    type={type}
    onClick={onClick}
    className={`h-12 rounded-lg border border-[#0658C2] px-8 text-base font-semibold text-black transition hover:bg-blue-50 ${className}`}
  >
    {children}
  </button>
);

export const FieldLabel = ({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <label className="block text-sm font-semibold text-black">
    {label} {required && <span className="text-red-500">*</span>}
    <div className="mt-2">{children}</div>
  </label>
);

export const SelectField = ({
  value,
  options,
  onChange,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) => (
  <div className="relative">
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full appearance-none rounded-lg border border-gray-200 bg-white px-4 pr-10 text-sm text-gray-700 outline-none focus:border-[#0658C2] focus:ring-2 focus:ring-blue-100"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
  </div>
);

export const DateField = ({
  value,
  onChange,
  placeholder = 'DD / MM / YYYY',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) => (
  <div className="relative">
    <input
      type="date"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="h-11 w-full rounded-lg border border-gray-200 px-4 pr-10 text-sm text-gray-700 outline-none focus:border-[#0658C2] focus:ring-2 focus:ring-blue-100"
    />
    <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black" />
  </div>
);

export const EmployeeCard = ({ compact = false }: { compact?: boolean }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr_220px] lg:items-center">
      <div className="flex items-center gap-6">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#092052,#9CC7FF)] text-2xl font-bold text-white">
          {getInitials(employeeProfile.name)}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <h2 className="text-xl font-bold tracking-wide text-black">{employeeProfile.name}</h2>
              <p className="text-base font-semibold text-black">{employeeProfile.role}</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-lg bg-green-100 px-3 py-1 text-sm font-medium text-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
              {employeeProfile.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            EMP ID :- {employeeProfile.employeeId} <span className="mx-3">|</span> UID :-
            {employeeProfile.uid}
          </p>
          {compact && (
            <div className="mt-2 space-y-1 text-sm text-gray-500">
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                {employeeProfile.phone}
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {employeeProfile.email}
              </p>
            </div>
          )}
        </div>
      </div>

      {!compact && (
        <div className="space-y-3 border-gray-200 lg:border-l lg:pl-10">
          <p className="flex items-center gap-3 text-sm text-black">
            <Phone className="h-5 w-5 text-gray-500" />
            {employeeProfile.phone}
          </p>
          <p className="flex items-center gap-3 text-sm text-black">
            <Mail className="h-5 w-5 text-gray-500" />
            {employeeProfile.email}
          </p>
        </div>
      )}

      {!compact && (
        <div className="rounded-3xl bg-green-100 px-8 py-4 text-center text-sm text-gray-600">
          <p>Available Leave Balance</p>
          <p className="mt-2 text-2xl font-semibold text-green-600">8.0</p>
          <p className="text-xs">Days</p>
        </div>
      )}
    </div>
  </div>
);

export const LeaveBalanceCards = () => (
  <div className="grid gap-4 sm:grid-cols-3">
    {leaveBalances.map((balance) => {
      const remaining = balance.total - balance.used;
      const percent = Math.min(100, Math.round((balance.used / balance.total) * 100));

      return (
        <div key={balance.type} className="rounded-lg bg-[#F8FAFF] p-4">
          <p className="text-sm font-semibold text-[#26324F]">{balance.type}</p>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-blue-100">
            <div className={`h-full rounded-full ${balanceStyles[balance.accent]}`} style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-4 flex justify-between text-xs font-medium text-gray-400">
            <span>Used</span>
            <span>Remaining</span>
          </div>
          <div className="mt-1 flex justify-between text-base font-bold">
            <span>
              {balance.used}
              <span className="text-xs font-semibold text-gray-500">/{balance.total}</span>
            </span>
            <span className="text-green-600">{remaining}</span>
          </div>
        </div>
      );
    })}
  </div>
);

export const LeaveForm = ({
  initialValues = defaultLeaveForm,
  onSubmit,
  compact = false,
  footer,
}: {
  initialValues?: LeaveFormValues;
  onSubmit: (values: LeaveFormValues) => void;
  compact?: boolean;
  footer?: React.ReactNode;
}) => {
  const [values, setValues] = useState(initialValues);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const update = (next: Partial<LeaveFormValues>) => setValues((current) => ({ ...current, ...next }));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className={`grid gap-5 ${compact ? 'md:grid-cols-3' : 'lg:grid-cols-3'}`}>
        <FieldLabel label="Leave Type" required>
          <SelectField
            value={values.leaveType}
            options={leaveTypes}
            onChange={(leaveType) => update({ leaveType: leaveType as LeaveType })}
          />
        </FieldLabel>
        <FieldLabel label="From Date" required>
          <DateField value={values.fromDate} onChange={(fromDate) => update({ fromDate })} />
        </FieldLabel>
        <FieldLabel label="To Date" required={!compact}>
          <DateField value={values.toDate} onChange={(toDate) => update({ toDate })} />
        </FieldLabel>
      </div>

      <div className={`grid gap-5 ${compact ? 'md:grid-cols-2' : 'lg:grid-cols-3'}`}>
        <FieldLabel label="Session From" required>
          <SelectField
            value={values.sessionFrom}
            options={sessions}
            onChange={(sessionFrom) => update({ sessionFrom: sessionFrom as LeaveSession })}
          />
        </FieldLabel>
        <FieldLabel label="Session to" required>
          <SelectField
            value={values.sessionTo}
            options={sessions}
            onChange={(sessionTo) => update({ sessionTo: sessionTo as LeaveSession })}
          />
        </FieldLabel>
        {!compact && (
          <FieldLabel label="Attachments (Optionals)">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="flex h-11 items-center gap-2 rounded-lg border border-dashed border-blue-300 px-4 text-sm font-medium text-[#0658C2]"
              >
                <UploadCloud className="h-4 w-4" />
                Upload Documents
              </button>
              <p className="text-xs text-gray-500">PDF, JPG, PNG<br />Max, 5MB each</p>
            </div>
          </FieldLabel>
        )}
      </div>

      <FieldLabel label="Reason" required>
        <textarea
          value={values.reason}
          onChange={(event) => update({ reason: event.target.value })}
          className={`${compact ? 'h-24' : 'h-28'} w-full resize-none rounded-lg border border-gray-200 px-4 py-3 text-sm text-gray-700 outline-none focus:border-[#0658C2] focus:ring-2 focus:ring-blue-100`}
          placeholder="Personal work for hometown"
        />
      </FieldLabel>

      {!compact && (
        <div className="flex justify-end gap-5 pt-1">
          <OutlineButton type="button">Cancel</OutlineButton>
          <PrimaryButton type="submit">Submit</PrimaryButton>
        </div>
      )}

      {footer}
    </form>
  );
};

export const StatusBadge = ({ status }: { status: LeaveStatus }) => (
  <span className={`inline-flex min-w-20 justify-center rounded-md border px-3 py-1 text-sm font-medium capitalize ${statusStyles[status]}`}>
    {status}
  </span>
);

export const RequestSummaryCard = ({ request }: { request: LeaveRequest }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1.4fr] lg:items-center">
      <EmployeeCard compact />
      <div className="grid gap-5 text-sm sm:grid-cols-2 lg:border-l lg:border-gray-200 lg:pl-10">
        <Info label="Supervisor" value={request.supervisor.name} />
        <Info label="Leave Type" value={request.leaveType} />
        <Info label="Leave Period" value={formatDateRange(request)} />
        <Info label="Applied On" value={formatDate(request.appliedOn)} />
        <Info label="Total Days" value={`${request.totalDays} Days`} />
      </div>
    </div>
  </div>
);

export const Info = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-sm text-gray-500">{label}</p>
    <p className="mt-1 font-medium text-black">{value}</p>
  </div>
);

export const AttachmentRow = ({ request }: { request: LeaveRequest }) => (
  <div className="flex items-center justify-between rounded-lg bg-[#F8FAFF] p-4">
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100 text-red-500">
        <FileText className="h-5 w-5" />
      </span>
      <div>
        <p className="text-sm font-semibold text-[#26324F]">{request.attachment.name}</p>
        <p className="text-xs text-gray-500">{request.attachment.size}</p>
      </div>
    </div>
    <button
      type="button"
      className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-[#0658C2]"
      aria-label="Download attachment"
    >
      <Download className="h-4 w-4" />
    </button>
  </div>
);

export const ReviewActions = ({ request, onChange }: { request: LeaveRequest; onChange: () => void }) => {
  const { approveLeave, rejectLeave } = useLeaveStore();

  if (request.status !== 'pending') {
    return (
      <div className="flex justify-end">
        <StatusBadge status={request.status} />
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-end gap-5 sm:flex-row">
      <OutlineButton onClick={() => rejectLeave(request.id)} className="sm:min-w-36">
        Reject
      </OutlineButton>
      <OutlineButton onClick={onChange} className="sm:min-w-36">
        Changes
      </OutlineButton>
      <PrimaryButton onClick={() => approveLeave(request.id)} className="sm:min-w-36">
        Approve
      </PrimaryButton>
    </div>
  );
};

export const ChangeRequestModal = ({
  request,
  onClose,
}: {
  request: LeaveRequest;
  onClose: () => void;
}) => {
  const changeLeave = useLeaveStore((state) => state.changeLeave);

  const initialValues = useMemo<LeaveFormValues>(
    () => ({
      leaveType: request.leaveType,
      fromDate: request.fromDate,
      toDate: request.toDate,
      sessionFrom: request.sessionFrom,
      sessionTo: request.sessionTo,
      reason: request.reason,
    }),
    [request],
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-[#FBFAFF] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-black">Request Changes</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="Close request changes"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <LeaveForm
            compact
            initialValues={initialValues}
            onSubmit={(values) => {
              changeLeave(request.id, values);
              onClose();
            }}
            footer={
              <div className="mt-5 flex justify-end gap-5">
                <OutlineButton onClick={onClose} className="sm:min-w-36">
                  Cancel
                </OutlineButton>
                <PrimaryButton type="submit" className="sm:min-w-36">
                  Submit
                </PrimaryButton>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
};

export const RequestSearch = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => (
  <div className="relative w-full sm:max-w-60">
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search keywords..."
      className="h-12 w-full rounded-lg border border-gray-300 px-5 pr-12 text-sm outline-none focus:border-[#0658C2]"
    />
    <Search className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />
  </div>
);

export const StatusSelect = ({
  value,
  onChange,
}: {
  value: LeaveStatus | 'all';
  onChange: (value: LeaveStatus | 'all') => void;
}) => (
  <div className="relative w-full sm:w-40">
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as LeaveStatus | 'all')}
      className="h-12 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 pr-10 text-base font-semibold text-gray-900 outline-none focus:border-[#0658C2]"
    >
      <option value="all">All Status</option>
      <option value="pending">Pending</option>
      <option value="approved">Approved</option>
      <option value="rejected">Rejected</option>
    </select>
    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black" />
  </div>
);

export const DateRangeButton = ({ label }: { label: string }) => (
  <button
    type="button"
    className="flex h-12 w-full items-center justify-between gap-4 rounded-lg border border-gray-300 px-4 text-base font-semibold text-gray-900 sm:w-72"
  >
    <span>{label}</span>
    <CalendarDays className="h-5 w-5 text-black" />
  </button>
);

export const RowAction = ({ onClick }: { onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[#0658C2] transition hover:bg-blue-50"
    aria-label="Review leave request"
  >
    <Eye className="h-5 w-5" />
  </button>
);

export { formatDate, formatDateRange };
