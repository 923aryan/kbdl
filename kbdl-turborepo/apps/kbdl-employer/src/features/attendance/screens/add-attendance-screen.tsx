'use client';

import { fetchEmployeesList, fetchWorkShiftsMeta, type MetaWorkShift } from '@/features/employees/api';
import { ArrowLeft, Loader2, Save, UserRound } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { todayIsoDate, upsertAttendance } from '../api';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
  { value: 'half_day', label: 'Half Day' },
  { value: 'leave', label: 'Leave' },
  { value: 'on_duty', label: 'On Duty' },
];

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

  useEffect(() => {
    void Promise.all([
      fetchEmployeesList({ roster: 'active', limit: 200 }),
      fetchWorkShiftsMeta({ limit: 50 }),
    ]).then(([empRes, shiftRes]) => {
      setEmployees(
        empRes.data.map((e) => ({
          employment_id: e.employment_id,
          name: e.name,
          phone_no: e.phone_no,
        })),
      );
      setWorkShifts(shiftRes.data);
    });
  }, []);

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
    <div className="min-h-screen bg-[#F6F7F9] text-[#111827]">
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
              <Field label="Employee" required>
                <select
                  value={employmentId}
                  onChange={(e) => setEmploymentId(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm outline-none focus:border-[#0658C2]"
                  required
                  disabled={isSecondShift}
                >
                  <option value="">Select employee</option>
                  {employees.map((e) => (
                    <option key={e.employment_id} value={e.employment_id}>
                      {e.name} ({e.phone_no})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Date" required>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm outline-none focus:border-[#0658C2]"
                  required
                />
              </Field>

              <Field label="Shift" required>
                <select
                  value={workShiftId}
                  onChange={(e) => setWorkShiftId(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm outline-none focus:border-[#0658C2]"
                  required
                >
                  <option value="">Select shift</option>
                  {workShifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.start_time.slice(0, 5)} – {s.end_time.slice(0, 5)})
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Status" required>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm outline-none focus:border-[#0658C2]"
                >
                  {STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>

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
                  className="h-11 w-full rounded-lg border border-[#D3D3D3] px-4 text-sm outline-none focus:border-[#0658C2]"
                />
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

            <div className="mt-5 rounded-lg border border-[#E5E7EB] p-4">
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
                className="mt-5 h-24 w-full resize-none rounded-lg border border-[#D3D3D3] px-4 py-3 text-sm outline-none focus:border-[#0658C2]"
              />
            </Field>

            <div className="mt-6 flex justify-end gap-4">
              <Link href={`/attendance?date=${date}`} className="flex h-12 items-center rounded-xl border border-[#0658C2] px-10 font-semibold">
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 items-center gap-2 rounded-xl bg-[#0658C2] px-10 font-semibold text-white disabled:opacity-60"
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
