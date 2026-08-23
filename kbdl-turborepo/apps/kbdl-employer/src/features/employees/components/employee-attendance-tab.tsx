'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import {
  fetchEmployeeAttendanceMonth,
  formatUiDate,
  type EmployeeAttendanceMonth,
} from '@/features/attendance/api';
import { currentUtcMonth } from '@/features/attendance/hooks/use-attendance-analytics';
import { employeeAttendancePath } from '../lib/employee-routes';

const CODE_CELL: Record<string, string> = {
  P: 'bg-[#E5FFEB]',
  A: 'bg-[#FEE9E5]',
  HD: 'bg-[#E5E5E5]',
  L: 'bg-[#EDE9FE]',
  H: 'bg-[#DBEAFF]',
  OF: 'bg-[#F4F4F4]',
  '-': 'bg-white',
};

function shiftMonth(month: string, offset: number): string {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  const d = new Date(Date.UTC(y, m - 1 + offset, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(month: string) {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function sourceLabel(source: string) {
  if (source === 'hr_manual') return 'HR marked';
  if (source === 'device') return 'Device';
  if (source === 'app') return 'App punch';
  if (source === 'system') return 'System';
  return source.replaceAll('_', ' ');
}

export function EmployeeAttendanceTab({ employmentId }: { employmentId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const monthParam = searchParams.get('month');
  const month =
    monthParam && /^\d{4}-\d{2}$/.test(monthParam) ? monthParam : currentUtcMonth();

  const [data, setData] = useState<EmployeeAttendanceMonth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [legendsOpen, setLegendsOpen] = useState(true);
  const [logOpen, setLogOpen] = useState(true);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchEmployeeAttendanceMonth(employmentId, month)
      .then((next) => {
        if (cancelled) return;
        setData(next);
        setSelectedDate(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load attendance');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [employmentId, month, refreshTick]);

  const goMonth = (offset: number) => {
    router.replace(employeeAttendancePath(employmentId, shiftMonth(month, offset)));
  };

  const dayByDate = useMemo(() => {
    const map = new Map((data?.days ?? []).map((d) => [d.date, d]));
    return map;
  }, [data]);

  const calendarCells = useMemo(() => {
    const y = Number(month.slice(0, 4));
    const m = Number(month.slice(5, 7));
    const first = new Date(Date.UTC(y, m - 1, 1));
    const startOffset = first.getUTCDay();
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const prevMonthDays = new Date(Date.UTC(y, m - 1, 0)).getUTCDate();
    const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - startOffset + 1;
      const inMonth = dayNumber >= 1 && dayNumber <= daysInMonth;
      const displayedDay =
        dayNumber < 1
          ? prevMonthDays + dayNumber
          : dayNumber > daysInMonth
            ? dayNumber - daysInMonth
            : dayNumber;
      const date = inMonth ? `${month}-${String(dayNumber).padStart(2, '0')}` : null;
      const cell = date ? dayByDate.get(date) : undefined;
      return {
        day: displayedDay,
        date,
        muted: !inMonth,
        code: cell?.code ?? '',
        status_label: cell?.status_label,
        holiday_name: cell?.holiday_name,
        ot: (cell?.ot_minutes ?? 0) > 0,
        shift_count: cell?.shift_count ?? 0,
      };
    });
  }, [month, dayByDate]);

  const selectedEntries = useMemo(() => {
    if (!data) return [];
    if (selectedDate) return data.entries.filter((e) => e.date === selectedDate);
    return data.entries;
  }, [data, selectedDate]);

  const selectedDay = selectedDate ? dayByDate.get(selectedDate) : null;

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-[#676767]">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading attendance…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
        <p>{error}</p>
        <button
          type="button"
          onClick={() => setRefreshTick((n) => n + 1)}
          className="mt-2 inline-flex items-center gap-2 font-semibold text-[#0658C2]"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  const summary = data?.summary;
  const assigned = data?.employee.assigned_shift;
  const addShiftHref = selectedDate
    ? `/attendance/add?employment_id=${employmentId}&date=${selectedDate}`
    : `/attendance/add?employment_id=${employmentId}`;

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] px-4 py-3 text-sm text-[#92400E]">
          <span>Could not refresh: {error}</span>
          <button
            type="button"
            onClick={() => setRefreshTick((n) => n + 1)}
            className="inline-flex cursor-pointer items-center gap-1 font-semibold text-[#0658C2]"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      )}
      {loading && (
        <div className="inline-flex items-center gap-2 text-sm text-[#676767]">
          <Loader2 className="h-4 w-4 animate-spin" /> Updating…
        </div>
      )}
      <div className="flex flex-col gap-3 rounded-xl border border-[#D3D3D3] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-[#676767]">Assigned shift</p>
          <p className="font-semibold">
            {assigned ? `${assigned.name} (${assigned.start_time} – ${assigned.end_time})` : 'Unassigned'}
          </p>
          <p className="text-xs text-[#676767]">
            {data?.employee.employee_no ? `Emp #${data.employee.employee_no}` : null}
            {data?.employee.designation
              ? `${data.employee.employee_no ? ' · ' : ''}${data.employee.designation}`
              : ''}
            {data?.employee.department ? ` · ${data.employee.department}` : ''}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <p className="text-sm font-semibold text-[#0658C2]">
            Attendance rate {data?.attendance_rate ?? 0}%
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/attendance?date=${selectedDate ?? data?.from ?? ''}`}
              className="rounded-lg border border-[#D3D3D3] px-3 py-1.5 text-xs font-semibold text-[#0658C2] hover:bg-[#DBEAFF]"
            >
              Open daily roster
            </Link>
            <Link
              href={addShiftHref}
              className="rounded-lg bg-[#0658C2] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0549a3]"
            >
              {selectedDate ? 'Add / edit this day' : 'Add attendance'}
            </Link>
            <button
              type="button"
              onClick={() => setRefreshTick((n) => n + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-[#D3D3D3] px-3 py-1.5 text-xs font-semibold text-[#676767]"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-7">
        <SummaryChip label="Present" value={summary?.present ?? 0} className="text-[#4CAF50]" />
        <SummaryChip label="Absent" value={summary?.absent ?? 0} className="text-[#F54A4A]" />
        <SummaryChip label="Leave" value={summary?.leave ?? 0} className="text-[#8B5CF6]" />
        <SummaryChip label="Half day" value={summary?.half_day ?? 0} className="text-[#525252]" />
        <SummaryChip
          label="Holiday / Off"
          value={(summary?.holiday ?? 0) + (summary?.week_off ?? 0)}
          className="text-[#0658C2]"
        />
        <SummaryChip label="Pending" value={summary?.pending ?? 0} className="text-[#64748B]" />
        <SummaryChip
          label="Worked / OT hrs"
          valueLabel={`${summary?.worked_hours ?? 0} / ${summary?.ot_hours ?? 0}`}
          className="text-[#EA580C]"
        />
      </div>
      {summary && summary.pending > 0 && (
        <p className="text-sm text-[#676767]">{summary.pending} working day(s) still pending this month.</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-[#D3D3D3] shadow-sm">
        <div className="calendar min-w-[900px]">
          <div className="flex items-center justify-between px-5 py-4">
            <button type="button" onClick={() => goMonth(-1)} className="inline-flex items-center gap-2 text-[#676767]">
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <h3 className="text-2xl font-semibold">{monthLabel(month)}</h3>
            <button type="button" onClick={() => goMonth(1)} className="inline-flex items-center gap-2 text-[#676767]">
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 border-t border-[#D3D3D3] bg-[#FAFAFA] text-sm font-semibold text-[#676767]">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="px-4 py-3">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarCells.map((cell, index) => (
              <button
                key={`${cell.day}-${index}`}
                type="button"
                disabled={cell.muted || !cell.date}
                onClick={() => setSelectedDate((prev) => (prev === cell.date ? null : cell.date))}
                className={`min-h-[92px] border-r border-t border-[#D3D3D3] p-3 text-left text-sm ${
                  cell.muted ? 'text-gray-300' : 'text-[#676767]'
                } ${CODE_CELL[cell.code] ?? 'bg-white'} ${
                  selectedDate && cell.date === selectedDate ? 'ring-2 ring-inset ring-[#0658C2]' : ''
                }`}
              >
                <span>{String(cell.day).padStart(2, '0')}</span>
                {cell.code && (
                  <div className={`mt-2 text-center font-semibold ${legendColor(cell.code)}`}>
                    {cell.code}
                  </div>
                )}
                {cell.ot && <p className="mt-1 text-center text-[10px] font-semibold text-[#EA580C]">OT</p>}
                {cell.shift_count > 1 && (
                  <p className="mt-1 text-center text-[10px] text-[#0658C2]">{cell.shift_count} shifts</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedDay && (
        <div className="rounded-xl border border-[#DBEAFF] bg-[#EFF6FF] px-4 py-3 text-sm text-[#0658C2]">
          <span className="font-semibold">{formatUiDate(selectedDay.date)}</span>
          {' — '}
          {selectedDay.status_label}
          {selectedDay.holiday_name ? ` (${selectedDay.holiday_name})` : ''}
          {selectedDay.shift_count > 1 ? ` · ${selectedDay.shift_count} shifts` : ''}
          {' · '}
          worked {Math.round((selectedDay.worked_minutes / 60) * 10) / 10}h
          {selectedDay.ot_minutes > 0
            ? ` · OT ${Math.round((selectedDay.ot_minutes / 60) * 10) / 10}h`
            : ''}
          <button
            type="button"
            className="ml-3 font-semibold underline"
            onClick={() => setSelectedDate(null)}
          >
            Show full month log
          </button>
        </div>
      )}

      <CollapsibleTitle title="Legends" open={legendsOpen} onToggle={() => setLegendsOpen((v) => !v)} />
      {legendsOpen && (
        <div className="grid gap-3 rounded-xl border border-[#D3D3D3] p-4 text-sm text-[#676767] shadow-sm sm:grid-cols-3 xl:grid-cols-6">
          {(
            [
              ['P', 'Present / On duty'],
              ['A', 'Absent'],
              ['HD', 'Half day'],
              ['L', 'Leave'],
              ['H', 'Holiday'],
              ['OF', 'Week off'],
            ] as [string, string][]
          ).map(([code, label]) => (
            <span key={label} className="inline-flex items-center gap-3">
              <span className={`px-1.5 text-xs font-semibold ${legendChip(code)}`}>{code}</span>
              {label}
            </span>
          ))}
        </div>
      )}

      <CollapsibleTitle
        title={selectedDate ? `Attendance log · ${formatUiDate(selectedDate)}` : 'Attendance log'}
        open={logOpen}
        onToggle={() => setLogOpen((v) => !v)}
      />
      {logOpen && (
        <div className="overflow-x-auto rounded-xl border border-[#D3D3D3] shadow-sm">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead>
              <tr className="bg-[#FAFAFA] text-[#676767]">
                {['Date', 'Shift', 'Time', 'Breaks', 'Worked', 'OT', 'Status', 'Source', 'Notes'].map((h) => (
                  <th key={h} className="px-4 py-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {selectedEntries.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-[#676767]">
                    No marked attendance rows for this view.
                  </td>
                </tr>
              ) : (
                selectedEntries.map((row) => (
                  <tr key={row.id} className="border-t border-[#D3D3D3]">
                    <td className="px-4 py-3">{formatUiDate(row.date)}</td>
                    <td className="px-4 py-3">
                      {row.shift_name}
                      {row.shift_mismatch && (
                        <span className="ml-1 text-xs text-[#FFA000]">alt</span>
                      )}
                    </td>
                    <td className="px-4 py-3">{row.time_log}</td>
                    <td className="px-4 py-3 text-[#676767]">
                      L {row.lunch_break_minutes}m · T {row.tea_break_minutes}m
                    </td>
                    <td className="px-4 py-3">{row.worked_hours_label}</td>
                    <td className="px-4 py-3">
                      {row.overtime_label}
                      {row.ot_reason ? <p className="text-xs text-[#676767]">{row.ot_reason}</p> : null}
                    </td>
                    <td className="px-4 py-3 font-semibold">{row.status_label}</td>
                    <td className="px-4 py-3 text-[#676767]">{sourceLabel(row.source)}</td>
                    <td className="px-4 py-3 text-[#676767]">{row.notes ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryChip({
  label,
  value,
  valueLabel,
  className,
}: {
  label: string;
  value?: number;
  valueLabel?: string;
  className: string;
}) {
  return (
    <div className="rounded-xl border border-[#D3D3D3] bg-white px-4 py-3 shadow-sm">
      <p className="text-xs text-[#676767]">{label}</p>
      <p className={`mt-1 text-xl font-bold ${className}`}>{valueLabel ?? value}</p>
    </div>
  );
}

function CollapsibleTitle({
  title,
  open,
  onToggle,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-lg px-1 py-1 text-left text-sm font-semibold"
    >
      {title}
      <span className="text-[#676767]">{open ? 'Hide' : 'Show'}</span>
    </button>
  );
}

function legendColor(code: string) {
  if (code === 'P') return 'text-[#4CAF50]';
  if (code === 'A') return 'text-[#F54A4A]';
  if (code === 'L') return 'text-[#8B5CF6]';
  if (code === 'H') return 'text-[#0658C2]';
  if (code === 'HD') return 'text-[#525252]';
  return 'text-[#676767]';
}

function legendChip(code: string) {
  if (code === 'P') return 'bg-[#E5FFEB] text-[#4CAF50]';
  if (code === 'A') return 'bg-[#FEE9E5] text-[#F54A4A]';
  if (code === 'L') return 'bg-[#EDE9FE] text-[#8B5CF6]';
  if (code === 'H') return 'bg-[#DBEAFF] text-[#0658C2]';
  if (code === 'HD') return 'bg-[#E5E5E5] text-[#525252]';
  return 'bg-[#F4F4F4] text-[#676767]';
}
