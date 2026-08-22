'use client';

import { fetchEmployeesList, fetchWorkShiftsMeta, type MetaWorkShift } from '@/features/employees/api';
import { ArrowLeft, Loader2, RefreshCw, Save, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { todayIsoDate, upsertAttendance } from '../api';
import { SelectField } from '../components/async-single-select';
import { SearchableSingleSelect } from '../components/searchable-single-select';

import { z } from 'zod';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'leave', label: 'Leave' },
  { value: 'on_duty', label: 'On Duty' },
];

const attendanceSchema = z
  .object({
    employmentId: z.string().min(1, 'Employee is required'),
    workShiftId: z.string().min(1, 'Shift is required'),
    date: z.string().min(1, 'Attendance date is required'),
    status: z.string().min(1, 'Status is required'),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    lunchBreakMinutes: z.coerce.number().min(0, 'Lunch break cannot be negative'),
    teaBreakMinutes: z.coerce.number().min(0, 'Tea break cannot be negative'),
    overtimeMinutes: z.coerce.number().min(0, 'OT minutes cannot be negative'),
    overtimeReason: z.string().optional(),
    notes: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    // Future attendance is not allowed
    if (data.date) {
      const selectedDate = new Date(`${data.date}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate > today) {
        ctx.addIssue({
          code: 'custom',
          path: ['date'],
          message: 'Attendance cannot be marked for a future date',
        });
      }
    }
    // Check-out cannot be before or equal to check-in
    if (data.checkIn && data.checkOut) {
      if (data.checkOut <= data.checkIn) {
        ctx.addIssue({
          code: 'custom',
          path: ['checkOut'],
          message: 'Check-out must be after check-in',
        });
      }
    }
  });

export function AddAttendanceScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillEmploymentId = searchParams.get('employment_id') ?? '';
  const prefillDate = searchParams.get('date') ?? todayIsoDate();
  const prefillShiftId = searchParams.get('work_shift_id') ?? '';

  const [employees, setEmployees] = useState<Array<{ employment_id: string; name: string; phone_no: string }>>([]);
  const [workShifts, setWorkShifts] = useState<MetaWorkShift[]>([]);
  const [employmentId, setEmploymentId] = useState(prefillEmploymentId);
  const [date, setDate] = useState(prefillDate);
  const [workShiftId, setWorkShiftId] = useState(prefillShiftId);
  const [checkIn, setCheckIn] = useState('18:00');
  const [checkOut, setCheckOut] = useState('02:00');
  const [lunchBreak, setLunchBreak] = useState('30');
  const [teaBreak, setTeaBreak] = useState('0');
  const [status, setStatus] = useState('present');
  const [isOt, setIsOt] = useState(Boolean(prefillEmploymentId));
  const [otMinutes, setOtMinutes] = useState('');
  const [otReason, setOtReason] = useState(prefillEmploymentId ? 'Second shift / alternate shift' : '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [shiftsLoading, setShiftsLoading] = useState(true);
  const [employeesError, setEmployeesError] = useState<string | null>(null);
  const [shiftsError, setShiftsError] = useState<string | null>(null);
  const [employeesReady, setEmployeesReady] = useState(false);
  const [shiftsReady, setShiftsReady] = useState(false);

  const applyEmployees = (empRes: Awaited<ReturnType<typeof fetchEmployeesList>>) => {
    setEmployees(
      empRes.data.map((e) => ({
        employment_id: e.employment_id,
        name: e.name,
        phone_no: e.phone_no,
      })),
    );
    setEmployeesError(null);
    setEmployeesReady(true);
  };

  const loadEmployees = useCallback(async () => {
    setEmployeesLoading(true);
    setEmployeesError(null);
    try {
      applyEmployees(await fetchEmployeesList({ roster: 'active', limit: 200 }));
    } catch (err) {
      setEmployeesError(err instanceof Error ? err.message : 'Failed to load employees');
    } finally {
      setEmployeesLoading(false);
    }
  }, []);

  const loadShifts = useCallback(async () => {
    setShiftsLoading(true);
    setShiftsError(null);
    try {
      const shiftRes = await fetchWorkShiftsMeta({ limit: 50 });
      setWorkShifts(shiftRes.data);
      setShiftsError(null);
      setShiftsReady(true);
    } catch (err) {
      setShiftsError(err instanceof Error ? err.message : 'Failed to load shifts');
    } finally {
      setShiftsLoading(false);
    }
  }, []);

  const loadMeta = useCallback(async () => {
    setEmployeesLoading(true);
    setShiftsLoading(true);
    setEmployeesError(null);
    setShiftsError(null);
    const settled = await Promise.allSettled([
      fetchEmployeesList({ roster: 'active', limit: 200 }),
      fetchWorkShiftsMeta({ limit: 50 }),
    ]);
    if (settled[0].status === 'fulfilled') {
      applyEmployees(settled[0].value);
    } else {
      setEmployeesError(
        settled[0].reason instanceof Error ? settled[0].reason.message : 'Failed to load employees',
      );
    }
    if (settled[1].status === 'fulfilled') {
      setWorkShifts(settled[1].value.data);
      setShiftsError(null);
      setShiftsReady(true);
    } else {
      setShiftsError(
        settled[1].reason instanceof Error ? settled[1].reason.message : 'Failed to load shifts',
      );
    }
    setEmployeesLoading(false);
    setShiftsLoading(false);
  }, []);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    if (!workShiftId || workShifts.length === 0) return;
    const shift = workShifts.find((s) => s.id === workShiftId);
    if (shift) {
      setCheckIn(shift.start_time.slice(0, 5));
      setCheckOut(shift.end_time.slice(0, 5));
      setLunchBreak(String(shift.break_minutes));
    }
  }, [workShiftId, workShifts]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const result = attendanceSchema.safeParse({
      employmentId,
      workShiftId,
      date,
      status,
      checkIn,
      checkOut,
      lunchBreakMinutes: lunchBreak,
      teaBreakMinutes: teaBreak,
      overtimeMinutes: isOt ? otMinutes : '0',
      overtimeReason: isOt ? otReason : '',
      notes,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};

      result.error.issues.forEach((issue) => {
        const field = issue.path[0];

        if (typeof field === 'string') {
          fieldErrors[field] = issue.message;
        }
      });

      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    if (!employmentId) {
      setError('Please select an employee');
      return;
    }
    if (!workShiftId) {
      setError('Please select a shift (required for each attendance row)');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await upsertAttendance({
        date,
        employment_id: employmentId,
        work_shift_id: workShiftId,
        check_in: checkIn || undefined,
        check_out: checkOut || undefined,
        lunch_break_minutes: Number(lunchBreak) || 0,
        tea_break_minutes: Number(teaBreak) || 0,
        status,
        is_ot: isOt,
        ot_minutes: isOt ? Number(otMinutes) || 0 : 0,
        ot_reason: isOt ? otReason || null : null,
        notes: notes || null,
      });
      router.push(`/attendance?date=${date}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save attendance');
    } finally {
      setLoading(false);
    }
  };

  const isSecondShift = Boolean(prefillEmploymentId);

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111827]">
      <main className="p-5 lg:p-6">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href={`/attendance?date=${date}`}
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#D3D3D3] bg-white text-[#0658C2] shadow-sm"
            aria-label="Back to attendance"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-[28px] font-bold">{isSecondShift ? 'Add Another Shift' : 'Add Attendance'}</h1>
            <p className="mt-1 text-sm text-[#676767]">
              {isSecondShift
                ? 'Same employee, same date — pick a different shift (e.g. Night). Each shift is a separate row.'
                : 'Manual entry with shift, breaks, and optional OT.'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-xl font-semibold">
              <UserRound className="h-5 w-5 text-[#0658C2]" />
              Attendance Details
            </h2>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <SearchableSingleSelect label="Employee" required placeholder={employeesLoading && !employeesReady ? 'Loading employees...' : 'Select Employee'} options={employees.map((e) => ({ value: e.employment_id, label: `${e.name} (${e.phone_no})` }))} value={employmentId} onChange={(value) => setEmploymentId(value)} error={errors.employmentId} disabled={isSecondShift || (employeesLoading && !employeesReady)} />
                <SectionRetry loading={employeesLoading} error={employeesError} hasData={employeesReady} onRetry={() => void loadEmployees()} label="employees" />
              </div>

              <Field label="Date" required>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`h-11 w-full rounded-lg border px-4 text-sm outline-none ${
                    errors.date ? 'border-[#F54A4A]' : 'border-[#D3D3D3] focus:border-[#0658C2]'
                  }`}
                  required />
                  {errors.date && <span className="mt-1 block text-xs font-medium text-[#F54A4A]">{errors.date}</span>}
              </Field>

              <div>
                <SelectField label="Shift" required placeholder={shiftsLoading && !shiftsReady ? 'Loading shifts...' : 'Select Shift'} options={workShifts.map((s) => ({ value: s.id, label: `${s.name} (${s.start_time.slice(0, 5)} – ${s.end_time.slice(0, 5)})` }))} value={workShiftId} onChange={(value) => setWorkShiftId(value)} error={errors.workShiftId} />
                <SectionRetry loading={shiftsLoading} error={shiftsError} hasData={shiftsReady} onRetry={() => void loadShifts()} label="shifts" />
              </div>

              <SelectField label="Status" required placeholder="Select Status" options={STATUS_OPTIONS} value={status} onChange={(value) => setStatus(value)} error={!status ? "Status is required" : undefined} />

              <Field label="Check-in">
                <input
                  type="time"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm outline-none focus:border-[#0658C2]"
                />
              </Field>
              <Field label="Check-out">
                <input
                  type="time"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className={`h-11 w-full rounded-lg border px-4 text-sm outline-none ${errors.checkOut ? 'border-[#F54A4A]' : 'border-[#D3D3D3] focus:border-[#0658C2]'}`}
                />
                {errors.checkOut && (
                  <span className="mt-1 block text-xs font-medium text-[#F54A4A]">
                    {errors.checkOut}
                  </span>
                )}
              </Field>

              <Field label="Lunch break (min)">
                <input
                  type="number"
                  min={0}
                  value={lunchBreak}
                  onChange={(e) => setLunchBreak(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm outline-none focus:border-[#0658C2]"
                />
              </Field>
              <Field label="Tea break (min)">
                <input
                  type="number"
                  min={0}
                  value={teaBreak}
                  onChange={(e) => setTeaBreak(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm outline-none focus:border-[#0658C2]"
                />
              </Field>
            </div>

            <div className="my-5 rounded-lg border border-[#E5E7EB] p-4">
              <label className="flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={isOt} onChange={(e) => setIsOt(e.target.checked)} />
                Mark as overtime (HR decision — typical for 2nd shift)
              </label>
              {isOt && (
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Field label="OT minutes">
                    <input
                      type="number"
                      min={0}
                      value={otMinutes}
                      onChange={(e) => setOtMinutes(e.target.value)}
                      className="h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm outline-none focus:border-[#0658C2]"
                    />
                  </Field>
                  <Field label="OT reason">
                    <input
                      value={otReason}
                      onChange={(e) => setOtReason(e.target.value)}
                      placeholder="alternate shift, dual shift"
                      className="h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm outline-none focus:border-[#0658C2]"
                    />
                  </Field>
                </div>
              )}
            </div>

            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. worked day shift and night shift"
                className="h-24 w-full resize-none rounded-lg border border-[#D3D3D3] px-4 py-3 text-sm outline-none focus:border-[#0658C2]"
              />
            </Field>

            <div className="mt-6 flex justify-end gap-4">
              <Link href={`/attendance?date=${date}`} className="flex h-12 items-center rounded-xl border border-[#0658C2] px-10 font-semibold transition-all duration-200 hover:bg-[#F0F6FF] hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#0658C2] px-10 font-semibold text-white disabled:opacity-60 cursor-pointer transition-all duration-200 hover:bg-[#054A9F] hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Attendance
              </button>
            </div>
          </section>
        </form>
      </main>
    </div>
  );
}

function SectionRetry({
  loading,
  error,
  hasData,
  onRetry,
  label,
}: {
  loading: boolean;
  error: string | null;
  hasData: boolean;
  onRetry: () => void;
  label: string;
}) {
  if (loading && !hasData) {
    return (
      <p className="mt-2 inline-flex items-center gap-2 text-xs text-[#676767]">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading {label}...
      </p>
    );
  }
  if (!error) return null;
  return (
    <div className={`mt-2 flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs ${hasData ? 'border border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]' : 'border border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]'}`}>
      <span>{hasData ? `Could not refresh ${label}: ${error}` : error}</span>
      <button type="button" onClick={onRetry} className="inline-flex cursor-pointer items-center gap-1 font-semibold text-[#0658C2]">
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Reload
      </button>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">
        {label} {required && <span className="text-[#F54A4A]">*</span>}
      </span>
      {children}
    </label>
  );
}
